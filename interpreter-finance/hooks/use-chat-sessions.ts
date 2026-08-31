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
        // Actualizar primero el estado de sesiones
        setSessions((prev) => [session, ...prev])
        // Luego establecer como sesión actual
        setCurrentSessionId(session.id)
        // Retornar la sesión para que el componente padre pueda usarla
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
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id)
        // Si la lista queda vacía, aseguramos que currentSessionId sea null
        if (next.length === 0) {
          setCurrentSessionIdState(null)
          localStorage.removeItem(CURRENT_KEY)
        } else if (id === currentSessionId) {
          // Si borramos la sesión actual pero quedan otras, seleccionamos la primera
          setCurrentSessionIdState(next[0].id)
          localStorage.setItem(CURRENT_KEY, next[0].id)
        }
        return next
      })
    },
    [currentSessionId]
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
