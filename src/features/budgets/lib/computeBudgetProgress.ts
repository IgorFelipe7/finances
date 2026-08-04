import type { Budget } from '@/features/budgets/schemas/budget.schema'

export interface BudgetProgress {
  id: string
  category: string
  limit: number
  spent: number
  /** spent / limit — uncapped, can exceed 1 when over budget. */
  percent: number
  status: 'ok' | 'warning' | 'over'
}

const WARNING_THRESHOLD = 0.8

/** Combines saved budget limits with this month's actual category spend, sorted worst-first. */
export function computeBudgetProgress(budgets: Budget[], categoryTotals: Map<string, number>): BudgetProgress[] {
  return budgets
    .map((budget) => {
      const spent = categoryTotals.get(budget.category) ?? 0
      const percent = spent / budget.monthly_limit
      const status: BudgetProgress['status'] = percent >= 1 ? 'over' : percent >= WARNING_THRESHOLD ? 'warning' : 'ok'
      return { id: budget.id, category: budget.category, limit: budget.monthly_limit, spent, percent, status }
    })
    .sort((a, b) => b.percent - a.percent)
}
