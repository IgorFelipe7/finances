import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { CurrencyInput } from '@/components/CurrencyInput'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import type { Account } from '@/features/accounts/schemas/account.schema'
import { useCreateTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'

const payInvoiceFormSchema = z.object({
  origin_account_id: z.string().min(1, 'Selecione a conta de origem.'),
  amount: z.number('Informe um valor válido.').positive('O valor deve ser maior que zero.'),
})

type PayInvoiceFormInput = z.infer<typeof payInvoiceFormSchema>

interface PayInvoiceDialogProps {
  card: Account
  invoiceAmount: number
  trigger: ReactNode
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function PayInvoiceDialog({ card, invoiceAmount, trigger }: PayInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const { data: accounts = [] } = useAccounts()
  const createTransaction = useCreateTransaction()
  const { formatMoney } = useMoneyFormatter()

  const payableAccounts = accounts.filter((account) => account.type !== 'credit_card' && account.id !== card.id)

  const form = useForm<PayInvoiceFormInput>({
    resolver: zodResolver(payInvoiceFormSchema),
    defaultValues: { origin_account_id: '', amount: invoiceAmount },
  })

  useEffect(() => {
    if (open) form.reset({ origin_account_id: '', amount: invoiceAmount })
  }, [open, invoiceAmount, form])

  function onSubmit(values: PayInvoiceFormInput) {
    createTransaction.mutate(
      {
        account_id: values.origin_account_id,
        destination_account_id: card.id,
        title: `Pagamento fatura ${card.name}`,
        amount: values.amount,
        transaction_type: 'transfer',
        recurrence: 'variable',
        category: 'Pagamento de Fatura',
        date: todayIso(),
        is_paid: true,
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) form.reset() }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar fatura — {card.name}</DialogTitle>
          <DialogDescription>
            Gera uma transferência da conta escolhida para {card.name}, abatendo o saldo devedor.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="origin_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pagar com</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={createTransaction.isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {payableAccounts.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhuma conta disponível.
                        </div>
                      ) : (
                        payableAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <span className="size-2 rounded-full" style={{ backgroundColor: account.color }} />
                            {account.name}
                          </SelectItem>
                        ))
                      )}
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
                      disabled={createTransaction.isPending}
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onBlur={field.onBlur}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Fatura atual: {formatMoney(invoiceAmount)}. Ajuste para um pagamento parcial se necessário.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createTransaction.isPending} className="mt-2 w-full">
              {createTransaction.isPending ? 'Pagando...' : 'Pagar fatura'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
