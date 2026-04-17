import type { ContentType, Locale, MarketConfig } from './types'

export const LOCALES: Locale[] = [
  'en-US', 'en-GB',
  'fr-FR', 'fr-CA',
  'es-ES', 'es-MX',
  'de-DE', 'it-IT',
  'pt-BR', 'nl-NL',
  'pl-PL', 'ja-JP',
]

export const CONTENT_TYPES: ContentType[] = [
  'product_description',
  'ad_copy',
  'meta_tags',
  'landing_page_copy',
]

export const LOCALE_LABELS: Record<Locale, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'fr-FR': 'French (France)',
  'fr-CA': 'French (Canada)',
  'es-ES': 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  'de-DE': 'German',
  'it-IT': 'Italian',
  'pt-BR': 'Portuguese (Brazil)',
  'nl-NL': 'Dutch',
  'pl-PL': 'Polish',
  'ja-JP': 'Japanese',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  'en-US': '🇺🇸',
  'en-GB': '🇬🇧',
  'fr-FR': '🇫🇷',
  'fr-CA': '🇨🇦',
  'es-ES': '🇪🇸',
  'es-MX': '🇲🇽',
  'de-DE': '🇩🇪',
  'it-IT': '🇮🇹',
  'pt-BR': '🇧🇷',
  'nl-NL': '🇳🇱',
  'pl-PL': '🇵🇱',
  'ja-JP': '🇯🇵',
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  product_description: 'Product Description',
  ad_copy: 'Ad Copy',
  meta_tags: 'Meta Tags (SEO)',
  landing_page_copy: 'Landing Page Copy',
}

// Cultural context presets per locale — feeds the transcreation layer
export const CULTURAL_CONTEXT_PRESETS: Record<Locale, string> = {
  'en-US': 'Use direct, benefit-driven language. Short sentences. Action-oriented CTAs.',
  'en-GB': 'Slightly more formal than US English. Understated confidence. Avoid Americanisms.',
  'fr-FR': 'Formal register. Avoid direct translations of English idioms. French audiences value precision and elegance.',
  'fr-CA': 'Quebecois French norms apply. More informal than France French. Avoid direct anglicisms.',
  'es-ES': 'Castilian Spanish. Vosotros form. More formal in tone than LATAM Spanish.',
  'es-MX': 'Mexican Spanish. Ustedes form. Warm, relationship-oriented tone. Avoid Spain-specific idioms.',
  'de-DE': 'Precise, informative, avoid superlatives. German audiences distrust over-promising. Technical detail is valued.',
  'it-IT': 'Expressive and warm but professional. Emphasize craftsmanship and quality aesthetics.',
  'pt-BR': 'Brazilian Portuguese. Você form. Friendly, enthusiastic tone. Very different from European Portuguese.',
  'nl-NL': 'Direct and pragmatic. Dutch audiences value honesty and straightforwardness. Avoid excessive marketing language.',
  'pl-PL': 'Formal but approachable. Polish consumers respond well to quality signals and European positioning.',
  'ja-JP': 'Polite formal register (丁寧語). Emphasize harmony, quality, reliability. Avoid aggressive sales language. Adapt idioms completely.',
}

// DeepL-compatible language codes
export const DEEPL_LOCALE_MAP: Record<Locale, string> = {
  'en-US': 'EN-US',
  'en-GB': 'EN-GB',
  'fr-FR': 'FR',
  'fr-CA': 'FR',
  'es-ES': 'ES',
  'es-MX': 'ES',
  'de-DE': 'DE',
  'it-IT': 'IT',
  'pt-BR': 'PT-BR',
  'nl-NL': 'NL',
  'pl-PL': 'PL',
  'ja-JP': 'JA',
}

// Base locale for generation (always en-US)
export const SOURCE_LOCALE: Locale = 'en-US'

// Inngest event names
export const INNGEST_EVENTS = {
  PROJECT_SUBMITTED: 'contentfactory/project.submitted',
  MARKET_TRANSLATE: 'contentfactory/market.translate',
  OUTPUT_EVALUATE: 'contentfactory/output.evaluate',
  PROJECT_EVALUATED: 'contentfactory/project.evaluated',
} as const

// Eval scoring thresholds
export const EVAL_THRESHOLDS = {
  PASS: 75,
  WARN: 50,
  FAIL: 0,
} as const

export const DEFAULT_MARKET_CONFIGS: Record<Locale, MarketConfig> = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    {
      locale,
      cultural_context: CULTURAL_CONTEXT_PRESETS[locale],
      platform: 'both' as const,
    },
  ])
) as Record<Locale, MarketConfig>
