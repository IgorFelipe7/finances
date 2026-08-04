import { z } from 'zod'
import { transactionCategoryTypeSchema } from '@/features/transactions/schemas/transaction.schema'

/** Shape the AI must return — a subset of `transactionSchema` limited to what can be inferred from free text. */
export const aiTransactionResultSchema = z.object({
  title: z.string().min(1).max(255),
  amount: z.number().positive(),
  transaction_type: transactionCategoryTypeSchema,
  account_id: z.string().uuid(),
  destination_account_id: z.string().uuid().nullable(),
  category: z.string().max(100).nullable(),
  date: z.string(),
  /** True when the text implies a recurring monthly charge (rent, subscription, salary, etc). */
  is_fixed: z.boolean().default(false),
})

export type AiTransactionResult = z.infer<typeof aiTransactionResultSchema>
