import { snapshotToPromptFacts, type FinancialSnapshot } from '@/features/dashboard/lib/buildFinancialSnapshot'
import { insightResponseSchema, type Insight } from '@/features/dashboard/schemas/insight.schema'
import { getOpenAIClient } from '@/lib/openai'

const SYSTEM_PROMPT = `Você é um consultor financeiro pessoal direto e caloroso, escrevendo para um app de finanças em português do Brasil.

Você recebe um resumo NUMÉRICO real da situação financeira do usuário este mês. Sua única tarefa é transformar esses fatos em 3 a 5 mensagens curtas, específicas e acionáveis — como avisos de um assistente que realmente entende a vida financeira da pessoa.

Regras muito importantes:
- NUNCA invente números. Use apenas os valores já formatados que aparecem no resumo (copie-os exatamente, com o "R$").
- Priorize: contas atrasadas > contas que vencem hoje > risco de estourar o orçamento > parcela terminando > quanto dá pra gastar por dia > elogios quando estiver tudo bem.
- Seja direto e humano, tipo "esse mês você já gastou mais do que devia" ou "hoje é dia de pagar X", sem economês nem enrolação.
- Cada mensagem deve ter no máximo ~140 caracteres.
- "tone" deve ser "danger" para atraso/estouro grave, "warning" para alerta, "success" para boas notícias (ex: última parcela, meta batida), "info" para contexto neutro (ex: quanto dá pra gastar por dia).
- Responda APENAS com um JSON no formato: { "insights": [ { "tone": "danger"|"warning"|"success"|"info", "headline": string (até 5 palavras), "message": string } ] }`

export async function generateInsights(snapshot: FinancialSnapshot): Promise<Insight[]> {
  const openai = getOpenAIClient()
  const facts = snapshotToPromptFacts(snapshot)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: facts },
    ],
  })

  const content = completion.choices[0]?.message.content
  if (!content) throw new Error('A IA não retornou nenhum conteúdo.')

  return insightResponseSchema.parse(JSON.parse(content)).insights
}
