import { computeCreditCardInvoices } from '@/features/accounts/lib/creditCard'
import type { Account } from '@/features/accounts/schemas/account.schema'
import { computeBudgetProgress, type BudgetProgress } from '@/features/budgets/lib/computeBudgetProgress'
import type { Budget } from '@/features/budgets/schemas/budget.schema'
import { computeCategoryTotals } from '@/features/dashboard/lib/computeCategoryTotals'
import type { Goal } from '@/features/goals/schemas/goal.schema'
import { withProjections } from '@/features/transactions/lib/projectTransactions'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { formatCurrency } from '@/lib/currency'
import { formatMonthYear } from '@/lib/date'

const MAX_CATEGORY_SLICES = 8
const MAX_RECENT_TRANSACTIONS = 15

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

export interface CategorySpend {
  category: string
  amount: number
}

export interface GoalProgress {
  name: string
  current: number
  target: number
  targetDate: string | null
}

export interface RecentTransaction {
  title: string
  amount: number
  date: string
  type: 'income' | 'expense' | 'transfer'
  category: string | null
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

  totalSaved: number
  recommendedSavings: number

  categoryBreakdown: CategorySpend[]
  budgetStatus: BudgetProgress[]
  goalsProgress: GoalProgress[]
  recentTransactions: RecentTransaction[]
}

/**
 * Turns raw accounts/transactions into defensible, pre-computed numbers. AI (insights/chat)
 * only ever phrases these facts — it never invents figures, so the math stays trustworthy.
 */
