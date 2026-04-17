import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import {
  generateContentFunction,
  translateMarketFunction,
} from '@/lib/inngest/functions'
import { env } from '@/lib/env'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateContentFunction, translateMarketFunction],
  // Explicit signingKey ensures Inngest rejects unsigned webhook POSTs
  // even if a proxy strips the env var — fails loudly instead of silently.
  signingKey: env.INNGEST_SIGNING_KEY,
})
