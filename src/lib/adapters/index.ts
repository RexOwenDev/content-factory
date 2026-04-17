import { createClaudeAdapter } from './claude'
import { createDeepLAdapter } from './deepl'
import { shopifyOutputAdapter } from './shopify'
import { wordpressOutputAdapter } from './wordpress'
import type { AdapterFactory } from './types'

function getAdapterMode(): 'fixture' | 'live' {
  return (process.env['ADAPTER_MODE'] as 'fixture' | 'live') ?? 'fixture'
}

export function createAdapters(): AdapterFactory {
  const mode = getAdapterMode()
  return {
    claude: () => createClaudeAdapter(mode),
    deepl: () => createDeepLAdapter(mode),
    shopify: () => shopifyOutputAdapter,
    wordpress: () => wordpressOutputAdapter,
  }
}

export const adapters = createAdapters()
