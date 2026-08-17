import { MagnifyingGlass, SignOut, UserCircle } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import { HideValuesToggle } from '@/components/layout/HideValuesToggle'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useCommandPaletteStore } from '@/features/command-palette/store/useCommandPaletteStore'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { generateMonthOptions } from '@/lib/date'
import { cn } from '@/lib/utils'

const MONTH_OPTIONS = generateMonthOptions()

/**
 * Header navigation. Replaces the former left sidebar: the app is wide and shallow,
 * so a horizontal pill rail buys back the whole left column for content. The rail is
 * hidden below lg, where BottomNav already covers navigation.
 */
export function TopNav() {
  const user = useAuthStore((state) => state.user)
  const openCommandPalette = useCommandPaletteStore((state) => state.open)
  const selectedMonth = useTimeTravelStore((state) => state.selectedMonth)
  const selectedYear = useTimeTravelStore((state) => state.selectedYear)
  const setSelectedPeriod = useTimeTravelStore((state) => state.setSelectedPeriod)

  const selectedValue = `${selectedYear}-${selectedMonth}`

  function handlePeriodChange(next: string) {
    const [year, month] = next.split('-').map(Number)
    setSelectedPeriod(month, year)
  }

  return (
    <header className="flex items-center gap-3 px-4 py-3 md:px-6">
      <NavLink to="/dashboard" className="flex shrink-0 items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <span className="size-3 rounded-[3px] bg-primary-foreground" />
        </span>
        <span className="hidden text-base font-semibold tracking-tight text-foreground sm:block">Finanças</span>
      </NavLink>

      <nav className="mx-auto hidden items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-border lg:flex">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'rounded-full px-3.5 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-foreground font-medium text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {item.shortLabel}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0 lg:gap-2">
        <Select value={selectedValue} onValueChange={handlePeriodChange}>
          <SelectTrigger className="h-9 w-24 rounded-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={openCommandPalette}
          aria-label="Buscar"
        >
          <MagnifyingGlass className="size-4.5" weight="bold" />
        </Button>

        <HideValuesToggle />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu do usuário">
              <UserCircle className="size-5" weight="duotone" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="max-w-48 truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => supabase.auth.signOut()}>
              <SignOut className="size-4" weight="bold" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
