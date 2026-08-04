import { z } from 'zod'
import { snapshotToPromptFacts, type FinancialSnapshot } from '@/features/dashboard/lib/buildFinancialSnapshot'
import { callOpenAI } from '@/lib/aiProxy'

const coachTipSchema = z.object({
  headline: z.string().min(1).max(60),
  message: z.string().min(1).max(220),
})

export type CoachTip = z.infer<typeof coachTipSchema>

const SYSTEM_PROMPT = `Você é um educador financeiro (NÃO um consultor de investimentos licenciado) escrevendo para um app de finanças pessoais em português do Brasil.

Gere APENAS UMA dica curta, prática e personalizada de economia ou educação financeira, baseada nos dados reais abaixo.

Regras muito importantes:
- Você NUNCA recomenda comprar uma ação, fundo, criptomoeda, ou produto específico de uma instituição financeira. Fale só em termos gerais e educativos (ex: "renda fixa de baixo risco e liquidez diária", "Tesouro Selic ou CDB de liquidez diária" como categorias, nunca "compre X" ou "invista na corretora Y").
- Tom educativo e de apoio, nunca prescritivo como um consultor ("uma opção comum é considerar...", nunca "você deve investir em...").
- Use os números reais do resumo abaixo (categoria com mais gasto, sobra do mês, reserva atual, dias restantes) pra tornar a dica ESPECÍFICA pra essa pessoa — não genérica.
- NUNCA invente números — use apenas os já formatados que aparecem no resumo.
- No máximo 2 frases curtas, diretas, sem economês.
- Responda APENAS com um JSON no formato: { "headline": string (até 6 palavras), "message": string }`

export async function generateCoachTip(snapshot: FinancialSnapshot, topCategory: string | null): Promise<CoachTip> {
  const facts = snapshotToPromptFacts(snapshot)
  const extra = topCategory ? `\nCategoria de maior gasto este mês: ${topCategory}.` : ''

  const completion = await callOpenAI({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: facts + extra },
    ],
  })

  const content = completion.choices[0]?.message.content
  if (!content) throw new Error('A IA não retornou nenhum conteúdo.')

  return coachTipSchema.parse(JSON.parse(content))
}
