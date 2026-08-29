import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, password, verify_password } = body

    if (!first_name || !last_name || !email || !password || !verify_password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    if (password !== verify_password) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    if (password.length > 64 || password.length < 4) {
      return NextResponse.json({ error: 'Password must be between 4 and 64 characters.' }, { status: 400 })
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must include uppercase, lowercase, number, and special character.' }, { status: 400 })
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name, last_name } },
    })

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: signUpData.user.id, first_name, last_name, email }])
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ user: profile, message: 'Registration successful.' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })
  }
}