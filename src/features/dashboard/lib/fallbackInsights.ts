import type { FinancialSnapshot } from '@/features/dashboard/lib/buildFinancialSnapshot'
import type { Insight } from '@/features/dashboard/schemas/insight.schema'
import { formatCurrency } from '@/lib/currency'

/** Deterministic, no-AI insight generator — used when the OpenAI call fails or no key is configured, so the panel never breaks. */
export function buildFallbackInsights(snapshot: FinancialSnapshot): Insight[] {
  const insights: Insight[] = []

  for (const charge of snapshot.overdueCharges.slice(0, 2)) {
    insights.push({
      tone: 'danger',
      headline: 'Conta atrasada',
      message: `"${charge.title}" venceu em ${charge.date} (${formatCurrency(charge.amount)}) e ainda não foi paga.`,
    })
  }

  if (snapshot.dueTodayCharges.length > 0) {
    const total = snapshot.dueTodayCharges.reduce((sum, c) => sum + c.amount, 0)
    const names = snapshot.dueTodayCharges.map((c) => `"${c.title}"`).join(', ')
    insights.push({
      tone: 'warning',
      headline: 'Vence hoje',
      message: `Hoje é dia de pagar ${names} — total de ${formatCurrency(total)}.`,
    })
  }

  if (snapshot.freeCashThisMonth < 0) {
    insights.push({
      tone: 'danger',
      headline: 'Sobra no vermelho',
      message: `As contas que ainda faltam este mês (${formatCurrency(snapshot.knownUpcomingExpenses)}) pesam mais que o que ainda entra. Fique de olho.`,
    })
  } else if (snapshot.overspendRisk) {
    insights.push({
      tone: 'warning',
      headline: 'Ritmo de gasto alto',
      message: `No ritmo atual, você deve fechar o mês gastando ${formatCurrency(snapshot.projectedMonthExpenses)} — acima do que entrou até agora. Vale segurar um pouco.`,
    })
  }

  for (const installment of snapshot.endingInstallments.slice(0, 2)) {
    insights.push({
      tone: 'success',
      headline: 'Última parcela',
      message: `Esse é o último mês de "${installment.title}" (${formatCurrency(installment.amount)}). Depois disso, esse valor libera no orçamento.`,
    })
  }

  if (snapshot.daysRemaining > 0) {
    insights.push({
      tone: 'info',
      headline: 'Quanto dá pra gastar',
      message: `Sobram cerca de ${formatCurrency(snapshot.safeToSpendPerDay)}/dia pelos próximos ${snapshot.daysRemaining} dias sem comprometer as contas fixas.`,
    })
  }

  if (snapshot.recommendedSavings > 0) {
    insights.push({
      tone: 'success',
      headline: 'Quanto guardar',
      message: `Dá pra guardar cerca de ${formatCurrency(snapshot.recommendedSavings)} este mês sem comprometer as contas. Você já tem ${formatCurrency(snapshot.totalSaved)} guardado.`,
    })
  }

  if (insights.length === 0) {
    insights.push({
      tone: 'info',
      headline: 'Tudo em dia',
      message: 'Nenhuma conta pendente ou atrasada por enquanto. Continue registrando para manter a previsão precisa.',
    })
  }

  return insights.slice(0, 6)
}
