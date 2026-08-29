import { NextRequest, NextResponse } from 'next/server'
import { AI_MODELS } from '@/utils/ai-models'
import { PROVIDERS, getProviderApiKey } from '@/utils/ai-providers'
import { buildSystemPrompt, type ChatContext } from '@/utils/ai-system-prompt'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const modelKey = String(body.model ?? '')
    const messages = (body.messages ?? []) as ChatMessage[]
    const context = (body.context ?? null) as ChatContext | null

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

    const provider = PROVIDERS[model.apiProvider]
    const apiKey = getProviderApiKey(model.apiProvider)
    if (!apiKey) {
      return NextResponse.json(
        { error: `Falta la variable de entorno ${provider.envKey}.` },
        { status: 500 }
      )
    }

    // Inyectamos el system prompt con el contexto del usuario (goal,
    // earnings, daily logs) delante de los mensajes del chat.
    const systemPrompt = context ? buildSystemPrompt(context) : ''
    const fullMessages: ChatMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id,
        messages: fullMessages,
        temperature: body.temperature ?? 0.2,
        max_tokens: body.max_tokens ?? 1024,
        stream: true,
      }),
    })

    if (!response.ok || !response.body) {
      const text = await response.text()
      return NextResponse.json(
        { error: `Error del provider (${response.status}): ${text.slice(0, 300)}` },
        { status: 502 }
      )
    }

    // Reenviamos el stream del provider al cliente. El provider (NVIDIA,
    // OpenAI-compatible) devuelve SSE: lineas "data: {...}" con deltas de
    // contenido. Extraemos solo el texto y lo emitimos como stream de texto.
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = response.body!.getReader()
        let buffer = ''
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
                if (delta) controller.enqueue(encoder.encode(delta))
              } catch {
                // ignora lineas no parseables
              }
            }
          }
        } catch (e) {
          controller.enqueue(
            encoder.encode(`\n[Error de stream: ${e instanceof Error ? e.message : String(e)}]`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Model': model.id,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Error interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
