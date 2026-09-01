'use client'

import { useRef } from 'react'
import { ArrowUp, Loader2, Waves, Mic, MicOff, Settings2 } from 'lucide-react'
import type { TTSSettings } from '@/hooks/use-tts'

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
  canSend: boolean
  stt: {
    toggle: () => void
    armed: boolean
    listening: boolean
  }
  tts: {
    enabled: boolean
    toggle: () => void
    setDialogOpen: (open: boolean) => void
    settings: TTSSettings | null
  }
}

export function ChatInput({
  input,
  onInputChange,
  onSend,
  onKeyDown,
  isLoading,
  canSend,
  stt,
  tts,
}: ChatInputProps) {
  return (
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
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Escribe un mensaje..."
            aria-label="Escribe un mensaje"
            className="max-h-40 min-h-[1.75rem] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onSend}
            disabled={!canSend}
            aria-label="Enviar"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {tts.enabled ? 'Voz activada' : ''}
        </p>
      </div>
    </div>
  )
}
