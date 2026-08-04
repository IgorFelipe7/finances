import { withProjections } from '@/features/transactions/lib/projectTransactions'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'

/**
 * Full-precision expense-by-category totals for [periodStart, periodEnd] — paid transactions,
 * projected instances, and known fixed/installment charges still pending (a committed expense,
 * not speculation). No top-N folding here; that's a display concern for whoever calls this
 * (the donut chart folds into "Outros", budgets need every category as-is).
 */
export function computeCategoryTotals(
  transactions: Transaction[],
  periodStartTime: number,
  periodEndTime: number,
): Map<string, number> {
  const expanded = withProjections(transactions, periodEndTime)
  const totals = new Map<string, number>()

  for (const transaction of expanded) {
    if (transaction.transaction_type !== 'expense') continue
    const isRecurringLike = transaction.recurrence === 'fixed' || transaction.installments_total > 1
    if (!transaction.is_paid && !transaction.is_projected && !isRecurringLike) continue
    const date = new Date(`${transaction.date}T00:00:00`).getTime()
    if (date < periodStartTime || date > periodEndTime) continue

    const category = transaction.category?.trim() || 'Outros'
    totals.set(category, (totals.get(category) ?? 0) + transaction.amount)
  }

  return totals
}
