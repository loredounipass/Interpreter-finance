'use client'

import { Bot, Loader2 } from 'lucide-react'
import { Markdown } from './markdown'
import type { ChatMessage } from '@/hooks/use-ai-chat'

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export function ChatMessages({ messages, isLoading, error }: ChatMessagesProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Bot className="size-6" />
          </div>
          <p className="text-lg font-semibold">En que puedo ayudarte hoy?</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Preguntame sobre tu progreso, ganancias o pideme consejos para mantenerte hidratado y combatir la fatiga.
          </p>
        </div>
      )}

      {messages.map((m) => {
        if (m.role === 'user') {
          return (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground">
                {m.content}
              </div>
            </div>
          )
        }
        return (
          <div key={m.id} className="flex gap-3">
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
            ? 'Tu modelo actual no admite imagenes. Quita la imagen o usa un modelo de solo texto.'
            : error}
        </div>
      )}
    </div>
  )
}
