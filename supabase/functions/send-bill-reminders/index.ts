import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

webpush.setVapidDetails('mailto:support@financas.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

function formatBRL(amount: number): string {
  return `R$ ${amount.toFixed(2).replace('.', ',')}`
}

/**
 * Meant to run once a day via pg_cron (see README "Push notifications" setup). Scoped
 * deliberately narrow: fixed/installment expenses whose own date is today and aren't marked
 * paid. Credit card invoice due-dates (which need the same closing/due-day cycle math the
 * client uses) aren't reproduced here — duplicating that logic server-side risked drifting out
 * of sync with the client's computeCreditCardInvoices. This covers the common case; the
 * in-app dashboard insight remains the source of truth for invoice-specific reminders.
 */
Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const today = new Date().toISOString().slice(0, 10)

  const { data: dueBills, error: billsError } = await supabase
    .from('transactions')
    .select('user_id, title, amount')
    .eq('date', today)
    .eq('is_paid', false)
    .eq('is_active', true)
    .eq('transaction_type', 'expense')
    .or('recurrence.eq.fixed,installments_total.gt.1')

  if (billsError) {
    return new Response(JSON.stringify({ error: billsError.message }), { status: 500 })
  }

  const billsByUser = new Map<string, { title: string; amount: number }[]>()
  for (const bill of dueBills ?? []) {
    const list = billsByUser.get(bill.user_id) ?? []
    list.push({ title: bill.title, amount: bill.amount })
    billsByUser.set(bill.user_id, list)
  }

  let pushesSent = 0

  for (const [userId, bills] of billsByUser) {
    const { data: subscriptions } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId)
    if (!subscriptions?.length) continue

    const total = bills.reduce((sum, bill) => sum + bill.amount, 0)
    const title = bills.length === 1 ? `Vence hoje: ${bills[0].title}` : `${bills.length} contas vencem hoje`
    const body = bills.length === 1 ? formatBRL(bills[0].amount) : `Total de ${formatBRL(total)}`
    const payload = JSON.stringify({ title, body, url: '/dashboard' })

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
        )
        pushesSent++
      } catch (pushError) {
        // Expired/invalid subscription — drop it so future runs stop retrying it.
        const statusCode = (pushError as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', subscription.id)
        }
      }
    }
  }

  return new Response(JSON.stringify({ usersNotified: billsByUser.size, pushesSent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
