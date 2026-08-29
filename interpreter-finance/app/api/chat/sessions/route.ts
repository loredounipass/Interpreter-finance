import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromRequest } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const { data, error } = await supabaseServer
    .from('chat_sessions')
    .select('id, title, model, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data })
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const title =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Nueva conversación'
  const model = typeof body.model === 'string' && body.model ? body.model : 'nvidia-nemotron'

  const { data, error } = await supabaseServer
    .from('chat_sessions')
    .insert([{ user_id: userId, title, model }])
    .select('id, title, model, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}
