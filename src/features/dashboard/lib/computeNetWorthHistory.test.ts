import { describe, expect, it } from 'vitest'
import type { Account } from '@/features/accounts/schemas/account.schema'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { computeNetWorthHistory } from './computeNetWorthHistory'

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
    title: 'Movimentação',
    amount: 100,
    transaction_type: 'income',
    recurrence: 'variable',
    category: null,
    date: '2026-06-15',
    is_paid: true,
    installments_total: 1,
    installment_current: 1,
    is_active: true,
    created_at: '2026-06-15T00:00:00.000Z',
    ...overrides,
  }
}

const REFERENCE_DATE = new Date(2026, 7, 4) // Aug 4, 2026

describe('computeNetWorthHistory', () => {
  it('reflects a paid transaction only in checkpoints on/after its date', () => {
    const points = computeNetWorthHistory(
      [makeAccount({ initial_balance: 0 })],
      [makeTransaction({ date: '2026-06-15', amount: 500, transaction_type: 'income' })],
      4, // May, Jun, Jul, Aug
      REFERENCE_DATE,
    )

    const june = points.find((p) => p.month === 5 && p.year === 2026)!
    const may = points.find((p) => p.month === 4 && p.year === 2026)!

    expect(may.netWorth).toBe(0)
    expect(june.netWorth).toBe(500)
  })

  it('does not count an account before it was created', () => {
    const points = computeNetWorthHistory(
      [makeAccount({ initial_balance: 200, created_at: '2026-07-01T00:00:00.000Z' })],
      [],
      3,
      REFERENCE_DATE,
    )

    const june = points.find((p) => p.month === 5 && p.year === 2026)!
    const july = points.find((p) => p.month === 6 && p.year === 2026)!

    expect(june.netWorth).toBe(0)
    expect(july.netWorth).toBe(200)
  })

  it('treats a credit card balance as debt (negative) toward net worth', () => {
    const points = computeNetWorthHistory(
      [makeAccount({ id: 'card-1', type: 'credit_card', initial_balance: 300 })],
      [],
      1,
      REFERENCE_DATE,
    )

    expect(points[0].netWorth).toBe(-300)
  })

  it('ignores unpaid transactions entirely', () => {
    const points = computeNetWorthHistory(
      [makeAccount({ initial_balance: 0 })],
      [makeTransaction({ date: '2026-06-15', amount: 500, is_paid: false })],
      1,
      REFERENCE_DATE,
    )

    expect(points[0].netWorth).toBe(0)
  })

  it('returns exactly windowSize points ending at the reference month', () => {
    const points = computeNetWorthHistory([makeAccount()], [], 6, REFERENCE_DATE)

    expect(points).toHaveLength(6)
    expect(points.at(-1)).toMatchObject({ month: 7, year: 2026 })
  })
})
