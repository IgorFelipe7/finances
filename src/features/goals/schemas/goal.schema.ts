import { z } from 'zod'

export const goalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  account_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  target_amount: z.coerce.number().positive(),
  target_date: z.string().nullable(),
  color: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type Goal = z.infer<typeof goalSchema>

export const goalFormSchema = z.object({
  name: z.string().min(1, 'Informe um nome para a meta.').max(100),
  target_amount: z.number('Informe um valor válido.').positive('O valor deve ser maior que zero.'),
  target_date: z.string().nullable(),
  color: z.string().min(1, 'Escolha uma cor.'),
})

export type GoalFormInput = z.infer<typeof goalFormSchema>
