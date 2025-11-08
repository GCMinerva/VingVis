import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projecthash: string }> }
) {
  try {
    const { projecthash } = await params
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
      .eq('project_hash', projecthash)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ project: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projecthash: string }> }
) {
  try {
    const { projecthash } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workflowData } = await request.json()

    const { data, error } = await supabase
      .from('projects')
      .update({
        workflow_data: workflowData,
      })
      .eq('project_hash', projecthash)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ project: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projecthash: string }> }
) {
  try {
    const { projecthash } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('project_hash', projecthash)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
