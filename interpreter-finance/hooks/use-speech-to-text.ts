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
  blockListening = false,
}: {
  lang?: string
  onFinal?: (text: string) => void
  blockListening?: boolean
}) {
  const [listening, setListening] = useState(false)
  const [armed, setArmed] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finalRef = useRef('')
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal
  const armedRef = useRef(false)
  const blockRef = useRef(blockListening)
  blockRef.current = blockListening
  const prevBlock = useRef(false)

  const clearSilence = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
  }

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      console.warn('Web Speech API no esta soportada en este navegador (usa Chrome/Edge).')
      return
    }
    if (blockRef.current) return
    finalRef.current = ''
    setTranscript('')
    armedRef.current = true
    setArmed(true)
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
      // Dictado continuo: si sigue armado y no esta bloqueado, reiniciar.
      if (armedRef.current && !blockRef.current) {
        restartTimer.current = setTimeout(() => start(), 300)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [lang])

  const stop = useCallback((manual = false) => {
    clearSilence()
    if (manual) {
      armedRef.current = false
      setArmed(false)
    }
    recognitionRef.current?.stop()
  }, [])

  const toggle = useCallback(() => {
    if (listening || armedRef.current) stop(true)
    else start()
  }, [listening, start, stop])

  // Reactivar despues de que el TTS termina de hablar.
  useEffect(() => {
    if (prevBlock.current && !blockListening && armedRef.current && !listening) {
      restartTimer.current = setTimeout(() => start(), 800)
    }
    prevBlock.current = blockListening
  }, [blockListening, listening, start])

  // Mientras el TTS habla, detener el micro (sin desarmar).
  useEffect(() => {
    if (blockListening) {
      clearSilence()
      recognitionRef.current?.stop()
    }
  }, [blockListening])

  useEffect(
    () => () => {
      clearSilence()
      recognitionRef.current?.stop()
    },
    []
  )

  return { listening, armed, transcript, start, stop, toggle }
}