export function buildFinancialSnapshot(
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[] = [],
  goals: Goal[] = [],
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

  // Credit card purchases are never individually "due" — only the aggregated statement is,
  // on its due date. Their own dates are excluded from the per-transaction charge lists below.
  const creditCardIds = new Set(accounts.filter((a) => a.type === 'credit_card').map((a) => a.id))

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

    if (!creditCardIds.has(t.account_id)) {
      const entry: SnapshotCharge = { title: t.title, amount: t.amount, date: t.date, type: t.transaction_type }
      if (d.getTime() < todayStart) overdueCharges.push(entry)
      else if (t.date === todayIso) dueTodayCharges.push(entry)
      else upcomingCharges.push(entry)
    }

    if (t.installments_total > 1 && t.installment_current === t.installments_total) {
      endingInstallments.push({ title: t.title, amount: t.amount, installmentsTotal: t.installments_total })
    }
  }

  // Aggregated invoice per card — this is what actually has a deadline, not each individual swipe.
  for (const account of accounts) {
    if (account.type !== 'credit_card' || !account.statement_closing_day || !account.statement_due_day) continue

    const invoices = computeCreditCardInvoices(
      account.id,
      account.statement_closing_day,
      account.statement_due_day,
      transactions,
      referenceDate,
    )
    if (invoices.closed.amount <= 0) continue

    const dueDate = invoices.closed.dueDate
    const dueTime = dueDate.getTime()
    const entry: SnapshotCharge = {
      title: `Fatura ${account.name}`,
      amount: invoices.closed.amount,
      date: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`,
      type: 'expense',
    }

    if (dueTime < todayStart) overdueCharges.push(entry)
    else if (dueTime === todayStart) dueTodayCharges.push(entry)
    else if (dueTime <= periodEnd.getTime()) upcomingCharges.push(entry)
  }

  const netWorth = accounts.reduce((total, account) => {
    const balance = balances.get(account.id) ?? account.initial_balance
    return total + (account.type === 'credit_card' ? -Math.abs(balance) : balance)
  }, 0)

  const totalSaved = accounts
    .filter((account) => account.type === 'savings')
    .reduce((sum, account) => sum + (balances.get(account.id) ?? account.initial_balance), 0)

  const daysRemaining = Math.max(daysInMonth - dayOfMonth, 0)
  const projectedMonthExpenses = dayOfMonth > 0 ? (confirmedExpenses / dayOfMonth) * daysInMonth : confirmedExpenses
  // Guard against noisy early-month run-rates (e.g. rent paid on day 1 alone would otherwise look catastrophic).
  const overspendRisk = dayOfMonth >= 5 && projectedMonthExpenses > confirmedIncome + knownUpcomingIncome && confirmedExpenses > 0

  const freeCashThisMonth = confirmedIncome + knownUpcomingIncome - confirmedExpenses - knownUpcomingExpenses
  const safeToSpendPerDay = Math.max(freeCashThisMonth, 0) / Math.max(daysRemaining, 1)
  // Suggest banking a slice of income, but never more than what's actually free this month.
  const recommendedSavings = Math.min(confirmedIncome * 0.2, Math.max(freeCashThisMonth, 0))

  // Same shared function the donut chart and Budgets panel use, so the numbers the assistant
  // talks about never disagree with what's on screen.
  const categoryTotals = computeCategoryTotals(transactions, periodStart.getTime(), periodEnd.getTime())
  const categoryBreakdown: CategorySpend[] = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORY_SLICES)
    .map(([category, amount]) => ({ category, amount }))

  const budgetStatus = computeBudgetProgress(budgets, categoryTotals)

  const goalsProgress: GoalProgress[] = goals.map((goal) => ({
    name: goal.name,
    current: balances.get(goal.account_id) ?? 0,
    target: goal.target_amount,
    targetDate: goal.target_date,
  }))

  // Bounded regardless of how many years of history the user has — keeps the prompt (and cost)
  // flat over time instead of growing with the account's age.
  const recentTransactions: RecentTransaction[] = transactions
    .filter((t) => t.is_paid)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_RECENT_TRANSACTIONS)
    .map((t) => ({ title: t.title, amount: t.amount, date: t.date, type: t.transaction_type, category: t.category }))

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
    totalSaved,
    recommendedSavings,
    categoryBreakdown,
    budgetStatus,
    goalsProgress,
    recentTransactions,
  }
}

/** Renders the snapshot as a compact, readable fact sheet for an LLM prompt — no hallucination surface for numbers. */
export function snapshotToPromptFacts(snapshot: FinancialSnapshot): string {
  const lines: string[] = []

  lines.push(`Hoje: ${snapshot.today} (${snapshot.monthLabel}, dia ${snapshot.dayOfMonth} de ${snapshot.daysInMonth}, faltam ${snapshot.daysRemaining} dias para o fim do mês).`)
  lines.push(`Patrimônio líquido atual: ${formatCurrency(snapshot.netWorth)}.`)
  lines.push(`Total guardado (contas do tipo poupança): ${formatCurrency(snapshot.totalSaved)}.`)

  if (snapshot.accounts.length > 0) {
    lines.push('Contas:')
    for (const account of snapshot.accounts) {
      lines.push(`- ${account.name} (${account.type}): ${formatCurrency(account.balance)}`)
    }
  }

  lines.push(`Receitas confirmadas no mês: ${formatCurrency(snapshot.confirmedIncome)}.`)
  lines.push(`Despesas confirmadas no mês: ${formatCurrency(snapshot.confirmedExpenses)}.`)
  lines.push(`Projeção de despesa do mês no ritmo atual: ${formatCurrency(snapshot.projectedMonthExpenses)}${snapshot.overspendRisk ? ' (ACIMA da receita — risco de estourar o orçamento)' : ''}.`)
  lines.push(`Contas fixas/parceladas/faturas que ainda vêm este mês: ${formatCurrency(snapshot.knownUpcomingExpenses)}. Receitas fixas que ainda entram: ${formatCurrency(snapshot.knownUpcomingIncome)}.`)
  lines.push(`Sobra livre estimada para o resto do mês: ${formatCurrency(snapshot.freeCashThisMonth)} (~${formatCurrency(snapshot.safeToSpendPerDay)}/dia nos ${snapshot.daysRemaining} dias restantes).`)
  lines.push(`Sugestão de quanto guardar este mês: ${formatCurrency(snapshot.recommendedSavings)} (baseado em receita e sobra livre, nunca mais do que o que realmente sobra).`)

  if (snapshot.overdueCharges.length > 0) {
    lines.push('Contas/faturas ATRASADAS (data já passou, não pagas):')
    for (const c of snapshot.overdueCharges) lines.push(`- ${c.title}: ${formatCurrency(c.amount)} (venceu em ${c.date})`)
  }

  if (snapshot.dueTodayCharges.length > 0) {
    lines.push('Contas/faturas que vencem HOJE:')
    for (const c of snapshot.dueTodayCharges) lines.push(`- ${c.title}: ${formatCurrency(c.amount)}`)
  }

  if (snapshot.upcomingCharges.length > 0) {
    lines.push('Próximas contas/faturas este mês (NENHUMA delas vence hoje nem está atrasada — todas ainda têm dias pela frente):')
    for (const c of snapshot.upcomingCharges.slice(0, 8)) {
      const daysAway = Math.round((new Date(`${c.date}T00:00:00`).getTime() - new Date(`${snapshot.today}T00:00:00`).getTime()) / 86400000)
      lines.push(`- ${c.title}: ${formatCurrency(c.amount)} em ${c.date} (faltam ${daysAway} dias)`)
    }
  }

  if (snapshot.endingInstallments.length > 0) {
    lines.push('Parcelamentos terminando este mês (última parcela):')
    for (const i of snapshot.endingInstallments) {
      lines.push(`- ${i.title}: ${formatCurrency(i.amount)} (parcela ${i.installmentsTotal}/${i.installmentsTotal}, última)`)
    }
  }

  if (snapshot.categoryBreakdown.length > 0) {
    lines.push('Gasto por categoria este mês (maior primeiro):')
    for (const c of snapshot.categoryBreakdown) lines.push(`- ${c.category}: ${formatCurrency(c.amount)}`)
  }

  if (snapshot.budgetStatus.length > 0) {
    lines.push('Orçamentos por categoria que o usuário definiu (limite mensal vs. já gasto):')
    for (const b of snapshot.budgetStatus) {
      const statusLabel = b.status === 'over' ? 'ESTOUROU' : b.status === 'warning' ? 'perto do limite' : 'tranquilo'
      lines.push(`- ${b.category}: ${formatCurrency(b.spent)} de ${formatCurrency(b.limit)} (${statusLabel})`)
    }
  }

  if (snapshot.goalsProgress.length > 0) {
    lines.push('Metas de economia:')
    for (const g of snapshot.goalsProgress) {
      const percent = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0
      const dateInfo = g.targetDate ? `, prazo ${g.targetDate}` : ''
      lines.push(`- ${g.name}: ${formatCurrency(g.current)} de ${formatCurrency(g.target)} (${percent}%${dateInfo})`)
    }
  }

  if (snapshot.recentTransactions.length > 0) {
    lines.push(`Últimas ${snapshot.recentTransactions.length} transações pagas (mais recente primeiro — use isso pra responder sobre compras específicas):`)
    for (const t of snapshot.recentTransactions) {
      const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '⇄'
      lines.push(`- ${t.date} ${sign}${formatCurrency(t.amount)} ${t.title}${t.category ? ` (${t.category})` : ''}`)
    }
  }

  return lines.join('\n')
}
