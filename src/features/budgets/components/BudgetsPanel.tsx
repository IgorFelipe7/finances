import { motion } from 'framer-motion'
import { AlertTriangle, Trash2, Wallet2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BudgetFormDialog } from '@/features/budgets/components/BudgetFormDialog'
import { useDeleteBudget } from '@/features/budgets/hooks/useBudgetMutations'
import { useBudgetProgress } from '@/features/budgets/hooks/useBudgetProgress'
import type { BudgetProgress } from '@/features/budgets/lib/computeBudgetProgress'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<BudgetProgress['status'], { bar: string; text: string }> = {
  ok: { bar: 'bg-primary', text: 'text-zinc-400' },
  warning: { bar: 'bg-chart-3', text: 'text-chart-3' },
  over: { bar: 'bg-destructive', text: 'text-destructive' },
}

function BudgetRow({ budget, index }: { budget: BudgetProgress; index: number }) {
  const deleteBudget = useDeleteBudget()
  const style = STATUS_STYLES[budget.status]
  const barWidth = Math.min(budget.percent, 1) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group space-y-2 rounded-lg px-1 py-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm text-foreground">
          {budget.status === 'over' && <AlertTriangle className="size-3.5 shrink-0 text-destructive" />}
          {budget.category}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs tabular-nums', style.text)}>
            {formatCurrency(budget.spent)} <span className="text-zinc-500">/ {formatCurrency(budget.limit)}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
            onClick={() => deleteBudget.mutate(budget.id)}
            aria-label={`Remover orçamento de ${budget.category}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={cn('h-full rounded-full', style.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

export function BudgetsPanel() {
  const { progress, isLoading } = useBudgetProgress()

  if (isLoading) return <div className="glass-panel h-40 animate-pulse rounded-xl" />

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Wallet2 className="size-4 text-primary" />
          Orçamentos por Categoria
        </h3>
        <BudgetFormDialog trigger={<Button type="button" variant="ghost" size="sm">+ Definir</Button>} />
      </div>

      {progress.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          Nenhum orçamento definido. Escolha uma categoria e um limite mensal pra acompanhar.
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {progress.map((budget, index) => (
            <BudgetRow key={budget.id} budget={budget} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
