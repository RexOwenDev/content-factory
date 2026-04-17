import { supabaseAdmin } from '../client'
import type { ContentType, EvalScore, Locale, Output, ShopifyProductPayload, WPMLPostPayload } from '../../types'

export async function createOutput(params: {
  jobId: string
  locale: Locale
  contentType: ContentType
  sourceContent: string
  deeplTranslation?: string
  transcreatedContent?: string
  finalContent?: string
  shopifyJson?: ShopifyProductPayload
  wordpressJson?: WPMLPostPayload
}): Promise<Output> {
  const { data, error } = await (supabaseAdmin.from('outputs') as any)
    .insert({
      job_id: params.jobId,
      locale: params.locale,
      content_type: params.contentType,
      source_content: params.sourceContent,
      deepl_translation: params.deeplTranslation ?? null,
      transcreated_content: params.transcreatedContent ?? null,
      final_content: params.finalContent ?? null,
      shopify_json: params.shopifyJson ?? null,
      wordpress_json: params.wordpressJson ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create output: ${error.message}`)
  return data as Output
}

export async function updateOutputFinal(
  outputId: string,
  finalContent: string,
  shopifyJson?: ShopifyProductPayload,
  wordpressJson?: WPMLPostPayload
): Promise<void> {
  const { error } = await (supabaseAdmin.from('outputs') as any)
    .update({
      final_content: finalContent,
      shopify_json: shopifyJson ?? null,
      wordpress_json: wordpressJson ?? null,
    })
    .eq('id', outputId)

  if (error) throw new Error(`Failed to update output ${outputId}: ${error.message}`)
}

export async function createEvalScore(
  outputId: string,
  score: EvalScore
): Promise<void> {
  const { error } = await (supabaseAdmin.from('eval_scores') as any)
    .insert({
      output_id: outputId,
      score: score.score,
      tone_match: score.tone_match,
      brand_voice_adherence: score.brand_voice_adherence,
      cultural_accuracy: score.cultural_accuracy,
      hallucination_flag: score.hallucination_flag,
      reasoning: score.reasoning,
    })

  if (error) throw new Error(`Failed to create eval score: ${error.message}`)
}

export async function getOutputByJobId(jobId: string): Promise<Output | null> {
  const { data, error } = await (supabaseAdmin.from('outputs') as any)
    .select('*')
    .eq('job_id', jobId)
    .single()

  if (error) return null
  return data as Output
}

export async function listOutputsByProject(projectId: string): Promise<Output[]> {
  const { data, error } = await (supabaseAdmin
    .from('outputs') as any)
    .select('*, content_jobs!inner(project_id)')
    .eq('content_jobs.project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to list outputs: ${error.message}`)
  return data as Output[]
}
