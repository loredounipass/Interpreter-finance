// CONFIGURACIÓN DE PROVIDERS DE IA
// Solo nvidia. La API key se lee de variables de entorno:
//   NVIDIA_API_KEY  -> .env.local / entorno del servidor
// NUNCA hardcodear keys en este archivo.

export type APIProvider = 'nvidia'

interface ProviderConfig {
  url: string
  envKey: string
}

export const PROVIDERS: Record<APIProvider, ProviderConfig> = {
  nvidia: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    envKey: 'NVIDIA_API_KEY',
  },
}

// TTS (magpie-tts-multilingual) via NVIDIA NVCF invocation endpoint.
// El function-id puede cambiar; permitimos sobreescribirlo con NVIDIA_TTS_URL.
export const TTS_PROVIDER: ProviderConfig = {
  url:
    process.env.NVIDIA_TTS_URL ??
    'https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com/v1/audio/synthesize',
  envKey: 'NVIDIA_API_KEY',
}

export function getProviderApiKey(apiProvider: APIProvider): string | null {
  const key = process.env[PROVIDERS[apiProvider].envKey]
  return key && key.length > 0 ? key : null
}
