import { useMemo } from 'react'
import { computeDailySpending, type SpendingDay } from '@/features/dashboard/lib/computeDailySpending'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

export function useDailySpending(): { weeks: SpendingDay[][]; isLoading: boolean } {
  const { data: transactions = [], isLoading } = useTransactions()
  const selectedMonth = useTimeTravelStore((state) => state.selectedMonth)
  const selectedYear = useTimeTravelStore((state) => state.selectedYear)

  const weeks = useMemo(
    () => computeDailySpending(transactions, selectedMonth, selectedYear),
    [transactions, selectedMonth, selectedYear],
  )

  return { weeks, isLoading }
}
