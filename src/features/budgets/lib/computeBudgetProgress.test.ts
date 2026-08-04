import { describe, expect, it } from 'vitest'
import type { Budget } from '@/features/budgets/schemas/budget.schema'
import { computeBudgetProgress } from './computeBudgetProgress'

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'b-1',
    user_id: 'user-1',
    category: 'Alimentação',
    monthly_limit: 500,
    created_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('computeBudgetProgress', () => {
  it('marks a category under 80% of its limit as ok', () => {
    const result = computeBudgetProgress([makeBudget({ monthly_limit: 500 })], new Map([['Alimentação', 300]]))

    expect(result[0]).toMatchObject({ spent: 300, percent: 0.6, status: 'ok' })
  })

  it('marks a category at or above 80% (but under 100%) as warning', () => {
    const result = computeBudgetProgress([makeBudget({ monthly_limit: 500 })], new Map([['Alimentação', 400]]))

    expect(result[0]).toMatchObject({ percent: 0.8, status: 'warning' })
  })

  it('marks a category at or over 100% of its limit as over, even past 100%', () => {
    const result = computeBudgetProgress([makeBudget({ monthly_limit: 500 })], new Map([['Alimentação', 650]]))

    expect(result[0]).toMatchObject({ percent: 1.3, status: 'over' })
  })

  it('treats a category with no spending yet as 0, not missing', () => {
    const result = computeBudgetProgress([makeBudget({ category: 'Transporte', monthly_limit: 200 })], new Map())

    expect(result[0]).toMatchObject({ spent: 0, percent: 0, status: 'ok' })
  })

  it('sorts worst (highest percent) first', () => {
    const budgets = [
      makeBudget({ id: 'b-1', category: 'A', monthly_limit: 100 }),
      makeBudget({ id: 'b-2', category: 'B', monthly_limit: 100 }),
    ]
    const totals = new Map([
      ['A', 50],
      ['B', 90],
    ])

    const result = computeBudgetProgress(budgets, totals)

    expect(result.map((r) => r.category)).toEqual(['B', 'A'])
  })
})
