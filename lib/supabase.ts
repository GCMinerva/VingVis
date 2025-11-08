import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client for browser/client-side operations
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          ftc_team_name: string | null
          ftc_team_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          ftc_team_name?: string | null
          ftc_team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          ftc_team_name?: string | null
          ftc_team_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          project_hash: string
          name: string
          template_type: 'omni-wheel' | 'mecanum-wheel'
          motor_config: any
          workflow_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_hash: string
          name: string
          template_type: 'omni-wheel' | 'mecanum-wheel'
          motor_config?: any
          workflow_data?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_hash?: string
          name?: string
          template_type?: 'omni-wheel' | 'mecanum-wheel'
          motor_config?: any
          workflow_data?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
