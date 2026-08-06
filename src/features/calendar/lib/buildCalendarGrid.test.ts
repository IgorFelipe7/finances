import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { buildCalendarGrid } from './buildCalendarGrid'

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
    recurrence_rule: null,
    ...overrides,
  }
}

// August 2026: Aug 1 is a Saturday, Aug 31 is a Monday.
const YEAR = 2026
const MONTH = 7
const TODAY = new Date(2026, 7, 4) // Aug 4, 2026 (Tuesday)

describe('buildCalendarGrid', () => {
  it('produces a full-weeks grid starting on the Sunday before the 1st and ending the Saturday after the last day', () => {
    const grid = buildCalendarGrid(YEAR, MONTH, [], TODAY)

    expect(grid.length % 7).toBe(0)
    expect(grid[0].iso).toBe('2026-07-26')
    expect(grid.at(-1)!.iso).toBe('2026-09-05')
  })

  it('flags days outside the target month as not-current, and today correctly', () => {
    const grid = buildCalendarGrid(YEAR, MONTH, [], TODAY)
    const july26 = grid.find((d) => d.iso === '2026-07-26')!
    const aug4 = grid.find((d) => d.iso === '2026-08-04')!
    const aug15 = grid.find((d) => d.iso === '2026-08-15')!

    expect(july26.isCurrentMonth).toBe(false)
    expect(aug4.isCurrentMonth).toBe(true)
    expect(aug4.isToday).toBe(true)
    expect(aug15.isToday).toBe(false)
  })

  it('flags Saturdays and Sundays as weekends', () => {
    const grid = buildCalendarGrid(YEAR, MONTH, [], TODAY)
    const saturday = grid.find((d) => d.iso === '2026-08-01')!
    const sunday = grid.find((d) => d.iso === '2026-08-02')!
    const monday = grid.find((d) => d.iso === '2026-08-03')!

    expect(saturday.isWeekend).toBe(true)
    expect(sunday.isWeekend).toBe(true)
    expect(monday.isWeekend).toBe(false)
  })

  it('buckets a paid transaction onto its date, summing income/expense/net', () => {
    const transactions = [
      makeTransaction({ id: 'a', date: '2026-08-15', transaction_type: 'expense', amount: 100 }),
      makeTransaction({ id: 'b', date: '2026-08-15', transaction_type: 'income', amount: 300 }),
    ]
    const grid = buildCalendarGrid(YEAR, MONTH, transactions, TODAY)
    const day = grid.find((d) => d.iso === '2026-08-15')!

    expect(day.expense).toBe(100)
    expect(day.income).toBe(300)
    expect(day.net).toBe(200)
    expect(day.entries).toHaveLength(2)
  })

  it('flags unpaid past-due entries as overdue and unpaid future entries as pending', () => {
    const transactions = [
      makeTransaction({ id: 'overdue', date: '2026-08-01', is_paid: false }),
      makeTransaction({ id: 'pending', date: '2026-08-20', is_paid: false }),
    ]
    const grid = buildCalendarGrid(YEAR, MONTH, transactions, TODAY)

    expect(grid.find((d) => d.iso === '2026-08-01')!.hasOverdue).toBe(true)
    expect(grid.find((d) => d.iso === '2026-08-20')!.hasPending).toBe(true)
  })

  it('projects a fixed transaction with a recurrence_rule onto its computed date for the month', () => {
    // Anchor is July; the rule (5th business day, Saturday not counted) resolves to Aug 7 in August.
    const transactions = [
      makeTransaction({
        id: 'salary',
        date: '2026-07-07',
        recurrence: 'fixed',
        transaction_type: 'income',
        amount: 5000,
        recurrence_rule: { type: 'business_day', n: 5, countSaturday: false },
      }),
    ]
    const grid = buildCalendarGrid(YEAR, MONTH, transactions, TODAY)
    const projectedDay = grid.find((d) => d.iso === '2026-08-07')!

    expect(projectedDay.income).toBe(5000)
    expect(projectedDay.entries[0].is_projected).toBe(true)
  })
})
