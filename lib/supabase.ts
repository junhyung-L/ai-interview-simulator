import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

const PLACEHOLDER_URL = 'your_supabase_project_url_here'

let _supabase: SupabaseClient | null = null

/** True when both public Supabase variables are set to real values. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && url !== PLACEHOLDER_URL)
}

/**
 * Returns the shared Supabase client, or null when the public Supabase
 * variables are unset (demo mode). Callers must handle the null case.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    )
  }
  return _supabase
}

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          created_at: string
          student_name: string
          category: string
          difficulty: string
          status: 'active' | 'completed'
          user_id?: string
        }
        Insert: {
          id?: string
          created_at?: string
          student_name: string
          category: string
          difficulty: string
          status?: 'active' | 'completed'
          user_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          session_id: string
          strengths: string
          improvements: string
          total_score: number
          empathy_score: number
          problem_solving_score: number
          communication_score: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          strengths: string
          improvements: string
          total_score: number
          empathy_score: number
          problem_solving_score: number
          communication_score: number
          created_at?: string
        }
      }
    }
  }
}
