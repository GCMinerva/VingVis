import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, ftcTeamName, ftcTeamId } = await request.json()

    // Sign up the user using regular client
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          ftc_team_name: ftcTeamName || null,
          ftc_team_id: ftcTeamId || null,
        }
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 })
    }

    // Create user profile using admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      username,
      ftc_team_name: ftcTeamName || null,
      ftc_team_id: ftcTeamId || null,
    })

    if (profileError) {
      // If profile creation fails, try to clean up the auth user
      console.error('Profile creation failed:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({
      user: authData.user,
      session: authData.session
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
