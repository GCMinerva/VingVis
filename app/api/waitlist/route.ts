import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 3 waitlist submissions per 10 minutes
  const rateLimitResponse = rateLimit(request, { interval: 600000, maxRequests: 3 })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { ftc_team_name, ftc_team_id, email } = body

    // Validate required fields
    if (!ftc_team_name || !ftc_team_id || !email) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Insert into waitlist table using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert([
        {
          ftc_team_name,
          ftc_team_id,
          email,
        },
      ])
      .select()
      .single()

    if (error) {
      // Check for duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already on the waitlist' },
          { status: 409 }
        )
      }

      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined the waitlist',
        data
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
