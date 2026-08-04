import type { Account } from '@/features/accounts/schemas/account.schema'
import { withProjections } from '@/features/transactions/lib/projectTransactions'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { formatCurrency } from '@/lib/currency'
import { formatMonthYear } from '@/lib/date'

export interface SnapshotCharge {
  title: string
  amount: number
  date: string
  type: 'income' | 'expense'
}

export interface EndingInstallment {
  title: string
  amount: number
  installmentsTotal: number
}

export interface FinancialSnapshot {
  today: string
  monthLabel: string
  dayOfMonth: number
  daysInMonth: number
  daysRemaining: number

  netWorth: number
  accounts: { name: string; type: Account['type']; balance: number }[]

  confirmedIncome: number
  confirmedExpenses: number
  projectedMonthExpenses: number
  overspendRisk: boolean

  overdueCharges: SnapshotCharge[]
  dueTodayCharges: SnapshotCharge[]
  upcomingCharges: SnapshotCharge[]
  endingInstallments: EndingInstallment[]

  knownUpcomingExpenses: number
  knownUpcomingIncome: number
  freeCashThisMonth: number
  safeToSpendPerDay: number
}

/**
 * Turns raw accounts/transactions into defensible, pre-computed numbers. AI (insights/chat)
 * only ever phrases these facts — it never invents figures, so the math stays trustworthy.
 */
