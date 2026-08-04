import { CreditCard, Landmark, PiggyBank, TrendingUp, type LucideIcon } from 'lucide-react'
import type { AccountType } from '@/features/accounts/schemas/account.schema'

export const ACCOUNT_TYPE_META: Record<AccountType, { label: string; icon: LucideIcon }> = {
  checking: { label: 'Conta Corrente', icon: Landmark },
  savings: { label: 'Poupança', icon: PiggyBank },
  credit_card: { label: 'Cartão de Crédito', icon: CreditCard },
  investment: { label: 'Investimento', icon: TrendingUp },
}

export const ACCOUNT_COLOR_PRESETS = [
  '#6366f1', // indigo (primary)
  '#22c55e', // green
  '#f97316', // orange
  '#ef4444', // red
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ec4899', // pink
  '#8b5cf6', // violet
] as const
