import type { DeepLAdapter } from './types'
import type { Locale } from '../types'
import { DEEPL_LOCALE_MAP } from '../config'
import { loadFixture } from '../fixtures/loader'

const fixtureDeepLAdapter: DeepLAdapter = {
  async translate(
    text: string,
    sourceLocale: Locale,
    targetLocale: Locale
  ): Promise<string> {
    const fixture = await loadFixture<{ translation: string }>(
      `translated/${sourceLocale}_${targetLocale}_sample.json`
    )
    return fixture?.translation ?? `[FIXTURE DEEPL ${DEEPL_LOCALE_MAP[targetLocale]}] ${text.substring(0, 150)}...`
  },
}

const liveDeepLAdapter: DeepLAdapter = {
  async translate(
    text: string,
    _sourceLocale: Locale,
    targetLocale: Locale
  ): Promise<string> {
    const apiKey = process.env['DEEPL_API_KEY']
    if (!apiKey) throw new Error('DEEPL_API_KEY is required for live mode')

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: 'EN',
        target_lang: DEEPL_LOCALE_MAP[targetLocale],
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as { translations: Array<{ text: string }> }
    return data.translations[0]?.text ?? text
  },
}

export function createDeepLAdapter(mode: 'fixture' | 'live'): DeepLAdapter {
  return mode === 'live' ? liveDeepLAdapter : fixtureDeepLAdapter
}
