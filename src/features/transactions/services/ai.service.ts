import type { Account } from '@/features/accounts/schemas/account.schema'
import { TRANSACTION_CATEGORY_SUGGESTIONS } from '@/features/transactions/constants'
import { callOpenAI } from '@/lib/aiProxy'
import {
  aiTransactionResultSchema,
  type AiTransactionResult,
} from '@/features/transactions/schemas/ai-transaction.schema'

function buildSystemPrompt(accounts: Account[], existingCategories: string[]): string {
  const accountList = accounts
    .map((account) => `- id: "${account.id}", nome: "${account.name}", tipo: "${account.type}"`)
    .join('\n')

  const today = new Date().toISOString().slice(0, 10)

  const usedCategories = existingCategories.length > 0 ? existingCategories.map((c) => `"${c}"`).join(', ') : '(nenhuma ainda)'

  return `Você é um parser de transações financeiras para um app de finanças pessoais em português do Brasil.

Contas ativas do usuário (use o "id" exato ao referenciar uma conta, nunca invente um id):
${accountList}

Categorias que o usuário já usou antes — REUTILIZE uma delas, com EXATAMENTE a mesma grafia (maiúsculas/minúsculas, singular/plural), sempre que a transação combinar com alguma. Só crie uma categoria nova se nenhuma dessas encaixar:
${usedCategories}

Se nenhuma categoria já usada encaixar, prefira uma destas sugestões padrão antes de inventar algo novo: ${TRANSACTION_CATEGORY_SUGGESTIONS.join(', ')}.

Data de hoje: ${today}

Interprete a mensagem do usuário e devolva APENAS um JSON com este formato exato:
{
  "title": string (descrição curta e específica; inclua nomes próprios/destinatários mencionados, ex: "Dízimo - AD Hortolândia", "Uber", "Supermercado"),
  "amount": number (positivo, em reais — veja a regra "valor com referência" abaixo se houver mais de um número no texto),
  "transaction_type": "income" | "expense" | "transfer",
  "account_id": string (id da conta de origem, escolhido da lista acima pelo nome mencionado),
  "destination_account_id": string | null (id da conta de destino, APENAS se transaction_type for "transfer"),
  "category": string | null (reutilize uma categoria já usada quando possível — ver acima — ou null se não for claro),
  "date": string (formato YYYY-MM-DD; use a data de hoje se não for mencionada),
  "is_fixed": boolean (true se for uma despesa/receita fixa que se repete todo mês, ex: aluguel, assinatura, mensalidade, salário; false caso contrário)
}

Regras:
- Se o usuário disser "paguei", "gastei", "comprei" → transaction_type "expense".
- Se disser "recebi", "ganhei", "caiu" → transaction_type "income".
- Se disser "transferi X do banco A pro banco B" → transaction_type "transfer", account_id = banco A, destination_account_id = banco B.
- Se nenhum banco for mencionado, use a primeira conta da lista como account_id.
- Nunca invente um id de conta que não esteja na lista.
- VALOR COM REFERÊNCIA: se o texto mencionar dois valores, um específico e outro de referência/total (ex: "22 reais de dízimo dos 212,50 reais", "paguei 50 de uma compra de 300"), o "amount" é sempre o valor específico que realmente saiu da conta — o primeiro, ligado diretamente à ação — NUNCA o valor de referência que vem depois de "de"/"dos"/"do total". Exemplo: "22 reais de dízimo dos 212,50 reais para AD Hortolândia" → amount: 22 (não 212,50), title: "Dízimo - AD Hortolândia", category: reutilize "Doações" se já existir na lista, senão crie "Doações" (sempre no plural).
- Categoria: nunca crie uma variação de uma categoria já existente (ex: se já existe "Doações", nunca crie "Doação", "Doacoes" ou "Doaçoes" — use exatamente "Doações").
- Marque "is_fixed": true sempre que o texto indicar recorrência mensal: palavras como "fixo", "fixa", "todo mês", "toda mês", "mensal", "mensalidade", "assinatura", ou nomes de serviços de assinatura (Netflix, Spotify, aluguel, academia, plano de saúde) mencionados sem indicação de compra avulsa.
- Transferências nunca são fixas: se transaction_type for "transfer", "is_fixed" deve ser sempre false.
- Se houver dúvida se é fixo ou avulso, prefira "is_fixed": false.
- Responda somente com o objeto JSON, sem texto adicional.`
}

export async function parseTransactionText(
  text: string,
  accounts: Account[],
  existingCategories: string[] = [],
): Promise<AiTransactionResult> {
  const completion = await callOpenAI({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt(accounts, existingCategories) },
      { role: 'user', content: text },
    ],
  })

  const content = completion.choices[0]?.message.content
  if (!content) {
    throw new Error('A IA não retornou nenhum conteúdo.')
  }

  return aiTransactionResultSchema.parse(JSON.parse(content))
}
