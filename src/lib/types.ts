export type Locale =
  | 'en-US' | 'en-GB'
  | 'fr-FR' | 'fr-CA'
  | 'es-ES' | 'es-MX'
  | 'de-DE' | 'it-IT'
  | 'pt-BR' | 'nl-NL'
  | 'pl-PL' | 'ja-JP'

export type ContentType =
  | 'product_description'
  | 'ad_copy'
  | 'meta_tags'
  | 'landing_page_copy'

export type JobStatus =
  | 'pending'
  | 'generating'
  | 'translating'
  | 'transcreating'
  | 'evaluating'
  | 'review_pending'
  | 'approved'
  | 'rejected'
  | 'failed'
  | 'exported'

export type ProjectStatus = 'draft' | 'running' | 'review' | 'complete' | 'failed'

export type AdapterMode = 'fixture' | 'live'

export type TranslationMode = 'deepl' | 'claude_transcreation' | 'both'

export interface ProductBrief {
  product_name: string
  category: string
  key_features: string[]
  target_audience: string
  price_point: string
  usp: string
  avoid_words: string[]
  extra_context?: string
}

export interface BrandVoiceProfile {
  tone: string
  style: string
  keywords: string[]
  avoid_words: string[]
  sample_copy: string
}

export interface MarketConfig {
  locale: Locale
  cultural_context: string
  platform: 'shopify' | 'wordpress' | 'both'
}

export interface GeneratedContent {
  content_type: ContentType
  locale: Locale
  content: string
  meta?: Record<string, string>
}

export interface TranslationResult {
  locale: Locale
  deepl_output?: string
  transcreated_output?: string
  final_output: string
  method_used: TranslationMode
}

export interface EvalScore {
  score: number
  tone_match: number
  brand_voice_adherence: number
  cultural_accuracy: number
  hallucination_flag: boolean
  reasoning: string
}

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  brief: ProductBrief
  brand_voice: BrandVoiceProfile
  target_locales: Locale[]
  content_types: ContentType[]
  translation_mode: TranslationMode
  created_at: string
  updated_at: string
}

export interface Market {
  id: string
  project_id: string
  locale: Locale
  cultural_context: string
  status: string
  created_at: string
}

export interface ContentJob {
  id: string
  project_id: string
  market_id: string
  content_type: ContentType
  status: JobStatus
  inngest_run_id: string | null
  error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Output {
  id: string
  job_id: string
  locale: Locale
  content_type: ContentType
  source_content: string
  deepl_translation: string | null
  transcreated_content: string | null
  final_content: string | null
  shopify_json: ShopifyProductPayload | null
  wordpress_json: WPMLPostPayload | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  output_id: string
  status: 'pending' | 'approved' | 'rejected'
  reviewer_note: string | null
  reviewed_at: string | null
  created_at: string
}

export interface PipelineEvent {
  id: string
  project_id: string
  job_id: string | null
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

// ─── Output shape types (shaped against real API schemas) ─────────────────────

export interface ShopifyProductPayload {
  product: {
    title: string
    body_html: string
    metafields: Array<{
      namespace: string
      key: string
      value: string
      type: string
    }>
  }
  locale: Locale
  translations: {
    title: string
    body_html: string
  }
}

export interface WPMLPostPayload {
  title: string
  content: string
  excerpt: string
  meta: {
    _yoast_wpseo_title: string
    _yoast_wpseo_metadesc: string
    _yoast_wpseo_focuskw: string
    wpml_language: string
    wpml_original_id: number
  }
  hreflang: Record<string, string>
}
