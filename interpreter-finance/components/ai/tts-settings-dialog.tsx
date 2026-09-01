'use client'

import { useState, useEffect } from 'react'
import { useTTS, DEFAULT_TTS_SETTINGS, type TTSSettings } from '@/hooks/use-tts'

const LANGUAGES = [
  { value: 'es-US', label: 'Espanol (US)' },
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

export function TTSSettingsDialog() {
  const tts = useTTS()
  const [draft, setDraft] = useState<TTSSettings>(tts.settings ?? DEFAULT_TTS_SETTINGS)

  useEffect(() => {
    if (tts.dialogOpen) setDraft(tts.settings ?? DEFAULT_TTS_SETTINGS)
  }, [tts.dialogOpen, tts.settings])

  if (!tts.dialogOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={() => tts.setDialogOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Configuracion de voz</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige idioma, voz y emocion para la lectura de las respuestas.
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
            <span className="text-xs text-muted-foreground">Emocion</span>
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
  )
}
