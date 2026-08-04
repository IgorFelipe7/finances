import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'

export function Sidebar() {
  const isCollapsed = useUIPreferencesStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useUIPreferencesStore((state) => state.setSidebarCollapsed)

  return (
    <TooltipProvider>
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 248 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="relative hidden shrink-0 flex-col overflow-hidden border-r border-white/10 bg-black/20 backdrop-blur-xl md:flex"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden">
          <motion.div
            className="absolute -top-28 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
            animate={{ opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center gap-2.5 overflow-hidden px-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-5 shadow-lg shadow-primary/30">
              <Landmark className="size-4 text-primary-foreground" />
            </span>
            <span
              className={cn(
                'whitespace-nowrap text-sm font-semibold tracking-tight text-foreground transition-opacity duration-150',
                isCollapsed && 'opacity-0',
              )}
            >
              Finanças
            </span>
          </div>

          <nav className="flex-1 space-y-1 px-2 pt-2">
            {NAV_ITEMS.map((item, index) => {
              const link = (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm transition-transform active:scale-[0.98]',
                      !isActive && 'hover:bg-white/5',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-lg bg-primary shadow-lg shadow-primary/25"
                          transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                        />
                      )}
                      <item.icon
                        className={cn(
                          'relative z-10 size-4 shrink-0 transition-transform duration-150 group-hover:scale-110',
                          isActive ? 'text-primary-foreground' : 'text-zinc-400 group-hover:text-foreground',
                        )}
                      />
                      {!isCollapsed && (
                        <span
                          className={cn(
                            'relative z-10 whitespace-nowrap',
                            isActive ? 'text-primary-foreground' : 'text-zinc-400 group-hover:text-foreground',
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </motion.div>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!isCollapsed)}
            className="flex shrink-0 items-center justify-center gap-2 overflow-hidden border-t border-white/10 px-4 py-3 text-xs text-zinc-400 transition-colors hover:text-foreground"
          >
            <ChevronLeft
              className={cn(
                'size-4 shrink-0 transition-transform duration-300',
                isCollapsed && 'rotate-180',
              )}
            />
            {!isCollapsed && <span className="whitespace-nowrap">Recolher</span>}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
