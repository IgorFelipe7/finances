import { z } from 'zod'

export const insightToneSchema = z.enum(['danger', 'warning', 'success', 'info'])
export type InsightTone = z.infer<typeof insightToneSchema>

export const insightSchema = z.object({
  tone: insightToneSchema,
  headline: z.string().min(1).max(60),
  message: z.string().min(1).max(180),
})
export type Insight = z.infer<typeof insightSchema>

export const insightResponseSchema = z.object({
  insights: z.array(insightSchema).min(1).max(6),
})
