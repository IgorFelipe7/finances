import type { Account } from '@/features/accounts/schemas/account.schema'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { MONTH_NAMES_PT_BR } from '@/lib/date'

export interface NetWorthPoint {
  key: string
  label: string
  month: number
  year: number
  netWorth: number
}

/** Last day of `year`-`month` (0-indexed), or `referenceDate` itself if that's the current month. */
function checkpointFor(year: number, month: number, referenceDate: Date): Date {
  const isCurrentMonth = year === referenceDate.getFullYear() && month === referenceDate.getMonth()
  if (isCurrentMonth) return referenceDate
  return new Date(year, month + 1, 0)
}

/**
 * Net worth as of the end of each of the last `windowSize` months, replaying paid transactions
 * up to each checkpoint from scratch — no separate snapshot table needed, the ledger already
 * has everything. An account only counts once it existed (its own `created_at`), so a newly
 * added account doesn't retroactively inflate months before it was created.
 */
export function computeNetWorthHistory(
  accounts: Account[],
  transactions: Transaction[],
  windowSize: number = 6,
  referenceDate: Date = new Date(),
): NetWorthPoint[] {
  const points: NetWorthPoint[] = []

  for (let offset = windowSize - 1; offset >= 0; offset--) {
    const bucketDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1)
    const checkpoint = checkpointFor(bucketDate.getFullYear(), bucketDate.getMonth(), referenceDate)
    const checkpointTime = new Date(checkpoint.getFullYear(), checkpoint.getMonth(), checkpoint.getDate()).getTime()

    const existingAccounts = accounts.filter((account) => new Date(account.created_at).getTime() <= checkpointTime)
    const balances = new Map<string, number>()
    for (const account of existingAccounts) balances.set(account.id, account.initial_balance)

    for (const t of transactions) {
      if (!t.is_paid) continue
      const transactionTime = new Date(`${t.date}T00:00:00`).getTime()
      if (transactionTime > checkpointTime) continue

      const originDelta = t.transaction_type === 'income' ? t.amount : t.transaction_type === 'expense' ? -t.amount : 0
      if (balances.has(t.account_id)) balances.set(t.account_id, (balances.get(t.account_id) ?? 0) + originDelta)
      if (t.destination_account_id && t.transaction_type === 'transfer' && balances.has(t.destination_account_id)) {
        balances.set(t.destination_account_id, (balances.get(t.destination_account_id) ?? 0) + t.amount)
      }
    }

    const netWorth = existingAccounts.reduce((total, account) => {
      const balance = balances.get(account.id) ?? account.initial_balance
      return total + (account.type === 'credit_card' ? -Math.abs(balance) : balance)
    }, 0)

    points.push({
      key: `${bucketDate.getFullYear()}-${bucketDate.getMonth()}`,
      label: MONTH_NAMES_PT_BR[bucketDate.getMonth()].slice(0, 3),
      month: bucketDate.getMonth(),
      year: bucketDate.getFullYear(),
      netWorth,
    })
  }

  return points
}
