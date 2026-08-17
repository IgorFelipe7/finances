import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { computeDailySpending } from './computeDailySpending'

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

function findDay(weeks: ReturnType<typeof computeDailySpending>, day: number) {
  return weeks.flat().find((cell) => cell.day === day)
}

describe('computeDailySpending', () => {
  it('lays the month out as whole week rows of 7', () => {
    const weeks = computeDailySpending([], 7, 2026)

    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks.flat().filter((cell) => cell.day !== null)).toHaveLength(31)
  })

  it('starts the week on Monday', () => {
    // 1 Aug 2026 is a Saturday, so Monday-first leaves 5 leading pad cells.
    const weeks = computeDailySpending([], 7, 2026)

    expect(weeks[0].slice(0, 5).every((cell) => cell.day === null)).toBe(true)
    expect(weeks[0][5].day).toBe(1)
  })

  it('sums expenses falling on the same day', () => {
    const weeks = computeDailySpending(
      [
        makeTransaction({ id: 'a', date: '2026-08-05', amount: 40 }),
        makeTransaction({ id: 'b', date: '2026-08-05', amount: 60 }),
      ],
      7,
      2026,
    )

    expect(findDay(weeks, 5)?.amount).toBe(100)
  })

  it('ignores income, transfers, and other months', () => {
    const weeks = computeDailySpending(
      [
        makeTransaction({ id: 'a', date: '2026-08-05', transaction_type: 'income', amount: 500 }),
        makeTransaction({ id: 'b', date: '2026-08-06', transaction_type: 'transfer', amount: 500 }),
        makeTransaction({ id: 'c', date: '2026-07-05', amount: 500 }),
      ],
      7,
      2026,
    )

    expect(weeks.flat().every((cell) => cell.amount === 0)).toBe(true)
  })

  it('buckets intensity against the month peak', () => {
    const weeks = computeDailySpending(
      [
        makeTransaction({ id: 'a', date: '2026-08-05', amount: 100 }),
        makeTransaction({ id: 'b', date: '2026-08-06', amount: 10 }),
      ],
      7,
      2026,
    )

    expect(findDay(weeks, 5)?.level).toBe(4)
    expect(findDay(weeks, 6)?.level).toBe(1)
    expect(findDay(weeks, 7)?.level).toBe(0)
  })

  it('reads dates as local time so a day never shifts backwards', () => {
    const weeks = computeDailySpending([makeTransaction({ date: '2026-08-01', amount: 25 })], 7, 2026)

    expect(findDay(weeks, 1)?.amount).toBe(25)
  })
})
