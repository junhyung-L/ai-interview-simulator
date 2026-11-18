import { getSupabase } from './supabase'

export async function signInWithGoogle() {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Sign-in is unavailable in demo mode (Supabase is not configured)')
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error signing in with Google:', error.message)
    throw error
  }

  return data
}

export async function signOut() {
  const supabase = getSupabase()
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}

export async function getUser() {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
