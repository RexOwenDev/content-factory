import type { ShopifyOutputAdapter } from './types'
import type { ShopifyProductPayload } from '../types'

// Shaped against Shopify Admin API 2025-01 Products endpoint + Translations API
// https://shopify.dev/docs/api/admin-rest/2025-01/resources/product
export const shopifyOutputAdapter: ShopifyOutputAdapter = {
  shape({ title, description, adCopy: _adCopy, metaTags, locale }): ShopifyProductPayload {
    const seoTitle = metaTags['title'] ?? title
    const seoDescription = metaTags['description'] ?? description.substring(0, 160)

    return {
      product: {
        title,
        body_html: `<p>${description}</p>`,
        metafields: [
          {
            namespace: 'seo',
            key: 'title',
            value: seoTitle,
            type: 'single_line_text_field',
          },
          {
            namespace: 'seo',
            key: 'description',
            value: seoDescription,
            type: 'single_line_text_field',
          },
          {
            namespace: 'content_factory',
            key: 'generated_locale',
            value: locale,
            type: 'single_line_text_field',
          },
          {
            namespace: 'content_factory',
            key: 'keywords',
            value: metaTags['keywords'] ?? '',
            type: 'single_line_text_field',
          },
        ],
      },
      locale,
      translations: {
        title,
        body_html: `<p>${description}</p>`,
      },
    }
  },
}
