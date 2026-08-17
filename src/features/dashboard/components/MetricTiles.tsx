import { ArrowsDownUp, Wallet } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { MetricTileSkeleton } from '@/features/dashboard/components/PanelSkeletons'
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { cn } from '@/lib/utils'

/*
 * Secondary metric tiles. The headline net-worth figure lives in RevenueHero, unboxed —
 * these carry the supporting detail and are exported individually so the page grid can
 * place them at whatever width it needs.
 *
 * Every figure carries the `num` utility: mono, tabular digits, so a column of money
 * never shifts horizontally as values animate or refresh.
 */

function useTileMotion(index: number) {
  const reduceMotion = useUIPreferencesStore((state) => state.reduceMotion)
  if (reduceMotion) return {}
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] as const },
  }
}

function TileLabel({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
      {icon}
      {children}
    </p>
  )
}

export function IncomeExpenseTile({ index = 0 }: { index?: number }) {
  const { monthlyIncome, monthlyExpenses, isLoading } = useAccountBalances()
  const { formatMoney } = useMoneyFormatter()
  const motionProps = useTileMotion(index)

  if (isLoading) return <MetricTileSkeleton lines={2} label="Carregando receitas e despesas" />

  const net = monthlyIncome - monthlyExpenses
  // Share of the month's larger side, so the bar reads as a ratio between the two
  // rather than against an arbitrary ceiling.
  const peak = Math.max(monthlyIncome, monthlyExpenses, 1)

  return (
    <motion.div {...motionProps} className="surface-panel flex h-full flex-col gap-4 rounded-xl p-5">
      <TileLabel icon={<ArrowsDownUp className="size-3.5 text-primary" weight="bold" />}>Receitas vs Despesas</TileLabel>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-muted-foreground">Receitas</span>
            <span className="text-sm font-semibold num text-positive">{formatMoney(monthlyIncome)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-positive" style={{ width: `${(monthlyIncome / peak) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-muted-foreground">Despesas</span>
            <span className="text-sm font-semibold num text-destructive">{formatMoney(monthlyExpenses)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-destructive" style={{ width: `${(monthlyExpenses / peak) * 100}%` }} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">Saldo do mês</span>
          <span className={cn('text-sm font-semibold num', net >= 0 ? 'text-positive' : 'text-destructive')}>
            {formatMoney(net)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function AccountsTile({ index = 1 }: { index?: number }) {
  const { accountBalances, isLoading } = useAccountBalances()
  const { formatMoney } = useMoneyFormatter()
  const motionProps = useTileMotion(index)

  if (isLoading) return <MetricTileSkeleton lines={3} label="Carregando contas" />

  return (
    <motion.div {...motionProps} className="surface-panel flex h-full flex-col gap-4 rounded-xl p-5">
      <TileLabel icon={<Wallet className="size-3.5 text-primary" weight="duotone" />}>Contas</TileLabel>

      {accountBalances.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
      ) : (
        <ul className="space-y-1">
          {accountBalances.map(({ account, balance }) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-3 rounded-lg px-1 py-1 text-sm transition-colors hover:bg-accent/60"
            >
              <span className="flex min-w-0 items-center gap-2 text-foreground">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: account.color }} />
                <span className="truncate">{account.name}</span>
              </span>
              <span
                className={cn(
                  'shrink-0 font-medium num',
                  balance < 0 ? 'text-destructive' : 'text-foreground',
                )}
              >
                {formatMoney(balance)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
