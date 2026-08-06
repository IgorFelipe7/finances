import { useMemo } from 'react'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useBudgets } from '@/features/budgets/hooks/useBudgets'
import { buildFinancialSnapshot } from '@/features/dashboard/lib/buildFinancialSnapshot'
import { useGoals } from '@/features/goals/hooks/useGoals'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

export function useFinancialSnapshot() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions()
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets()
  const { data: goals = [], isLoading: goalsLoading } = useGoals()

  const snapshot = useMemo(
    () => buildFinancialSnapshot(accounts, transactions, budgets, goals),
    [accounts, transactions, budgets, goals],
  )

  return { snapshot, isLoading: accountsLoading || transactionsLoading || budgetsLoading || goalsLoading }
}
