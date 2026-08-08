import { motion } from 'framer-motion'
import { Link2, MoreVertical, Pencil, ReceiptText, Trash2 } from 'lucide-react'
import { useState } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog'
import { PayInvoiceDialog } from '@/features/accounts/components/PayInvoiceDialog'
import { ACCOUNT_TYPE_META } from '@/features/accounts/constants'
import { useDeleteAccount } from '@/features/accounts/hooks/useAccountMutations'
import { useCreditCardInvoices } from '@/features/accounts/hooks/useCreditCardInvoices'
import { formatDueDate } from '@/features/accounts/lib/creditCard'
import type { Account } from '@/features/accounts/schemas/account.schema'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { cn } from '@/lib/utils'

interface AccountCardProps {
  account: Account
  balance: number
  index: number
}

export function AccountCard({ account, balance, index }: AccountCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteAccount = useDeleteAccount()
  const { formatMoney } = useMoneyFormatter()

  const meta = ACCOUNT_TYPE_META[account.type]
  const isCreditCard = account.type === 'credit_card'
  const displayBalance = isCreditCard ? -Math.abs(balance) : balance
  const isNegative = displayBalance < 0
  const invoices = useCreditCardInvoices(account)
  // Falls back to the raw running balance only when the card has no cycle configured yet.
  const dueInvoiceAmount = invoices ? invoices.closed.amount : Math.abs(balance)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <Card className="group relative overflow-hidden glass-panel transition-shadow hover:shadow-xl hover:shadow-black/20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
          style={{ backgroundColor: account.color }}
        />
        <CardHeader className="relative flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-border"
            style={{ backgroundColor: `${account.color}26` }}
          >
            <meta.icon className="size-5" style={{ color: account.color }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-medium text-foreground">
              {account.name}
              {account.bank_connection_id && (
                <Link2 className="size-3 shrink-0 text-primary" aria-label="Sincronizado via Open Finance" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">{meta.label}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-foreground"
                aria-label="Opções da conta"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-xs text-muted-foreground">{isCreditCard ? 'Saldo devedor' : 'Saldo atual'}</p>
          <p className={cn('text-2xl font-bold tabular-nums text-foreground', isNegative && 'text-destructive')}>
            {formatMoney(displayBalance)}
          </p>

          {isCreditCard && (
            <div className="mt-4 space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ReceiptText className="size-3.5" />
                  {invoices ? 'Fatura a pagar' : 'Fatura atual'}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatMoney(dueInvoiceAmount)}
                </span>
              </div>

              {invoices ? (
                <>
                  <p className="text-xs text-muted-foreground">Vence dia {formatDueDate(invoices.closed.dueDate)}</p>
                  {invoices.open.amount > 0 && (
                    <p className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Próxima fatura (fecha dia {formatDueDate(invoices.open.closingDate)})</span>
                      <span className="tabular-nums">{formatMoney(invoices.open.amount)}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Configure o dia de fechamento e vencimento para separar a fatura por ciclo.
                </p>
              )}

              <PayInvoiceDialog
                card={account}
                invoiceAmount={dueInvoiceAmount}
                trigger={
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={dueInvoiceAmount <= 0}
                  >
                    Pagar Fatura
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AccountFormDialog account={account} open={editOpen} onOpenChange={setEditOpen} trigger={null} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{account.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta será removida da sua lista, mas o histórico de transações é preservado. Essa ação pode ser
              revertida apenas via suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteAccount.isPending}
              onClick={() => deleteAccount.mutate(account.id, { onSuccess: () => setDeleteOpen(false) })}
            >
              {deleteAccount.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
