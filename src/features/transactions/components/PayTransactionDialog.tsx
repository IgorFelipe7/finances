import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CurrencyInput } from '@/components/CurrencyInput'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { usePayTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import type { ProjectedTransaction } from '@/features/transactions/lib/projectTransactions'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'

const payFormSchema = z.object({
  account_id: z.string().min(1, 'Selecione a conta.'),
  amount: z.number('Informe um valor válido.').positive('O valor deve ser maior que zero.'),
})

type PayFormInput = z.infer<typeof payFormSchema>

interface PayTransactionDialogProps {
  transaction: ProjectedTransaction
  trigger: ReactNode
}

function formatDate(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

export function PayTransactionDialog({ transaction, trigger }: PayTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const { data: accounts = [] } = useAccounts()
  const payTransaction = usePayTransaction()
  const { formatMoney } = useMoneyFormatter()
  const isInstallment = transaction.installments_total > 1
  const isIncome = transaction.transaction_type === 'income'
  const verb = isIncome ? 'Receber' : 'Pagar'
  const noun = isIncome ? 'recebimento' : 'pagamento'

  const form = useForm<PayFormInput>({
    resolver: zodResolver(payFormSchema),
    defaultValues: { account_id: transaction.account_id, amount: transaction.amount },
  })

  useEffect(() => {
    if (open) form.reset({ account_id: transaction.account_id, amount: transaction.amount })
  }, [open, transaction, form])

  function onSubmit(values: PayFormInput) {
    payTransaction.mutate(
      {
        id: transaction.anchor_id,
        isProjected: transaction.is_projected,
        account_id: values.account_id,
        destination_account_id: transaction.destination_account_id,
        title: transaction.title,
        amount: values.amount,
        transaction_type: transaction.transaction_type,
        category: transaction.category,
        date: transaction.date,
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) form.reset() }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {verb} "{transaction.title}"
            {isInstallment ? ` (${transaction.installment_current}/${transaction.installments_total})` : ''}
          </DialogTitle>
          <DialogDescription>
            Referente a {formatDate(transaction.date)}. Só esse lançamento é afetado — os outros meses continuam
            como estão.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={payTransaction.isPending}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <span className="size-2 rounded-full" style={{ backgroundColor: account.color }} />
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      disabled={payTransaction.isPending}
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onBlur={field.onBlur}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Previsto: {formatMoney(transaction.amount)}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={payTransaction.isPending} className="mt-2 w-full">
              {payTransaction.isPending ? 'Confirmando...' : `Confirmar ${noun}`}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
