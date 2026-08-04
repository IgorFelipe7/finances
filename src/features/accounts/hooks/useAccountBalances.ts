import { useMemo } from 'react'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { withProjections } from '@/features/transactions/lib/projectTransactions'
import type { Account } from '@/features/accounts/schemas/account.schema'

export interface AccountBalance {
  account: Account
  balance: number
}

function applyDelta(map: Map<string, number>, accountId: string, delta: number) {
  map.set(accountId, (map.get(accountId) ?? 0) + delta)
}

function computeNetWorth(accounts: Account[], balances: Map<string, number>) {
  return accounts.reduce((total, account) => {
    const balance = balances.get(account.id) ?? account.initial_balance
    return total + (account.type === 'credit_card' ? -Math.abs(balance) : balance)
  }, 0)
}

/**
 * Single O(n) pass over transactions, accumulating into Map<account_id, balance>.
 * Transfers touch two accumulators (origin and destination) in the same iteration —
 * see the Stage 1 architecture plan. Tracks two parallel totals per account: the
 * confirmed balance (paid transactions only) and the projected balance (paid +
 * unpaid, i.e. Time Travel), plus this month's income/expense totals.
 */
export function useAccountBalances() {
  const { data: accounts = [] } = useAccounts()
  const { data: transactions = [] } = useTransactions()
  const selectedMonth = useTimeTravelStore((state) => state.selectedMonth)
  const selectedYear = useTimeTravelStore((state) => state.selectedYear)

  return useMemo(() => {
    const periodStartTime = new Date(selectedYear, selectedMonth, 1).getTime()
    const periodEndTime = new Date(selectedYear, selectedMonth + 1, 0).getTime()

    const balances = new Map<string, number>()
    const projectedBalances = new Map<string, number>()
    for (const account of accounts) {
      balances.set(account.id, account.initial_balance)
      projectedBalances.set(account.id, account.initial_balance)
    }

    let monthlyIncome = 0
    let monthlyExpenses = 0

    const transactionsWithProjections = withProjections(transactions, periodEndTime)

    for (const transaction of transactionsWithProjections) {
      const transactionTime = new Date(transaction.date).getTime()
      if (transactionTime > periodEndTime) continue

      const originDelta =
        transaction.transaction_type === 'income' ? transaction.amount : -transaction.amount
      const destinationDelta = transaction.transaction_type === 'transfer' ? transaction.amount : 0

      applyDelta(projectedBalances, transaction.account_id, originDelta)
      if (transaction.destination_account_id) {
        applyDelta(projectedBalances, transaction.destination_account_id, destinationDelta)
      }

      if (transaction.is_paid) {
        applyDelta(balances, transaction.account_id, originDelta)
        if (transaction.destination_account_id) {
          applyDelta(balances, transaction.destination_account_id, destinationDelta)
        }
      }

      // "Receitas vs Despesas do mês" also counts known fixed/installment charges for this
      // month even before they're marked paid — they're a real commitment, not speculation.
      const isRecurringLike = transaction.recurrence === 'fixed' || transaction.installments_total > 1
      if ((transaction.is_paid || isRecurringLike) && transactionTime >= periodStartTime) {
        if (transaction.transaction_type === 'income') monthlyIncome += transaction.amount
        if (transaction.transaction_type === 'expense') monthlyExpenses += transaction.amount
      }
    }

    const accountBalances: AccountBalance[] = accounts.map((account) => ({
      account,
      balance: balances.get(account.id) ?? account.initial_balance,
    }))

    return {
      accountBalances,
      netWorth: computeNetWorth(accounts, balances),
      projectedNetWorth: computeNetWorth(accounts, projectedBalances),
      monthlyIncome,
      monthlyExpenses,
    }
  }, [accounts, transactions, selectedMonth, selectedYear])
}
