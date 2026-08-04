import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, type LucideIcon } from 'lucide-react'
import type { TransactionCategoryType } from '@/features/transactions/schemas/transaction.schema'

export const TRANSACTION_TYPE_META: Record<
  TransactionCategoryType,
  { label: string; icon: LucideIcon; colorClass: string }
> = {
  income: { label: 'Receita', icon: ArrowUpCircle, colorClass: 'text-positive' },
  expense: { label: 'Despesa', icon: ArrowDownCircle, colorClass: 'text-destructive' },
  transfer: { label: 'Transferência', icon: ArrowLeftRight, colorClass: 'text-chart-5' },
}

export const TRANSACTION_CATEGORY_SUGGESTIONS = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Assinaturas',
  'Salário',
  'Investimentos',
  'Outros',
]
