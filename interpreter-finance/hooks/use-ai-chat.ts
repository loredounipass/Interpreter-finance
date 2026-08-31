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

      // Verificar que haya un sessionId válido si se requiere
      if (!opts?.sessionId) {
        console.error('Intento de enviar mensaje sin sessionId:', { sessionId: opts?.sessionId, hasOpt: !!opts })
        setError('No hay una sesión activa. Por favor, crea o selecciona una sesión.')
        return
      }

      const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
      setMessages([...nextMessages, { role: 'assistant', content: '' }])
      setInput('')
      setError(null)
      setIsLoading(true)

      let lastError: Error | null = null
      const maxRetries = 2
      let retryCount = 0

      while (retryCount <= maxRetries) {
        try {
          const headers = await authHeaders()
          
          // Verificar si hay token de autenticación
          if (!headers.Authorization && retryCount === 0) {
            setError('No estás autenticado. Por favor, inicia sesión.')
            setMessages(nextMessages)
            setIsLoading(false)
            return
          }

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

          // Manejar errores de conexión (posible sleep de Render)
          if (!res.ok && res.status === 0) {
            throw new Error('Error de conexión. Reintentando...')
          }

          if (!res.ok || !res.body) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error ?? 'Error al enviar el mensaje.')
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

          // Si llegamos aquí, fue exitoso
          break
        } catch (e: unknown) {
          lastError = e instanceof Error ? e : new Error(String(e))
          
          // Si es error de conexión y podemos reintentar, esperar y continuar
          if (lastError.message.includes('conexión') || lastError.message.includes('fetch') || lastError.message.includes('Failed to fetch')) {
            if (retryCount < maxRetries) {
              retryCount++
              await new Promise((r) => setTimeout(r, 1000 * retryCount))
              continue
            }
          }
          
          // Si no es error de conexión o ya reintentamos, mostrar error
          setError(lastError.message)
          setMessages(nextMessages)
          break
        }
      }

      setIsLoading(false)
    },
    [input, isLoading, messages, model, opts]
  )

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, setMessages, model, setModel, input, setInput, isLoading, error, setError, send, clear }
}
