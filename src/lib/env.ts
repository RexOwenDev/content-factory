import { z } from 'zod'

const envSchema = z.object({
  // Adapter mode — 'fixture' requires no external keys, 'live' requires all below
  ADAPTER_MODE: z.enum(['fixture', 'live']).default('fixture'),

  // Supabase — required always (even fixture mode writes to DB)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Inngest — required always for job orchestration
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),

  // Anthropic API — required for live mode only
  // Name matches AI SDK's Anthropic provider auto-detection.
  ANTHROPIC_API_KEY: z.string().optional(),

  // DeepL API — required for live mode only
  DEEPL_API_KEY: z.string().optional(),

  // Shopify — required for live push mode only
  SHOPIFY_STORE_URL: z.string().url().optional(),
  SHOPIFY_ACCESS_TOKEN: z.string().optional(),

  // WordPress — required for live push mode only
  WP_SITE_URL: z.string().url().optional(),
  WP_USERNAME: z.string().optional(),
  WP_APP_PASSWORD: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables — check .env.local against .env.example')
  }

  const env = parsed.data

  if (env.ADAPTER_MODE === 'live') {
    const liveRequired = ['ANTHROPIC_API_KEY', 'DEEPL_API_KEY'] as const
    const missing = liveRequired.filter((key) => !env[key])
    if (missing.length > 0) {
      throw new Error(
        `ADAPTER_MODE=live requires: ${missing.join(', ')}. See .env.example for details.`
      )
    }
  }

  return env
}

// Validated once at module load — fails fast in development
export const env = validateEnv()
