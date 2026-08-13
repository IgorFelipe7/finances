import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CurrencyInput } from '@/components/CurrencyInput'
import { Input } from '@/components/ui/input'
import { useUpdateTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import { TRANSACTION_CATEGORY_SUGGESTIONS } from '@/features/transactions/constants'
import {
  editFixedTransactionSchema,
  type EditFixedTransactionInput,
  type Transaction,
} from '@/features/transactions/schemas/transaction.schema'

interface EditFixedTransactionDialogProps {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditFixedTransactionDialog({ transaction, open, onOpenChange }: EditFixedTransactionDialogProps) {
  const updateTransaction = useUpdateTransaction()

  const form = useForm<EditFixedTransactionInput>({
    resolver: zodResolver(editFixedTransactionSchema),
    defaultValues: {
      title: transaction.title,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: transaction.title,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
      })
    }
  }, [open, transaction, form])

  function onSubmit(values: EditFixedTransactionInput) {
    updateTransaction.mutate(
      { id: transaction.id, ...values, category: values.category?.trim() || null },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar gasto fixo</DialogTitle>
          <DialogDescription>
            Alterações valem a partir de agora — o dia de cobrança segue esta data em todos os próximos meses.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input disabled={updateTransaction.isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        disabled={updateTransaction.isPending}
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de cobrança</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={updateTransaction.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input
                      list="edit-fixed-category-suggestions"
                      disabled={updateTransaction.isPending}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <datalist id="edit-fixed-category-suggestions">
                    {TRANSACTION_CATEGORY_SUGGESTIONS.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updateTransaction.isPending} className="mt-2 w-full">
              {updateTransaction.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
