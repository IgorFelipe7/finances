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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import type { Account } from '@/features/accounts/schemas/account.schema'
import { formatCurrency } from '@/lib/currency'

const savingsFormSchema = z.object({
  account_id: z.string().min(1, 'Selecione uma conta.'),
  amount: z.number('Informe um valor válido.'),
})

type SavingsFormInput = z.infer<typeof savingsFormSchema>
type Mode = 'add' | 'set'

interface SavingsUpdateDialogProps {
  accounts: Account[]
  balancesByAccountId: Map<string, number>
  trigger: ReactNode
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function SavingsUpdateDialog({ accounts, balancesByAccountId, trigger }: SavingsUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('add')
  const createTransaction = useCreateTransaction()

  const form = useForm<SavingsFormInput>({
    resolver: zodResolver(savingsFormSchema),
    defaultValues: { account_id: accounts[0]?.id ?? '', amount: 0 },
  })

  const selectedAccountId = form.watch('account_id')
  const currentBalance = balancesByAccountId.get(selectedAccountId) ?? 0

  useEffect(() => {
    if (!open) return
    setMode('add')
    form.reset({ account_id: accounts[0]?.id ?? '', amount: 0 })
  }, [open, accounts, form])

  useEffect(() => {
    if (mode === 'set') form.setValue('amount', currentBalance)
    else form.setValue('amount', 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedAccountId])

  function onSubmit(values: SavingsFormInput) {
    if (mode === 'add') {
      if (values.amount <= 0) {
        form.setError('amount', { message: 'Informe um valor maior que zero.' })
        return
      }
      createTransaction.mutate(
        {
          account_id: values.account_id,
          destination_account_id: null,
          title: 'Depósito em poupança',
          amount: values.amount,
          transaction_type: 'income',
          recurrence: 'variable',
          category: 'Poupança',
          date: todayIso(),
          is_paid: true,
        },
        { onSuccess: () => setOpen(false) },
      )
      return
    }

    const delta = values.amount - currentBalance
    if (delta === 0) {
      setOpen(false)
      return
    }

    createTransaction.mutate(
      {
        account_id: values.account_id,
        destination_account_id: null,
        title: 'Ajuste de saldo guardado',
        amount: Math.abs(delta),
        transaction_type: delta > 0 ? 'income' : 'expense',
        recurrence: 'variable',
        category: 'Ajuste',
        date: todayIso(),
        is_paid: true,
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) form.reset() }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Atualizar guardado</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Registre um valor que você acabou de guardar.'
              : 'Corrija o saldo total guardado para um valor exato.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="add" className="flex-1">
              Guardar dinheiro
            </TabsTrigger>
            <TabsTrigger value="set" className="flex-1">
              Ajustar saldo
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            {accounts.length > 1 && (
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={createTransaction.isPending}>
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
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{mode === 'add' ? 'Quanto você guardou?' : 'Novo saldo total'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      disabled={createTransaction.isPending}
                      {...field}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {mode === 'add'
                      ? `Guardado atualmente: ${formatCurrency(currentBalance)}`
                      : `Isso vai lançar um ajuste de ${formatCurrency(field.value - currentBalance)}.`}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createTransaction.isPending} className="mt-2 w-full">
              {createTransaction.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
