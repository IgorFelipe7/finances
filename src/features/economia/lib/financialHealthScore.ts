import type { FinancialSnapshot } from '@/features/dashboard/lib/buildFinancialSnapshot'

export interface HealthScoreFactor {
  label: string
  points: number
  maxPoints: number
  ok: boolean
  detail: string
}

export interface HealthScoreBreakdown {
  score: number
  emergencyFundMonths: number
  monthlyExpenseEstimate: number
  factors: HealthScoreFactor[]
}

const EMERGENCY_FUND_TARGET_MONTHS = 6

/**
 * A 0-100 composite from facts already in the snapshot — no new data collected, nothing
 * fabricated. Weighted toward the emergency fund (the single biggest lever for resilience),
 * with the rest split across staying current on bills, not overspending, and a positive
 * month. Recalculates fresh every time the underlying data changes — no separate "trend"
 * tracking needed for it to feel alive.
 */
export function computeHealthScore(snapshot: FinancialSnapshot): HealthScoreBreakdown {
  const monthlyExpenseEstimate = Math.max(snapshot.confirmedExpenses + snapshot.knownUpcomingExpenses, 1)
  const emergencyFundMonths = snapshot.totalSaved / monthlyExpenseEstimate
  const emergencyFundCoverage = Math.min(emergencyFundMonths / EMERGENCY_FUND_TARGET_MONTHS, 1)
  const emergencyFundPoints = Math.round(emergencyFundCoverage * 40)

  const hasOverdue = snapshot.overdueCharges.length > 0
  const noOverduePoints = hasOverdue ? 0 : 20

  const noOverspendPoints = snapshot.overspendRisk ? 0 : 20

  const hasPositiveFreeCash = snapshot.freeCashThisMonth >= 0
  const positiveFreeCashPoints = hasPositiveFreeCash ? 20 : 0

  const factors: HealthScoreFactor[] = [
    {
      label: 'Reserva de emergência',
      points: emergencyFundPoints,
      maxPoints: 40,
      ok: emergencyFundMonths >= EMERGENCY_FUND_TARGET_MONTHS,
      detail: `${emergencyFundMonths.toFixed(1)} de ${EMERGENCY_FUND_TARGET_MONTHS} meses de despesas cobertos`,
    },
    {
      label: 'Sem contas atrasadas',
      points: noOverduePoints,
      maxPoints: 20,
      ok: !hasOverdue,
      detail: hasOverdue ? `${snapshot.overdueCharges.length} conta(s) atrasada(s)` : 'Tudo em dia',
    },
    {
      label: 'Ritmo de gasto sob controle',
      points: noOverspendPoints,
      maxPoints: 20,
      ok: !snapshot.overspendRisk,
      detail: snapshot.overspendRisk ? 'Projeção acima da receita do mês' : 'Dentro do esperado',
    },
    {
      label: 'Sobra positiva este mês',
      points: positiveFreeCashPoints,
      maxPoints: 20,
      ok: hasPositiveFreeCash,
      detail: hasPositiveFreeCash ? 'Sobrando dinheiro este mês' : 'Contas superam a renda este mês',
    },
  ]

  return {
    score: emergencyFundPoints + noOverduePoints + noOverspendPoints + positiveFreeCashPoints,
    emergencyFundMonths,
    monthlyExpenseEstimate,
    factors,
  }
}
