import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

    // User profile is automatically created by database trigger
    return NextResponse.json({
      user: authData.user,
      session: authData.session
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
