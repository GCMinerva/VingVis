import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 5 login attempts per minute
  const rateLimitResponse = rateLimit(request, { interval: 60000, maxRequests: 5 })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { email, password } = await request.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Verify user profile exists in database, create if missing
    if (data.user) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingUser) {
        console.log('User profile missing during signin, creating it...')
        const username = data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'user'
        await supabaseAdmin.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          username: username,
          ftc_team_name: data.user.user_metadata?.ftc_team_name || null,
          ftc_team_id: data.user.user_metadata?.ftc_team_id || null,
        })
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
