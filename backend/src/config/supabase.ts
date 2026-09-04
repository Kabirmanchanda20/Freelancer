import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

/** Service-role client — Storage only. Never expose this key to the browser. */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
