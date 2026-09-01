import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/supabase-server'


// CREATES A USER PROFILE ROW IN SUPABASE AFTER REGISTRATION (SERVER-SIDE ONLY)
export async function POST(request: NextRequest) {
  const { userId, supabase } = await getUserIdFromRequest(request)
  if (!userId || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { firstName, lastName, email } = body

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .insert([{ id: userId, first_name: firstName, last_name: lastName, email }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
