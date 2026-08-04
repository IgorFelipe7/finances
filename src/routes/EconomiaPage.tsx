import { motion } from 'framer-motion'
import { Check, PiggyBank, RotateCw, Shield, Sparkles, Target, X } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { useFinancialSnapshot } from '@/features/dashboard/hooks/useFinancialSnapshot'
import { HealthScoreGauge } from '@/features/economia/components/HealthScoreGauge'
import { TipsGrid } from '@/features/economia/components/TipsGrid'
import { useSavingsCoachTip } from '@/features/economia/hooks/useSavingsCoachTip'
import { computeHealthScore } from '@/features/economia/lib/financialHealthScore'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

function FactorRow({ label, detail, points, maxPoints, ok }: { label: string; detail: string; points: number; maxPoints: number; ok: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', ok ? 'bg-positive/15 text-positive' : 'bg-white/5 text-zinc-500')}>
        {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{label}</p>
        <p className="truncate text-xs text-zinc-400">{detail}</p>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-zinc-400">
        {points}/{maxPoints}
      </span>
    </div>
  )
}

export function EconomiaPage() {
  const { snapshot, isLoading } = useFinancialSnapshot()
  const { tip, isLoading: tipLoading, isFetching: tipFetching, refetch: refetchTip } = useSavingsCoachTip()

  if (isLoading) {
    return (
      <AppLayout title="Economia">
        <div className="space-y-4">
          <div className="glass-panel h-56 animate-pulse rounded-xl" />
          <div className="glass-panel h-32 animate-pulse rounded-xl" />
        </div>
      </AppLayout>
    )
  }

  const health = computeHealthScore(snapshot)
  const savingsGoalMonthly = snapshot.confirmedIncome * 0.2
  const savingsGoalProgress = savingsGoalMonthly > 0 ? Math.min(snapshot.recommendedSavings / savingsGoalMonthly, 1) : 0
  const emergencyFundProgress = Math.min(health.emergencyFundMonths / 6, 1)

  return (
    <AppLayout title="Economia">
      <div className="space-y-6">
        <p className="max-w-2xl text-sm text-zinc-400">
          Sua saúde financeira calculada a partir dos seus números reais, mais dicas práticas de economia e
          investimento pra você aplicar no seu ritmo.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel flex flex-col items-center gap-6 rounded-xl p-6 sm:flex-row sm:items-start"
        >
          <HealthScoreGauge score={health.score} />
          <div className="w-full flex-1 space-y-3">
            <div>
              <h2 className="text-sm font-medium text-foreground">Saúde Financeira</h2>
              <p className="text-xs text-zinc-400">Recalculada em tempo real a partir das suas contas e despesas.</p>
            </div>
            <div className="space-y-2.5">
              {health.factors.map((factor) => (
                <FactorRow key={factor.label} {...factor} />
              ))}
            </div>
          </div>
        </motion.div>

        {!tipLoading && tip && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="glass-panel relative flex items-start gap-4 overflow-hidden rounded-xl p-5 ring-1 ring-primary/25"
          >
            <span className="absolute inset-y-0 left-0 w-1 bg-primary" />
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">{tip.headline}</p>
              <p className="mt-1 text-sm text-zinc-300">{tip.message}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-zinc-500 hover:text-foreground"
              onClick={() => refetchTip()}
              disabled={tipFetching}
              aria-label="Gerar outra dica"
            >
              <RotateCw className={cn('size-3.5', tipFetching && 'animate-spin')} />
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass-panel space-y-3 rounded-xl p-5"
          >
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Shield className="size-4 text-primary" />
              Reserva de Emergência
            </h3>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(snapshot.totalSaved)}</p>
            <p className="text-xs text-zinc-400">
              {health.emergencyFundMonths.toFixed(1)} de 6 meses de despesas cobertos (~
              {formatCurrency(health.monthlyExpenseEstimate)}/mês)
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${emergencyFundProgress * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              A recomendação padrão é guardar de 3 a 6 meses de despesas em algo de baixo risco e resgate rápido
              (ex: Tesouro Selic ou CDB com liquidez diária) antes de investir em renda variável.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="glass-panel space-y-3 rounded-xl p-5"
          >
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Target className="size-4 text-primary" />
              Meta 20% (regra 50/30/20)
            </h3>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(snapshot.recommendedSavings)}</p>
            <p className="text-xs text-zinc-400">
              de uma meta de {formatCurrency(savingsGoalMonthly)}/mês (20% da sua renda confirmada)
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${savingsGoalProgress * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              A regra 50/30/20 sugere 50% da renda pra necessidades, 30% pra desejos e 20% pra reserva/investimento
              — é um ponto de partida flexível, não uma lei fixa.
            </p>
          </motion.div>
        </div>

        <TipsGrid />

        <div className="glass-panel flex items-start gap-2.5 rounded-xl p-4 text-xs text-zinc-500">
          <PiggyBank className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Conteúdo educativo geral — não é recomendação de investimento personalizada. Para decisões específicas,
            consulte um profissional licenciado.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
