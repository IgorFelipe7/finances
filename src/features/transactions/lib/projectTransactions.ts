import { resolveRecurrenceDate, toIsoDate } from '@/features/transactions/lib/recurrenceRule'
import { addMonthsToIsoDate } from '@/lib/date'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'

export type ProjectedTransaction = Transaction & { is_projected: boolean; anchor_id: string }

const MAX_PROJECTED_MONTHS = 60

/** Same-day-of-month shift by default; a `recurrence_rule` recomputes the date for that month instead. */
function projectedDateFor(transaction: Transaction, offset: number): string {
  if (!transaction.recurrence_rule) return addMonthsToIsoDate(transaction.date, offset)

  const anchor = new Date(`${transaction.date}T00:00:00`)
  return toIsoDate(resolveRecurrenceDate(transaction.recurrence_rule, anchor.getFullYear(), anchor.getMonth() + offset))
}

/** Identifies "the same recurring slot" — matches how a settled row is created in `usePayTransaction`. */
function occurrenceKey(transaction: Pick<Transaction, 'account_id' | 'transaction_type' | 'title' | 'date'>) {
  return `${transaction.account_id}::${transaction.transaction_type}::${transaction.title}::${transaction.date}`
}

/**
 * Real transactions only exist for the month they were recorded in. `fixed` recurrence
 * replicates forward every month indefinitely; an installment (`installments_total > 1`)
 * replicates forward until `installment_current` reaches `installments_total`. Both are
 * generated as virtual (unpaid) rows so Time Travel can show/settle them like any other
 * pending transaction, without ever writing them to the database — unless the user pays
 * that specific occurrence, in which case a real row already occupies the slot and the
 * virtual one is skipped (see `settledOccurrenceKeys`).
 */
function* generateVirtualInstances(
  transaction: Transaction,
  periodEndTime: number,
  settledOccurrenceKeys: Set<string>,
) {
  const isFixed = transaction.recurrence === 'fixed'
  const isInstallment = transaction.installments_total > 1

  if (!isFixed && !isInstallment) return

  const maxOffset = isInstallment ? transaction.installments_total - transaction.installment_current : Infinity

  for (let offset = 1; offset <= Math.min(maxOffset, MAX_PROJECTED_MONTHS); offset++) {
    const projectedDate = projectedDateFor(transaction, offset)
    if (new Date(projectedDate).getTime() > periodEndTime) break

    const key = occurrenceKey({
      account_id: transaction.account_id,
      transaction_type: transaction.transaction_type,
      title: transaction.title,
      date: projectedDate,
    })
    if (settledOccurrenceKeys.has(key)) continue

    yield {
      ...transaction,
      id: `${transaction.id}::projected::${offset}`,
      anchor_id: transaction.id,
      date: projectedDate,
      is_paid: false,
      installment_current: isInstallment ? transaction.installment_current + offset : transaction.installment_current,
      is_projected: true,
    } satisfies ProjectedTransaction
  }
}

/**
 * Expands `transactions` with virtual projections of every `fixed` or installment
 * transaction, up to `periodEndTime`. Real rows come back untouched (`is_projected: false`)
 * so callers can keep treating this like the original list for balance math, while
 * UI can use `is_projected` to badge/disable the synthetic rows.
 */
export function withProjections(transactions: Transaction[], periodEndTime: number): ProjectedTransaction[] {
  const result: ProjectedTransaction[] = []

  // Every real row "occupies" its own (account, type, title, date) slot — if that slot was
  // produced by paying a projected occurrence, the anchor must stop re-generating it virtually.
  const settledOccurrenceKeys = new Set(transactions.map((transaction) => occurrenceKey(transaction)))

  for (const transaction of transactions) {
    result.push({ ...transaction, is_projected: false, anchor_id: transaction.id })
    for (const virtual of generateVirtualInstances(transaction, periodEndTime, settledOccurrenceKeys)) {
      result.push(virtual)
    }
  }

  return result
}
