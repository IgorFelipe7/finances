import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Keep this in sync with the models actually used by the app's AI services — never let the
// caller pick an arbitrary (possibly more expensive) OpenAI model.
const ALLOWED_MODELS = new Set(['gpt-4o-mini'])

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!OPENAI_API_KEY) {
    return jsonResponse({ error: 'OPENAI_API_KEY não configurada no servidor.' }, 500)
  }

  // Require a real logged-in user of this app — never let an anonymous caller burn the key.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return jsonResponse({ error: 'Não autenticado.' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido.' }, 400)
  }

  // Only forward the exact fields the app's AI services use — never pass the request through
  // verbatim, so a caller can't smuggle in arbitrary OpenAI params.
  const { model, messages, response_format, stream } = body as {
    model?: string
    messages?: unknown
    response_format?: unknown
    stream?: boolean
  }

  if (typeof model !== 'string' || !ALLOWED_MODELS.has(model)) {
    return jsonResponse({ error: 'Modelo não permitido.' }, 400)
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'Requisição inválida.' }, 400)
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, response_format, stream: !!stream }),
  })

  return new Response(openaiResponse.body, {
    status: openaiResponse.status,
    headers: {
      ...corsHeaders,
      'Content-Type': openaiResponse.headers.get('Content-Type') ?? 'application/json',
    },
  })
})
