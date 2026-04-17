import type {
  BrandVoiceProfile,
  ContentType,
  EvalScore,
  GeneratedContent,
  Locale,
  ProductBrief,
  ShopifyProductPayload,
  TranslationMode,
  WPMLPostPayload,
} from '../types'

export type AdapterMode = 'fixture' | 'live'

// ─── Claude Adapter ──────────────────────────────────────────────────────────

export interface ClaudeAdapter {
  generateContent(
    brief: ProductBrief,
    contentType: ContentType,
    locale: Locale,
    brandVoice: BrandVoiceProfile
  ): Promise<GeneratedContent>

  transcreate(
    sourceContent: string,
    sourceLocale: Locale,
    targetLocale: Locale,
    culturalContext: string,
    brandVoice: BrandVoiceProfile,
    contentType: ContentType
  ): Promise<string>

  evaluateBrandVoice(
    content: string,
    brandVoice: BrandVoiceProfile,
    locale: Locale,
    contentType: ContentType
  ): Promise<EvalScore>

  backTranslate?(
    transcreatedContent: string,
    sourceLocale: Locale,
    targetLocale: Locale
  ): Promise<string>
}

// ─── DeepL Adapter ───────────────────────────────────────────────────────────

export interface DeepLAdapter {
  translate(
    text: string,
    sourceLocale: Locale,
    targetLocale: Locale
  ): Promise<string>
}

// ─── Output Adapters ─────────────────────────────────────────────────────────

export interface ShopifyOutputAdapter {
  shape(params: {
    title: string
    description: string
    adCopy: string
    metaTags: Record<string, string>
    locale: Locale
  }): ShopifyProductPayload
}

export interface WordPressOutputAdapter {
  shape(params: {
    title: string
    description: string
    adCopy: string
    metaTags: Record<string, string>
    locale: Locale
    originalPostId?: number
    siteUrl?: string
  }): WPMLPostPayload
}

// ─── Adapter Factory ─────────────────────────────────────────────────────────

export interface AdapterFactory {
  claude(): ClaudeAdapter
  deepl(): DeepLAdapter
  shopify(): ShopifyOutputAdapter
  wordpress(): WordPressOutputAdapter
}

export interface AdapterConfig {
  mode: AdapterMode
  translationMode: TranslationMode
}
