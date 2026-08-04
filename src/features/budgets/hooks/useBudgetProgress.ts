import { useMemo } from 'react'
import { computeCategoryTotals } from '@/features/dashboard/lib/computeCategoryTotals'
import { useBudgets } from '@/features/budgets/hooks/useBudgets'
import { computeBudgetProgress, type BudgetProgress } from '@/features/budgets/lib/computeBudgetProgress'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

export function useBudgetProgress(): { progress: BudgetProgress[]; isLoading: boolean } {
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets()
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions()

  const progress = useMemo(() => {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime()
    const categoryTotals = computeCategoryTotals(transactions, periodStart, periodEnd)
    return computeBudgetProgress(budgets, categoryTotals)
  }, [budgets, transactions])

  return { progress, isLoading: budgetsLoading || transactionsLoading }
}
