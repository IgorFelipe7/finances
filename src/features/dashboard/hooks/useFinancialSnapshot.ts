import { useMemo } from 'react'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { buildFinancialSnapshot } from '@/features/dashboard/lib/buildFinancialSnapshot'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

export function useFinancialSnapshot() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions()

  const snapshot = useMemo(() => buildFinancialSnapshot(accounts, transactions), [accounts, transactions])

  return { snapshot, isLoading: accountsLoading || transactionsLoading }
}
