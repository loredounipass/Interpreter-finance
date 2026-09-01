'use client'

import { useCallback, useEffect, useState } from 'react'
import { authHeaders } from '@/lib/api-auth'
import type { ChatMessage, ChatSession } from './use-ai-chat'

const CURRENT_KEY = 'ai_current_session'


// MANAGES PERSISTENT CHAT SESSION LIFECYCLE INCLUDING CREATION, SELECTION, HISTORY LOADING, AND DELETION VIA THE API
export function useChatSessions(isAuthenticated = false) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null)
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
      if (!headers.Authorization) {
        setSessions([])
        setCurrentSessionId(null)
        return
      }
      const res = await fetch('/api/chat/sessions', { headers })
      if (!res.ok) {
        setSessions([])
        setCurrentSessionId(null)
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
      setCurrentSessionId(null)
    } finally {
      setIsLoading(false)
    }
  }, [setCurrentSessionId])

  const createSession = useCallback(
    async (model: string) => {
      try {
        const headers = await authHeaders()
        const res = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ model }),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error('Error al crear sesión:', errorData.error ?? res.statusText)
          return null
        }
        const data = await res.json()
        if (!data?.session?.id) {
          console.error('La sesión creada no tiene ID válido:', data)
          return null
        }
        const session: ChatSession = data.session
        setSessions((prev) => [session, ...prev])
        setCurrentSessionId(session.id)
        return session
      } catch (e) {
        console.error('Excepción al crear sesión:', e)
        return null
      }
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
      const res = await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE', headers })
      if (!res.ok) return
      const prevSessions = sessions
      const next = prevSessions.filter((s) => s.id !== id)
      setSessions(next)
      if (next.length === 0) {
        setCurrentSessionIdState(null)
        localStorage.removeItem(CURRENT_KEY)
      } else if (id === currentSessionId) {
        setCurrentSessionIdState(next[0].id)
        localStorage.setItem(CURRENT_KEY, next[0].id)
      }
    },
    [currentSessionId, sessions]
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

  // Only load sessions once the user is authenticated, preventing 401 race conditions
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions()
    }
  }, [isAuthenticated, loadSessions])

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
