import type { Account } from '@/features/accounts/schemas/account.schema'
import { TRANSACTION_CATEGORY_SUGGESTIONS } from '@/features/transactions/constants'
import {
  aiTransactionResultSchema,
  type AiTransactionResult,
} from '@/features/transactions/schemas/ai-transaction.schema'
import { callOpenAI } from '@/lib/aiProxy'

function buildSystemPrompt(accounts: Account[], existingCategories: string[]): string {
  const accountList = accounts
    .map((account) => `- id: "${account.id}", nome: "${account.name}", tipo: "${account.type}"`)
    .join('\n')

  const today = new Date().toISOString().slice(0, 10)
  const usedCategories = existingCategories.length > 0 ? existingCategories.map((c) => `"${c}"`).join(', ') : '(nenhuma ainda)'

  return `Você é um leitor de recibos e notas fiscais para um app de finanças pessoais em português do Brasil.

Contas ativas do usuário (use o "id" exato, nunca invente um id):
${accountList}

Categorias que o usuário já usou antes — REUTILIZE uma delas (mesma grafia) sempre que fizer sentido; só crie uma nova se nenhuma encaixar:
${usedCategories}

Se nenhuma categoria já usada encaixar, prefira uma destas: ${TRANSACTION_CATEGORY_SUGGESTIONS.join(', ')}.

Data de hoje: ${today}

Analise a imagem do recibo/nota fiscal e devolva APENAS um JSON com este formato exato:
{
  "title": string (nome do estabelecimento, ex: "Supermercado Extra"),
  "amount": number (valor TOTAL pago, positivo — o total final, não subtotal),
  "transaction_type": "expense",
  "account_id": string (use a primeira conta da lista, a menos que o recibo indique claramente outra forma de pagamento reconhecível),
  "destination_account_id": null,
  "category": string | null (reutilize uma categoria já usada quando possível),
  "date": string (data do recibo em YYYY-MM-DD; use a data de hoje se ilegível),
  "is_fixed": false
}

Regras:
- Recibos são sempre "expense".
- Nunca invente um id de conta que não esteja na lista.
- Se a imagem não for um recibo legível, responda com amount: 0.1, title: "Não consegui ler o recibo", category: null.
- Responda somente com o objeto JSON, sem texto adicional.`
}

export async function scanReceiptImage(
  imageDataUrl: string,
  accounts: Account[],
  existingCategories: string[] = [],
): Promise<AiTransactionResult> {
  const completion = await callOpenAI({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt(accounts, existingCategories) },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extraia os dados desse recibo.' },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
  })

  const content = completion.choices[0]?.message.content
  if (!content) throw new Error('A IA não retornou nenhum conteúdo.')

  return aiTransactionResultSchema.parse(JSON.parse(content))
}
