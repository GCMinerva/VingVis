import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client for browser/client-side operations
// Safe to use in both client and server components
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// NOTE: Admin client has been moved to lib/supabase-admin.ts
// Import from there for server-side operations that need to bypass RLS

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
          template_type: 'omni-wheel' | 'mecanum-wheel' | 'tank-drive' | 'holonomic-drive' | 'x-drive' | 'swerve-drive'
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
          template_type: 'omni-wheel' | 'mecanum-wheel' | 'tank-drive' | 'holonomic-drive' | 'x-drive' | 'swerve-drive'
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
          template_type?: 'omni-wheel' | 'mecanum-wheel' | 'tank-drive' | 'holonomic-drive' | 'x-drive' | 'swerve-drive'
          motor_config?: any
          workflow_data?: any
          created_at?: string
          updated_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          ftc_team_name: string
          ftc_team_id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          ftc_team_name: string
          ftc_team_id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          ftc_team_name?: string
          ftc_team_id?: string
          email?: string
          created_at?: string
        }
      }
    }
  }
}
