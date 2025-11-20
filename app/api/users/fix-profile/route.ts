import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// This endpoint fixes user profiles for authenticated users
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fix profile request for user:', user.id, 'email:', user.email)

    // Check if user profile exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({
        message: 'User profile already exists',
        user: existingUser
      })
    }

    // Check if email exists with different ID
    const { data: emailUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', user.email!)
      .maybeSingle()

    if (emailUser && emailUser.id !== user.id) {
      console.error('Email conflict - email exists with different ID:', emailUser.id, 'vs', user.id)
      return NextResponse.json({
        error: 'Your email is already associated with a different account ID',
        details: {
          currentAuthId: user.id,
          existingProfileId: emailUser.id,
          email: user.email
        }
      }, { status: 409 })
    }

    // Create user profile using admin client (bypasses RLS)
    let username = user.user_metadata?.username || user.email?.split('@')[0] || 'user'

    console.log('Creating user profile with username:', username)

    let { data: newUser, error: insertError } = await supabaseAdmin.from('users').insert({
      id: user.id,
      email: user.email!,
      username: username,
      ftc_team_name: user.user_metadata?.ftc_team_name || null,
      ftc_team_id: user.user_metadata?.ftc_team_id || null,
    }).select().single()

    // If username already exists, try with a unique suffix
    if (insertError && insertError.code === '23505') {
      console.log('Username collision, trying with suffix')
      username = `${username}_${user.id.substring(0, 8)}`
      const result = await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email!,
        username: username,
        ftc_team_name: user.user_metadata?.ftc_team_name || null,
        ftc_team_id: user.user_metadata?.ftc_team_id || null,
      }).select().single()

      newUser = result.data
      insertError = result.error
    }

    if (insertError) {
      console.error('Failed to create user profile:', insertError)
      return NextResponse.json({
        error: insertError.message,
        code: insertError.code
      }, { status: 400 })
    }

    return NextResponse.json({
      message: 'User profile created successfully',
      user: newUser
    })
  } catch (error: any) {
    console.error('Fix profile error:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}
