import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Type for the Supabase client with our Database schema
export type TypedSupabaseClient = SupabaseClient<Database>

// Create client only if configured (allows app to work without backend)
const _supabase: TypedSupabaseClient | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

export const supabase = _supabase

// Helper to get the typed client (throws if not configured)
export function getSupabaseClient(): TypedSupabaseClient {
  if (!_supabase) {
    throw new Error('Supabase is not configured')
  }
  return _supabase
}

// Helper to check if user is authenticated
export const getUser = async () => {
  if (!_supabase) return null
  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  return user
}

// Helper to check if user is a coach
export const isCoach = async (): Promise<boolean> => {
  if (!_supabase) return false
  const user = await getUser()
  if (!user) return false

  const client = getSupabaseClient()
  const { data } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role === 'coach'
}
