import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { computeCategoryTotals } from './computeCategoryTotals'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    destination_account_id: null,
    title: 'Item',
    amount: 100,
    transaction_type: 'expense',
    recurrence: 'variable',
    category: 'Alimentação',
    date: '2026-08-05',
    is_paid: true,
    installments_total: 1,
    installment_current: 1,
    is_active: true,
    created_at: '2026-08-05T00:00:00.000Z',
    ...overrides,
  }
}

const PERIOD_START = new Date(2026, 7, 1).getTime()
const PERIOD_END = new Date(2026, 7, 31).getTime()

describe('computeCategoryTotals', () => {
  it('sums paid expenses per category within the period, ignoring income/transfers', () => {
    const transactions = [
      makeTransaction({ id: '1', category: 'Alimentação', amount: 100 }),
      makeTransaction({ id: '2', category: 'Alimentação', amount: 50 }),
      makeTransaction({ id: '3', category: 'Transporte', amount: 30 }),
      makeTransaction({ id: '4', transaction_type: 'income', amount: 1000 }),
      makeTransaction({ id: '5', transaction_type: 'transfer', amount: 200 }),
    ]

    const totals = computeCategoryTotals(transactions, PERIOD_START, PERIOD_END)

    expect(totals.get('Alimentação')).toBe(150)
    expect(totals.get('Transporte')).toBe(30)
    expect(totals.has('income')).toBe(false)
  })

  it('counts a pending fixed expense for the month even though it is not paid yet', () => {
    const transactions = [
      makeTransaction({ recurrence: 'fixed', is_paid: false, category: 'Assinaturas', amount: 40, date: '2026-08-03' }),
    ]

    const totals = computeCategoryTotals(transactions, PERIOD_START, PERIOD_END)

    expect(totals.get('Assinaturas')).toBe(40)
  })

  it('ignores an ordinary (non-recurring) unpaid transaction', () => {
    const transactions = [makeTransaction({ is_paid: false, category: 'Lazer', amount: 40 })]

    const totals = computeCategoryTotals(transactions, PERIOD_START, PERIOD_END)

    expect(totals.has('Lazer')).toBe(false)
  })

  it('falls back to "Outros" when category is null or blank', () => {
    const transactions = [makeTransaction({ category: null, amount: 20 })]

    const totals = computeCategoryTotals(transactions, PERIOD_START, PERIOD_END)

    expect(totals.get('Outros')).toBe(20)
  })
})
