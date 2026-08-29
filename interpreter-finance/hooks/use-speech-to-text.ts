'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SILENCE_MS = 4000

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

export function useSpeechToText({
  lang = 'es-US',
  onFinal,
}: {
  lang?: string
  onFinal?: (text: string) => void
}) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finalRef = useRef('')
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  const clearSilence = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
  }

  const stop = useCallback(() => {
    clearSilence()
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      console.warn('Web Speech API no esta soportada en este navegador (usa Chrome/Edge).')
      return
    }
    finalRef.current = ''
    setTranscript('')
    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: { resultIndex: number; results: SpeechRecognitionResultLike[] }) => {
      let interim = ''
      let finalChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finalChunk += res[0].transcript
        else interim += res[0].transcript
      }
      if (finalChunk) {
        finalRef.current += finalChunk + ' '
        clearSilence()
        silenceTimer.current = setTimeout(() => {
          const text = finalRef.current.trim()
          recognition.stop()
          if (text) onFinalRef.current?.(text)
        }, SILENCE_MS)
      }
      setTranscript(finalRef.current + interim)
    }

    recognition.onerror = (e: { error?: string }) => {
      console.error('[STT]', e?.error)
      setListening(false)
      clearSilence()
    }

    recognition.onend = () => {
      setListening(false)
      clearSilence()
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [lang])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      clearSilence()
    }
  }, [])

  return { listening, transcript, start, stop, toggle }
}
