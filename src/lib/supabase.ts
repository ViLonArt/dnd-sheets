import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client configuration
 * 
 * To get your Supabase URL and anon key:
 * 1. Go to your Supabase Dashboard
 * 2. Navigate to Settings → API
 * 3. Copy the "Project URL" and "anon public" key
 * 
 * For local development, you can use environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL and/or Anon Key are missing. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or environment.'
  )
}

/**
 * Create Supabase client instance
 * This client is used for:
 * - Authentication (sign in, sign up, sign out)
 * - Calling Edge Functions
 * - Accessing Storage buckets
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

/**
 * Get the current session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}

