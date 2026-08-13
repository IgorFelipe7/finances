import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Target } from 'lucide-react'
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
import { CurrencyInput } from '@/components/CurrencyInput'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/features/accounts/components/ColorPicker'
import { ACCOUNT_COLOR_PRESETS } from '@/features/accounts/constants'
import { useCreateGoal } from '@/features/goals/hooks/useGoalMutations'
import { goalFormSchema, type GoalFormInput } from '@/features/goals/schemas/goal.schema'

interface GoalFormDialogProps {
  trigger?: ReactNode
}

export function GoalFormDialog({ trigger }: GoalFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createGoal = useCreateGoal()

  const form = useForm<GoalFormInput>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: { name: '', target_amount: 0, target_date: null, color: ACCOUNT_COLOR_PRESETS[0] },
  })

  function onSubmit(values: GoalFormInput) {
    createGoal.mutate(values, {
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
            Nova Meta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Target className="size-4 text-primary" />
            Nova meta
          </DialogTitle>
          <DialogDescription>
            Cria uma reserva dedicada com um objetivo — acompanhe o progresso separado do resto do seu dinheiro.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Viagem, Reserva, Notebook novo..." disabled={createGoal.isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor alvo</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        disabled={createGoal.isPending}
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
                name="target_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={createGoal.isPending}
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} disabled={createGoal.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createGoal.isPending} className="mt-2 w-full">
              {createGoal.isPending ? 'Criando...' : 'Criar meta'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
