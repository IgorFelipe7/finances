import { z } from 'zod'

export const budgetSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category: z.string().min(1).max(100),
  monthly_limit: z.coerce.number().positive(),
  created_at: z.string(),
})

export type Budget = z.infer<typeof budgetSchema>

export const budgetFormSchema = z.object({
  category: z.string().min(1, 'Escolha uma categoria.').max(100),
  monthly_limit: z.number('Informe um valor válido.').positive('O valor deve ser maior que zero.'),
})

export type BudgetFormInput = z.infer<typeof budgetFormSchema>
