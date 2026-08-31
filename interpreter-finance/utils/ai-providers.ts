// CONFIGURACIÓN DE PROVIDERS DE IA
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

export const TTS_PROVIDER: ProviderConfig = {
  url:
    process.env.NVIDIA_TTS_URL ??
    'https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com/v1/audio/synthesize',
  envKey: 'NVIDIA_API_KEY',
}


// RETRIEVES THE API KEY FOR A GIVEN PROVIDER FROM ENVIRONMENT VARIABLES
export function getProviderApiKey(apiProvider: APIProvider): string | null {
  const key = process.env[PROVIDERS[apiProvider].envKey]
  return key && key.length > 0 ? key : null
}
