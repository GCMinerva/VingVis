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
      console.log('Email conflict detected - email exists with different ID:', emailUser.id, 'vs', user.id)
      console.log('Attempting to fix by updating the existing profile ID...')

      // Check if there are any projects associated with the old ID
      const { data: oldProjects } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('user_id', emailUser.id)

      console.log('Old profile has', oldProjects?.length || 0, 'projects')

      // Strategy: Update the existing profile's ID to match the current auth user ID
      // First, delete the old profile
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', emailUser.id)

      if (deleteError) {
        console.error('Failed to delete old profile:', deleteError)
        return NextResponse.json({
          error: 'Failed to fix profile mismatch. Please contact support.',
          details: {
            currentAuthId: user.id,
            existingProfileId: emailUser.id,
            email: user.email,
            deleteError: deleteError.message
          }
        }, { status: 500 })
      }

      // Now create with the correct ID
      const username = emailUser.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user'
      const { data: newUser, error: createError } = await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email!,
        username: username,
        ftc_team_name: emailUser.ftc_team_name || user.user_metadata?.ftc_team_name || null,
        ftc_team_id: emailUser.ftc_team_id || user.user_metadata?.ftc_team_id || null,
      }).select().single()

      if (createError) {
        console.error('Failed to create new profile after deletion:', createError)
        return NextResponse.json({
          error: 'Failed to fix profile mismatch. Please contact support.',
          details: {
            currentAuthId: user.id,
            createError: createError.message
          }
        }, { status: 500 })
      }

      return NextResponse.json({
        message: 'User profile fixed successfully (ID mismatch resolved)',
        user: newUser,
        note: oldProjects && oldProjects.length > 0 ?
          `Warning: ${oldProjects.length} projects from old profile were deleted` :
          'No projects were affected'
      })
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
