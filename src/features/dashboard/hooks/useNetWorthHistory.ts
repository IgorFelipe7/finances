import { useMemo } from 'react'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { computeNetWorthHistory, type NetWorthPoint } from '@/features/dashboard/lib/computeNetWorthHistory'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

const WINDOW_SIZE = 6

export function useNetWorthHistory(): { points: NetWorthPoint[]; isLoading: boolean } {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions()

  const points = useMemo(
    () => computeNetWorthHistory(accounts, transactions, WINDOW_SIZE),
    [accounts, transactions],
  )

  return { points, isLoading: accountsLoading || transactionsLoading }
}
