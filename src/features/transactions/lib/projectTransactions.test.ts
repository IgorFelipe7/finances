import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { withProjections } from './projectTransactions'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    destination_account_id: null,
    title: 'Netflix',
    amount: 39.9,
    transaction_type: 'expense',
    recurrence: 'variable',
    category: 'Assinaturas',
    date: '2026-01-05',
    is_paid: true,
    installments_total: 1,
    installment_current: 1,
    is_active: true,
    created_at: '2026-01-05T00:00:00.000Z',
    ...overrides,
  }
}

describe('withProjections', () => {
  it('projects a fixed transaction forward every month, unpaid, until the window ends', () => {
    const anchor = makeTransaction({ recurrence: 'fixed', date: '2026-01-05' })
    const periodEnd = new Date(2026, 3, 30).getTime() // through April

    const projected = withProjections([anchor], periodEnd).filter((t) => t.is_projected)

    expect(projected.map((t) => t.date)).toEqual(['2026-02-05', '2026-03-05', '2026-04-05'])
    expect(projected.every((t) => t.is_paid === false)).toBe(true)
  })

  it('stops installment projections once installments_total is reached', () => {
    const anchor = makeTransaction({ installments_total: 3, installment_current: 1, date: '2026-01-10' })
    const periodEnd = new Date(2026, 11, 31).getTime()

    const projected = withProjections([anchor], periodEnd).filter((t) => t.is_projected)

    expect(projected).toHaveLength(2)
    expect(projected.map((t) => t.installment_current)).toEqual([2, 3])
  })

  it('does not re-project a month already occupied by a real settled row for the same slot', () => {
    const anchor = makeTransaction({ recurrence: 'fixed', date: '2026-01-05', title: 'Netflix', account_id: 'acc-1' })
    const settled = makeTransaction({
      id: 'tx-2',
      recurrence: 'variable',
      installments_total: 1,
      date: '2026-02-05',
      title: 'Netflix',
      account_id: 'acc-1',
      is_paid: true,
    })
    const periodEnd = new Date(2026, 2, 31).getTime() // through March

    const result = withProjections([anchor, settled], periodEnd)
    const februaryEntries = result.filter((t) => t.date === '2026-02-05')

    expect(februaryEntries).toHaveLength(1)
    expect(februaryEntries[0].is_projected).toBe(false)
  })

  it('leaves real (non-recurring) rows untouched and generates nothing for them', () => {
    const oneOff = makeTransaction({ recurrence: 'variable', installments_total: 1 })
    const periodEnd = new Date(2027, 0, 1).getTime()

    const result = withProjections([oneOff], periodEnd)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ is_projected: false, anchor_id: 'tx-1' })
  })
})
