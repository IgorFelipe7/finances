import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Ban,
  CalendarClock,
  CircleDollarSign,
  MoreVertical,
  Pencil,
  Repeat,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { AppLayout } from '@/components/layout/AppLayout'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { TRANSACTION_TYPE_META } from '@/features/transactions/constants'
import { EditFixedTransactionDialog } from '@/features/transactions/components/EditFixedTransactionDialog'
import { PayTransactionDialog } from '@/features/transactions/components/PayTransactionDialog'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'
import { useCancelRecurrence } from '@/features/transactions/hooks/useTransactionMutations'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import type { Transaction } from '@/features/transactions/schemas/transaction.schema'
import { formatCurrency } from '@/lib/currency'
import { addMonthsToIsoDate, nextMonthlyOccurrence } from '@/lib/date'
import { cn } from '@/lib/utils'

function formatShortDate(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** True for `fixed` recurrence (no end), or an installment series that still has a future charge left. */
function isOngoingRecurring(transaction: Transaction, today: string): boolean {
  if (transaction.recurrence === 'fixed') return true
  if (transaction.installments_total <= 1) return false
  const lastOccurrence = addMonthsToIsoDate(
    transaction.date,
    transaction.installments_total - transaction.installment_current,
  )
  return lastOccurrence >= today
}

function FixedExpenseRow({
  transaction,
  accountName,
  index,
}: {
  transaction: Transaction
  accountName: string
  index: number
}) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const meta = TRANSACTION_TYPE_META[transaction.transaction_type]
  const cancelRecurrence = useCancelRecurrence()
  const nextCharge = nextMonthlyOccurrence(transaction.date)
  const dayOfMonth = Number(transaction.date.split('-')[2])
  const isInstallment = transaction.installments_total > 1
  const remainingInstallments = isInstallment ? transaction.installments_total - transaction.installment_current : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full bg-white/5', meta.colorClass)}>
        <meta.icon className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{transaction.title}</p>
        <p className="truncate text-xs text-zinc-400">
          {accountName}
          {transaction.category ? ` · ${transaction.category}` : ''}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <Badge variant="outline" className="gap-1 text-xs text-primary">
          <Repeat className="size-3" />
          {isInstallment
            ? `Parcela ${transaction.installment_current}/${transaction.installments_total}`
            : `Todo dia ${dayOfMonth}`}
        </Badge>
        <span className="text-xs text-zinc-400">
          próx. {formatShortDate(nextCharge)}
          {isInstallment ? ` · faltam ${remainingInstallments}` : ''}
        </span>
      </div>

      <p
        className={cn(
          'w-28 shrink-0 text-right text-sm font-semibold tabular-nums',
          transaction.transaction_type === 'income' ? 'text-positive' : 'text-destructive',
        )}
      >
        {transaction.transaction_type === 'income' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </p>

      {!transaction.is_paid && (
        <PayTransactionDialog
          transaction={{ ...transaction, is_projected: false, anchor_id: transaction.id }}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <CircleDollarSign className="size-3.5" />
              {transaction.transaction_type === 'income' ? 'Receber' : 'Pagar'}
            </Button>
          }
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="Opções do gasto fixo"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setCancelOpen(true)}>
            <Ban className="size-4" />
            Parar recorrência
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditFixedTransactionDialog transaction={transaction} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parar "{transaction.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esse lançamento deixa de entrar automaticamente nos próximos meses. O histórico já lançado é mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelRecurrence.isPending}
              onClick={() =>
                cancelRecurrence.mutate(
                  {
                    id: transaction.id,
                    recurrence: transaction.recurrence,
                    installments_total: transaction.installments_total,
                    installment_current: transaction.installment_current,
                  },
                  { onSuccess: () => setCancelOpen(false) },
                )
              }
            >
              {cancelRecurrence.isPending ? 'Parando...' : 'Parar recorrência'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

function FixedExpenseSection({
  title,
  transactions,
  accountsById,
  emptyLabel,
}: {
  title: string
  transactions: Transaction[]
  accountsById: Map<string, { name: string }>
  emptyLabel: string
}) {
  return (
    <div className="space-y-2">
      <h2 className="px-1 text-sm font-medium text-foreground">{title}</h2>
      <div className="glass-panel rounded-xl p-2">
        {transactions.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-400">{emptyLabel}</p>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((transaction, index) => (
              <FixedExpenseRow
                key={transaction.id}
                transaction={transaction}
                index={index}
                accountName={accountsById.get(transaction.account_id)?.name ?? 'Conta removida'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface UpcomingCharge {
  id: string
  title: string
  amount: number
  date: string
  type: 'income' | 'expense'
}

function UpcomingChargesTimeline({ charges }: { charges: UpcomingCharge[] }) {
  if (charges.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-1.5 px-1 text-sm font-medium text-foreground">
        <CalendarClock className="size-4 text-primary" />
        Próximas Cobranças
      </h2>
      <div className="glass-panel flex gap-3 overflow-x-auto rounded-xl p-3">
        {charges.map((charge, index) => {
          const date = new Date(`${charge.date}T00:00:00`)
          return (
            <motion.div
              key={charge.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className={cn(
                'flex w-36 shrink-0 flex-col gap-2 rounded-lg border-l-2 bg-white/[0.03] p-3',
                charge.type === 'income' ? 'border-l-positive' : 'border-l-destructive',
              )}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{date.getDate()}</span>
                <span className="text-xs text-zinc-400 capitalize">
                  {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                </span>
              </div>
              <p className="truncate text-xs font-medium text-zinc-300">{charge.title}</p>
              <p
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  charge.type === 'income' ? 'text-positive' : 'text-destructive',
                )}
              >
                {charge.type === 'income' ? '+' : '-'}
                {formatCurrency(charge.amount)}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function FixedExpensesPage() {
  const { data: transactions = [], isLoading } = useTransactions()
  const { data: accounts = [] } = useAccounts()

  const accountsById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts])

  const fixedExpenses = useMemo(() => {
    const today = todayIso()
    return transactions
      .filter((t) => t.transaction_type === 'expense' && isOngoingRecurring(t, today))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions])

  const fixedIncomes = useMemo(() => {
    const today = todayIso()
    return transactions
      .filter((t) => t.transaction_type === 'income' && isOngoingRecurring(t, today))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions])

  const upcomingCharges = useMemo(() => {
    const all = [...fixedExpenses, ...fixedIncomes]
    const charges: UpcomingCharge[] = all.map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      amount: transaction.amount,
      date: nextMonthlyOccurrence(transaction.date),
      type: transaction.transaction_type as 'income' | 'expense',
    }))
    return charges.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8)
  }, [fixedExpenses, fixedIncomes])

  const totalFixedExpenses = fixedExpenses.reduce((sum, t) => sum + t.amount, 0)
  const totalFixedIncomes = fixedIncomes.reduce((sum, t) => sum + t.amount, 0)
  const netFixedImpact = totalFixedIncomes - totalFixedExpenses

  return (
    <AppLayout title="Gastos Fixos">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-zinc-400">
            Cadastre uma vez — na mão ou pela IA — e o lançamento entra sozinho todo mês, sem precisar digitar de
            novo. Ele continua aparecendo até você parar a recorrência.
          </p>
          <TransactionFormDialog
            defaultRepeatMode="fixed"
            trigger={
              <Button className="shrink-0 gap-1.5">
                <Repeat className="size-4" />
                Novo gasto fixo
              </Button>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  <TrendingDown className="size-3.5 text-destructive" />
                  Despesas Fixas / Mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={totalFixedExpenses}
                  formatter={formatCurrency}
                  className="text-2xl font-bold text-destructive"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  <TrendingUp className="size-3.5 text-positive" />
                  Receitas Fixas / Mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={totalFixedIncomes}
                  formatter={formatCurrency}
                  className="text-2xl font-bold text-positive"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  <Wallet className="size-3.5 text-primary" />
                  Impacto Líquido Fixo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={netFixedImpact}
                  formatter={formatCurrency}
                  className={cn('text-2xl font-bold', netFixedImpact >= 0 ? 'text-positive' : 'text-destructive')}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="glass-panel space-y-2 rounded-xl p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <>
            <UpcomingChargesTimeline charges={upcomingCharges} />

            <FixedExpenseSection
              title="Despesas Fixas"
              transactions={fixedExpenses}
              accountsById={accountsById}
              emptyLabel="Nenhuma despesa fixa cadastrada ainda."
            />
            <FixedExpenseSection
              title="Receitas Fixas"
              transactions={fixedIncomes}
              accountsById={accountsById}
              emptyLabel="Nenhuma receita fixa cadastrada ainda."
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
