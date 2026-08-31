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

// MANAGES AI CHAT STATE, MESSAGE HISTORY, AND STREAMING COMMUNICATION WITH THE BACKEND API
export function useAIChat(opts?: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [model, setModel] = useState<string>(DEFAULT_MODEL)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null)

  const send = useCallback(
    async (context?: ChatContext, overrideText?: string) => {
      const text = (overrideText ?? input).trim()
      if (!text || isLoading) return

      const sessionIdToSend = opts?.sessionId ?? pendingSessionId

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
              sessionId: sessionIdToSend ?? null,
            }),
          })

          if (!res.ok && res.status === 0) {
            throw new Error('Error de conexión. Reintentando...')
          }

          if (!res.ok || !res.body) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error ?? 'Error al enviar el mensaje.')
          }

          const newSessionId = res.headers.get('X-Session-Id')
          if (newSessionId) {
            setPendingSessionId(newSessionId)
            opts?.onSessionCreated?.(newSessionId)
          }

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let acc = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            acc += decoder.decode(value, { stream: true })
            setMessages([...nextMessages, { role: 'assistant', content: acc }])
          }

          break
        } catch (e: unknown) {
          lastError = e instanceof Error ? e : new Error(String(e))
          
          if (lastError.message.includes('conexión') || lastError.message.includes('fetch') || lastError.message.includes('Failed to fetch')) {
            if (retryCount < maxRetries) {
              retryCount++
              await new Promise((r) => setTimeout(r, 1000 * retryCount))
              continue
            }
          }
          
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
