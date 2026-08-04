import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { computeMonthlyRetrospective, computeYearlyRetrospective } from './computeRetrospective'

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

const REFERENCE_DATE = new Date(2026, 7, 15) // Aug 15, 2026

describe('computeMonthlyRetrospective', () => {
  it('sums income/expenses only within the reference month and ignores transfers/unpaid', () => {
    const transactions = [
      makeTransaction({ id: '1', transaction_type: 'income', amount: 2000, date: '2026-08-01' }),
      makeTransaction({ id: '2', transaction_type: 'expense', amount: 300, date: '2026-08-10' }),
      makeTransaction({ id: '3', transaction_type: 'expense', amount: 999, date: '2026-07-31' }), // previous month
      makeTransaction({ id: '4', transaction_type: 'transfer', amount: 500, date: '2026-08-05' }), // excluded
      makeTransaction({ id: '5', transaction_type: 'expense', amount: 50, date: '2026-08-12', is_paid: false }), // excluded
    ]

    const result = computeMonthlyRetrospective(transactions, REFERENCE_DATE)

    expect(result.totalIncome).toBe(2000)
    expect(result.totalExpenses).toBe(300)
    expect(result.net).toBe(1700)
    expect(result.transactionCount).toBe(2)
  })

  it('finds the top category and the single biggest expense', () => {
    const transactions = [
      makeTransaction({ id: '1', category: 'Alimentação', amount: 200, date: '2026-08-02' }),
      makeTransaction({ id: '2', category: 'Alimentação', amount: 150, date: '2026-08-03' }),
      makeTransaction({ id: '3', category: 'Transporte', amount: 100, date: '2026-08-04' }),
    ]

    const result = computeMonthlyRetrospective(transactions, REFERENCE_DATE)

    expect(result.topCategory).toEqual({ name: 'Alimentação', amount: 350 })
    expect(result.biggestExpense).toMatchObject({ title: 'Item', amount: 200 })
  })

  it('computes the expense change vs the previous month as a percentage', () => {
    const transactions = [
      makeTransaction({ id: '1', amount: 100, date: '2026-07-10' }), // previous month baseline
      makeTransaction({ id: '2', amount: 150, date: '2026-08-10' }), // 50% more
    ]

    const result = computeMonthlyRetrospective(transactions, REFERENCE_DATE)

    expect(result.expenseChangePercent).toBeCloseTo(50)
  })

  it('reports expenseChangePercent as null when there is no previous-month data to compare', () => {
    const transactions = [makeTransaction({ amount: 100, date: '2026-08-10' })]

    const result = computeMonthlyRetrospective(transactions, REFERENCE_DATE)

    expect(result.expenseChangePercent).toBeNull()
  })
})

describe('computeYearlyRetrospective', () => {
  it('identifies the best and toughest months by net (income - expenses)', () => {
    const transactions = [
      makeTransaction({ id: '1', transaction_type: 'income', amount: 5000, date: '2026-01-05' }),
      makeTransaction({ id: '2', transaction_type: 'expense', amount: 500, date: '2026-01-10' }), // Jan net: +4500
      makeTransaction({ id: '3', transaction_type: 'income', amount: 1000, date: '2026-03-05' }),
      makeTransaction({ id: '4', transaction_type: 'expense', amount: 1800, date: '2026-03-10' }), // Mar net: -800
    ]

    const result = computeYearlyRetrospective(transactions, 2026)

    expect(result.bestMonth).toMatchObject({ label: 'Jan', net: 4500 })
    expect(result.toughestMonth).toMatchObject({ label: 'Mar', net: -800 })
    expect(result.monthlyBreakdown).toHaveLength(12)
  })

  it('returns null for toughestMonth when only one month has activity', () => {
    const transactions = [makeTransaction({ transaction_type: 'income', amount: 100, date: '2026-05-01' })]

    const result = computeYearlyRetrospective(transactions, 2026)

    expect(result.bestMonth).toMatchObject({ label: 'Mai' })
    expect(result.toughestMonth).toBeNull()
  })
})
