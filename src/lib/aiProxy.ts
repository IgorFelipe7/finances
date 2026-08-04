import { supabase } from '@/config/supabase'

const FUNCTION_PATH = 'openai-proxy'

interface ChatCompletionRequest {
  model: string
  messages: { role: string; content: string }[]
  response_format?: { type: 'json_object' }
}

interface ChatCompletionResponse {
  choices: { message: { content: string | null } }[]
}

function functionUrl(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '')
  return `${base}/functions/v1/${FUNCTION_PATH}`
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Você precisa estar autenticado para usar os recursos de IA.')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    return body?.error || response.statusText
  } catch {
    return response.statusText || `HTTP ${response.status}`
  }
}

/**
 * Every OpenAI call in the app goes through this — the key lives only in the Supabase Edge
 * Function's server-side secrets, never in the browser bundle or network payloads the user
 * can inspect. See supabase/functions/openai-proxy.
 */
export async function callOpenAI(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const headers = await authHeaders()
  const response = await fetch(functionUrl(), { method: 'POST', headers, body: JSON.stringify(request) })

  if (!response.ok) {
    throw new Error(`Falha ao chamar a IA: ${await readErrorMessage(response)}`)
  }

  return response.json()
}

/** Same proxy, but streams token deltas as they arrive (SSE) instead of waiting for the full reply. */
export async function* streamOpenAI(request: Omit<ChatCompletionRequest, 'response_format'>): AsyncGenerator<string> {
  const headers = await authHeaders()
  const response = await fetch(functionUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...request, stream: true }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Falha ao chamar a IA: ${await readErrorMessage(response)}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return

      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // ignore malformed/keep-alive lines
      }
    }
  }
}
