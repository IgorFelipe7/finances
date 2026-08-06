import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDayCell } from '@/features/calendar/components/CalendarDayCell'
import type { CalendarDay } from '@/features/calendar/lib/buildCalendarGrid'

const WEEKDAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface CalendarGridProps {
  days: CalendarDay[]
  monthKey: string
  selectedIso: string | null
  onSelectDay: (day: CalendarDay) => void
}

export function CalendarGrid({ days, monthKey, selectedIso, onSelectDay }: CalendarGridProps) {
  const maxExpense = Math.max(0, ...days.filter((d) => d.isCurrentMonth).map((d) => d.expense))

  return (
    <div className="glass-panel overflow-hidden rounded-xl p-3 sm:p-4">
      <div className="grid grid-cols-7 gap-1 px-1 pb-2 text-center text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
        {WEEKDAY_HEADERS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={monthKey}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day) => (
            <CalendarDayCell
              key={day.iso}
              day={day}
              maxExpense={maxExpense}
              isSelected={day.iso === selectedIso}
              onSelect={() => onSelectDay(day)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
