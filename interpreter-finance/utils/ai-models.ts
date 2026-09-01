// REGISTRO DE MODELOS DE IA DISPONIBLES

export interface AIModel {
  key: string
  id: string
  name: string
  provider: string
  apiProvider: 'nvidia'
  free: boolean
  modelType: 'chat' | 'translation-only'
}

export const AI_MODELS: Record<string, AIModel> = {
  'nvidia-gpt-oss': {
    key: 'nvidia-gpt-oss',
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'NVIDIA',
    apiProvider: 'nvidia',
    free: true,
    modelType: 'chat',
  },
  'nvidia-gpt-oss-120': {
    key: 'nvidia-gpt-oss-120',
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'NVIDIA',
    apiProvider: 'nvidia',
    free: true,
    modelType: 'chat',
  },
  "nvidia-diffusiongemma": {
    key: 'nvidia-diffusiongemma',
    id: "google/diffusiongemma-26b-a4b-it",
    name: "DiffusionGemma 26B A4B IT",
    provider: "Google",
    apiProvider: "nvidia",
    free: true,
    modelType: "chat",
  },
}

// MODELO POR DEFECTO
export const DEFAULT_MODEL = 'nvidia-gpt-oss'

// LISTA ORDENADA PARA EL SELECTOR
export const AI_MODEL_LIST = Object.values(AI_MODELS)
