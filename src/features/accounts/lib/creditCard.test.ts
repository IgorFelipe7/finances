import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { computeCreditCardInvoices } from './creditCard'

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'card-1',
    destination_account_id: null,
    title: 'Compra',
    amount: 100,
    transaction_type: 'expense',
    recurrence: 'variable',
    category: null,
    date: '2026-07-15',
    is_paid: true,
    installments_total: 1,
    installment_current: 1,
    is_active: true,
    created_at: '2026-07-15T00:00:00.000Z',
    ...overrides,
  }
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

describe('computeCreditCardInvoices', () => {
  const referenceDate = new Date(2026, 7, 4) // Aug 4, 2026

  it('wraps the due date into the next month when due-day <= closing-day', () => {
    const invoices = computeCreditCardInvoices('card-1', 29, 8, [], referenceDate)

    expect(isoDate(invoices.closed.closingDate)).toBe('2026-07-29')
    expect(isoDate(invoices.closed.dueDate)).toBe('2026-08-08')
    expect(isoDate(invoices.open.closingDate)).toBe('2026-08-29')
    expect(isoDate(invoices.open.dueDate)).toBe('2026-09-08')
  })

  it('keeps the due date in the same month when due-day > closing-day', () => {
    const justAfterClosing = new Date(2026, 7, 6) // Aug 6, right after an Aug 5 closing
    const invoices = computeCreditCardInvoices('card-1', 5, 12, [], justAfterClosing)

    expect(isoDate(invoices.closed.closingDate)).toBe('2026-08-05')
    expect(isoDate(invoices.closed.dueDate)).toBe('2026-08-12')
  })

  it('splits purchases into the closed vs. open cycle purely by date', () => {
    const transactions = [
      makeTransaction({ date: '2026-07-15', amount: 100 }), // closed cycle: Jun30-Jul29
      makeTransaction({ id: 'tx-2', date: '2026-08-01', amount: 50 }), // open cycle: Jul30-Aug29
    ]
    const invoices = computeCreditCardInvoices('card-1', 29, 8, transactions, referenceDate)

    expect(invoices.closed.amount).toBe(100)
    expect(invoices.open.amount).toBe(50)
  })

  it('subtracts payments made after closing from the closed invoice amount', () => {
    const transactions = [
      makeTransaction({ date: '2026-07-15', amount: 100 }),
      makeTransaction({
        id: 'tx-2',
        transaction_type: 'transfer',
        account_id: 'checking-1',
        destination_account_id: 'card-1',
        date: '2026-08-01',
        amount: 60,
      }),
    ]
    const invoices = computeCreditCardInvoices('card-1', 29, 8, transactions, referenceDate)

    expect(invoices.closed.amount).toBe(40)
  })

  it('never goes negative even if payments exceed purchases', () => {
    const transactions = [
      makeTransaction({ date: '2026-07-15', amount: 100 }),
      makeTransaction({
        id: 'tx-2',
        transaction_type: 'transfer',
        account_id: 'checking-1',
        destination_account_id: 'card-1',
        date: '2026-08-01',
        amount: 500,
      }),
    ]
    const invoices = computeCreditCardInvoices('card-1', 29, 8, transactions, referenceDate)

    expect(invoices.closed.amount).toBe(0)
  })
})
