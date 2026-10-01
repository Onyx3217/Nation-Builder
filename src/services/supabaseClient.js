import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in .env — cloud saves disabled.'
  )
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
    : null

/** True when Supabase is properly configured */
export const hasSupabase = Boolean(supabase)

let sessionPromise = null

export async function ensureSupabaseSession() {
  if (!supabase) return null

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (data.session?.user) return data.session

  if (!sessionPromise) {
    sessionPromise = supabase.auth.signInAnonymously().then(({ data: signInData, error: signInError }) => {
      if (signInError) throw signInError
      return signInData.session
    }).finally(() => {
      sessionPromise = null
    })
  }

  return sessionPromise
}
