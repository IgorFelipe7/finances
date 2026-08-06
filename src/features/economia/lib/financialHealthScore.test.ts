import { describe, expect, it } from 'vitest'
import type { FinancialSnapshot } from '@/features/dashboard/lib/buildFinancialSnapshot'
import { computeHealthScore } from './financialHealthScore'

function makeSnapshot(overrides: Partial<FinancialSnapshot> = {}): FinancialSnapshot {
  return {
    today: '2026-08-04',
    monthLabel: 'Agosto 2026',
    dayOfMonth: 4,
    daysInMonth: 31,
    daysRemaining: 27,
    netWorth: 1000,
    accounts: [],
    confirmedIncome: 1000,
    confirmedExpenses: 200,
    projectedMonthExpenses: 1550,
    overspendRisk: false,
    overdueCharges: [],
    dueTodayCharges: [],
    upcomingCharges: [],
    endingInstallments: [],
    knownUpcomingExpenses: 0,
    knownUpcomingIncome: 0,
    freeCashThisMonth: 800,
    safeToSpendPerDay: 29.6,
    totalSaved: 1200, // 6 months of the 200/month expense estimate — fully covers the target
    recommendedSavings: 200,
    categoryBreakdown: [],
    budgetStatus: [],
    goalsProgress: [],
    recentTransactions: [],
    ...overrides,
  }
}

describe('computeHealthScore', () => {
  it('gives full marks when every factor is healthy', () => {
    const result = computeHealthScore(makeSnapshot())

    expect(result.score).toBe(100)
    expect(result.factors.every((f) => f.ok)).toBe(true)
  })

  it('scores the emergency fund proportionally, not all-or-nothing', () => {
    // 100 saved against 200/month expenses = 0.5 months covered = 1/12 of the 6-month target
    const result = computeHealthScore(makeSnapshot({ totalSaved: 100 }))
    const emergencyFactor = result.factors.find((f) => f.label === 'Reserva de emergência')!

    expect(result.emergencyFundMonths).toBeCloseTo(0.5)
    expect(emergencyFactor.points).toBe(Math.round((0.5 / 6) * 40))
    expect(emergencyFactor.ok).toBe(false)
  })

  it('zeroes the overdue-bills factor when there is at least one overdue charge', () => {
    const result = computeHealthScore(
      makeSnapshot({ overdueCharges: [{ title: 'Aluguel', amount: 100, date: '2026-08-01', type: 'expense' }] }),
    )
    const overdueFactor = result.factors.find((f) => f.label === 'Sem contas atrasadas')!

    expect(overdueFactor.points).toBe(0)
    expect(overdueFactor.ok).toBe(false)
    expect(result.score).toBe(80)
  })

  it('zeroes the free-cash factor when the month is already in the red', () => {
    const result = computeHealthScore(makeSnapshot({ freeCashThisMonth: -50 }))
    const freeCashFactor = result.factors.find((f) => f.label === 'Sobra positiva este mês')!

    expect(freeCashFactor.points).toBe(0)
    expect(result.score).toBe(80)
  })

  it('caps the emergency fund score at the 6-month target instead of rewarding excess savings further', () => {
    const result = computeHealthScore(makeSnapshot({ totalSaved: 10000 }))
    const emergencyFactor = result.factors.find((f) => f.label === 'Reserva de emergência')!

    expect(emergencyFactor.points).toBe(40)
    expect(result.score).toBe(100)
  })
})
