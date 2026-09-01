'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type TTSVoice = 'Diego' | 'Isabela'
export type TTSLanguage = 'es-US' | 'en-US'
export type TTSEmotion = 'default' | 'neutral' | 'calm' | 'happy' | 'angry' | 'pleasantSurprised'

export interface TTSSettings {
  language: TTSLanguage
  voice: TTSVoice
  emotion: TTSEmotion
}

export const DEFAULT_TTS_SETTINGS: TTSSettings = {
  language: 'es-US',
  voice: 'Diego',
  emotion: 'neutral',
}

const STORAGE_KEY = 'if_v1_ai_tts_settings'


// PROVIDES TEXT-TO-SPEECH CONTROL INCLUDING NVCF AUDIO STREAMING, PERSISTENT SETTINGS, AND AUDIO PLAYBACK STATE
export function useTTS() {
  const [enabled, setEnabled] = useState(false)
  const [settings, setSettings] = useState<TTSSettings | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setSettings(JSON.parse(saved) as TTSSettings)
    } catch {
    }
  }, [])

  const saveSettings = useCallback((s: TTSSettings) => {
    setSettings(s)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
    }
    setDialogOpen(false)
    setEnabled(true)
  }, [])

  const toggle = useCallback(() => {
    if (enabled) {
      setEnabled(false)
      setSpeaking(false)
      audioRef.current?.pause()
      return
    }
    if (!settings) {
      setDialogOpen(true)
      return
    }
    setEnabled(true)
  }, [enabled, settings])

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || !settings) return
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language: settings.language,
            voice: settings.voice,
            emotion: settings.emotion,
          }),
        })
        if (!res.ok) return
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        audioRef.current?.pause()
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => setSpeaking(false)
        audio.onpause = () => setSpeaking(false)
        setSpeaking(true)
        audio.play().catch(() => setSpeaking(false))
      } catch {
      }
    },
    [enabled, settings]
  )

  return { enabled, settings, dialogOpen, setDialogOpen, saveSettings, toggle, speak, speaking }
}
