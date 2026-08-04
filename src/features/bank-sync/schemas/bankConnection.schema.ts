import { z } from 'zod'

export const bankConnectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  pluggy_item_id: z.string(),
  connector_name: z.string(),
  connector_image_url: z.string().nullable(),
  status: z.string(),
  last_synced_at: z.string().nullable(),
  created_at: z.string(),
})

export type BankConnection = z.infer<typeof bankConnectionSchema>
