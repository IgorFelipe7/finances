import { ArrowDown, ArrowUp, DotsThree, TrendUp } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { Button } from '@/components/ui/button'
import { Skeleton, SkeletonPanel } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Best-effort display name from an email handle — "igor.felps@x.com" -> "Igor",
 * "igorfelps17@x.com" -> "Igorfelps". A greeting needs a name and the handle is all we
 * store. Takes the part before any separator, drops trailing digits, and returns null if
 * what's left is too short to plausibly be a name, so the caller can fall back.
 */
function firstNameFromEmail(email: string | undefined) {
  const handle = email?.split('@')[0]?.split(/[._+-]/)[0]?.replace(/\d+$/, '')
  if (!handle || handle.length < 3) return null
  return handle.charAt(0).toUpperCase() + handle.slice(1).toLowerCase()
}

/**
 * Splits formatted currency into the leading part and the decimal tail, so the cents can
 * be dimmed. Works off the formatter's own output rather than re-formatting, which keeps
 * the "hide values" masking intact — a masked string simply has no separator to split on.
 */
function splitCents(formatted: string) {
  const index = formatted.lastIndexOf(',')
  if (index === -1) return { main: formatted, cents: null }
  return { main: formatted.slice(0, index), cents: formatted.slice(index) }
}

export function RevenueHero() {
  const { netWorth, projectedNetWorth, monthlyIncome, monthlyExpenses, isLoading } = useAccountBalances()
  const { formatMoney } = useMoneyFormatter()
  const email = useAuthStore((state) => state.user?.email)
  const reduceMotion = useUIPreferencesStore((state) => state.reduceMotion)

  if (isLoading) {
    return (
      <SkeletonPanel label="Carregando resumo" className="space-y-5">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-14 w-80 max-w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </SkeletonPanel>
    )
  }

  const name = firstNameFromEmail(email)
  const { main, cents } = splitCents(formatMoney(netWorth))
  // Month-over-month movement expressed against income, which is the only baseline
  // available here that isn't zero for a brand-new account.
  const net = monthlyIncome - monthlyExpenses
  const deltaPercent = monthlyIncome > 0 ? (net / monthlyIncome) * 100 : null

  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } }

  return (
    <motion.div {...motionProps}>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Bem-vindo de volta,{' '}
        <span className="text-muted-foreground">{name ?? 'por aqui'}</span>
      </h1>

      <p className="mt-6 text-xs font-medium tracking-wider text-muted-foreground uppercase">Patrimônio total</p>

      <div className="mt-1.5 flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className={cn('num text-5xl font-semibold tracking-tight sm:text-6xl', netWorth < 0 ? 'text-destructive' : 'text-foreground')}>
          {main}
          {cents && <span className="text-muted-foreground">{cents}</span>}
        </p>

        {deltaPercent !== null && (
          <span
            className={cn(
              'num mb-1.5 inline-flex items-center gap-0.5 text-sm font-medium',
              net >= 0 ? 'text-positive' : 'text-destructive',
            )}
          >
            <TrendUp className={cn('size-3.5', net < 0 && 'rotate-180')} weight="bold" />
            {net >= 0 ? '+' : ''}
            {deltaPercent.toFixed(2)}%
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Projetado para o fim do mês:{' '}
        <span className="num font-medium text-foreground">{formatMoney(projectedNetWorth)}</span>
      </p>

      <div className="mt-5 flex items-center gap-2">
        <TransactionFormDialog
          initialValues={{ transaction_type: 'income' }}
          trigger={
            <Button type="button" className="h-10 gap-1.5 rounded-full px-5">
              Receber
              <ArrowDown className="size-4" weight="bold" />
            </Button>
          }
        />
        <TransactionFormDialog
          initialValues={{ transaction_type: 'expense' }}
          trigger={
            <Button type="button" variant="outline" className="h-10 gap-1.5 rounded-full px-5">
              Pagar
              <ArrowUp className="size-4" weight="bold" />
            </Button>
          }
        />
        <Button type="button" variant="outline" size="icon" className="size-10 rounded-full" aria-label="Mais ações">
          <DotsThree className="size-5" weight="bold" />
        </Button>
      </div>
    </motion.div>
  )
}
