import { z } from 'zod'

export const transactionCategoryTypeSchema = z.enum(['income', 'expense', 'transfer'])
export type TransactionCategoryType = z.infer<typeof transactionCategoryTypeSchema>

export const transactionRecurrenceSchema = z.enum(['fixed', 'variable', 'temporary'])
export type TransactionRecurrence = z.infer<typeof transactionRecurrenceSchema>

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
})

export type Transaction = z.infer<typeof transactionSchema>

export const repeatModeSchema = z.enum(['none', 'fixed', 'installment'])
export type RepeatMode = z.infer<typeof repeatModeSchema>

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
