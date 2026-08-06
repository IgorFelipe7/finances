import { withProjections, type ProjectedTransaction } from '@/features/transactions/lib/projectTransactions'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'

export interface CalendarDay {
  date: Date
  iso: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  income: number
  expense: number
  net: number
  /** Unpaid entries whose date has already passed. */
  hasOverdue: boolean
  /** Unpaid entries still ahead (today or future). */
  hasPending: boolean
  entries: ProjectedTransaction[]
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const ONE_DAY_MS = 86_400_000

/**
 * Builds a full 7-column month grid — including the leading/trailing days from adjacent months
 * needed to complete the first/last week — with every real and projected transaction bucketed
 * onto the day it actually falls on. Recurring items use `withProjections`, so a rule like "5º
 * dia útil" lands on its real computed date each month instead of a naive same-day guess.
 */
export function buildCalendarGrid(
  year: number,
  month: number,
  transactions: Transaction[],
  today: Date = new Date(),
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())
  const gridEnd = new Date(year, month, lastOfMonth.getDate() + (6 - lastOfMonth.getDay()))

  const expanded = withProjections(transactions, gridEnd.getTime() + ONE_DAY_MS)

  const byDate = new Map<string, ProjectedTransaction[]>()
  for (const entry of expanded) {
    const bucket = byDate.get(entry.date)
    if (bucket) bucket.push(entry)
    else byDate.set(entry.date, [entry])
  }

  const todayIso = toIsoDate(today)
  const days: CalendarDay[] = []
  const cursor = new Date(gridStart)

  while (cursor.getTime() <= gridEnd.getTime()) {
    const iso = toIsoDate(cursor)
    const entries = (byDate.get(iso) ?? []).sort((a, b) => a.title.localeCompare(b.title))
    const dayOfWeek = cursor.getDay()

    let income = 0
    let expense = 0
    let hasOverdue = false
    let hasPending = false

    for (const entry of entries) {
      if (entry.transaction_type === 'income') income += entry.amount
      else if (entry.transaction_type === 'expense') expense += entry.amount

      if (!entry.is_paid) {
        if (iso < todayIso) hasOverdue = true
        else hasPending = true
      }
    }

    days.push({
      date: new Date(cursor),
      iso,
      isCurrentMonth: cursor.getMonth() === month,
      isToday: iso === todayIso,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      income,
      expense,
      net: income - expense,
      hasOverdue,
      hasPending,
      entries,
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}
