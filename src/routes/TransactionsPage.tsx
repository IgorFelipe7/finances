import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Ban, CircleDollarSign, MoreVertical, Repeat, Trash2 } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { TRANSACTION_TYPE_META } from '@/features/transactions/constants'
import { PayTransactionDialog } from '@/features/transactions/components/PayTransactionDialog'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'
import { useCancelRecurrence, useDeactivateTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { withProjections, type ProjectedTransaction } from '@/features/transactions/lib/projectTransactions'
import type { TransactionCategoryType } from '@/features/transactions/schemas/transaction.schema'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

type TypeFilter = TransactionCategoryType | 'all'

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
  { value: 'transfer', label: 'Transferências' },
]

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function TransactionRow({
  transaction,
  accountName,
  destinationAccountName,
  index,
}: {
  transaction: ProjectedTransaction
  accountName: string
  destinationAccountName: string | null
  index: number
}) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const meta = TRANSACTION_TYPE_META[transaction.transaction_type]
  const deactivate = useDeactivateTransaction()
  const cancelRecurrence = useCancelRecurrence()
  const isTransfer = transaction.transaction_type === 'transfer'
  const signedAmount = transaction.transaction_type === 'expense' ? -transaction.amount : transaction.amount
  const isInstallment = transaction.installments_total > 1
  const isFixed = transaction.recurrence === 'fixed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        'group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/5',
        transaction.is_projected && 'opacity-70',
      )}
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full bg-white/5', meta.colorClass)}>
        <meta.icon className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {transaction.title}
          {isInstallment ? ` (${transaction.installment_current}/${transaction.installments_total})` : ''}
        </p>
        <p className="truncate text-xs text-zinc-400">
          {accountName}
          {destinationAccountName ? ` → ${destinationAccountName}` : ''}
          {transaction.category ? ` · ${transaction.category}` : ''}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {transaction.is_projected && (
          <Badge variant="outline" className="gap-1 text-xs text-primary">
            <Repeat className="size-3" />
            {isFixed ? 'Fixa' : 'Parcela'}
          </Badge>
        )}
        {!transaction.is_projected && isFixed && (
          <Badge variant="outline" className="gap-1 text-xs text-primary">
            <Repeat className="size-3" />
            Fixa
          </Badge>
        )}
        {!transaction.is_projected && !transaction.is_paid && (
          <Badge variant="outline" className="text-xs text-zinc-400">
            Pendente
          </Badge>
        )}
        <span className="text-xs text-zinc-400">{formatDate(transaction.date)}</span>
      </div>

      <p
        className={cn(
          'w-28 shrink-0 text-right text-sm font-semibold tabular-nums',
          isTransfer
            ? 'text-foreground'
            : signedAmount > 0
              ? 'text-positive'
              : signedAmount < 0
                ? 'text-destructive'
                : 'text-foreground',
        )}
      >
        {!isTransfer && signedAmount > 0 ? '+' : ''}
        {formatCurrency(signedAmount)}
      </p>

      {!transaction.is_paid && (
        <PayTransactionDialog
          transaction={transaction}
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

      {isFixed || isInstallment ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-zinc-500 transition-colors hover:text-foreground data-[state=open]:text-foreground"
                aria-label="Opções da recorrência"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={() => setCancelOpen(true)}>
                <Ban className="size-4" />
                Cancelar recorrência
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={transaction.is_projected}
                onSelect={() => !transaction.is_projected && deactivate.mutate(transaction.id)}
              >
                <Trash2 className="size-4" />
                Excluir este lançamento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar "{transaction.title}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isInstallment
                    ? 'As próximas parcelas deixam de ser lançadas. O histórico já lançado é mantido.'
                    : 'Essa despesa fixa deixará de se repetir nos próximos meses. O histórico já lançado é mantido.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={cancelRecurrence.isPending}
                  onClick={() =>
                    cancelRecurrence.mutate(
                      {
                        id: transaction.anchor_id,
                        recurrence: transaction.recurrence,
                        installments_total: transaction.installments_total,
                        installment_current: transaction.installment_current,
                      },
                      { onSuccess: () => setCancelOpen(false) },
                    )
                  }
                >
                  {cancelRecurrence.isPending ? 'Cancelando...' : 'Cancelar recorrência'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-zinc-500 transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-0"
          disabled={deactivate.isPending || transaction.is_projected}
          onClick={() => deactivate.mutate(transaction.id)}
          aria-label="Remover transação"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </motion.div>
  )
}

export function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')

  const { data: transactions = [], isLoading } = useTransactions()
  const { data: accounts = [] } = useAccounts()
  const selectedMonth = useTimeTravelStore((state) => state.selectedMonth)
  const selectedYear = useTimeTravelStore((state) => state.selectedYear)

  const accountsById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts])

  const filtered = useMemo(() => {
    const periodEndTime = new Date(selectedYear, selectedMonth + 1, 0).getTime()
    return withProjections(transactions, periodEndTime).filter((transaction) => {
      const date = new Date(`${transaction.date}T00:00:00`)
      if (date.getMonth() !== selectedMonth || date.getFullYear() !== selectedYear) return false
      if (typeFilter !== 'all' && transaction.transaction_type !== typeFilter) return false
      if (
        accountFilter !== 'all' &&
        transaction.account_id !== accountFilter &&
        transaction.destination_account_id !== accountFilter
      )
        return false
      return true
    })
  }, [transactions, selectedMonth, selectedYear, typeFilter, accountFilter])

  return (
    <AppLayout title="Transações">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setTypeFilter(filter.value)}
                className={cn(
                  'rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-foreground',
                  typeFilter === filter.value && 'border-white/10 bg-white/5 text-foreground',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <span className="size-2 rounded-full" style={{ backgroundColor: account.color }} />
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <TransactionFormDialog />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <ArrowLeftRight className="size-6 text-primary" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Nenhuma transação neste período</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Ajuste os filtros ou registre uma nova transação para começar.
                </p>
              </div>
              <TransactionFormDialog />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  index={index}
                  accountName={accountsById.get(transaction.account_id)?.name ?? 'Conta removida'}
                  destinationAccountName={
                    transaction.destination_account_id
                      ? (accountsById.get(transaction.destination_account_id)?.name ?? 'Conta removida')
                      : null
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
