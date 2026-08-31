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
  'nvidia-nemotron': {
    key: 'nvidia-nemotron',
    id: 'nvidia/nemotron-3-nano-30b-a3b',
    name: 'Nemotron 3 Nano 30B (3B active)',
    provider: 'NVIDIA',
    apiProvider: 'nvidia',
    free: true,
    modelType: 'chat',
  },
  'nvidia-nemotron-mini-4b': {
    key: 'nvidia-nemotron-mini-4b',
    id: 'nvidia/nemotron-mini-4b-instruct',
    name: 'Nemotron Mini 4B Instruct',
    provider: 'NVIDIA',
    apiProvider: 'nvidia',
    free: true,
    modelType: 'chat',
  },
  'mistral-nemotron': {
    key: 'mistral-nemotron',
    id: 'mistralai/mistral-nemotron',
    name: 'Mistral Nemotron',
    provider: 'NVIDIA',
    apiProvider: 'nvidia',
    free: true,
    modelType: 'chat',
  },
  'nvidia-gpt-oss': {
    key: 'nvidia-gpt-oss',
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'NVIDIA',
    apiProvider: 'nvidia',
    free: true,
    modelType: 'chat',
  },
}

// MODELO POR DEFECTO
export const DEFAULT_MODEL = 'nvidia-nemotron'

// LISTA ORDENADA PARA EL SELECTOR
export const AI_MODEL_LIST = Object.values(AI_MODELS)
