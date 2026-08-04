import { LogOut, User } from 'lucide-react'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { generateMonthOptions } from '@/lib/date'
import { Button } from '@/components/ui/button'
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
  const selectedMonth = useTimeTravelStore((state) => state.selectedMonth)
  const selectedYear = useTimeTravelStore((state) => state.selectedYear)
  const setSelectedPeriod = useTimeTravelStore((state) => state.setSelectedPeriod)

  const selectedValue = `${selectedYear}-${selectedMonth}`

  function handlePeriodChange(next: string) {
    const [year, month] = next.split('-').map(Number)
    setSelectedPeriod(month, year)
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 md:px-8">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
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
