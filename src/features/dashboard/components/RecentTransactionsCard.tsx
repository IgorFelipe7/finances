import { ArrowUpRight, Receipt } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Skeleton, SkeletonPanel } from '@/components/ui/skeleton'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { cn } from '@/lib/utils'

const LIMIT = 6

const CATEGORY_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-4)']

/** Stable colour per category name — same label always gets the same dot across renders. */
function colorForCategory(category: string) {
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length]
}

export function RecentTransactionsCard() {
  const { data: transactions = [], isLoading } = useTransactions()
  const { formatMoney } = useMoneyFormatter()

  if (isLoading) {
    return (
      <SkeletonPanel label="Carregando transações recentes" className="surface-panel h-full rounded-xl p-5">
        <Skeleton className="h-4 w-44" />
        <div className="mt-5 space-y-3.5">
          {Array.from({ length: LIMIT }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28 max-w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3.5 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    )
  }

  const recent = transactions.slice(0, LIMIT)

  return (
    <div className="surface-panel flex h-full flex-col rounded-xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Receipt className="size-4 text-primary" weight="duotone" />
          Transações recentes
        </h3>
        <Link
          to="/transactions"
          className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver todas
          <ArrowUpRight className="size-3.5" weight="bold" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-8 text-center">
          <p className="text-sm font-medium text-foreground">Nenhuma transação ainda</p>
          <p className="text-xs text-muted-foreground">O que você lançar aparece aqui.</p>
        </div>
      ) : (
        <ul className="mt-4 flex-1 divide-y divide-border">
          {recent.map((transaction) => {
            const category = transaction.category ?? 'Outros'
            const isIncome = transaction.transaction_type === 'income'

            return (
              <li key={transaction.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{transaction.title}</p>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colorForCategory(category) }}
                    />
                    <span className="truncate">{category}</span>
                  </span>
                </div>

                <span
                  className={cn(
                    'num shrink-0 text-sm font-medium',
                    isIncome ? 'text-positive' : 'text-foreground',
                  )}
                >
                  {isIncome ? '+' : '-'}
                  {formatMoney(transaction.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
