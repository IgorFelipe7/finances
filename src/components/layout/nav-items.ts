import { LayoutDashboard, ArrowLeftRight, Repeat, Target, Wallet, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Gastos Fixos', href: '/fixed-expenses', icon: Repeat },
  { label: 'Economia', href: '/economia', icon: Target },
  { label: 'Contas', href: '/accounts', icon: Wallet },
  { label: 'Configurações', href: '/settings', icon: Settings },
]
