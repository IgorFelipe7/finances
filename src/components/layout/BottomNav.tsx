import { MoreHorizontal } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

// Only 4 fit a phone width without labels wrapping — the rest live behind "Mais".
const PRIMARY_HREFS = ['/dashboard', '/transactions', '/calendario', '/accounts']

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const primaryItems = NAV_ITEMS.filter((item) => PRIMARY_HREFS.includes(item.href))
  const overflowItems = NAV_ITEMS.filter((item) => !PRIMARY_HREFS.includes(item.href))
  const isOverflowActive = overflowItems.some((item) => item.href === location.pathname)

  return (
    <nav className="glass-panel fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-1 py-2 md:hidden">
      {primaryItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] text-muted-foreground transition-colors',
              isActive && 'text-primary',
            )
          }
        >
          <item.icon className="size-5" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] text-muted-foreground transition-colors',
              isOverflowActive && 'text-primary',
            )}
          >
            <MoreHorizontal className="size-5" />
            <span>Mais</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={12}>
          {overflowItems.map((item) => (
            <DropdownMenuItem key={item.href} onSelect={() => navigate(item.href)}>
              <item.icon className="size-4" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
