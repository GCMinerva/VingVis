import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// This endpoint syncs the current authenticated user to the users table
// Call this if you get foreign key errors
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

    // Check if user profile exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      return NextResponse.json({ message: 'User profile already exists', user: existingUser })
    }

    // Create user profile using admin client (bypasses RLS)
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user'

    const { data, error } = await supabaseAdmin.from('users').insert({
      id: user.id,
      email: user.email!,
      username: username,
      ftc_team_name: user.user_metadata?.ftc_team_name || null,
      ftc_team_id: user.user_metadata?.ftc_team_id || null,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'User profile created successfully', user: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
