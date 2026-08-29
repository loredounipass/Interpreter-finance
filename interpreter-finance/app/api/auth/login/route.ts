import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { data: profile } = await supabase.from('profiles').select().eq('id', data.user.id).single()

    return NextResponse.json({ user: profile, session: data.session }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}