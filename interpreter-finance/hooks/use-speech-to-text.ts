'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SILENCE_MS = 4000

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}


// IMPLEMENTS CONTINUOUS SPEECH RECOGNITION WITH SILENCE DETECTION, AUTO-SEND ON PAUSE, AND TTS INTERLOCKING FOR HANDS-FREE OPERATION
// HOOK CONFIGURING WEB SPEECH API RECOGNITION, HANDLING INTERIM/FINAL RESULTS, AND AUTO-DISPATCHING ON SILENCE
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

  // CLEARS THE ACTIVE SILENCE DETECTION TIMER TO PREVENT PREMATURE TRANSCRIPT DISPATCH
  const clearSilence = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current)
      silenceTimer.current = null
    }
  }

  const startRef = useRef<() => void>(() => {})

  // Internal: creates and starts a new SpeechRecognition instance
  // Does NOT reset tracking refs — caller decides whether to reset
  // INITIALIZES WEB SPEECH API RECOGNITION INSTANCE, BINDING EVENT HANDLERS FOR RESULTS AND ERRORS
  const beginRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      console.warn('Web Speech API no esta soportada en este navegador (usa Chrome/Edge).')
      return
    }
    if (blockRef.current) return
    if (startingRef.current || listening) return
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

  // Manual start: full reset of all tracking state (user pressed mic button)
  // RESETS TRANSCRIPT STATE AND TRACKING REFS BEFORE INITIATING A NEW RECOGNITION SESSION
  const start = useCallback(() => {
    pendingRef.current = ''
    deliveredRef.current = ''
    sentRef.current = false
    setTranscript('')
    beginRecognition()
  }, [beginRecognition])

  // Auto-resume: NO reset — preserves deliveredRef so duplicates are ignored
  // RESUMES AN ONGOING RECOGNITION SESSION WITHOUT CLEARING ALREADY DELIVERED TRANSCRIPTS
  const resumeSession = useCallback(() => {
    sentRef.current = false
    beginRecognition()
  }, [beginRecognition])

  useEffect(() => { startRef.current = start }, [start])

  const resumeRef = useRef<() => void>(() => {})
  useEffect(() => { resumeRef.current = resumeSession }, [resumeSession])

  // SCHEDULES AN AUTOMATIC RESTART OF THE RECOGNITION SESSION AFTER A SPECIFIED DELAY TO ENSURE CONTINUOUS LISTENING
  const scheduleRestart = useCallback((delay: number) => {
    if (restartTimer.current) clearTimeout(restartTimer.current)
    restartTimer.current = setTimeout(() => resumeRef.current(), delay)
  }, [])

  // STOPS THE ACTIVE RECOGNITION SESSION AND CLEARS SILENCE TIMERS; DISARMS AUTO-RESTART IF MANUAL STOP IS REQUESTED
  const stop = useCallback((manual = false) => {
    clearSilence()
    if (manual) {
      armedRef.current = false
      setArmed(false)
    }
    recognitionRef.current?.stop()
  }, [])

  // TOGGLES THE SPEECH RECOGNITION SESSION STATE BETWEEN ACTIVE AND STOPPED
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
