'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Loader2, ArrowUp, Trash2, Mic, MicOff, Settings2, Waves, Plus, Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useAIChat } from '@/hooks/use-ai-chat'
import { useChatSessions } from '@/hooks/use-chat-sessions'
import { AI_MODEL_LIST, AI_MODELS } from '@/utils/ai-models'
import { useFinance } from '@/hooks/use-finance'
import { useTTS, DEFAULT_TTS_SETTINGS, type TTSSettings } from '@/hooks/use-tts'
import { useSpeechToText } from '@/hooks/use-speech-to-text'
import type { ChatContext } from '@/utils/ai-system-prompt'

function Markdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_a]:break-words [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:break-all [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/30 [&_pre]:p-3 [&_pre]:text-[13px] [&_pre]:whitespace-pre-wrap [&_pre]:max-w-full [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-white/10 [&_th]:p-2 [&_td]:border [&_td]:border-white/10 [&_td]:p-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}

const LANGUAGES = [
  { value: 'es-US', label: 'Español (US)' },
  { value: 'en-US', label: 'English (US)' },
] as const

const VOICES = [
  { value: 'Diego', label: 'Diego' },
  { value: 'Isabela', label: 'Isabela' },
] as const

const EMOTIONS = [
  { value: 'default', label: 'Por defecto' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'calm', label: 'Calmado' },
  { value: 'happy', label: 'Feliz' },
  { value: 'angry', label: 'Enojado' },
  { value: 'pleasantSurprised', label: 'Sorprendido' },
] as const

const selectClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50'

export function AIChat() {
  const { goal, ratePerMinute, todayTotal, todayEarnings, monthEarnings, monthTotal, completedDays, goalHitRate, logs } = useFinance()
  const tts = useTTS()
  const scrollRef = useRef<HTMLDivElement>(null)
  const spokenIdx = useRef(-1)
  const [draft, setDraft] = useState<TTSSettings>(tts.settings ?? DEFAULT_TTS_SETTINGS)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading: sessionsLoading,
    createSession,
    loadHistory,
    deleteSession,
    updateSession,
  } = useChatSessions()

  const { messages, setMessages, model, setModel, input, setInput, isLoading, error, setError, send, clear } = useAIChat({
    sessionId: currentSessionId,
    onSessionCreated: setCurrentSessionId,
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

  // Marca el momento en que terminó de hablar TTS para ignorar el eco del
  // altavoz (en móvil el micrófono captura el audio de Maggie y se genera
  // un bucle que repite la respuesta y gasta la API).
  const ttsEndRef = useRef(0)
  useEffect(() => {
    if (!tts.speaking) ttsEndRef.current = Date.now()
  }, [tts.speaking])

  // Evita enviar el mismo texto dos veces seguidas (el STT a veces dispara el
  // resultado final más de una vez, o captura un eco).
  const lastSentRef = useRef<{ text: string; time: number } | null>(null)

  const handleFinal = useCallback(
    (text: string) => {
      if (tts.speaking) return
      // Ignora resultados dentro de los 2s posteriores a que Maggie terminó
      // de hablar: es el eco del propio TTS, no tu voz.
      if (Date.now() - ttsEndRef.current < 2000) return
      const now = Date.now()
      if (lastSentRef.current && lastSentRef.current.text === text && now - lastSentRef.current.time < 3000) return
      lastSentRef.current = { text, time: now }
      setInput(text)
      send(context, text)
    },
    [context, send, tts.speaking]
  )

  const stt = useSpeechToText({
    lang: tts.settings?.language ?? 'es-US',
    onFinal: handleFinal,
    blockListening: tts.speaking,
  })

  // Mostrar en vivo el texto reconocido en el input mientras se escucha.
  useEffect(() => {
    if (stt.listening) setInput(stt.transcript)
  }, [stt.transcript, stt.listening])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Al activar la voz, no leemos mensajes anteriores: avanzamos el marcador.
  useEffect(() => {
    if (tts.enabled) {
      const lastIdx = messages.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1)
      spokenIdx.current = lastIdx
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tts.enabled])

  // Reproducir TTS cuando termina de generarse un mensaje del asistente.
  // Usamos speakRef para no re-ejecutar este efecto si cambia la identidad de
  // tts.speak (eso repetiría la última respuesta sin que haya un mensaje nuevo).
  const speakRef = useRef(tts.speak)
  speakRef.current = tts.speak
  useEffect(() => {
    if (isLoading || !tts.enabled) return
    const lastIdx = messages.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1)
    if (lastIdx > spokenIdx.current) {
      spokenIdx.current = lastIdx
      const content = messages[lastIdx]?.content ?? ''
      if (content.trim()) speakRef.current(content)
    }
  }, [messages, isLoading, tts.enabled])

  // Sincronizar el borrador al abrir el dialogo.
  useEffect(() => {
    if (tts.dialogOpen) setDraft(tts.settings ?? DEFAULT_TTS_SETTINGS)
  }, [tts.dialogOpen, tts.settings])

  // Cargar el historial de la sesión indicada (marcando como ya leídas las
  // respuestas para no reproducirlas con TTS al abrir).
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
    if (!session) return
    setMessages([])
    setError(null)
    spokenIdx.current = -1
    setSidebarOpen(false)
  }, [createSession, model, setMessages, setError])

  const onDeleteSession = useCallback(
    async (id: string) => {
      const wasCurrent = id === currentSessionId
      await deleteSession(id)
      // Recargar sesiones para asegurar que el estado esté sincronizado
      // después de eliminar (útil cuando se borran todas las sesiones).
      if (wasCurrent) {
        setMessages([])
        setError(null)
        spokenIdx.current = -1
      }
    },
    [deleteSession, currentSessionId, setMessages]
  )

  const onModelChange = useCallback(
    (value: string) => {
      setModel(value)
      if (currentSessionId) updateSession(currentSessionId, { model: value })
    },
    [currentSessionId, updateSession, setModel]
  )

  // Carga inicial: una vez lista la lista de sesiones, abre la sesión guardada.
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
      {/* Sidebar de sesiones */}
      <aside
        className={`absolute inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-sidebar/90 backdrop-blur-xl transition-[transform,width] md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:hidden' : 'md:flex'}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Chats</p>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar"
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" /> Nuevo chat
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">Aún no hay conversaciones.</p>
          ) : (
            sessions.map((s) => {
              const active = s.id === currentSessionId
              return (
                <div
                  key={s.id}
                  className={`group flex items-start gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                    active ? 'bg-primary/10' : 'hover:bg-white/5'
                  }`}
                >
                  <button onClick={() => { openSession(s.id); setSidebarOpen(false) }} className="min-w-0 flex-1 text-left">
                    <p className={`truncate text-sm ${active ? 'text-primary' : 'text-foreground'}`}>{s.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {AI_MODELS[s.model]?.name ?? s.model}
                    </p>
                  </button>
                  <button
                    onClick={() => onDeleteSession(s.id)}
                    aria-label="Borrar historial"
                    className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* Columna del chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir chats"
              className="grid size-8 place-items-center rounded-xl border border-white/10 text-muted-foreground md:hidden"
            >
              <Menu className="size-4" />
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Mostrar chats' : 'Ocultar chats'}
              className="hidden size-8 place-items-center rounded-xl border border-white/10 text-muted-foreground transition-colors hover:text-foreground md:grid"
            >
              {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
            <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary sm:size-9">
              <Bot className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">Assistant</p>
              <h2 className="truncate text-base font-semibold leading-tight sm:text-lg">interpreter AI</h2>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/50 sm:flex-none sm:px-3"
            >
              {AI_MODEL_LIST.map((m) => (
                <option key={m.key} value={m.key} className="bg-card text-foreground">
                  {m.name}
                </option>
              ))}
            </select>
            <button
              onClick={clear}
              aria-label="Clear chat"
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Bot className="size-6" />
                </div>
                <p className="text-lg font-semibold">¿En qué puedo ayudarte hoy?</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Pregúntame sobre tu progreso, ganancias o pídeme consejos para mantenerte hidratado y combatir la fatiga.
                </p>
              </div>
            )}

            {messages.map((m, i) => {
              if (m.role === 'user') {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground">
                      {m.content}
                    </div>
                  </div>
                )
              }
              return (
                <div key={i} className="flex gap-3">
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    <Bot className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {m.content === '' && isLoading ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Markdown content={m.content} />
                    )}
                  </div>
                </div>
              )
            })}

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {/image|imagen|not support|unsupported/i.test(error)
                  ? 'Tu modelo actual no admite imágenes. Quita la imagen o usa un modelo de solo texto.'
                  : error}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-5">
          <div className="mx-auto w-full max-w-3xl">
            <div className="relative flex items-end gap-2 rounded-3xl border border-white/10 bg-white/[0.04] px-3 py-2.5 transition-colors focus-within:border-primary/50">
              <button
                type="button"
                onClick={stt.toggle}
                disabled={isLoading}
                aria-label={stt.armed ? 'Detener dictado' : 'Dictar con voz'}
                className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-40 ${
                  stt.listening
                    ? 'animate-pulse bg-destructive text-destructive-foreground'
                    : stt.armed
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Waves className="size-4" />
              </button>
              <button
                type="button"
                onClick={tts.toggle}
                aria-label={tts.enabled ? 'Desactivar voz' : 'Activar voz'}
                className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors ${
                  tts.enabled ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tts.enabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}
              </button>
              {tts.enabled && (
                <button
                  type="button"
                  onClick={() => tts.setDialogOpen(true)}
                  aria-label="Configurar voz"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Settings2 className="size-4" />
                </button>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Escribe un mensaje..."
                className="max-h-40 min-h-[1.75rem] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => send(context)}
                disabled={!canSend}
                aria-label="Enviar"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {tts.enabled ? '🔊 Voz activada' : ''}
            </p>
          </div>
        </div>
      </div>

      {tts.dialogOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => tts.setDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Configuración de voz</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige idioma, voz y emoción para la lectura de las respuestas.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs text-muted-foreground">Idioma</span>
                <select
                  value={draft.language}
                  onChange={(e) => setDraft({ ...draft, language: e.target.value as TTSSettings['language'] })}
                  className={selectClass}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Voz</span>
                <select
                  value={draft.voice}
                  onChange={(e) => setDraft({ ...draft, voice: e.target.value as TTSSettings['voice'] })}
                  className={selectClass}
                >
                  {VOICES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Emoción</span>
                <select
                  value={draft.emotion}
                  onChange={(e) => setDraft({ ...draft, emotion: e.target.value as TTSSettings['emotion'] })}
                  className={selectClass}
                >
                  {EMOTIONS.map((em) => (
                    <option key={em.value} value={em.value}>{em.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => tts.setDialogOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => tts.saveSettings(draft)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
