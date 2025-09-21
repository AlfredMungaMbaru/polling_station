import { createClient } from '@supabase/supabase-js'

// Fallback values for development/demo purposes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key'

// Only throw error in production with invalid config
if ((!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url') && process.env.NODE_ENV === 'production') {
  throw new Error('Missing or invalid Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types for authentication
export type AuthUser = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

export type AuthError = {
  message: string
}