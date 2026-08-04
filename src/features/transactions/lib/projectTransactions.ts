import { addMonthsToIsoDate } from '@/lib/date'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'

export type ProjectedTransaction = Transaction & { is_projected: boolean; anchor_id: string }

const MAX_PROJECTED_MONTHS = 60

/**
 * Real transactions only exist for the month they were recorded in. `fixed` recurrence
 * replicates forward every month indefinitely; an installment (`installments_total > 1`)
 * replicates forward until `installment_current` reaches `installments_total`. Both are
 * generated as virtual (unpaid) rows so Time Travel can show/settle them like any other
 * pending transaction, without ever writing them to the database.
 */
function* generateVirtualInstances(transaction: Transaction, periodEndTime: number) {
  const isFixed = transaction.recurrence === 'fixed'
  const isInstallment = transaction.installments_total > 1

  if (!isFixed && !isInstallment) return

  const maxOffset = isInstallment ? transaction.installments_total - transaction.installment_current : Infinity

  for (let offset = 1; offset <= Math.min(maxOffset, MAX_PROJECTED_MONTHS); offset++) {
    const projectedDate = addMonthsToIsoDate(transaction.date, offset)
    if (new Date(projectedDate).getTime() > periodEndTime) break

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

  for (const transaction of transactions) {
    result.push({ ...transaction, is_projected: false, anchor_id: transaction.id })
    for (const virtual of generateVirtualInstances(transaction, periodEndTime)) {
      result.push(virtual)
    }
  }

  return result
}
