import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-server'


// PROXIES INCOMING HTTP REQUESTS TO SUPABASE TABLE OPERATIONS (DAILY_LOGS, GOALS) BASED ON THE URL PATH SEGMENT AND HTTP METHOD.
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const supabase = createSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 500 })
  }

  const { path } = await context.params
  const segment = path[0]
  const id = path[1]

  try {
    switch (segment) {
      case 'entries': {
        if (request.method === 'GET' && !id) {
          const { data, error } = await supabase.from('daily_logs').select('*').order('created_at', { ascending: false })
          if (error) throw error
          return NextResponse.json(data)
        }
        if (request.method === 'POST' && !id) {
          const body = await request.json()
          const { data, error } = await supabase.from('daily_logs').insert([{ logged_on: body.date, minutes: body.minutes, note: body.note ?? null }]).select().single()
          if (error) throw error
          return NextResponse.json(data, { status: 201 })
        }
        if (request.method === 'DELETE' && id) {
          const { error } = await supabase.from('daily_logs').delete().eq('id', id)
          if (error) throw error
          return new NextResponse(null, { status: 204 })
        }
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      case 'goals': {
        if (path[1] === 'daily' && request.method === 'GET') {
          const { data, error } = await supabase.from('goals').select('*').order('updated_at', { ascending: false }).limit(1).single()
          if (error) throw error
          return NextResponse.json(data)
        }
        if (path[1] === 'daily' && request.method === 'PUT') {
          const body = await request.json()
          const { data, error } = await supabase.from('goals').upsert([{ daily_minutes: body.minutes }]).select().single()
          if (error) throw error
          return NextResponse.json(data)
        }
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      default:
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Unable to reach the Supabase backend.' }, { status: 500 })
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
