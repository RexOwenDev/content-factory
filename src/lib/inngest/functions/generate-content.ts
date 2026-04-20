import { z } from 'zod'
import { inngest } from '../client'
import { createClaudeAdapter } from '../../adapters/claude'
import { createDeepLAdapter } from '../../adapters/deepl'
import { createContentJobsForProject, updateJobStatus } from '../../db/queries/jobs'
import { createOutput } from '../../db/queries/outputs'
import { getProjectWithMarkets } from '../../db/queries/projects'
import { supabaseAdmin } from '../../db/client'
import { EVAL_THRESHOLDS } from '../../config'
import type { Locale } from '../../types'

// ─── Fan-out: project.submitted → N×M content jobs ───────────────────────────

export const generateContentFunction = inngest.createFunction(
  {
    id: 'generate-content',
    name: 'Generate Content (fan-out)',
    retries: 3,
  },
  { event: 'contentfactory/project.submitted' },
  async ({ event, step }) => {
    const { projectId, adapterMode } = z
      .object({ projectId: z.string().uuid(), adapterMode: z.enum(['fixture', 'live']) })
      .parse(event.data)

    // 1. Load project + markets
    const result = await step.run('load-project', async () => {
      const data = await getProjectWithMarkets(projectId)
      if (!data) throw new Error(`Project ${projectId} not found`)
      return data
    })

    const { project, markets } = result

    // 2. Create all content jobs (pending) upfront — idempotency via DB unique constraint
    const jobs = await step.run('create-jobs', async () => {
      return createContentJobsForProject(
        projectId,
        markets.map((m) => ({ id: m.id, locale: m.locale as Locale })),
        project.content_types
      )
    })

    // 3. Update project status → running
    await step.run('set-project-running', async () => {
      const { error } = await (supabaseAdmin.from('projects') as any)
        .update({ status: 'running' })
        .eq('id', projectId)
      if (error) throw new Error(`Failed to set project running: ${error.message}`)
    })

    // 4. Fan-out: fire one job.started event per content job.
    // step.sendEvent gives Inngest native idempotency and visibility — do NOT wrap in step.run.
    await step.sendEvent(
      'fan-out-jobs',
      jobs.map((job) => ({
        name: 'contentfactory/job.started' as const,
        data: {
          jobId: job.id,
          projectId,
          contentType: job.content_type,
          adapterMode,
        },
      }))
    )

    return { projectId, jobCount: jobs.length }
  }
)

// ─── Per-job: generate EN-US → translate/transcreate → QA → evaluate ─────────

