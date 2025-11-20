import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 3 signup attempts per 5 minutes
  const rateLimitResponse = rateLimit(request, { interval: 300000, maxRequests: 3 })
  if (rateLimitResponse) return rateLimitResponse

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

    // Wait a moment for the database trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify user profile exists, if not create it manually
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingUser) {
      console.log('Database trigger did not create user profile, creating manually...')
      let finalUsername = username || authData.user.email?.split('@')[0] || 'user'

      // Try to insert with the base username, if it fails due to unique constraint, add suffix
      let { error: insertError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email: authData.user.email!,
        username: finalUsername,
        ftc_team_name: ftcTeamName || null,
        ftc_team_id: ftcTeamId || null,
      })

      // If username already exists, try with a unique suffix
      if (insertError && insertError.code === '23505') {
        finalUsername = `${finalUsername}_${authData.user.id.substring(0, 8)}`
        const { error: retryError } = await supabaseAdmin.from('users').insert({
          id: authData.user.id,
          email: authData.user.email!,
          username: finalUsername,
          ftc_team_name: ftcTeamName || null,
          ftc_team_id: ftcTeamId || null,
        })

        if (retryError) {
          console.error('Failed to create user profile after retry:', retryError)
        }
      } else if (insertError) {
        console.error('Failed to create user profile:', insertError)
      }
    }

    return NextResponse.json({
      user: authData.user,
      session: authData.session
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
