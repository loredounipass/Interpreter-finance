'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAIChat } from '@/hooks/use-ai-chat'
import { useChatSessions } from '@/hooks/use-chat-sessions'
import { useFinance } from '@/hooks/use-finance'
import { useTTS } from '@/hooks/use-tts'
import { useSpeechToText } from '@/hooks/use-speech-to-text'
import type { ChatContext } from '@/utils/ai-system-prompt'
import { ChatSidebar } from './chat-sidebar'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { TTSSettingsDialog } from './tts-settings-dialog'

export function AIChat() {
  const { goal, ratePerMinute, todayTotal, todayEarnings, monthEarnings, monthTotal, completedDays, goalHitRate, logs } = useFinance()
  const tts = useTTS()
  const scrollRef = useRef<HTMLDivElement>(null)
  const spokenIdx = useRef(-1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading: sessionsLoading,
    loadSessions,
    createSession,
    loadHistory,
    deleteSession,
    updateSession,
  } = useChatSessions()

  const { messages, setMessages, model, setModel, input, setInput, isLoading, error, setError, send, clear } = useAIChat({
    sessionId: currentSessionId,
    onSessionCreated: (id) => {
      setCurrentSessionId(id)
      loadSessions()
    },
  })

  const context = useMemo<ChatContext>(
    () => ({
      goalMinutes: goal,
      ratePerMinute,
      todayMinutes: todayTotal,
      todayEarnings,
      monthEarnings,
      monthTotal,
      completedDays,
      goalHitRate,
      language: tts.settings?.language ?? 'es-US',
      recentLogs: logs.map((l) => ({ logged_on: l.logged_on, minutes: l.minutes, note: l.note })),
    }),
    [goal, ratePerMinute, todayTotal, todayEarnings, monthEarnings, monthTotal, completedDays, goalHitRate, logs, tts.settings]
  )

  const ttsEndRef = useRef(0)
  useEffect(() => {
    if (!tts.speaking) ttsEndRef.current = Date.now()
  }, [tts.speaking])

  const lastSentRef = useRef<{ text: string; time: number } | null>(null)

  const handleFinal = useCallback(
    (text: string) => {
      if (tts.speaking) return
      if (Date.now() - ttsEndRef.current < 2000) return
      const now = Date.now()
      if (lastSentRef.current && lastSentRef.current.text === text && now - lastSentRef.current.time < 3000) return
      lastSentRef.current = { text, time: now }
      setInput(text)
      send(context, text)
    },
    [context, send, setInput, tts.speaking]
  )

  const stt = useSpeechToText({
    lang: tts.settings?.language ?? 'es-US',
    onFinal: handleFinal,
    blockListening: tts.speaking,
  })

  useEffect(() => {
    if (stt.listening) setInput(stt.transcript)
  }, [stt.transcript, stt.listening, setInput])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (tts.enabled) {
      const lastIdx = messages.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1)
      spokenIdx.current = lastIdx
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tts.enabled])

  const speakRef = useRef(tts.speak)
  useEffect(() => { speakRef.current = tts.speak }, [tts.speak])
  useEffect(() => {
    if (isLoading || !tts.enabled) return
    const lastIdx = messages.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1)
    if (lastIdx > spokenIdx.current) {
      spokenIdx.current = lastIdx
      const content = messages[lastIdx]?.content ?? ''
      if (content.trim()) speakRef.current(content)
    }
  }, [messages, isLoading, tts.enabled])

  const openSession = useCallback(
    async (id: string) => {
      setCurrentSessionId(id)
      const msgs = await loadHistory(id)
      setMessages(msgs)
      const lastIdx = msgs.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1)
      spokenIdx.current = lastIdx
      const sess = sessions.find((s) => s.id === id)
      if (sess) setModel(sess.model)
    },
    [setCurrentSessionId, loadHistory, setMessages, setModel, sessions]
  )

  const startNewChat = useCallback(async () => {
    const session = await createSession(model)
    if (!session?.id) {
      setError('No se pudo crear la sesion. Por favor, intenta de nuevo.')
      return
    }
    setMessages([])
    setError(null)
    spokenIdx.current = -1
    setSidebarOpen(false)
  }, [createSession, model, setMessages, setError])

  const onDeleteSession = useCallback(
    async (id: string) => {
      const wasCurrent = id === currentSessionId
      await deleteSession(id)
      if (wasCurrent) {
        setMessages([])
        setError(null)
        spokenIdx.current = -1
      }
    },
    [deleteSession, currentSessionId, setMessages, setError]
  )

  const onModelChange = useCallback(
    (value: string) => {
      setModel(value)
      if (currentSessionId) updateSession(currentSessionId, { model: value })
    },
    [currentSessionId, updateSession, setModel]
  )

  const didInitLoad = useRef(false)
  useEffect(() => {
    if (didInitLoad.current || sessionsLoading) return
    didInitLoad.current = true
    if (currentSessionId && sessions.length > 0) openSession(currentSessionId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsLoading, currentSessionId, sessions.length])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(context)
    }
  }

  const canSend = !isLoading && input.trim().length > 0

  return (
    <section className="relative flex h-full min-h-0">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        sidebarOpen={sidebarOpen}
        collapsed={collapsed}
        onOpenSession={openSession}
        onDeleteSession={onDeleteSession}
        onStartNewChat={startNewChat}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          model={model}
          onModelChange={onModelChange}
          onClear={clear}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
          onOpenMobileSidebar={() => setSidebarOpen(true)}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          <ChatMessages messages={messages} isLoading={isLoading} error={error} />
        </div>

        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={() => send(context)}
          onKeyDown={onKeyDown}
          isLoading={isLoading}
          canSend={canSend}
          stt={stt}
          tts={tts}
        />
      </div>

      <TTSSettingsDialog
        key={tts.dialogOpen ? 'open' : 'closed'}
        open={tts.dialogOpen}
        onClose={() => tts.setDialogOpen(false)}
        onSave={tts.saveSettings}
        currentSettings={tts.settings}
      />
    </section>
  )
}
