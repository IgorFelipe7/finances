import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Wallet2 } from 'lucide-react'
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
import { useSaveBudget } from '@/features/budgets/hooks/useBudgetMutations'
import { budgetFormSchema, type BudgetFormInput } from '@/features/budgets/schemas/budget.schema'
import { TRANSACTION_CATEGORY_SUGGESTIONS } from '@/features/transactions/constants'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

interface BudgetFormDialogProps {
  trigger?: ReactNode
  defaultCategory?: string
  defaultLimit?: number
}

export function BudgetFormDialog({ trigger, defaultCategory, defaultLimit }: BudgetFormDialogProps) {
  const [open, setOpen] = useState(false)
  const saveBudget = useSaveBudget()
  const { data: transactions = [] } = useTransactions()

  const categoryOptions = useMemo(() => {
    const used = transactions.map((t) => t.category).filter((c): c is string => !!c)
    return Array.from(new Set([...used, ...TRANSACTION_CATEGORY_SUGGESTIONS])).sort()
  }, [transactions])

  const form = useForm<BudgetFormInput>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { category: defaultCategory ?? '', monthly_limit: defaultLimit ?? 0 },
  })

  function onSubmit(values: BudgetFormInput) {
    saveBudget.mutate(values, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) form.reset() }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5">
            <Plus className="size-4" />
            Definir orçamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Wallet2 className="size-4 text-primary" />
            {defaultCategory ? 'Editar orçamento' : 'Novo orçamento'}
          </DialogTitle>
          <DialogDescription>Defina um limite mensal para uma categoria de despesa.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input
                      list="budget-category-suggestions"
                      placeholder="Ex: Alimentação"
                      disabled={saveBudget.isPending || !!defaultCategory}
                      {...field}
                    />
                  </FormControl>
                  <datalist id="budget-category-suggestions">
                    {categoryOptions.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthly_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite mensal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0,00"
                      disabled={saveBudget.isPending}
                      {...field}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={saveBudget.isPending} className="mt-2 w-full">
              {saveBudget.isPending ? 'Salvando...' : 'Salvar orçamento'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
