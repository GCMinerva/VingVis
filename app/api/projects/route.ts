import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET all projects for the current user
export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ projects: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST create new project
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

    const { name, templateType, motorConfig, projectHash } = await request.json()

    console.log('Project creation request for user:', user.id, 'email:', user.email)

    // Ensure user profile exists before creating project
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    console.log('User profile check - exists:', !!existingUser, 'error:', checkError?.message || 'none')

    // Only create user if they don't exist (not found or query error)
    if (!existingUser && (!checkError || checkError.code === 'PGRST116')) {
      console.log('User profile not found, creating it...')
      console.log('User metadata:', JSON.stringify(user.user_metadata))

      // Create user profile if it doesn't exist
      let username = user.user_metadata?.username || user.email?.split('@')[0] || 'user'

      // Try to insert with the base username, if it fails due to unique constraint, add suffix
      let { error: userCreateError } = await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email!,
        username: username,
        ftc_team_name: user.user_metadata?.ftc_team_name || null,
        ftc_team_id: user.user_metadata?.ftc_team_id || null,
      })

      console.log('User creation attempt - error:', userCreateError?.message || 'none', 'code:', userCreateError?.code || 'none')

      // If username or email already exists but not with this ID, there's a mismatch
      if (userCreateError && userCreateError.code === '23505') {
        console.log('Unique constraint violation - checking which field...')

        // Check if a user with this email exists but different ID
        const { data: emailUser } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('email', user.email!)
          .maybeSingle()

        if (emailUser && emailUser.id !== user.id) {
          console.error('Email exists with different ID:', emailUser.id, 'vs', user.id)
          return NextResponse.json({
            error: 'User profile mismatch detected. Please refresh the page or sign out and sign in again to fix this issue automatically.'
          }, { status: 400 })
        }

        console.log('Username collision, trying with suffix...')
        username = `${username}_${user.id.substring(0, 8)}`
        const { error: retryError } = await supabaseAdmin.from('users').insert({
          id: user.id,
          email: user.email!,
          username: username,
          ftc_team_name: user.user_metadata?.ftc_team_name || null,
          ftc_team_id: user.user_metadata?.ftc_team_id || null,
        })

        if (retryError) {
          console.error('Failed to create user profile after retry:', retryError)
          return NextResponse.json({
            error: `Failed to create user profile: ${retryError.message}`
          }, { status: 400 })
        }
      } else if (userCreateError) {
        console.error('Failed to create user profile:', userCreateError)
        return NextResponse.json({
          error: `Failed to create user profile: ${userCreateError.message}`
        }, { status: 400 })
      }

      // Verify user was created successfully
      const { data: verifyUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      console.log('User verification after creation - exists:', !!verifyUser)

      if (!verifyUser) {
        console.error('User profile creation failed silently')
        return NextResponse.json({
          error: 'Failed to create user profile. Please try signing out and signing in again.'
        }, { status: 400 })
      }
    } else if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user profile:', checkError)
      return NextResponse.json({
        error: `Database error: ${checkError.message}`
      }, { status: 500 })
    }

    // Use admin client to bypass RLS policies
    const { data, error } = await supabaseAdmin.from('projects').insert({
      user_id: user.id,
      project_hash: projectHash,
      name,
      template_type: templateType,
      motor_config: motorConfig,
      workflow_data: {},
    }).select().single()

    if (error) {
      console.error('Project creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ project: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
