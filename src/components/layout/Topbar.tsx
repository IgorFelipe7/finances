import { LogOut, Search, User } from 'lucide-react'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useCommandPaletteStore } from '@/features/command-palette/store/useCommandPaletteStore'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { generateMonthOptions } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { HideValuesToggle } from '@/components/layout/HideValuesToggle'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TopbarProps {
  title: string
}

const MONTH_OPTIONS = generateMonthOptions()

export function Topbar({ title }: TopbarProps) {
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
    <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-8">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="hidden gap-2 text-muted-foreground sm:flex"
          onClick={openCommandPalette}
        >
          <Search className="size-4" />
          Buscar
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground/80">Ctrl K</kbd>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="sm:hidden"
          onClick={openCommandPalette}
          aria-label="Buscar"
        >
          <Search className="size-4" />
        </Button>

        <HideValuesToggle />
        <ThemeToggle />

        <Select value={selectedValue} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-40">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Menu do usuário">
              <User className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="max-w-48 truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => supabase.auth.signOut()}>
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
