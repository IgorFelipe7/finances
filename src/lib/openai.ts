import OpenAI from 'openai'

let client: OpenAI | null = null

/** Lazily initialized so the app doesn't crash without a key — errors surface only when AI features are actually used. */
export function getOpenAIClient(): OpenAI {
  if (client) return client

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY não configurada. Adicione sua chave da OpenAI ao arquivo .env.')
  }

  // MVP tradeoff: calling OpenAI directly from the browser (see .env.example).
  client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  return client
}

export function hasOpenAIKey(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY
}
