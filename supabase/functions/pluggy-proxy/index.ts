import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const PLUGGY_CLIENT_ID = Deno.env.get('PLUGGY_CLIENT_ID')
const PLUGGY_CLIENT_SECRET = Deno.env.get('PLUGGY_CLIENT_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PLUGGY_API = 'https://api.pluggy.ai'
const ACCOUNT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4']

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

let cachedApiKey: { key: string; expiresAt: number } | null = null

/** Pluggy's own API key (distinct from our client secret) is valid for ~2h; cache it across invocations. */
async function getPluggyApiKey(): Promise<string> {
  if (cachedApiKey && cachedApiKey.expiresAt > Date.now()) return cachedApiKey.key

  const response = await fetch(`${PLUGGY_API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: PLUGGY_CLIENT_ID, clientSecret: PLUGGY_CLIENT_SECRET }),
  })
  if (!response.ok) throw new Error('Falha ao autenticar com o Pluggy.')

  const data = await response.json()
  cachedApiKey = { key: data.apiKey, expiresAt: Date.now() + 110 * 60 * 1000 }
  return cachedApiKey.key
}

function mapAccountType(pluggyType: string, subtype: string | null): 'checking' | 'savings' | 'credit_card' | 'investment' {
  if (pluggyType === 'CREDIT') return 'credit_card'
  if (pluggyType === 'INVESTMENT') return 'investment'
  if (subtype === 'SAVINGS_ACCOUNT') return 'savings'
  return 'checking'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
    return jsonResponse({ error: 'Integração com Open Finance não configurada no servidor.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

  const supabaseAsUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: authError,
  } = await supabaseAsUser.auth.getUser()
  if (authError || !user) return jsonResponse({ error: 'Não autenticado.' }, 401)

  // Writes below use the service role (RLS is bypassed), so every query is scoped to `user.id`
  // by hand — never to an id taken from the request body.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido.' }, 400)
  }

  let apiKey: string
  try {
    apiKey = await getPluggyApiKey()
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 502)
  }

  if (body.action === 'connect-token') {
    const itemId = typeof body.itemId === 'string' ? body.itemId : undefined
    if (itemId) {
      // Update-mode connections (reconnecting an expired login) must target an item this user owns.
      const { data: existing } = await supabase
        .from('bank_connections')
        .select('user_id')
        .eq('pluggy_item_id', itemId)
        .maybeSingle()
      if (existing && existing.user_id !== user.id) return jsonResponse({ error: 'Conexão inválida.' }, 403)
    }

    const response = await fetch(`${PLUGGY_API}/connect_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ itemId, options: { clientUserId: user.id } }),
    })
    if (!response.ok) return jsonResponse({ error: 'Falha ao gerar token de conexão.' }, 502)
    const data = await response.json()
    return jsonResponse({ accessToken: data.accessToken }, 200)
  }

  if (body.action === 'sync') {
    const itemId = body.itemId
    if (typeof itemId !== 'string') return jsonResponse({ error: 'itemId é obrigatório.' }, 400)

    const { data: existing } = await supabase
      .from('bank_connections')
      .select('user_id')
      .eq('pluggy_item_id', itemId)
      .maybeSingle()
    if (existing && existing.user_id !== user.id) return jsonResponse({ error: 'Conexão inválida.' }, 403)

    const itemResponse = await fetch(`${PLUGGY_API}/items/${itemId}`, { headers: { 'X-API-KEY': apiKey } })
    if (!itemResponse.ok) return jsonResponse({ error: 'Não foi possível consultar a conexão no Pluggy.' }, 502)
    const item = await itemResponse.json()

    const { data: connection, error: upsertConnError } = await supabase
      .from('bank_connections')
      .upsert(
        {
          user_id: user.id,
          pluggy_item_id: itemId,
          connector_name: item.connector?.name ?? 'Banco',
          connector_image_url: item.connector?.imageUrl ?? null,
          status: item.status ?? 'UPDATED',
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'pluggy_item_id' },
      )
      .select()
      .single()
    if (upsertConnError) return jsonResponse({ error: upsertConnError.message }, 500)

    const accountsResponse = await fetch(`${PLUGGY_API}/accounts?itemId=${itemId}`, { headers: { 'X-API-KEY': apiKey } })
    if (!accountsResponse.ok) return jsonResponse({ error: 'Não foi possível buscar as contas.' }, 502)
    const { results: pluggyAccounts } = await accountsResponse.json()

    let accountsImported = 0
    let transactionsImported = 0

    for (const [index, pluggyAccount] of (pluggyAccounts ?? []).entries()) {
      const accountType = mapAccountType(pluggyAccount.type, pluggyAccount.subtype ?? null)

      const { data: localAccount, error: accountError } = await supabase
        .from('accounts')
        .upsert(
          {
            user_id: user.id,
            bank_connection_id: connection.id,
            external_id: pluggyAccount.id,
            name: `${item.connector?.name ?? 'Banco'} · ${pluggyAccount.name}`,
            type: accountType,
            initial_balance: pluggyAccount.balance ?? 0,
            color: ACCOUNT_COLORS[index % ACCOUNT_COLORS.length],
            is_active: true,
          },
          { onConflict: 'user_id,external_id' },
        )
        .select()
        .single()
      if (accountError || !localAccount) continue
      accountsImported++

      const transactionsResponse = await fetch(
        `${PLUGGY_API}/transactions?accountId=${pluggyAccount.id}&pageSize=500`,
        { headers: { 'X-API-KEY': apiKey } },
      )
      if (!transactionsResponse.ok) continue
      const { results: pluggyTransactions } = await transactionsResponse.json()

      for (const tx of pluggyTransactions ?? []) {
        // Pluggy's amount sign convention differs slightly between bank (DEBIT/CREDIT `type`)
        // and credit card accounts (signed `amount` only) — verify against real sandbox data
        // once credentials are set up, this is the best-effort mapping from the public docs.
        const isExpense = accountType === 'credit_card' ? tx.amount > 0 : tx.type === 'DEBIT'

        const { error: txError } = await supabase.from('transactions').upsert(
          {
            user_id: user.id,
            account_id: localAccount.id,
            bank_connection_id: connection.id,
            external_id: tx.id,
            title: tx.description ?? 'Transação',
            amount: Math.abs(tx.amount),
            transaction_type: isExpense ? 'expense' : 'income',
            recurrence: 'variable',
            category: tx.category ?? null,
            date: String(tx.date ?? '').slice(0, 10),
            is_paid: true,
            installments_total: 1,
            installment_current: 1,
            is_active: true,
          },
          { onConflict: 'user_id,external_id' },
        )
        if (!txError) transactionsImported++
      }
    }

    await supabase
      .from('bank_connections')
      .update({ status: item.status ?? 'UPDATED', last_synced_at: new Date().toISOString() })
      .eq('id', connection.id)

    return jsonResponse({ connectionId: connection.id, accountsImported, transactionsImported }, 200)
  }

  if (body.action === 'disconnect') {
    const connectionId = body.connectionId
    if (typeof connectionId !== 'string') return jsonResponse({ error: 'connectionId é obrigatório.' }, 400)

    const { data: connection, error: fetchError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single()
    if (fetchError || !connection) return jsonResponse({ error: 'Conexão não encontrada.' }, 404)

    await fetch(`${PLUGGY_API}/items/${connection.pluggy_item_id}`, { method: 'DELETE', headers: { 'X-API-KEY': apiKey } })
    await supabase.from('accounts').update({ is_active: false }).eq('bank_connection_id', connectionId)
    await supabase.from('bank_connections').delete().eq('id', connectionId)

    return jsonResponse({ ok: true }, 200)
  }

  return jsonResponse({ error: 'Ação desconhecida.' }, 400)
})
