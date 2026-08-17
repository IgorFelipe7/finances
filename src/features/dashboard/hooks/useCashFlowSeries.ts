import { useMemo } from 'react'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { withProjections } from '@/features/transactions/lib/projectTransactions'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { MONTH_NAMES_PT_BR } from '@/lib/date'

export interface CashFlowPoint {
  key: string
  label: string
  month: number
  year: number
  income: number
  expense: number
  net: number
  isFuture: boolean
}

const WINDOW_SIZE = 6

/**
 * Trailing `WINDOW_SIZE`-month window ending at the selected Time Travel month.
 * Counts a transaction if it's confirmed (`is_paid`) or a known-future projection
 * (`is_projected`, from a fixed/installment anchor) — so the chart reads as
 * "what happened, plus what's already locked in" rather than raw pending clutter.
 */
export function useCashFlowSeries(): { points: CashFlowPoint[]; isLoading: boolean } {
  const { data: transactions = [], isLoading } = useTransactions()
  const selectedMonth = useTimeTravelStore((state) => state.selectedMonth)
  const selectedYear = useTimeTravelStore((state) => state.selectedYear)

  const points = useMemo(() => {
    const windowEndTime = new Date(selectedYear, selectedMonth + 1, 0).getTime()
    const expanded = withProjections(transactions, windowEndTime)

    const now = new Date()
    const todayKey = `${now.getFullYear()}-${now.getMonth()}`

    const buckets = new Map<string, { income: number; expense: number }>()

    for (const transaction of expanded) {
      if (!transaction.is_paid && !transaction.is_projected) continue
      const date = new Date(`${transaction.date}T00:00:00`)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = buckets.get(key) ?? { income: 0, expense: 0 }
      if (transaction.transaction_type === 'income') bucket.income += transaction.amount
      if (transaction.transaction_type === 'expense') bucket.expense += transaction.amount
      buckets.set(key, bucket)
    }

    const series: CashFlowPoint[] = []
    for (let offset = WINDOW_SIZE - 1; offset >= 0; offset--) {
      const date = new Date(selectedYear, selectedMonth - offset, 1)
      const month = date.getMonth()
      const year = date.getFullYear()
      const key = `${year}-${month}`
      const bucket = buckets.get(key) ?? { income: 0, expense: 0 }

      series.push({
        key,
        label: MONTH_NAMES_PT_BR[month].slice(0, 3),
        month,
        year,
        income: bucket.income,
        expense: bucket.expense,
        net: bucket.income - bucket.expense,
        isFuture: key !== todayKey && date.getTime() > new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
      })
    }

    return series
  }, [transactions, selectedMonth, selectedYear])

  return { points, isLoading }
}
