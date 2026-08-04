import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Account } from '@/features/accounts/schemas/account.schema'
import { SavingsUpdateDialog } from '@/features/accounts/components/SavingsUpdateDialog'
import { useDeactivateGoal } from '@/features/goals/hooks/useGoalMutations'
import type { Goal } from '@/features/goals/schemas/goal.schema'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

function formatTargetDate(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function GoalCard({ goal, account, balance, index }: { goal: Goal; account: Account; balance: number; index: number }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deactivateGoal = useDeactivateGoal()

  const progress = Math.min(Math.max(balance, 0) / goal.target_amount, 1)
  const isComplete = balance >= goal.target_amount
  const daysLeft = goal.target_date
    ? Math.ceil((new Date(`${goal.target_date}T00:00:00`).getTime() - Date.now()) / 86400000)
    : null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
      <Card className="h-full border border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: goal.color }} />
            <span className="truncate">{goal.name}</span>
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-zinc-500 hover:text-foreground" aria-label="Opções da meta">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Remover meta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <AnimatedNumber value={balance} formatter={formatCurrency} className="text-xl font-bold text-foreground" />
            <span className="shrink-0 text-xs text-zinc-400">de {formatCurrency(goal.target_amount)}</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: goal.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className={cn(isComplete && 'flex items-center gap-1 text-positive')}>
              {isComplete && <CheckCircle2 className="size-3.5" />}
              {(progress * 100).toFixed(0)}% completo
            </span>
            {goal.target_date && (
              <span>{daysLeft !== null && daysLeft >= 0 ? `${daysLeft} dias restantes` : formatTargetDate(goal.target_date)}</span>
            )}
          </div>

          <SavingsUpdateDialog
            accounts={[account]}
            balancesByAccountId={new Map([[account.id, balance]])}
            trigger={
              <Button type="button" size="sm" variant="secondary" className="w-full gap-1.5">
                <Plus className="size-3.5" />
                Guardar
              </Button>
            }
          />
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover "{goal.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              A meta é removida, mas a conta e o dinheiro já guardado continuam existindo normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deactivateGoal.isPending}
              onClick={() => deactivateGoal.mutate(goal.id, { onSuccess: () => setDeleteOpen(false) })}
            >
              {deactivateGoal.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
