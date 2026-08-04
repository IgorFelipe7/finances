import { useMemo } from 'react'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { withProjections } from '@/features/transactions/lib/projectTransactions'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

export interface CategorySlice {
  category: string
  amount: number
  percent: number
}

const MAX_SLICES = 5

/** Expense-by-category split for the selected month (confirmed + projected), folded into "Outros" past the top 5. */
export function useCategoryBreakdown(): { slices: CategorySlice[]; total: number } {
  const { data: transactions = [] } = useTransactions()
  const selectedMonth = useTimeTravelStore((state) => state.selectedMonth)
  const selectedYear = useTimeTravelStore((state) => state.selectedYear)

  return useMemo(() => {
    const periodStartTime = new Date(selectedYear, selectedMonth, 1).getTime()
    const periodEndTime = new Date(selectedYear, selectedMonth + 1, 0).getTime()
    const expanded = withProjections(transactions, periodEndTime)

    const totals = new Map<string, number>()

    for (const transaction of expanded) {
      if (transaction.transaction_type !== 'expense') continue
      if (!transaction.is_paid && !transaction.is_projected) continue
      const date = new Date(`${transaction.date}T00:00:00`).getTime()
      if (date < periodStartTime || date > periodEndTime) continue

      const category = transaction.category?.trim() || 'Outros'
      totals.set(category, (totals.get(category) ?? 0) + transaction.amount)
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1])
    // Reserve one slot for "Outros" whenever there's overflow, so the donut never exceeds
    // MAX_SLICES wedges — that's the full fixed-hue budget (chart-1..5).
    const hasOverflow = sorted.length > MAX_SLICES
    const splitAt = hasOverflow ? MAX_SLICES - 1 : MAX_SLICES
    const top = sorted.slice(0, splitAt)
    const rest = sorted.slice(splitAt)
    const restTotal = rest.reduce((sum, [, amount]) => sum + amount, 0)

    if (restTotal > 0) {
      const othersIndex = top.findIndex(([category]) => category === 'Outros')
      if (othersIndex >= 0) {
        top[othersIndex] = ['Outros', top[othersIndex][1] + restTotal]
      } else {
        top.push(['Outros', restTotal])
      }
    }

    const total = top.reduce((sum, [, amount]) => sum + amount, 0)

    return {
      total,
      slices: top.map(([category, amount]) => ({
        category,
        amount,
        percent: total > 0 ? amount / total : 0,
      })),
    }
  }, [transactions, selectedMonth, selectedYear])
}
