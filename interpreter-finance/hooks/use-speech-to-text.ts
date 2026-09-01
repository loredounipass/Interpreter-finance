'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SILENCE_MS = 4000

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}


// IMPLEMENTS CONTINUOUS SPEECH RECOGNITION WITH SILENCE DETECTION, AUTO-SEND ON PAUSE, AND TTS INTERLOCKING FOR HANDS-FREE OPERATION
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
  const startingRef = useRef(false)
  const pendingRef = useRef('')
  const deliveredRef = useRef('')
  const sentRef = useRef(false)
  const onFinalRef = useRef(onFinal)
  useEffect(() => { onFinalRef.current = onFinal }, [onFinal])
  const armedRef = useRef(false)
  const blockRef = useRef(blockListening)
  useEffect(() => { blockRef.current = blockListening }, [blockListening])
  const prevBlock = useRef(false)

  const clearSilence = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
  }

  const startRef = useRef<() => void>(() => {})

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      console.warn('Web Speech API no esta soportada en este navegador (usa Chrome/Edge).')
      return
    }
    if (blockRef.current) return
    if (startingRef.current || listening) return
    pendingRef.current = ''
    deliveredRef.current = ''
    sentRef.current = false
    setTranscript('')
    armedRef.current = true
    setArmed(true)
    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: { resultIndex: number; results: SpeechRecognitionResultLike[] }) => {
      let interim = ''
      let finals = ''
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i]
        if (res.isFinal) finals += res[0].transcript
        else interim += res[0].transcript
      }
      if (finals.length > deliveredRef.current.length) {
        pendingRef.current = finals.slice(deliveredRef.current.length).trim()
        clearSilence()
        silenceTimer.current = setTimeout(() => {
          if (pendingRef.current && !sentRef.current) {
            sentRef.current = true
            deliveredRef.current = finals
            onFinalRef.current?.(pendingRef.current)
            pendingRef.current = ''
          }
        }, SILENCE_MS)
      }
      setTranscript(finals + interim)
    }

    recognition.onerror = (e: { error?: string }) => {
      if (e?.error !== 'no-speech' && e?.error !== 'aborted') {
        console.error('[STT]', e?.error)
      }
      clearSilence()
    }

    recognition.onend = () => {
      setListening(false)
      clearSilence()
      startingRef.current = false
      if (!blockRef.current && !sentRef.current && pendingRef.current) {
        sentRef.current = true
        deliveredRef.current = (deliveredRef.current + ' ' + pendingRef.current).trim()
        onFinalRef.current?.(pendingRef.current)
        pendingRef.current = ''
      }
      if (armedRef.current && !blockRef.current) {
        scheduleRestart(400)
      }
    }

    recognition.onstart = () => {
      startingRef.current = false
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      startingRef.current = true
      setListening(true)
    } catch (e) {
      console.warn('[STT] No se pudo iniciar el reconocimiento (¿gesto requerido?):', e)
      startingRef.current = false
      setListening(false)
    }
  }, [lang, listening])

  useEffect(() => { startRef.current = start }, [start])

  const scheduleRestart = useCallback((delay: number) => {
    if (restartTimer.current) clearTimeout(restartTimer.current)
    restartTimer.current = setTimeout(() => startRef.current(), delay)
  }, [])

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

  useEffect(() => {
    if (prevBlock.current && !blockListening && armedRef.current && !listening) {
      scheduleRestart(800)
    }
    prevBlock.current = blockListening
  }, [blockListening, listening, scheduleRestart])

  useEffect(() => {
    if (blockListening) {
      clearSilence()
      recognitionRef.current?.stop()
    }
  }, [blockListening])

  useEffect(
    () => () => {
      clearSilence()
      if (restartTimer.current) clearTimeout(restartTimer.current)
      recognitionRef.current?.stop()
    },
    []
  )

  return { listening, armed, transcript, start, stop, toggle }
}
