import { AnimatePresence, motion } from 'framer-motion'
import { CalendarHeart } from 'lucide-react'
import { DayAgendaContent } from '@/features/calendar/components/DayAgendaContent'
import type { CalendarDay } from '@/features/calendar/lib/buildCalendarGrid'

interface DayAgendaPanelProps {
  day: CalendarDay
}

function formatPanelDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

/** Desktop-only companion to the grid — updates live as the user clicks around, no modal needed. */
export function DayAgendaPanel({ day }: DayAgendaPanelProps) {
  return (
    <div className="glass-panel sticky top-4 hidden max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl p-4 lg:flex">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarHeart className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {day.isToday ? 'Hoje' : 'Dia selecionado'}
          </p>
          <p className="truncate text-sm font-semibold text-foreground capitalize">{formatPanelDate(day.date)}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={day.iso}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <DayAgendaContent day={day} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
