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
  const startingRef = useRef(false)
  const finalRef = useRef('')
  const sentRef = useRef(false)
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

  const startRef = useRef<() => void>(() => {})

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      console.warn('Web Speech API no esta soportada en este navegador (usa Chrome/Edge).')
      return
    }
    if (blockRef.current) return
    // Evita arranques superpuestos (el SO a veces dispara onend/start seguidos).
    if (startingRef.current || listening) return
    finalRef.current = ''
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
          if (text && !sentRef.current) {
            sentRef.current = true
            onFinalRef.current?.(text)
          }
          finalRef.current = ''
        }, SILENCE_MS)
      }
      setTranscript(finalRef.current + interim)
    }

    recognition.onerror = (e: { error?: string }) => {
      // no-speech / aborted son transitorios en móvil; el onend se encarga de reiniciar.
      if (e?.error !== 'no-speech' && e?.error !== 'aborted') {
        console.error('[STT]', e?.error)
      }
      clearSilence()
    }

    recognition.onend = () => {
      setListening(false)
      clearSilence()
      startingRef.current = false
      // En móvil el SO cierra el reconocimiento tras cada frase, antes de que
      // venza el timer de silencio. Si aún no se envió el texto acumulado,
      // lo enviamos aquí para que no se pierda (y no se "borre" del input).
      if (!blockRef.current && !sentRef.current) {
        const text = finalRef.current.trim()
        if (text) {
          sentRef.current = true
          onFinalRef.current?.(text)
        }
      }
      finalRef.current = ''
      sentRef.current = false
      // Dictado continuo: si sigue armado y no esta bloqueado, reiniciar.
      // (En iOS esto fallara por la politica de gesto y quedara apagado hasta
      // un nuevo toque; en Android/desktop se mantiene escuchando.)
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
      // En móvil el reinicio automatico sin gesto del usuario lanza error.
      // No lo dejamos colgado: nos quedamos armados para que el usuario
      // pueda volver a tocar el micrófono.
      console.warn('[STT] No se pudo iniciar el reconocimiento (¿gesto requerido?):', e)
      startingRef.current = false
      setListening(false)
    }
  }, [lang, listening])

  startRef.current = start

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

  // Reactivar despues de que el TTS termina de hablar.
  useEffect(() => {
    if (prevBlock.current && !blockListening && armedRef.current && !listening) {
      scheduleRestart(800)
    }
    prevBlock.current = blockListening
  }, [blockListening, listening, scheduleRestart])

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
