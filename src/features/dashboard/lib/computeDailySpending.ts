import type { Transaction } from '@/features/transactions/schemas/transaction.schema'

export interface SpendingDay {
  /** Day of month, 1-based. Null for padding cells before the 1st / after the last. */
  day: number | null
  amount: number
  /** 0 (none) to 4 (heaviest), bucketed against the month's own peak. */
  level: 0 | 1 | 2 | 3 | 4
}

const LEVEL_THRESHOLDS = [0.25, 0.5, 0.75] as const

function levelFor(amount: number, peak: number): SpendingDay['level'] {
  if (amount <= 0 || peak <= 0) return 0
  const ratio = amount / peak
  if (ratio <= LEVEL_THRESHOLDS[0]) return 1
  if (ratio <= LEVEL_THRESHOLDS[1]) return 2
  if (ratio <= LEVEL_THRESHOLDS[2]) return 3
  return 4
}

/**
 * Expense intensity per calendar day for one month, laid out as week rows of 7 cells
 * starting on Monday. Leading and trailing cells are padded with `day: null` so the grid
 * is always a clean rectangle.
 *
 * Transactions store a date with no time component, so this is per-day — an hour-of-day
 * breakdown isn't derivable from the data we persist.
 */
export function computeDailySpending(transactions: Transaction[], month: number, year: number): SpendingDay[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totals = new Array<number>(daysInMonth + 1).fill(0)

  for (const transaction of transactions) {
    if (transaction.transaction_type !== 'expense') continue
    // Parse as local midnight: `new Date('2026-08-16')` is UTC and can shift a day back.
    const date = new Date(`${transaction.date}T00:00:00`)
    if (date.getFullYear() !== year || date.getMonth() !== month) continue
    totals[date.getDate()] += transaction.amount
  }

  const peak = Math.max(...totals)

  // getDay() is Sunday-first; shift so Monday starts the week.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const cells: SpendingDay[] = []
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null, amount: 0, level: 0 })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, amount: totals[day], level: levelFor(totals[day], peak) })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, amount: 0, level: 0 })
  }

  const weeks: SpendingDay[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}
