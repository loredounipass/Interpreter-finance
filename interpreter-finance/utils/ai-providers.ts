// CONFIGURACIÓN DE PROVIDERS DE IA
// Solo google y nvidia. Las API keys se leen de variables de entorno:
//   NVIDIA_API_KEY  -> .env.local / entorno del servidor
//   GOOGLE_API_KEY  -> .env.local / entorno del servidor
// NUNCA hardcodear keys en este archivo.

export type APIProvider = 'nvidia' | 'google'

interface ProviderConfig {
  url: string
  envKey: string
}

export const PROVIDERS: Record<APIProvider, ProviderConfig> = {
  nvidia: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    envKey: 'NVIDIA_API_KEY',
  },
  google: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    envKey: 'GOOGLE_API_KEY',
  },
}

export function getProviderApiKey(apiProvider: APIProvider): string | null {
  const key = process.env[PROVIDERS[apiProvider].envKey]
  return key && key.length > 0 ? key : null
}
