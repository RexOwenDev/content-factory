import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

// Browser-safe client — uses anon key, respects RLS
export const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Server-only admin client — bypasses RLS, never expose to browser
export const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
