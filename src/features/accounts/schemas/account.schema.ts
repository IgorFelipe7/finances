import { z } from 'zod'

export const accountTypeSchema = z.enum(['checking', 'savings', 'credit_card', 'investment'])
export type AccountType = z.infer<typeof accountTypeSchema>

export const accountSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: accountTypeSchema,
  initial_balance: z.coerce.number(),
  color: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  statement_closing_day: z.coerce.number().int().min(1).max(31).nullable().default(null),
  statement_due_day: z.coerce.number().int().min(1).max(31).nullable().default(null),
  bank_connection_id: z.string().uuid().nullable().optional(),
})

export type Account = z.infer<typeof accountSchema>

export const accountFormSchema = z
  .object({
    name: z.string().min(1, 'Informe um nome para a conta.').max(100),
    type: accountTypeSchema,
    initial_balance: z.number('Informe um valor válido.'),
    color: z.string().min(1, 'Escolha uma cor.'),
    statement_closing_day: z.number('Informe um dia válido.').int().min(1).max(31).nullable(),
    statement_due_day: z.number('Informe um dia válido.').int().min(1).max(31).nullable(),
  })
  .refine((data) => data.type !== 'credit_card' || !!data.statement_closing_day, {
    message: 'Informe o dia de fechamento da fatura.',
    path: ['statement_closing_day'],
  })
  .refine((data) => data.type !== 'credit_card' || !!data.statement_due_day, {
    message: 'Informe o dia de vencimento da fatura.',
    path: ['statement_due_day'],
  })

export type AccountFormInput = z.infer<typeof accountFormSchema>
