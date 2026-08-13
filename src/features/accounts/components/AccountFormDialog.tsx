import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
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
import { ColorPicker } from '@/features/accounts/components/ColorPicker'
import { ACCOUNT_COLOR_PRESETS, ACCOUNT_TYPE_META } from '@/features/accounts/constants'
import { useCreateAccount, useUpdateAccount } from '@/features/accounts/hooks/useAccountMutations'
import {
  accountFormSchema,
  type Account,
  type AccountFormInput,
  type AccountType,
} from '@/features/accounts/schemas/account.schema'

interface AccountFormDialogProps {
  trigger?: ReactNode
  account?: Account
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultType?: AccountType
}

function defaultValuesFor(account?: Account, defaultType?: AccountType): AccountFormInput {
  return {
    name: account?.name ?? '',
    type: account?.type ?? defaultType ?? 'checking',
    initial_balance: account?.initial_balance ?? 0,
    color: account?.color ?? ACCOUNT_COLOR_PRESETS[0],
    statement_closing_day: account?.statement_closing_day ?? null,
    statement_due_day: account?.statement_due_day ?? null,
  }
}

export function AccountFormDialog({
  trigger,
  account,
  open: openProp,
  onOpenChange,
  defaultType,
}: AccountFormDialogProps) {
  const isEditing = !!account
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const isPending = createAccount.isPending || updateAccount.isPending

  const form = useForm<AccountFormInput>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: defaultValuesFor(account, defaultType),
  })

  useEffect(() => {
    if (open) form.reset(defaultValuesFor(account, defaultType))
  }, [open, account, defaultType, form])

  const accountType = form.watch('type')

  function onSubmit(values: AccountFormInput) {
    const payload: AccountFormInput = {
      ...values,
      statement_closing_day: values.type === 'credit_card' ? values.statement_closing_day : null,
      statement_due_day: values.type === 'credit_card' ? values.statement_due_day : null,
    }

    if (account) {
      updateAccount.mutate(
        { id: account.id, input: payload },
        { onSuccess: () => setOpen(false) },
      )
      return
    }

    createAccount.mutate(payload, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset()
      }}
    >
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="gap-1.5">
              <Plus className="size-4" />
              Adicionar Conta
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar conta' : 'Nova conta'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados da conta.'
              : 'Cadastre um banco, carteira ou cartão para acompanhar o saldo.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank, Carteira, XP..." disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPE_META).map(([value, meta]) => (
                        <SelectItem key={value} value={value}>
                          <meta.icon className="size-4 text-muted-foreground" />
                          {meta.label}
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
              name="initial_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo inicial</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      disabled={isPending}
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

            {accountType === 'credit_card' && (
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-input px-3 py-2.5">
                <FormField
                  control={form.control}
                  name="statement_closing_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fechamento da fatura</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="Dia"
                          disabled={isPending}
                          value={field.value ?? ''}
                          onChange={(event) => {
                            const parsed = event.target.valueAsNumber
                            field.onChange(event.target.value === '' || Number.isNaN(parsed) ? null : parsed)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statement_due_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento da fatura</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="Dia"
                          disabled={isPending}
                          value={field.value ?? ''}
                          onChange={(event) => {
                            const parsed = event.target.valueAsNumber
                            field.onChange(event.target.value === '' || Number.isNaN(parsed) ? null : parsed)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="mt-2 w-full">
              {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar conta'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
