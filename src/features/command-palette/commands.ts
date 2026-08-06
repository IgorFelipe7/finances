import {
  ArrowLeftRight,
  Bot,
  CalendarDays,
  LayoutDashboard,
  PanelLeftClose,
  Repeat,
  Settings,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type CommandAction =
  | { type: 'navigate'; href: string }
  | { type: 'open-assistant' }
  | { type: 'toggle-sidebar' }

export interface Command {
  id: string
  label: string
  group: 'Navegar' | 'Ações'
  icon: LucideIcon
  action: CommandAction
}

export const COMMANDS: Command[] = [
  { id: 'nav-dashboard', label: 'Ir para Dashboard', group: 'Navegar', icon: LayoutDashboard, action: { type: 'navigate', href: '/dashboard' } },
  { id: 'nav-transactions', label: 'Ir para Transações', group: 'Navegar', icon: ArrowLeftRight, action: { type: 'navigate', href: '/transactions' } },
  { id: 'nav-fixed', label: 'Ir para Gastos Fixos', group: 'Navegar', icon: Repeat, action: { type: 'navigate', href: '/fixed-expenses' } },
  { id: 'nav-calendar', label: 'Ir para Calendário', group: 'Navegar', icon: CalendarDays, action: { type: 'navigate', href: '/calendario' } },
  { id: 'nav-economia', label: 'Ir para Economia', group: 'Navegar', icon: Target, action: { type: 'navigate', href: '/economia' } },
  { id: 'nav-retrospective', label: 'Ir para Retrospectiva', group: 'Navegar', icon: Sparkles, action: { type: 'navigate', href: '/retrospectiva' } },
  { id: 'nav-accounts', label: 'Ir para Contas', group: 'Navegar', icon: Wallet, action: { type: 'navigate', href: '/accounts' } },
  { id: 'nav-settings', label: 'Ir para Configurações', group: 'Navegar', icon: Settings, action: { type: 'navigate', href: '/settings' } },
  { id: 'action-assistant', label: 'Abrir assistente de IA', group: 'Ações', icon: Bot, action: { type: 'open-assistant' } },
  { id: 'action-sidebar', label: 'Recolher/expandir menu lateral', group: 'Ações', icon: PanelLeftClose, action: { type: 'toggle-sidebar' } },
]
