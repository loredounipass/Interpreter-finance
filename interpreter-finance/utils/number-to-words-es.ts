// Convierte numeros a palabras en espanol para el TTS (Magpie no lee bien los digitos).
// Ej: "350" -> "trescientos cincuenta", "7.4" -> "siete punto cuatro".

const UNITS = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
  'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
  'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
]

const TENS = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']

const HUNDREDS = [
  '', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
]

export function integerToWords(n: number): string {
  if (!Number.isFinite(n)) return ''
  n = Math.floor(Math.abs(n))
  if (n < 30) return UNITS[n]
  if (n < 100) {
    const t = Math.floor(n / 10)
    const u = n % 10
    if (u === 0) return TENS[t]
    return `${TENS[t]} y ${UNITS[u]}`
  }
  if (n < 1000) {
    const h = Math.floor(n / 100)
    const r = n % 100
    if (h === 1) return r === 0 ? 'cien' : `ciento ${integerToWords(r)}`
    return r === 0 ? HUNDREDS[h] : `${HUNDREDS[h]} ${integerToWords(r)}`
  }
  if (n < 1_000_000) {
    const miles = Math.floor(n / 1000)
    const r = n % 1000
    const head = miles === 1 ? 'mil' : `${integerToWords(miles)} mil`
    return r === 0 ? head : `${head} ${integerToWords(r)}`
  }
  const mill = Math.floor(n / 1_000_000)
  const r = n % 1_000_000
  const head = mill === 1 ? 'un millón' : `${integerToWords(mill)} millones`
  return r === 0 ? head : `${head} ${integerToWords(r)}`
}

function numberTokenToWords(token: string): string {
  const cleaned = token.replace(/,/g, '')
  if (cleaned.includes('.')) {
    const [intPart, fracPart] = cleaned.split('.')
    const intWords = integerToWords(parseInt(intPart || '0', 10))
    const fracWords = (fracPart ?? '')
      .split('')
      .map((d) => UNITS[parseInt(d, 10)] ?? '')
      .filter(Boolean)
      .join(' ')
    return `${intWords} punto ${fracWords}`
  }
  return integerToWords(parseInt(cleaned, 10))
}

export function numbersToWordsEs(input: string): string {
  return input.replace(/\d[\d.,]*/g, (m) => numberTokenToWords(m))
}
