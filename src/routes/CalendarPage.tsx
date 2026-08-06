import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { CalendarGrid } from '@/features/calendar/components/CalendarGrid'
import { DayDetailDialog } from '@/features/calendar/components/DayDetailDialog'
import { buildCalendarGrid, type CalendarDay } from '@/features/calendar/lib/buildCalendarGrid'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { formatCurrency } from '@/lib/currency'
import { formatMonthYear } from '@/lib/date'
import { cn } from '@/lib/utils'

export function CalendarPage() {
  const { data: transactions = [], isLoading } = useTransactions()
  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const days = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth, transactions, today),
    [viewYear, viewMonth, transactions, today],
  )

  const monthSummary = useMemo(() => {
    const currentMonthDays = days.filter((d) => d.isCurrentMonth)
    const income = currentMonthDays.reduce((sum, d) => sum + d.income, 0)
    const expense = currentMonthDays.reduce((sum, d) => sum + d.expense, 0)
    const pendingDays = currentMonthDays.filter((d) => d.hasPending || d.hasOverdue).length
    return { income, expense, net: income - expense, pendingDays }
  }, [days])

  function changeMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  function goToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  function handleSelectDay(day: CalendarDay) {
    setSelectedDay(day)
    setDetailOpen(true)
  }

  return (
    <AppLayout title="Calendário">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-zinc-400">
            Veja onde cada real entra e sai, dia a dia — incluindo contas fixas e parceladas futuras, já na data
            certa em que elas caem.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={goToday} className="text-zinc-400">
              Hoje
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => changeMonth(-1)} aria-label="Mês anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-28 text-center text-sm font-medium text-foreground capitalize">
              {formatMonthYear(viewMonth, viewYear)}
            </span>
            <Button type="button" variant="outline" size="icon" onClick={() => changeMonth(1)} aria-label="Próximo mês">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  <TrendingUp className="size-3.5 text-positive" />
                  Receitas do Mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedNumber value={monthSummary.income} formatter={formatCurrency} className="text-2xl font-bold text-positive" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  <TrendingDown className="size-3.5 text-destructive" />
                  Despesas do Mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedNumber value={monthSummary.expense} formatter={formatCurrency} className="text-2xl font-bold text-destructive" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  <Wallet className="size-3.5 text-primary" />
                  Saldo do Mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={monthSummary.net}
                  formatter={formatCurrency}
                  className={cn('text-2xl font-bold', monthSummary.net >= 0 ? 'text-positive' : 'text-destructive')}
                />
                {monthSummary.pendingDays > 0 && (
                  <p className="mt-1 text-xs text-zinc-400">
                    {monthSummary.pendingDays} dia{monthSummary.pendingDays > 1 ? 's' : ''} com conta pendente
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="glass-panel h-96 animate-pulse rounded-xl" />
        ) : (
          <>
            <CalendarGrid
              days={days}
              monthKey={`${viewYear}-${viewMonth}`}
              selectedIso={selectedDay?.iso ?? null}
              onSelectDay={handleSelectDay}
            />

            <div className="glass-panel flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-4 py-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-positive" /> Receita no dia
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-destructive" /> Despesa no dia
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-chart-3" /> Conta pendente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-destructive" /> Atrasada
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" /> Sombra vermelha = intensidade do gasto no dia
              </span>
            </div>
          </>
        )}
      </div>

      <DayDetailDialog day={selectedDay} open={detailOpen} onOpenChange={setDetailOpen} />
    </AppLayout>
  )
}
