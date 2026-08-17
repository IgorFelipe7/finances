import {
  ArrowsLeftRight,
  CalendarBlank,
  ChartPieSlice,
  GearSix,
  Repeat,
  Target,
  Wallet,
  type Icon,
} from '@phosphor-icons/react'

export interface NavItem {
  label: string
  /** Short form used by the pill nav, where horizontal space is tight. */
  shortLabel: string
  href: string
  icon: Icon
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', shortLabel: 'Início', href: '/dashboard', icon: ChartPieSlice },
  { label: 'Transações', shortLabel: 'Transações', href: '/transactions', icon: ArrowsLeftRight },
  { label: 'Gastos Fixos', shortLabel: 'Fixos', href: '/fixed-expenses', icon: Repeat },
  { label: 'Calendário', shortLabel: 'Agenda', href: '/calendario', icon: CalendarBlank },
  { label: 'Economia', shortLabel: 'Economia', href: '/economia', icon: Target },
  { label: 'Contas', shortLabel: 'Contas', href: '/accounts', icon: Wallet },
  { label: 'Configurações', shortLabel: 'Ajustes', href: '/settings', icon: GearSix },
]
