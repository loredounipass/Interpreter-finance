import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, getUserIdFromRequest } from '@/lib/supabase-server'

async function ownSession(request: NextRequest, id: string) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return { userId: null, error: NextResponse.json({ error: 'No autenticado.' }, { status: 401 }) }
  }
  const { data, error } = await supabaseServer
    .from('chat_sessions')
    .select('user_id')
    .eq('id', id)
    .single()
  if (error || !data) {
    return { userId, error: NextResponse.json({ error: 'Sesión no encontrada.' }, { status: 404 }) }
  }
  if (data.user_id !== userId) {
    return { userId, error: NextResponse.json({ error: 'No autorizado.' }, { status: 403 }) }
  }
  return { userId, error: null }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await ownSession(request, id)
  if (error) return error

  const { data, error: msgError } = await supabaseServer
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', id)
    .order('position', { ascending: true })

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await ownSession(request, id)
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string') updates.title = body.title
  if (typeof body.model === 'string') updates.model = body.model

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 })
  }

  const { data, error: updError } = await supabaseServer
    .from('chat_sessions')
    .update(updates)
    .eq('id', id)
    .select('id, title, model, created_at, updated_at')
    .single()

  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })
  return NextResponse.json({ session: data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await ownSession(request, id)
  if (error) return error

  const { error: delError } = await supabaseServer.from('chat_sessions').delete().eq('id', id)
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
