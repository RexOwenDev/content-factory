import type { WordPressOutputAdapter } from './types'
import type { Locale, WPMLPostPayload } from '../types'
import { LOCALES } from '../config'

// Shaped against WordPress REST API + WPML REST API + Yoast SEO meta keys
// WPML: https://wpml.org/documentation/related-projects/wpml-rest-api/
// Yoast: https://developer.yoast.com/features/schema/api/
export const wordpressOutputAdapter: WordPressOutputAdapter = {
  shape({ title, description, adCopy: _adCopy, metaTags, locale, originalPostId = 0, siteUrl = '' }): WPMLPostPayload {
    const wpLang = locale.split('-')[0] ?? 'en'

    // Build hreflang map from all supported locales
    const hreflang = buildHreflangMap(locale, siteUrl)

    return {
      title,
      content: `<!-- wp:paragraph -->\n<p>${description}</p>\n<!-- /wp:paragraph -->`,
      excerpt: description.substring(0, 200),
      meta: {
        _yoast_wpseo_title: metaTags['title'] ?? title,
        _yoast_wpseo_metadesc: metaTags['description'] ?? description.substring(0, 160),
        _yoast_wpseo_focuskw: metaTags['keywords']?.split(',')[0]?.trim() ?? '',
        wpml_language: wpLang,
        wpml_original_id: originalPostId,
      },
      hreflang,
    }
  },
}

function buildHreflangMap(currentLocale: Locale, siteUrl: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const locale of LOCALES) {
    const langSegment = locale === 'en-US' ? '' : `/${locale.toLowerCase()}`
    map[locale] = `${siteUrl}${langSegment}/`
  }
  map['x-default'] = `${siteUrl}/`
  return map
}
