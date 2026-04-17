import type { ClaudeAdapter } from './types'
import type {
  BrandVoiceProfile,
  ContentType,
  EvalScore,
  GeneratedContent,
  Locale,
  ProductBrief,
} from '../types'
import { loadFixture } from '../fixtures/loader'
import {
  buildGenerationPrompt,
  buildTranscreationPrompt,
  buildEvalPrompt,
  buildBackTranslationPrompt,
} from '../pipeline/prompts'
import { CULTURAL_CONTEXT_PRESETS } from '../config'

// ─── Fixture implementation ───────────────────────────────────────────────────

const fixtureClaudeAdapter: ClaudeAdapter = {
  async generateContent(
    brief: ProductBrief,
    contentType: ContentType,
    locale: Locale,
    _brandVoice: BrandVoiceProfile
  ): Promise<GeneratedContent> {
    const fixture = await loadFixture<GeneratedContent>(
      `generated/${brief.product_name.toLowerCase().replace(/\s+/g, '-')}_${contentType}_${locale}.json`
    )
    return (
      fixture ??
      (await loadFixture<GeneratedContent>(`generated/default_${contentType}_${locale}.json`)) ?? {
        content_type: contentType,
        locale,
        content: `[FIXTURE] ${contentType} for ${brief.product_name} in ${locale}`,
        meta:
          contentType === 'meta_tags'
            ? {
                title: `${brief.product_name} | ${locale}`,
                description: brief.usp,
                keywords: brief.key_features.join(', '),
              }
            : undefined,
      }
    )
  },

  async transcreate(
    sourceContent: string,
    sourceLocale: Locale,
    targetLocale: Locale,
    _culturalContext: string,
    _brandVoice: BrandVoiceProfile,
    _contentType: ContentType
  ): Promise<string> {
    const fixture = await loadFixture<{ transcreated: string }>(
      `transcreated/${sourceLocale}_${targetLocale}_sample.json`
    )
    return (
      fixture?.transcreated ??
      `[FIXTURE TRANSCREATION → ${targetLocale}] ${sourceContent.substring(0, 120)}...`
    )
  },

  async evaluateBrandVoice(
    _content: string,
    _brandVoice: BrandVoiceProfile,
    locale: Locale,
    contentType: ContentType
  ): Promise<EvalScore> {
    const fixture = await loadFixture<EvalScore>(`evaluated/${contentType}_${locale}_score.json`)
    return (
      fixture ?? {
        score: 82,
        tone_match: 85,
        brand_voice_adherence: 80,
        cultural_accuracy: 81,
        hallucination_flag: false,
        reasoning:
          '[FIXTURE] Content demonstrates good alignment with brand voice. Tone is consistent. No factual claims outside brief scope detected.',
      }
    )
  },
}

// ─── Live implementation (Vercel AI Gateway → Claude Opus 4.7) ───────────────

let _generateText: typeof import('ai').generateText | null = null

async function getGenerateText() {
  if (!_generateText) {
    const mod = await import('ai')
    _generateText = mod.generateText
  }
  return _generateText
}

let _gateway: typeof import('ai').gateway | null = null

async function getGateway() {
  if (!_gateway) {
    const mod = await import('ai')
    _gateway = mod.gateway
  }
  return _gateway
}

const liveClaudeAdapter: ClaudeAdapter = {
  async generateContent(
    brief: ProductBrief,
    contentType: ContentType,
    locale: Locale,
    brandVoice: BrandVoiceProfile
  ): Promise<GeneratedContent> {
    const generateText = await getGenerateText()
    const gateway = await getGateway()
    const { system, user } = buildGenerationPrompt(contentType, { brief, brandVoice, locale })

    const { text } = await generateText({
      model: gateway('anthropic/claude-opus-4-7'),
      system,
      prompt: user,
      maxOutputTokens: 1024,
    })

    if (contentType === 'meta_tags') {
      try {
        const parsed = JSON.parse(text) as Record<string, string>
        return { content_type: contentType, locale, content: text, meta: parsed }
      } catch {
        // Model returned non-JSON text for meta_tags — fall through to content-only.
        return { content_type: contentType, locale, content: text }
      }
    }

    return { content_type: contentType, locale, content: text }
  },

  async transcreate(
    sourceContent: string,
    sourceLocale: Locale,
    targetLocale: Locale,
    culturalContext: string,
    brandVoice: BrandVoiceProfile,
    contentType: ContentType
  ): Promise<string> {
    const generateText = await getGenerateText()
    const gateway = await getGateway()

    const { system, user } = buildTranscreationPrompt(
      sourceContent,
      sourceLocale,
      targetLocale,
      brandVoice,
      contentType
    )
    void culturalContext // included in buildTranscreationPrompt via CULTURAL_CONTEXT_PRESETS

    const { text } = await generateText({
      model: gateway('anthropic/claude-opus-4-7'),
      system,
      prompt: user,
      maxOutputTokens: 1024,
    })
    return text
  },

  async evaluateBrandVoice(
    content: string,
    brandVoice: BrandVoiceProfile,
    locale: Locale,
    contentType: ContentType
  ): Promise<EvalScore> {
    const generateText = await getGenerateText()
    const gateway = await getGateway()
    const { system, user } = buildEvalPrompt(content, brandVoice, locale, contentType)

    const { text } = await generateText({
      model: gateway('anthropic/claude-opus-4-7'),
      system,
      prompt: user,
      maxOutputTokens: 512,
    })

    try {
      return JSON.parse(text) as EvalScore
    } catch {
      throw new Error(
        `Claude eval returned non-JSON output (first 120 chars): ${text.substring(0, 120)}`
      )
    }
  },

  async backTranslate(
    transcreatedContent: string,
    sourceLocale: Locale,
    targetLocale: Locale
  ): Promise<string> {
    const generateText = await getGenerateText()
    const gateway = await getGateway()
    const { system, user } = buildBackTranslationPrompt(
      transcreatedContent,
      sourceLocale,
      targetLocale
    )

    const { text } = await generateText({
      model: gateway('anthropic/claude-opus-4-7'),
      system,
      prompt: user,
      maxOutputTokens: 1024,
    })
    return text
  },
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createClaudeAdapter(mode: 'fixture' | 'live'): ClaudeAdapter {
  return mode === 'live' ? liveClaudeAdapter : fixtureClaudeAdapter
}
