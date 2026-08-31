import { NextRequest, NextResponse } from 'next/server'
import { TTS_PROVIDER, getProviderApiKey } from '@/utils/ai-providers'
import { numbersToWordsEs } from '@/utils/number-to-words-es'

type TTSLanguage = 'es-US' | 'en-US'
type TTSVoice = 'Diego' | 'Isabela'
type TTSEmotion = 'default' | 'neutral' | 'calm' | 'happy' | 'angry' | 'pleasantSurprised'


// REPLACES COMMON ABBREVIATIONS (MIN, SEC, H, D, KM) WITH THEIR FULL WORD EQUIVALENTS IN THE TARGET LANGUAGE SO THAT THE TTS ENGINE PRONOUNCES THEM CORRECTLY.
function normalizeForTTS(input: string, language: TTSLanguage): string {
  const rules: Record<TTSLanguage, [RegExp, string][]> = {
    'es-US': [
      [/\bmin\b/gi, 'minutos'],
      [/\bseg\b/gi, 'segundos'],
      [/\bh\b/gi, 'horas'],
      [/\bd\b/gi, 'días'],
      [/\bkm\b/gi, 'kilómetros'],
    ],
    'en-US': [
      [/\bmin\b/gi, 'minutes'],
      [/\bsec\b/gi, 'seconds'],
      [/\bh\b/gi, 'hours'],
      [/\bd\b/gi, 'days'],
      [/\bkm\b/gi, 'kilometers'],
    ],
  }
  return rules[language].reduce((acc, [re, repl]) => acc.replace(re, repl), input)
}


// SYNTHESIZES SPEECH AUDIO FROM TEXT USING THE NVIDIA MAGPIE TTS PROVIDER, RETURNING A WAV BUFFER WITH THE REQUESTED VOICE, EMOTION, AND LANGUAGE SETTINGS.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const language: TTSLanguage = body.language === 'en-US' ? 'en-US' : 'es-US'
    const raw = String(body.text ?? '').trim()
    const normalized = normalizeForTTS(raw, language)
    const text = language === 'es-US' ? numbersToWordsEs(normalized) : normalized
    const voice: TTSVoice = body.voice === 'Isabela' ? 'Isabela' : 'Diego'
    const emotion: TTSEmotion = body.emotion ?? 'default'

    if (!text) {
      return NextResponse.json({ error: 'Falta el texto.' }, { status: 400 })
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: 'El texto excede 2000 caracteres.' }, { status: 400 })
    }

    const apiKey = getProviderApiKey('nvidia')
    if (!apiKey) {
      return NextResponse.json({ error: `Falta la variable de entorno ${TTS_PROVIDER.envKey}.` }, { status: 500 })
    }

    const locale = language === 'en-US' ? 'EN-US' : 'ES-US'
    const voiceName =
      emotion && emotion !== 'default'
        ? `Magpie-Multilingual.${locale}.${voice}.${emotion[0].toUpperCase()}${emotion.slice(1)}`
        : `Magpie-Multilingual.${locale}.${voice}`

    const form = new FormData()
    form.append('text', text)
    form.append('language', language)
    form.append('voice', voiceName)
    form.append('encoding', 'LINEAR_PCM')
    form.append('sample_rate_hz', '22050')

    const response = await fetch(TTS_PROVIDER.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!response.ok) {
      const textErr = await response.text()
      return NextResponse.json(
        { error: `Error del TTS (${response.status}): ${textErr.slice(0, 300)}` },
        { status: 502 }
      )
    }

    const buffer = await response.arrayBuffer()
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Error interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
