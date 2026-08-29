'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Loader2, ArrowUp, Trash2, Mic, MicOff, Settings2, Waves } from 'lucide-react'
import { useAIChat } from '@/hooks/use-ai-chat'
import { AI_MODEL_LIST } from '@/utils/ai-models'
import { useFinance } from '@/hooks/use-finance'
import { useTTS, DEFAULT_TTS_SETTINGS, type TTSSettings } from '@/hooks/use-tts'
import { useSpeechToText } from '@/hooks/use-speech-to-text'
import type { ChatContext } from '@/utils/ai-system-prompt'

function Markdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/30 [&_pre]:p-3 [&_pre]:text-[13px] [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
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
  const { messages, model, setModel, input, setInput, isLoading, error, send, clear } = useAIChat()
  const { goal, ratePerMinute, todayTotal, todayEarnings, monthEarnings, monthTotal, completedDays, goalHitRate, logs } = useFinance()
  const tts = useTTS()
  const scrollRef = useRef<HTMLDivElement>(null)
  const spokenIdx = useRef(-1)
  const [draft, setDraft] = useState<TTSSettings>(tts.settings ?? DEFAULT_TTS_SETTINGS)

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

  const handleFinal = useCallback(
    (text: string) => {
      setInput(text)
      send(context, text)
    },
    [context, send]
  )

  const stt = useSpeechToText({ lang: tts.settings?.language ?? 'es-US', onFinal: handleFinal })

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
  useEffect(() => {
    if (isLoading || !tts.enabled) return
    const lastIdx = messages.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1)
    if (lastIdx > spokenIdx.current) {
      spokenIdx.current = lastIdx
      const content = messages[lastIdx]?.content ?? ''
      if (content.trim()) tts.speak(content)
    }
  }, [messages, isLoading, tts.enabled, tts.speak])

  // Sincronizar el borrador al abrir el dialogo.
  useEffect(() => {
    if (tts.dialogOpen) setDraft(tts.settings ?? DEFAULT_TTS_SETTINGS)
  }, [tts.dialogOpen, tts.settings])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(context)
    }
  }

  const canSend = !isLoading && input.trim().length > 0

  return (
    <section className="glass-panel flex h-[calc(100vh-7rem)] flex-col rounded-2xl p-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Bot className="size-5" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Assistant</p>
            <h2 className="mt-1 text-lg font-semibold">AI chat</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/50"
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
            className="grid size-9 place-items-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:text-foreground"
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
              {error}
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
              aria-label={stt.listening ? 'Detener dictado' : 'Dictar con voz'}
              className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors ${
                stt.listening
                  ? 'animate-pulse bg-destructive text-destructive-foreground'
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
              className="max-h-40 min-h-[1.75rem] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
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
            {tts.enabled ? '🔊 Voz activada · ' : ''}Enter para enviar, Shift+Enter para salto de línea.
          </p>
        </div>
      </div>

      {tts.dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
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