export const translateMarketFunction = inngest.createFunction(
  {
    id: 'translate-market',
    name: 'Translate Market Job',
    retries: 3,
    concurrency: { limit: 5 },
    // Ensures jobs reach a terminal status when retries are exhausted,
    // otherwise the row sticks in 'generating'/'translating' forever.
    onFailure: async ({ event }) => {
      const { jobId } = event.data.event.data as { jobId: string }
      const message = event.data.error?.message ?? 'Job failed after retries'
      await updateJobStatus(jobId, 'failed', { error: message })
    },
  },
  { event: 'contentfactory/job.started' },
  async ({ event, step }) => {
    const { jobId, projectId, contentType, adapterMode } = z
      .object({
        jobId: z.string().uuid(),
        projectId: z.string().uuid(),
        contentType: z.enum(['product_description', 'ad_copy', 'meta_tags', 'landing_page_copy'] as const),
        adapterMode: z.enum(['fixture', 'live']),
      })
      .parse(event.data)

    const claude = createClaudeAdapter(adapterMode)
    const deepl = createDeepLAdapter(adapterMode)

    // 1. Load job + market + project in parallel
    const context = await step.run('load-context', async () => {
      const [jobResult, projectResult] = await Promise.all([
        (supabaseAdmin.from('content_jobs') as any)
          .select('*, markets(locale, cultural_context)')
          .eq('id', jobId)
          .single(),
        (supabaseAdmin.from('projects') as any)
          .select('*')
          .eq('id', projectId)
          .single(),
      ])
      if (jobResult.error) throw new Error(`Job ${jobId} not found`)
      if (projectResult.error) throw new Error(`Project ${projectId} not found`)

      return {
        job: jobResult.data,
        project: projectResult.data,
        locale: jobResult.data.markets.locale as Locale,
        culturalContext: jobResult.data.markets.cultural_context as string,
      }
    })

    const { project, locale, culturalContext } = context

    // 2. Mark generating
    await step.run('set-generating', async () => {
      await updateJobStatus(jobId, 'generating')
    })

    // 3. Generate EN-US source content
    const sourceContent = await step.run('generate-source', async () => {
      return claude.generateContent(project.brief, contentType, 'en-US', project.brand_voice)
    })

    // 4. Translate to target locale (skip for en-US source)
    let deeplTranslation: string | undefined
    let transcreatedContent: string | undefined
    let finalContent: string

    if (locale === 'en-US') {
      finalContent = sourceContent.content
    } else if (project.translation_mode === 'deepl') {
      await step.run('set-translating', () => updateJobStatus(jobId, 'translating'))

      finalContent = await step.run('deepl-translate', async () => {
        return deepl.translate(sourceContent.content, 'en-US', locale)
      })
      deeplTranslation = finalContent
    } else if (project.translation_mode === 'claude_transcreation') {
      await step.run('set-transcreating', () => updateJobStatus(jobId, 'transcreating'))

      finalContent = await step.run('claude-transcreate', async () => {
        return claude.transcreate(
          sourceContent.content,
          'en-US',
          locale,
          culturalContext,
          project.brand_voice,
          contentType
        )
      })
      transcreatedContent = finalContent
    } else {
      // 'both': DeepL draft → Claude refines using DeepL as context
      await step.run('set-translating', () => updateJobStatus(jobId, 'translating'))

      deeplTranslation = await step.run('deepl-translate', async () => {
        return deepl.translate(sourceContent.content, 'en-US', locale)
      })

      await step.run('set-transcreating', () => updateJobStatus(jobId, 'transcreating'))

      transcreatedContent = await step.run('claude-refine', async () => {
        // Feed DeepL output as context for Claude to refine cultural register
        const enrichedSource = `[DeepL draft for reference]\n${deeplTranslation}\n\n[Original EN-US]\n${sourceContent.content}`
        return claude.transcreate(
          enrichedSource,
          'en-US',
          locale,
          culturalContext,
          project.brand_voice,
          contentType
        )
      })
      finalContent = transcreatedContent
    }

    // 5. Back-translation QA (only for transcreated content, not raw DeepL)
    let backTranslationFlag = false
    if (transcreatedContent && claude.backTranslate) {
      const backTranslated = await step.run('back-translate-qa', async () => {
        return claude.backTranslate!(transcreatedContent!, 'en-US', locale)
      })

      // Simple keyword-overlap check: flag if <40% of source keywords appear in back-translation
      backTranslationFlag = await step.run('qa-check', async () => {
        const sourceWords = new Set(
          sourceContent.content.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
        )
        const backWords = new Set(
          backTranslated.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
        )
        const overlap = Array.from(sourceWords).filter((w) => backWords.has(w)).length
        const ratio = sourceWords.size > 0 ? overlap / sourceWords.size : 1
        return ratio < 0.4
      })
    }

    // 6. Evaluate brand voice
    await step.run('set-evaluating', () => updateJobStatus(jobId, 'evaluating'))

    const evalScore = await step.run('evaluate', async () => {
      return claude.evaluateBrandVoice(finalContent, project.brand_voice, locale, contentType)
    })

    // 7. Persist output
    const output = await step.run('save-output', async () => {
      return createOutput({
        jobId,
        locale,
        contentType,
        sourceContent: sourceContent.content,
        deeplTranslation,
        transcreatedContent,
        finalContent,
      })
    })

    // 8. Save eval score + back-translation flag
    await step.run('save-eval', async () => {
      await (supabaseAdmin.from('eval_scores') as any).insert({
        output_id: output.id,
        score: evalScore.score,
        tone_match: evalScore.tone_match,
        brand_voice_adherence: evalScore.brand_voice_adherence,
        cultural_accuracy: evalScore.cultural_accuracy,
        hallucination_flag: evalScore.hallucination_flag || backTranslationFlag,
        reasoning: evalScore.reasoning,
      })
    })

    // 9. Determine next status based on eval score
    const passed = evalScore.score >= EVAL_THRESHOLDS.PASS
    const nextStatus = passed ? 'review_pending' : 'rejected'

    await step.run('set-final-status', async () => {
      await updateJobStatus(jobId, nextStatus, {
        error: !passed ? `Eval score ${evalScore.score} below threshold ${EVAL_THRESHOLDS.PASS}` : undefined,
      })
    })

    return {
      jobId,
      locale,
      contentType,
      score: evalScore.score,
      passed,
      backTranslationFlag,
    }
  }
)
