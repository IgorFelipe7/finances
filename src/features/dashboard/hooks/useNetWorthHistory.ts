import { useMemo } from 'react'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { computeNetWorthHistory, type NetWorthPoint } from '@/features/dashboard/lib/computeNetWorthHistory'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

const WINDOW_SIZE = 6

export function useNetWorthHistory(): NetWorthPoint[] {
  const { data: accounts = [] } = useAccounts()
  const { data: transactions = [] } = useTransactions()

  return useMemo(() => computeNetWorthHistory(accounts, transactions, WINDOW_SIZE), [accounts, transactions])
}
