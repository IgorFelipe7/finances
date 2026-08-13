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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { TRANSACTION_CATEGORY_SUGGESTIONS, TRANSACTION_TYPE_META } from '@/features/transactions/constants'
import { useCreateTransaction } from '@/features/transactions/hooks/useTransactionMutations'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { resolveRecurrenceDate, toIsoDate } from '@/features/transactions/lib/recurrenceRule'
import {
  transactionFormSchema,
  type RecurrenceRule,
  type RepeatMode,
  type TransactionFormInput,
} from '@/features/transactions/schemas/transaction.schema'

const REPEAT_MODE_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: 'none', label: 'Não se repete' },
  { value: 'fixed', label: 'Fixa (todo mês)' },
  { value: 'installment', label: 'Parcelada' },
]

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

const OCCURRENCE_OPTIONS = [
  { value: 1, label: '1ª' },
  { value: 2, label: '2ª' },
  { value: 3, label: '3ª' },
  { value: 4, label: '4ª' },
  { value: -1, label: 'Última' },
]

function formatPreviewDate(dateIso: string) {
  if (!dateIso) return ''
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

interface TransactionFormDialogProps {
  trigger?: ReactNode
  defaultRepeatMode?: RepeatMode
  /** Pre-fills the form — e.g. from an AI-parsed Smart Input result — for the user to review before saving. */
  initialValues?: Partial<TransactionFormInput>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function buildDefaultValues(
  defaultRepeatMode: RepeatMode,
  initialValues?: Partial<TransactionFormInput>,
): TransactionFormInput {
  return {
    transaction_type: 'expense',
    title: '',
    amount: 0,
    account_id: '',
    destination_account_id: null,
    category: null,
    date: todayIso(),
    is_paid: true,
    repeat_mode: defaultRepeatMode,
    installments_total: 2,
    recurrence_kind: 'day_of_month',
    recurrence_weekday: 1,
    recurrence_occurrence: 1,
    recurrence_business_day_n: 5,
    recurrence_count_saturday: false,
    ...initialValues,
  }
}

export function TransactionFormDialog({
  trigger,
  defaultRepeatMode = 'none',
  initialValues,
  open: openProp,
  onOpenChange,
}: TransactionFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const { data: accounts = [] } = useAccounts()
  const { data: transactions = [] } = useTransactions()
  const createTransaction = useCreateTransaction()

  const categorySuggestions = Array.from(
    new Set([...transactions.map((t) => t.category).filter((c): c is string => !!c), ...TRANSACTION_CATEGORY_SUGGESTIONS]),
  )

  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: buildDefaultValues(defaultRepeatMode, initialValues),
  })

  useEffect(() => {
    if (open) form.reset(buildDefaultValues(defaultRepeatMode, initialValues))
    // Reset only on the open transition — initialValues/defaultRepeatMode are fresh objects
    // from the caller on every render, and re-running this while already open would wipe edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const transactionType = form.watch('transaction_type')
  const originAccountId = form.watch('account_id')
  const repeatMode = form.watch('repeat_mode')
  const recurrenceKind = form.watch('recurrence_kind')
  const recurrenceWeekday = form.watch('recurrence_weekday')
  const recurrenceOccurrence = form.watch('recurrence_occurrence')
  const recurrenceBusinessDayN = form.watch('recurrence_business_day_n')
  const recurrenceCountSaturday = form.watch('recurrence_count_saturday')
  const watchedDate = form.watch('date')

  // Weekday/business-day rules don't let the user pick an arbitrary date — the date IS the rule's
  // output for whichever month is currently selected, recomputed live as the rule's own inputs change.
  useEffect(() => {
    if (repeatMode !== 'fixed' || recurrenceKind === 'day_of_month') return

    const rule: RecurrenceRule =
      recurrenceKind === 'weekday_occurrence'
        ? { type: 'weekday_occurrence', weekday: recurrenceWeekday, occurrence: recurrenceOccurrence as 1 | 2 | 3 | 4 | -1 }
        : { type: 'business_day', n: recurrenceBusinessDayN, countSaturday: recurrenceCountSaturday }

    const currentDate = form.getValues('date')
    const reference = currentDate ? new Date(`${currentDate}T00:00:00`) : new Date()
    const base = Number.isNaN(reference.getTime()) ? new Date() : reference
    const resolved = toIsoDate(resolveRecurrenceDate(rule, base.getFullYear(), base.getMonth()))
    form.setValue('date', resolved, { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatMode, recurrenceKind, recurrenceWeekday, recurrenceOccurrence, recurrenceBusinessDayN, recurrenceCountSaturday])

  function onSubmit(values: TransactionFormInput) {
    const isInstallment = values.repeat_mode === 'installment' && values.transaction_type !== 'transfer'
    const isFixed = values.repeat_mode === 'fixed' && values.transaction_type !== 'transfer'

    const recurrenceRule: RecurrenceRule | null = !isFixed
      ? null
      : values.recurrence_kind === 'weekday_occurrence'
        ? {
            type: 'weekday_occurrence',
            weekday: values.recurrence_weekday,
            occurrence: values.recurrence_occurrence as 1 | 2 | 3 | 4 | -1,
          }
        : values.recurrence_kind === 'business_day'
          ? { type: 'business_day', n: values.recurrence_business_day_n, countSaturday: values.recurrence_count_saturday }
          : null

    createTransaction.mutate(
      {
        account_id: values.account_id,
        destination_account_id: values.transaction_type === 'transfer' ? values.destination_account_id : null,
        title: values.title,
        amount: values.amount,
        transaction_type: values.transaction_type,
        recurrence: isFixed ? 'fixed' : 'variable',
        category: values.category?.trim() || null,
        date: values.date,
        is_paid: values.is_paid,
        installments_total: isInstallment ? values.installments_total : 1,
        installment_current: 1,
        recurrence_rule: recurrenceRule,
      },
      {
        onSuccess: () => {
          setOpen(false)
          form.reset({
            ...form.getValues(),
            title: '',
            amount: 0,
            category: null,
            repeat_mode: defaultRepeatMode,
            recurrence_kind: 'day_of_month',
          })
        },
      },
    )
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
              Nova Transação
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Confira antes de salvar' : 'Nova transação'}</DialogTitle>
          <DialogDescription>
            {initialValues
              ? 'A IA já preencheu os campos abaixo a partir do que você digitou — ajuste o que quiser antes de salvar.'
              : 'Registre manualmente uma receita, despesa ou transferência.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList className="w-full">
                      {Object.entries(TRANSACTION_TYPE_META).map(([value, meta]) => (
                        <TabsTrigger key={value} value={value} className="flex-1 gap-1.5">
                          <meta.icon className="size-3.5" />
                          {meta.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Supermercado, Salário..."
                        disabled={createTransaction.isPending}
                        {...field}
                      />
                    </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => {
                  const isRuleControlled = repeatMode === 'fixed' && recurrenceKind !== 'day_of_month'
                  return (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={createTransaction.isPending || isRuleControlled}
                          {...field}
                        />
                      </FormControl>
                      {isRuleControlled && (
                        <p className="text-xs text-muted-foreground">Calculada pela regra de recorrência abaixo.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{transactionType === 'transfer' ? 'Conta de origem' : 'Conta'}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={createTransaction.isPending}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhuma conta cadastrada.
                        </div>
                      ) : (
                        accounts.map((account) => (
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

            {transactionType === 'transfer' && (
              <FormField
                control={form.control}
                name="destination_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de destino</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={createTransaction.isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts
                          .filter((account) => account.id !== originAccountId)
                          .map((account) => (
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input
                      list="category-suggestions"
                      placeholder="Ex: Alimentação"
                      disabled={createTransaction.isPending}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <datalist id="category-suggestions">
                    {categorySuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            {transactionType !== 'transfer' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="repeat_mode"
                  render={({ field }) => (
                    <FormItem className={repeatMode === 'installment' ? '' : 'col-span-2'}>
                      <FormLabel>Repetição</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={createTransaction.isPending}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REPEAT_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {repeatMode === 'installment' && (
                  <FormField
                    control={form.control}
                    name="installments_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcelas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={2}
                            max={360}
                            step={1}
                            disabled={createTransaction.isPending}
                            {...field}
                            onChange={(event) => field.onChange(event.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {repeatMode === 'fixed' && transactionType !== 'transfer' && (
              <div className="space-y-3 rounded-lg border border-input px-3 py-2.5">
                <FormField
                  control={form.control}
                  name="recurrence_kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cai em</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={createTransaction.isPending}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="day_of_month">Dia fixo do mês</SelectItem>
                          <SelectItem value="weekday_occurrence">Dia da semana (ex: 1ª segunda)</SelectItem>
                          <SelectItem value="business_day">Dia útil do mês (ex: 5º dia útil)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {recurrenceKind === 'weekday_occurrence' && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="recurrence_occurrence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ocorrência</FormLabel>
                          <Select
                            value={String(field.value)}
                            onValueChange={(value) => field.onChange(Number(value))}
                            disabled={createTransaction.isPending}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {OCCURRENCE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurrence_weekday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia da semana</FormLabel>
                          <Select
                            value={String(field.value)}
                            onValueChange={(value) => field.onChange(Number(value))}
                            disabled={createTransaction.isPending}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {WEEKDAY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {recurrenceKind === 'business_day' && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="recurrence_business_day_n"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qual dia útil</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={23}
                              disabled={createTransaction.isPending}
                              {...field}
                              onChange={(event) => field.onChange(event.target.valueAsNumber)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurrence_count_saturday"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-input px-3 py-2">
                          <FormLabel className="text-xs leading-tight">Sábado conta como dia útil?</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={createTransaction.isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {recurrenceKind !== 'day_of_month' && (
                  <p className="text-xs text-muted-foreground">
                    Esse mês cai em <span className="font-medium text-foreground">{formatPreviewDate(watchedDate)}</span> —
                    todo mês a data é recalculada pela regra.
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="is_paid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-input px-3 py-2.5">
                  <div>
                    <FormLabel>
                      {transactionType === 'income' ? 'Já foi recebido?' : 'Já foi pago?'}
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Desative para lançar como pendente (previsão).
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={createTransaction.isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createTransaction.isPending} className="mt-2 w-full">
              {createTransaction.isPending ? 'Salvando...' : 'Salvar transação'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
