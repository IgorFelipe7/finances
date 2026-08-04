import { useMemo } from 'react'
import { computeCreditCardInvoices, type CreditCardInvoices } from '@/features/accounts/lib/creditCard'
import type { Account } from '@/features/accounts/schemas/account.schema'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

export function useCreditCardInvoices(account: Account): CreditCardInvoices | null {
  const { data: transactions = [] } = useTransactions()

  return useMemo(() => {
    if (account.type !== 'credit_card' || !account.statement_closing_day || !account.statement_due_day) return null
    return computeCreditCardInvoices(
      account.id,
      account.statement_closing_day,
      account.statement_due_day,
      transactions,
    )
  }, [account, transactions])
}
