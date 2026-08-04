import {
  AlertTriangle,
  Clock,
  Handshake,
  PiggyBank,
  RefreshCw,
  Repeat,
  Shield,
  Target,
  type LucideIcon,
} from 'lucide-react'

export type TipCategory = 'habito' | 'reserva' | 'investimento' | 'divida'

export interface SavingsTip {
  id: string
  icon: LucideIcon
  title: string
  description: string
  category: TipCategory
}

export const TIP_CATEGORY_LABELS: Record<TipCategory, string> = {
  habito: 'Hábito',
  reserva: 'Reserva',
  investimento: 'Investimento',
  divida: 'Dívida',
}

/**
 * General financial-literacy principles — never a specific product/ticker recommendation.
 * Grounded in the standard emergency-fund (3–6 months) and 50/30/20 guidance, and current
 * (2026) Tesouro Selic / CDB-vs-poupança comparisons researched for this feature.
 */
export const SAVINGS_TIPS: SavingsTip[] = [
  {
    id: 'automatizar',
    icon: Repeat,
    title: 'Automatize a poupança',
    description: 'Programe uma transferência automática pro dia seguinte ao do seu pagamento — o que sai de vista não vira gasto.',
    category: 'habito',
  },
  {
    id: '24h',
    icon: Clock,
    title: 'Regra das 24 horas',
    description: 'Pra compras não essenciais acima de um valor que você definir, espere um dia antes de fechar. Boa parte do impulso passa.',
    category: 'habito',
  },
  {
    id: 'divida-primeiro',
    icon: AlertTriangle,
    title: 'Quite dívida cara antes de investir',
    description: 'Juros de cartão e cheque especial passam de 400% ao ano — nenhum investimento paga isso. Zere essas dívidas primeiro.',
    category: 'divida',
  },
  {
    id: 'reserva-primeiro',
    icon: Shield,
    title: 'Reserva antes de investir em risco',
    description: 'Só depois de ter de 3 a 6 meses de despesas guardados em algo líquido vale considerar renda variável.',
    category: 'reserva',
  },
  {
    id: 'onde-guardar',
    icon: PiggyBank,
    title: 'Renda fixa líquida rende mais que poupança',
    description: 'Opções como Tesouro Selic ou CDB com liquidez diária rendem bem mais que a poupança, com risco baixo e resgate rápido (D+1).',
    category: 'investimento',
  },
  {
    id: 'assinaturas',
    icon: RefreshCw,
    title: 'Audite assinaturas todo trimestre',
    description: 'Serviços que você esqueceu que tem são o vazamento mais comum de dinheiro — e o mais fácil de estancar.',
    category: 'habito',
  },
  {
    id: 'negociar',
    icon: Handshake,
    title: 'Renegocie contas fixas 1x por ano',
    description: 'Internet, seguro, plano de celular — ligue e pergunte se tem oferta melhor. Poucos minutos, economia recorrente.',
    category: 'habito',
  },
  {
    id: 'metas',
    icon: Target,
    title: 'Separe reservas por objetivo',
    description: 'Uma reserva de emergência e uma de "viagem" ou "compra grande" separadas evitam que você invada uma pela outra.',
    category: 'reserva',
  },
]
