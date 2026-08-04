import type { Transaction } from '@/features/transactions/schemas/transaction.schema'

export function formatDueDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function clampToMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, lastDay))
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Most recent statement closing date that is on or before `referenceDate`. */
function lastClosingOnOrBefore(closingDay: number, referenceDate: Date): Date {
  const thisMonth = clampToMonth(referenceDate.getFullYear(), referenceDate.getMonth(), closingDay)
  if (thisMonth.getTime() <= startOfDay(referenceDate).getTime()) return thisMonth
  return clampToMonth(referenceDate.getFullYear(), referenceDate.getMonth() - 1, closingDay)
}

/**
 * Due date is usually a handful of days after closing. Stored as a bare day-of-month, so the
 * wrap into next month is inferred from the numbers: due ≤ closing means it lands next month
 * (e.g. closes the 28th, due the 5th); due > closing stays in the same month (closes the 5th, due the 12th).
 */
function resolveDueDate(closingDay: number, dueDay: number, closingDate: Date): Date {
  const monthOffset = dueDay <= closingDay ? 1 : 0
  return clampToMonth(closingDate.getFullYear(), closingDate.getMonth() + monthOffset, dueDay)
}

export interface CreditCardCycle {
  /** First day whose purchases belong to this cycle. */
  start: Date
  closingDate: Date
  dueDate: Date
  amount: number
}

export interface CreditCardInvoices {
  /** The statement that has already closed — this is what's actually due/payable right now. */
  closed: CreditCardCycle
  /** Purchases made since the last closing date — still accumulating, not due yet. */
  open: CreditCardCycle
}

/**
 * Splits a card's transactions into the invoice that's due now (closed) and the one still
 * accumulating (open), instead of treating every purchase as immediately payable. A purchase
 * only becomes "money you owe on a deadline" once its statement closes — never on the day it
 * was made.
 */
export function computeCreditCardInvoices(
  accountId: string,
  closingDay: number,
  dueDay: number,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): CreditCardInvoices {
  const closedClosing = lastClosingOnOrBefore(closingDay, referenceDate)
  const closedStart = addDays(clampToMonth(closedClosing.getFullYear(), closedClosing.getMonth() - 1, closingDay), 1)
  const closedDue = resolveDueDate(closingDay, dueDay, closedClosing)

  const openClosing = clampToMonth(closedClosing.getFullYear(), closedClosing.getMonth() + 1, closingDay)
  const openStart = addDays(closedClosing, 1)
  const openDue = resolveDueDate(closingDay, dueDay, openClosing)

  let closedPurchases = 0
  let closedPayments = 0
  let openPurchases = 0

  for (const transaction of transactions) {
    if (!transaction.is_active) continue
    const isPurchase = transaction.account_id === accountId && transaction.transaction_type === 'expense'
    const isPayment = transaction.destination_account_id === accountId && transaction.transaction_type === 'transfer'
    if (!isPurchase && !isPayment) continue

    const date = new Date(`${transaction.date}T00:00:00`)

    if (isPurchase && date >= closedStart && date <= closedClosing) {
      closedPurchases += transaction.amount
    } else if (isPurchase && date > closedClosing && date <= openClosing) {
      openPurchases += transaction.amount
    }

    // Payments made after the invoice closes are assumed to settle that closed invoice first.
    if (isPayment && date > closedClosing) {
      closedPayments += transaction.amount
    }
  }

  return {
    closed: {
      start: closedStart,
      closingDate: closedClosing,
      dueDate: closedDue,
      amount: Math.max(closedPurchases - closedPayments, 0),
    },
    open: {
      start: openStart,
      closingDate: openClosing,
      dueDate: openDue,
      amount: openPurchases,
    },
  }
}
