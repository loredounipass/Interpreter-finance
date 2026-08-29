'use client'

import { useCallback, useState } from 'react'
import { DEFAULT_MODEL } from '@/utils/ai-models'
import type { ChatContext } from '@/utils/ai-system-prompt'
import { authHeaders } from '@/lib/api-auth'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatSession {
  id: string
  title: string
  model: string
  created_at: string
  updated_at: string
}

interface UseAIChatOptions {
  sessionId?: string | null
  onSessionCreated?: (id: string) => void
}

export function useAIChat(opts?: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [model, setModel] = useState<string>(DEFAULT_MODEL)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (context?: ChatContext, overrideText?: string) => {
      const text = (overrideText ?? input).trim()
      if (!text || isLoading) return

      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
      setMessages([...nextMessages, { role: 'assistant', content: '' }])
      setInput('')
      setError(null)
      setIsLoading(true)

      try {
        const headers = await authHeaders()
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({
            model,
            messages: nextMessages,
            context,
            sessionId: opts?.sessionId ?? null,
          }),
        })

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Error al enviar el mensaje.')
          setMessages(nextMessages)
          return
        }

        // El servidor crea la sesión si no se envió una; nos devuelve el id.
        const newSessionId = res.headers.get('X-Session-Id')
        if (newSessionId && opts?.onSessionCreated) opts.onSessionCreated(newSessionId)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acc = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          setMessages([...nextMessages, { role: 'assistant', content: acc }])
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
        setMessages(nextMessages)
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, messages, model, opts]
  )

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, setMessages, model, setModel, input, setInput, isLoading, error, setError, send, clear }
}
