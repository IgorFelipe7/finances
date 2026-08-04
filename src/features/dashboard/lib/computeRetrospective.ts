import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { MONTH_NAMES_PT_BR, formatMonthYear } from '@/lib/date'

export interface RetrospectiveStats {
  totalIncome: number
  totalExpenses: number
  net: number
  transactionCount: number
  topCategory: { name: string; amount: number } | null
  biggestExpense: { title: string; amount: number; date: string } | null
}

/** Sums confirmed (paid) income/expense transactions within [start, end], plus the top category and single biggest expense. */
function aggregatePeriod(transactions: Transaction[], start: Date, end: Date): RetrospectiveStats {
  const startTime = start.getTime()
  const endTime = end.getTime()

  let totalIncome = 0
  let totalExpenses = 0
  let transactionCount = 0
  const categoryTotals = new Map<string, number>()
  let biggestExpense: { title: string; amount: number; date: string } | null = null

  for (const t of transactions) {
    if (!t.is_paid || t.transaction_type === 'transfer') continue
    const time = new Date(`${t.date}T00:00:00`).getTime()
    if (time < startTime || time > endTime) continue

    transactionCount += 1

    if (t.transaction_type === 'income') {
      totalIncome += t.amount
    } else {
      totalExpenses += t.amount
      const category = t.category?.trim() || 'Outros'
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + t.amount)
      if (!biggestExpense || t.amount > biggestExpense.amount) {
        biggestExpense = { title: t.title, amount: t.amount, date: t.date }
      }
    }
  }

  const topCategoryEntry = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]

  return {
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    transactionCount,
    topCategory: topCategoryEntry ? { name: topCategoryEntry[0], amount: topCategoryEntry[1] } : null,
    biggestExpense,
  }
}

export interface MonthlyRetrospective extends RetrospectiveStats {
  periodLabel: string
  expenseChangePercent: number | null
}

export function computeMonthlyRetrospective(
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): MonthlyRetrospective {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)
  const current = aggregatePeriod(transactions, start, end)

  const prevStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1)
  const prevEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0)
  const previous = aggregatePeriod(transactions, prevStart, prevEnd)

  const expenseChangePercent =
    previous.totalExpenses > 0 ? ((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100 : null

  return {
    ...current,
    periodLabel: formatMonthYear(referenceDate.getMonth(), referenceDate.getFullYear()),
    expenseChangePercent,
  }
}

export interface YearlyRetrospective extends RetrospectiveStats {
  periodLabel: string
  bestMonth: { label: string; net: number } | null
  toughestMonth: { label: string; net: number } | null
  monthlyBreakdown: { label: string; income: number; expense: number }[]
}

export function computeYearlyRetrospective(transactions: Transaction[], year: number): YearlyRetrospective {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  const current = aggregatePeriod(transactions, start, end)

  const monthlyBreakdown = Array.from({ length: 12 }, (_, month) => {
    const stats = aggregatePeriod(transactions, new Date(year, month, 1), new Date(year, month + 1, 0))
    return { label: MONTH_NAMES_PT_BR[month].slice(0, 3), income: stats.totalIncome, expense: stats.totalExpenses }
  })

  const monthsWithActivity = monthlyBreakdown
    .filter((m) => m.income > 0 || m.expense > 0)
    .map((m) => ({ label: m.label, net: m.income - m.expense }))
  const sortedByNet = [...monthsWithActivity].sort((a, b) => b.net - a.net)

  return {
    ...current,
    periodLabel: String(year),
    bestMonth: sortedByNet[0] ?? null,
    toughestMonth: sortedByNet.length > 1 ? (sortedByNet.at(-1) ?? null) : null,
    monthlyBreakdown,
  }
}
