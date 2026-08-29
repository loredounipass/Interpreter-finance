'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Bot, Loader2, Send, Trash2 } from 'lucide-react'
import { useAIChat } from '@/hooks/use-ai-chat'
import { AI_MODEL_LIST } from '@/utils/ai-models'
import { useFinance } from '@/hooks/use-finance'
import type { ChatContext } from '@/utils/ai-system-prompt'

export function AIChat() {
  const { messages, model, setModel, input, setInput, isLoading, error, send, clear } = useAIChat()
  const { goal, ratePerMinute, todayTotal, todayEarnings, monthEarnings, monthTotal, completedDays, goalHitRate, logs } = useFinance()
  const scrollRef = useRef<HTMLDivElement>(null)

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
      recentLogs: logs.map((l) => ({ logged_on: l.logged_on, minutes: l.minutes, note: l.note })),
    }),
    [goal, ratePerMinute, todayTotal, todayEarnings, monthEarnings, monthTotal, completedDays, goalHitRate, logs]
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(context)
    }
  }

  return (
    <section className="glass-panel flex h-[calc(100vh-7rem)] flex-col rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
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
              <option key={m.id} value={m.id} className="bg-card text-foreground">
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

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-4 pr-1">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Empieza a escribir para chatear con el modelo seleccionado.
          </p>
        )}
        {messages.map((m, i) => {
          if (m.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {m.content}
                </div>
              </div>
            )
          }
          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-foreground">
                {m.content === '' && isLoading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  m.content
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

      <div className="flex items-end gap-2 border-t border-white/10 pt-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Escribe un mensaje..."
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button
          onClick={() => send(context)}
          disabled={isLoading || !input.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
    </section>
  )
}
