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
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `Error del provider (${response.status}): ${text.slice(0, 300)}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const content: string =
      data?.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({ content, model: model.id })
  } catch (error) {
    return NextResponse.json(
      { error: `Error interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