export function buildFinancialSnapshot(
  accounts: Account[],
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): FinancialSnapshot {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const periodStart = new Date(year, month, 1)
  const periodEnd = new Date(year, month + 1, 0)
  const daysInMonth = periodEnd.getDate()
  const dayOfMonth = referenceDate.getDate()
  const todayIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`
  const todayStart = new Date(year, month, dayOfMonth).getTime()

  const balances = new Map<string, number>()
  for (const account of accounts) balances.set(account.id, account.initial_balance)

  let confirmedIncome = 0
  let confirmedExpenses = 0
  let knownUpcomingExpenses = 0
  let knownUpcomingIncome = 0
  const overdueCharges: SnapshotCharge[] = []
  const dueTodayCharges: SnapshotCharge[] = []
  const upcomingCharges: SnapshotCharge[] = []
  const endingInstallments: EndingInstallment[] = []

  const expanded = withProjections(transactions, periodEnd.getTime())

  for (const t of expanded) {
    const originDelta = t.transaction_type === 'income' ? t.amount : t.transaction_type === 'expense' ? -t.amount : 0
    if (t.is_paid) {
      if (balances.has(t.account_id)) balances.set(t.account_id, (balances.get(t.account_id) ?? 0) + originDelta)
      if (t.destination_account_id && balances.has(t.destination_account_id)) {
        balances.set(t.destination_account_id, (balances.get(t.destination_account_id) ?? 0) + t.amount)
      }
    }

    const d = new Date(`${t.date}T00:00:00`)
    if (d.getTime() < periodStart.getTime() || d.getTime() > periodEnd.getTime()) continue
    if (t.transaction_type === 'transfer') continue

    if (t.is_paid) {
      if (t.transaction_type === 'income') confirmedIncome += t.amount
      else confirmedExpenses += t.amount
      continue
    }

    const isRecurringLike = t.recurrence === 'fixed' || t.installments_total > 1
    if (!isRecurringLike) continue

    if (t.transaction_type === 'income') knownUpcomingIncome += t.amount
    else knownUpcomingExpenses += t.amount

    const entry: SnapshotCharge = { title: t.title, amount: t.amount, date: t.date, type: t.transaction_type }
    if (d.getTime() < todayStart) overdueCharges.push(entry)
    else if (t.date === todayIso) dueTodayCharges.push(entry)
    else upcomingCharges.push(entry)

    if (t.installments_total > 1 && t.installment_current === t.installments_total) {
      endingInstallments.push({ title: t.title, amount: t.amount, installmentsTotal: t.installments_total })
    }
  }

  const netWorth = accounts.reduce((total, account) => {
    const balance = balances.get(account.id) ?? account.initial_balance
    return total + (account.type === 'credit_card' ? -Math.abs(balance) : balance)
  }, 0)

  const daysRemaining = Math.max(daysInMonth - dayOfMonth, 0)
  const projectedMonthExpenses = dayOfMonth > 0 ? (confirmedExpenses / dayOfMonth) * daysInMonth : confirmedExpenses
  // Guard against noisy early-month run-rates (e.g. rent paid on day 1 alone would otherwise look catastrophic).
  const overspendRisk = dayOfMonth >= 5 && projectedMonthExpenses > confirmedIncome + knownUpcomingIncome && confirmedExpenses > 0

  const freeCashThisMonth = confirmedIncome + knownUpcomingIncome - confirmedExpenses - knownUpcomingExpenses
  const safeToSpendPerDay = Math.max(freeCashThisMonth, 0) / Math.max(daysRemaining, 1)

  return {
    today: todayIso,
    monthLabel: formatMonthYear(month, year),
    dayOfMonth,
    daysInMonth,
    daysRemaining,
    netWorth,
    accounts: accounts.map((account) => ({
      name: account.name,
      type: account.type,
      balance: balances.get(account.id) ?? account.initial_balance,
    })),
    confirmedIncome,
    confirmedExpenses,
    projectedMonthExpenses,
    overspendRisk,
    overdueCharges,
    dueTodayCharges,
    upcomingCharges: upcomingCharges.sort((a, b) => a.date.localeCompare(b.date)),
    endingInstallments,
    knownUpcomingExpenses,
    knownUpcomingIncome,
    freeCashThisMonth,
    safeToSpendPerDay,
  }
}

/** Renders the snapshot as a compact, readable fact sheet for an LLM prompt — no hallucination surface for numbers. */
export function snapshotToPromptFacts(snapshot: FinancialSnapshot): string {
  const lines: string[] = []

  lines.push(`Hoje: ${snapshot.today} (${snapshot.monthLabel}, dia ${snapshot.dayOfMonth} de ${snapshot.daysInMonth}, faltam ${snapshot.daysRemaining} dias para o fim do mês).`)
  lines.push(`Patrimônio líquido atual: ${formatCurrency(snapshot.netWorth)}.`)

  if (snapshot.accounts.length > 0) {
    lines.push('Contas:')
    for (const account of snapshot.accounts) {
      lines.push(`- ${account.name} (${account.type}): ${formatCurrency(account.balance)}`)
    }
  }

  lines.push(`Receitas confirmadas no mês: ${formatCurrency(snapshot.confirmedIncome)}.`)
  lines.push(`Despesas confirmadas no mês: ${formatCurrency(snapshot.confirmedExpenses)}.`)
  lines.push(`Projeção de despesa do mês no ritmo atual: ${formatCurrency(snapshot.projectedMonthExpenses)}${snapshot.overspendRisk ? ' (ACIMA da receita — risco de estourar o orçamento)' : ''}.`)
  lines.push(`Contas fixas/parceladas que ainda vêm este mês: ${formatCurrency(snapshot.knownUpcomingExpenses)}. Receitas fixas que ainda entram: ${formatCurrency(snapshot.knownUpcomingIncome)}.`)
  lines.push(`Sobra livre estimada para o resto do mês: ${formatCurrency(snapshot.freeCashThisMonth)} (~${formatCurrency(snapshot.safeToSpendPerDay)}/dia nos ${snapshot.daysRemaining} dias restantes).`)

  if (snapshot.overdueCharges.length > 0) {
    lines.push('Contas fixas/parceladas ATRASADAS (data já passou, não marcadas como pagas):')
    for (const c of snapshot.overdueCharges) lines.push(`- ${c.title}: ${formatCurrency(c.amount)} (venceu em ${c.date})`)
  }

  if (snapshot.dueTodayCharges.length > 0) {
    lines.push('Contas que vencem HOJE:')
    for (const c of snapshot.dueTodayCharges) lines.push(`- ${c.title}: ${formatCurrency(c.amount)}`)
  }

  if (snapshot.upcomingCharges.length > 0) {
    lines.push('Próximas contas fixas/parceladas este mês:')
    for (const c of snapshot.upcomingCharges.slice(0, 8)) lines.push(`- ${c.title}: ${formatCurrency(c.amount)} em ${c.date}`)
  }

  if (snapshot.endingInstallments.length > 0) {
    lines.push('Parcelamentos terminando este mês (última parcela):')
    for (const i of snapshot.endingInstallments) {
      lines.push(`- ${i.title}: ${formatCurrency(i.amount)} (parcela ${i.installmentsTotal}/${i.installmentsTotal}, última)`)
    }
  }

  return lines.join('\n')
}
