import { z } from 'zod'

export const transactionCategoryTypeSchema = z.enum(['income', 'expense', 'transfer'])
export type TransactionCategoryType = z.infer<typeof transactionCategoryTypeSchema>

export const transactionRecurrenceSchema = z.enum(['fixed', 'variable', 'temporary'])
export type TransactionRecurrence = z.infer<typeof transactionRecurrenceSchema>

/** How a `fixed` transaction's date is recalculated each month. Null (the default) means the
 * legacy behavior: same day-of-month as the anchor `date`. */
export const recurrenceRuleSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('weekday_occurrence'),
    /** 0 = Domingo ... 6 = Sábado */
    weekday: z.number().int().min(0).max(6),
    /** 1st through 4th occurrence in the month, or -1 for "última". */
    occurrence: z.number().int().refine((v) => [1, 2, 3, 4, -1].includes(v), 'Ocorrência inválida.'),
  }),
  z.object({
    type: z.literal('business_day'),
    n: z.number().int().min(1).max(23),
    countSaturday: z.boolean(),
  }),
])
export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>

/** Mirrors the `transactions` table (see the schema executed in Stage 1). */
export const transactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  account_id: z.string().uuid(),
  destination_account_id: z.string().uuid().nullable(),
  title: z.string().min(1).max(255),
  amount: z.coerce.number(),
  transaction_type: transactionCategoryTypeSchema,
  recurrence: transactionRecurrenceSchema,
  category: z.string().max(100).nullable(),
  date: z.string(),
  is_paid: z.boolean(),
  installments_total: z.number().int(),
  installment_current: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string(),
  recurrence_rule: recurrenceRuleSchema.nullable().optional(),
})

export type Transaction = z.infer<typeof transactionSchema>

export const repeatModeSchema = z.enum(['none', 'fixed', 'installment'])
export type RepeatMode = z.infer<typeof repeatModeSchema>

export const recurrenceKindSchema = z.enum(['day_of_month', 'weekday_occurrence', 'business_day'])
export type RecurrenceKind = z.infer<typeof recurrenceKindSchema>

export const transactionFormSchema = z
  .object({
    transaction_type: transactionCategoryTypeSchema,
    title: z.string().min(1, 'Informe um título.').max(255),
    amount: z.number('Informe um valor válido.').positive('O valor deve ser maior que zero.'),
    account_id: z.string().min(1, 'Selecione a conta de origem.'),
    destination_account_id: z.string().nullable(),
    category: z.string().max(100).nullable(),
    date: z.string().min(1, 'Informe a data.'),
    is_paid: z.boolean(),
    repeat_mode: repeatModeSchema,
    installments_total: z.number().int().min(2).max(360),
    recurrence_kind: recurrenceKindSchema,
    recurrence_weekday: z.number().int().min(0).max(6),
    recurrence_occurrence: z.number().int(),
    recurrence_business_day_n: z.number().int().min(1).max(23),
    recurrence_count_saturday: z.boolean(),
  })
  .refine((data) => data.transaction_type !== 'transfer' || !!data.destination_account_id, {
    message: 'Selecione a conta de destino.',
    path: ['destination_account_id'],
  })
  .refine((data) => data.transaction_type !== 'transfer' || data.destination_account_id !== data.account_id, {
    message: 'A conta de destino deve ser diferente da origem.',
    path: ['destination_account_id'],
  })

export type TransactionFormInput = z.infer<typeof transactionFormSchema>

export const editFixedTransactionSchema = z.object({
  title: z.string().min(1, 'Informe um título.').max(255),
  amount: z.number('Informe um valor válido.').positive('O valor deve ser maior que zero.'),
  category: z.string().max(100).nullable(),
  date: z.string().min(1, 'Informe a data.'),
})

export type EditFixedTransactionInput = z.infer<typeof editFixedTransactionSchema>
