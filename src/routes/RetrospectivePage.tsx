import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { ChevronLeft, ChevronRight, PartyPopper, Receipt, Sparkles, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { computeMonthlyRetrospective, computeYearlyRetrospective } from '@/features/dashboard/lib/computeRetrospective'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { cn } from '@/lib/utils'

type Period = 'month' | 'year'

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  index,
}: {
  icon: typeof Trophy
  label: string
  value: string
  detail?: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.06 }}
    >
      <Card className="glass-panel h-full">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <Icon className="size-3.5 text-primary" />
            {label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="truncate text-xl font-bold text-foreground">{value}</p>
          {detail && <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MonthlyBarTooltip({ active, payload, label }: TooltipContentProps) {
  const { formatMoney } = useMoneyFormatter()
  if (!active || !payload?.length) return null
  const income = payload.find((entry) => entry.dataKey === 'income')?.value ?? 0
  const expense = payload.find((entry) => entry.dataKey === 'expense')?.value ?? 0

  return (
    <div className="min-w-40 rounded-lg border border-border bg-popover p-3 text-xs shadow-2xl backdrop-blur-xl">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      <p className="text-positive">Receitas: {formatMoney(Number(income))}</p>
      <p className="text-destructive">Despesas: {formatMoney(Number(expense))}</p>
    </div>
  )
}

export function RetrospectivePage() {
  const { data: transactions = [], isLoading } = useTransactions()
  const { formatMoney, formatMoneyCompact } = useMoneyFormatter()
  const [period, setPeriod] = useState<Period>('month')
  const [year, setYear] = useState(() => new Date().getFullYear())

  const monthly = useMemo(() => computeMonthlyRetrospective(transactions), [transactions])
  const yearly = useMemo(() => computeYearlyRetrospective(transactions, year), [transactions, year])

  const stats = period === 'month' ? monthly : yearly
  const netIsPositive = stats.net >= 0

  return (
    <AppLayout title="Retrospectiva">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-muted-foreground">
            Um resumo do seu período — maior categoria, maior gasto, e como esse período se compara.
          </p>

          <div className="flex items-center gap-2">
            {period === 'year' && (
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setYear((y) => y - 1)} aria-label="Ano anterior">
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="w-12 text-center text-sm font-medium text-foreground">{year}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setYear((y) => Math.min(y + 1, new Date().getFullYear()))}
                  disabled={year >= new Date().getFullYear()}
                  aria-label="Próximo ano"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList>
                <TabsTrigger value="month">Este mês</TabsTrigger>
                <TabsTrigger value="year">Este ano</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isLoading ? (
          <div className="glass-panel h-64 animate-pulse rounded-xl" />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={cn(
                'glass-panel relative overflow-hidden rounded-xl p-6 text-center ring-1 sm:p-10',
                netIsPositive ? 'ring-positive/25' : 'ring-destructive/25',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none absolute inset-x-0 top-0 h-40 blur-3xl',
                  netIsPositive ? 'bg-positive/10' : 'bg-destructive/10',
                )}
              />
              <span className="relative flex items-center justify-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <Sparkles className="size-3.5 text-primary" />
                {period === 'month' ? monthly.periodLabel : yearly.periodLabel}
              </span>
              <p
                className={cn(
                  'relative mt-2 text-4xl font-bold tabular-nums sm:text-5xl',
                  netIsPositive ? 'text-positive' : 'text-destructive',
                )}
              >
                {netIsPositive ? '+' : ''}
                {formatMoney(stats.net)}
              </p>
              <p className="relative mt-2 text-sm text-muted-foreground">
                {netIsPositive ? 'guardado / sobrando no período' : 'a mais gasto do que entrou no período'}
              </p>

              {period === 'month' && monthly.expenseChangePercent !== null && (
                <p
                  className={cn(
                    'relative mt-4 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium',
                    monthly.expenseChangePercent <= 0
                      ? 'border-positive/30 text-positive'
                      : 'border-destructive/30 text-destructive',
                  )}
                >
                  {monthly.expenseChangePercent <= 0 ? (
                    <TrendingDown className="size-3.5" />
                  ) : (
                    <TrendingUp className="size-3.5" />
                  )}
                  {Math.abs(monthly.expenseChangePercent).toFixed(0)}%{' '}
                  {monthly.expenseChangePercent <= 0 ? 'menos gasto' : 'mais gasto'} que o mês anterior
                </p>
              )}
            </motion.div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={TrendingUp} label="Receitas" value={formatMoney(stats.totalIncome)} index={0} />
              <StatCard icon={TrendingDown} label="Despesas" value={formatMoney(stats.totalExpenses)} index={1} />
              <StatCard
                icon={Trophy}
                label="Categoria Campeã"
                value={stats.topCategory?.name ?? '—'}
                detail={stats.topCategory ? formatMoney(stats.topCategory.amount) : undefined}
                index={2}
              />
              <StatCard
                icon={Receipt}
                label="Maior Gasto Único"
                value={stats.biggestExpense ? formatMoney(stats.biggestExpense.amount) : '—'}
                detail={stats.biggestExpense?.title}
                index={3}
              />
            </div>

            {period === 'year' && (yearly.bestMonth || yearly.toughestMonth) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {yearly.bestMonth && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
                    <Card className="border border-positive/20 bg-card/80 backdrop-blur-xl">
                      <CardHeader>
                        <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-positive uppercase">
                          <PartyPopper className="size-3.5" />
                          Melhor mês
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{yearly.bestMonth.label}</p>
                        <p className="text-sm text-positive">+{formatMoney(yearly.bestMonth.net)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                {yearly.toughestMonth && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.36 }}>
                    <Card className="border border-destructive/20 bg-card/80 backdrop-blur-xl">
                      <CardHeader>
                        <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-destructive uppercase">
                          <TrendingDown className="size-3.5" />
                          Mês mais apertado
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold text-foreground">{yearly.toughestMonth.label}</p>
                        <p className="text-sm text-destructive">{formatMoney(yearly.toughestMonth.net)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}

            {period === 'year' && (
              <div className="glass-panel rounded-xl p-5">
                <h3 className="mb-4 text-sm font-medium text-foreground">Receitas vs Despesas — {year}</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearly.monthlyBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={48}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        tickFormatter={(value) => formatMoneyCompact(Number(value))}
                      />
                      <Tooltip content={MonthlyBarTooltip} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
                      <Bar dataKey="income" fill="var(--positive)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expense" fill="var(--destructive)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
