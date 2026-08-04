import { describe, expect, it } from 'vitest'
import type { Account } from '@/features/accounts/schemas/account.schema'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { buildFinancialSnapshot } from './buildFinancialSnapshot'

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    user_id: 'user-1',
    name: 'Conta',
    type: 'checking',
    initial_balance: 1000,
    color: '#000',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    statement_closing_day: null,
    statement_due_day: null,
    ...overrides,
  }
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    destination_account_id: null,
    title: 'Despesa',
    amount: 100,
    transaction_type: 'expense',
    recurrence: 'variable',
    category: null,
    date: '2026-08-04',
    is_paid: true,
    installments_total: 1,
    installment_current: 1,
    is_active: true,
    created_at: '2026-08-04T00:00:00.000Z',
    ...overrides,
  }
}

const REFERENCE_DATE = new Date(2026, 7, 4) // Aug 4, 2026

describe('buildFinancialSnapshot', () => {
  it('classifies a fixed expense as overdue once its date has passed unpaid', () => {
    const transactions = [makeTransaction({ recurrence: 'fixed', date: '2026-08-01', is_paid: false, title: 'Aluguel' })]
    const snapshot = buildFinancialSnapshot([makeAccount()], transactions, REFERENCE_DATE)

    expect(snapshot.overdueCharges).toHaveLength(1)
    expect(snapshot.overdueCharges[0].title).toBe('Aluguel')
    expect(snapshot.dueTodayCharges).toHaveLength(0)
  })

  it('classifies a fixed expense due exactly today as dueToday, not overdue', () => {
    const transactions = [makeTransaction({ recurrence: 'fixed', date: '2026-08-04', is_paid: false, title: 'Internet' })]
    const snapshot = buildFinancialSnapshot([makeAccount()], transactions, REFERENCE_DATE)

    expect(snapshot.dueTodayCharges).toHaveLength(1)
    expect(snapshot.overdueCharges).toHaveLength(0)
  })

  it('excludes individual credit card purchases from the charge lists, surfacing only the aggregated invoice', () => {
    const card = makeAccount({ id: 'card-1', type: 'credit_card', statement_closing_day: 29, statement_due_day: 8 })
    const purchase = makeTransaction({
      account_id: 'card-1',
      recurrence: 'fixed',
      date: '2026-07-10',
      is_paid: false,
      title: 'Spotify',
    })
    const snapshot = buildFinancialSnapshot([makeAccount(), card], [purchase], REFERENCE_DATE)

    const allCharges = [...snapshot.overdueCharges, ...snapshot.dueTodayCharges, ...snapshot.upcomingCharges]
    expect(allCharges.some((c) => c.title === 'Spotify')).toBe(false)
    expect(allCharges.some((c) => c.title.startsWith('Fatura'))).toBe(true)
  })

  it('caps recommendedSavings at the actual free cash, never suggesting more than what is free', () => {
    const transactions = [
      makeTransaction({ transaction_type: 'income', amount: 1000, is_paid: true, date: '2026-08-01' }),
      makeTransaction({ id: 'tx-2', transaction_type: 'expense', amount: 950, is_paid: true, date: '2026-08-02' }),
    ]
    const snapshot = buildFinancialSnapshot([makeAccount()], transactions, REFERENCE_DATE)

    // 20% of 1000 income would be 200, but only 50 is actually free this month.
    expect(snapshot.freeCashThisMonth).toBe(50)
    expect(snapshot.recommendedSavings).toBeCloseTo(50)
  })

  it('sums totalSaved only from savings-type accounts, ignoring checking/credit card balances', () => {
    const accounts = [
      makeAccount({ id: 'acc-1', type: 'checking', initial_balance: 5000 }),
      makeAccount({ id: 'acc-2', type: 'savings', initial_balance: 300 }),
    ]
    const snapshot = buildFinancialSnapshot(accounts, [], REFERENCE_DATE)

    expect(snapshot.totalSaved).toBe(300)
  })
})
