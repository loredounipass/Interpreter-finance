import { NextRequest, NextResponse } from 'next/server'
import { AI_MODELS } from '@/utils/ai-models'
import { PROVIDERS, getProviderApiKey } from '@/utils/ai-providers'
import { buildSystemPrompt, type ChatContext } from '@/utils/ai-system-prompt'
import { getUserIdFromRequest } from '@/lib/supabase-server'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  console.log('[chat] POST called')
  try {
    const { userId, supabase } = await getUserIdFromRequest(request)

    const body = await request.json()
    const modelKey = String(body.model ?? '')
    const messages = (body.messages ?? []) as ChatMessage[]
    const context = (body.context ?? null) as ChatContext | null
    let sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''

    const model = AI_MODELS[modelKey]
    if (!model) {
      return NextResponse.json({ error: 'Modelo no encontrado.' }, { status: 400 })
    }
    if (model.modelType !== 'chat') {
      return NextResponse.json({ error: 'Este modelo no es de chat.' }, { status: 400 })
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Faltan mensajes.' }, { status: 400 })
    }

    let basePos = 0

    const saveMsg = async (role: string, content: string, position: number) => {
      if (!userId || !supabase || !sessionId) return
      try {
        await supabase.from('chat_messages').insert([
          { session_id: sessionId, user_id: userId, role, content, position },
        ])
      } catch { /* persistencia optional */ }
    }

    const updateSession = async () => {
      if (!userId || !supabase || !sessionId) return
      try {
        await supabase.from('chat_sessions').update({ model: modelKey, updated_at: new Date().toISOString() }).eq('id', sessionId)
      } catch { /* optional */ }
    }

    // Resolver sesión (best-effort).
    if (supabase && sessionId) {
      try {
        const { data: sess } = await supabase.from('chat_sessions').select('id, user_id').eq('id', sessionId).single()
        if (!sess || sess.user_id !== userId) sessionId = ''
      } catch { sessionId = '' }
    }
    console.log('[chat] sessionId=', sessionId ? 'set' : 'none', 'userId=', userId ? 'set' : 'none')
    if (!sessionId && supabase) {
      try {
        const firstUser = [...messages].reverse().find((m) => m.role === 'user')
        const title = firstUser ? firstUser.content.slice(0, 60) : 'Nueva conversación'
        const { data: sess, error: sessErr } = await supabase.from('chat_sessions').insert([{ user_id: userId, title, model: modelKey }]).select('id').single()
        if (!sessErr && sess) { sessionId = sess.id }
      } catch { /* optional */ }
    }
    if (sessionId && supabase) {
      try {
        const { count } = await supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('session_id', sessionId)
        basePos = count ?? 0
      } catch { basePos = 0 }
    }

    // Guardar mensaje del usuario (best-effort).
    const userMsg = messages[messages.length - 1]
    await saveMsg(userMsg.role, userMsg.content, basePos + 1)

    const provider = PROVIDERS[model.apiProvider]
    const apiKey = getProviderApiKey(model.apiProvider)
    if (!apiKey) {
      return NextResponse.json({ error: `Falta la variable de entorno ${provider.envKey}.` }, { status: 500 })
    }

    const systemPrompt = context ? buildSystemPrompt(context) : ''
    const fullMessages: ChatMessage[] = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages

    console.log('[chat] fetching NVIDIA...')
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model.id, messages: fullMessages, temperature: body.temperature ?? 0.2, max_tokens: body.max_tokens ?? 1024, stream: true }),
    })
    console.log('[chat] NVIDIA response ok=', response.ok, 'hasBody=', !!response.body)
    if (!response.ok || !response.body) {
      const text = await response.text()
      console.log('[chat] NVIDIA error:', response.status, text.slice(0, 200))
      return NextResponse.json({ error: `Error del provider (${response.status}): ${text.slice(0, 300)}` }, { status: 502 })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = response.body!.getReader()
        let buffer = ''
        let acc = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              const payload = trimmed.slice(5).trim()
              if (payload === '[DONE]') continue
              try {
                const json = JSON.parse(payload)
                const delta: string = json?.choices?.[0]?.delta?.content ?? ''
                if (delta) { acc += delta; controller.enqueue(encoder.encode(delta)) }
              } catch { /* ignora */ }
            }
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`\n[Error de stream: ${e instanceof Error ? e.message : String(e)}]`))
        } finally {
          controller.close()
          // Persistencia best-effort: asistente + sesión.
          if (acc.trim()) await saveMsg('assistant', acc, basePos + 2)
          await updateSession()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Model': model.id, 'X-Session-Id': sessionId },
    })
  } catch (error) {
    return NextResponse.json({ error: `Error interno: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
  }
}