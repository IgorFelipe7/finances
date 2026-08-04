import { supabase } from '@/config/supabase'

const FUNCTION_PATH = 'pluggy-proxy'

interface SyncResult {
  connectionId: string
  accountsImported: number
  transactionsImported: number
}

function functionUrl(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '')
  return `${base}/functions/v1/${FUNCTION_PATH}`
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Você precisa estar autenticado.')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function callProxy<T>(payload: Record<string, unknown>): Promise<T> {
  const headers = await authHeaders()
  const response = await fetch(functionUrl(), { method: 'POST', headers, body: JSON.stringify(payload) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || 'Falha ao conectar com o Open Finance.')
  return body as T
}

/** Server-scoped token that authorizes the Pluggy Connect widget to run for this user (and this item, in update mode). */
export function getConnectToken(itemId?: string): Promise<{ accessToken: string }> {
  return callProxy({ action: 'connect-token', itemId })
}

/** Pulls accounts + transactions for a freshly-linked or previously-linked item into our tables. */
export function syncBankConnection(itemId: string): Promise<SyncResult> {
  return callProxy({ action: 'sync', itemId })
}

export function disconnectBankConnection(connectionId: string): Promise<{ ok: true }> {
  return callProxy({ action: 'disconnect', connectionId })
}
