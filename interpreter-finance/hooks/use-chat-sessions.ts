'use client'

import { useCallback, useEffect, useState } from 'react'
import { authHeaders } from '@/lib/api-auth'
import type { ChatMessage, ChatSession } from './use-ai-chat'

const CURRENT_KEY = 'ai_current_session'

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null)
  // Inicia en true para que la carga inicial del chat espere a que terminen
  // de cargar las sesiones antes de abrir la guardada (y restaurar su modelo).
  const [isLoading, setIsLoading] = useState(true)

  const setCurrentSessionId = useCallback((id: string | null) => {
    setCurrentSessionIdState(id)
    if (id) localStorage.setItem(CURRENT_KEY, id)
    else localStorage.removeItem(CURRENT_KEY)
  }, [])

  const loadSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const headers = await authHeaders()
      const res = await fetch('/api/chat/sessions', { headers })
      if (!res.ok) {
        setSessions([])
        return
      }
      const data = await res.json()
      const list: ChatSession[] = data.sessions ?? []
      setSessions(list)
      const saved = localStorage.getItem(CURRENT_KEY)
      if (saved && list.some((s) => s.id === saved)) {
        setCurrentSessionId(saved)
      } else if (list.length > 0) {
        setCurrentSessionId(list[0].id)
      } else {
        setCurrentSessionId(null)
      }
    } catch {
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [setCurrentSessionId])

  const createSession = useCallback(
    async (model: string) => {
      const headers = await authHeaders()
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ model }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const session: ChatSession = data.session
      setSessions((prev) => [session, ...prev])
      setCurrentSessionId(session.id)
      return session
    },
    [setCurrentSessionId]
  )

  const loadHistory = useCallback(async (id: string): Promise<ChatMessage[]> => {
    const headers = await authHeaders()
    const res = await fetch(`/api/chat/sessions/${id}`, { headers })
    if (!res.ok) return []
    const data = await res.json()
    return (data.messages ?? []) as ChatMessage[]
  }, [])

  const deleteSession = useCallback(
    async (id: string) => {
      const headers = await authHeaders()
      await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE', headers })
      setSessions((prev) => prev.filter((s) => s.id !== id))
      setCurrentSessionIdState((cur) => {
        if (cur === id) {
          localStorage.removeItem(CURRENT_KEY)
          return null
        }
        return cur
      })
    },
    []
  )

  const updateSession = useCallback(async (id: string, updates: { title?: string; model?: string }) => {
    const headers = await authHeaders()
    const res = await fetch(`/api/chat/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(updates),
    })
    if (!res.ok) return
    const data = await res.json()
    const session: ChatSession = data.session
    setSessions((prev) => prev.map((s) => (s.id === id ? session : s)))
  }, [])

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading,
    loadSessions,
    createSession,
    loadHistory,
    deleteSession,
    updateSession,
  }
}
