import { motion } from 'framer-motion'
import type { CalendarDay } from '@/features/calendar/lib/buildCalendarGrid'
import { cn } from '@/lib/utils'

const compactNumberFormatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

interface CalendarDayCellProps {
  day: CalendarDay
  maxExpense: number
  isSelected: boolean
  onSelect: () => void
  index: number
}

export function CalendarDayCell({ day, maxExpense, isSelected, onSelect, index }: CalendarDayCellProps) {
  const heat = maxExpense > 0 ? Math.min(day.expense / maxExpense, 1) : 0
  const hasActivity = day.income > 0 || day.expense > 0
  const isClickable = day.isCurrentMonth || day.entries.length > 0

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={!isClickable}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.008, 0.25) }}
      whileHover={isClickable ? { y: -2 } : undefined}
      whileTap={isClickable ? { scale: 0.97 } : undefined}
      className={cn(
        'group relative flex aspect-square flex-col overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-1.5 text-left transition-colors sm:aspect-auto sm:h-24 sm:p-2.5',
        isClickable && 'hover:border-white/10 hover:bg-white/[0.05]',
        !day.isCurrentMonth && 'opacity-30',
        day.isToday && !isSelected && 'border-primary/30',
        isSelected && 'border-primary/60 bg-primary/[0.08] ring-1 ring-primary/40',
      )}
    >
      {heat > 0 && (
        <div
          className="pointer-events-none absolute -bottom-6 left-1/2 size-20 -translate-x-1/2 rounded-full bg-destructive blur-xl"
          style={{ opacity: 0.1 + heat * 0.3 }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums',
            day.isToday
              ? 'bg-gradient-to-br from-primary to-chart-5 text-primary-foreground shadow-lg shadow-primary/30'
              : day.isWeekend
                ? 'text-zinc-600'
                : 'text-zinc-300',
          )}
        >
          {day.date.getDate()}
        </span>

        {day.hasOverdue && (
          <motion.span
            className="size-1.5 shrink-0 rounded-full bg-destructive"
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.3, repeat: Infinity }}
          />
        )}
        {!day.hasOverdue && day.hasPending && <span className="size-1.5 shrink-0 rounded-full bg-chart-3" />}
      </div>

      {hasActivity && (
        <div className="relative mt-auto hidden flex-wrap gap-1 sm:flex">
          {day.income > 0 && (
            <span className="rounded-full bg-positive/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-positive">
              +{compactNumberFormatter.format(day.income)}
            </span>
          )}
          {day.expense > 0 && (
            <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-destructive">
              -{compactNumberFormatter.format(day.expense)}
            </span>
          )}
        </div>
      )}

      {hasActivity && (
        <div className="relative mt-auto flex gap-1 sm:hidden">
          {day.income > 0 && <span className="size-1.5 rounded-full bg-positive" />}
          {day.expense > 0 && <span className="size-1.5 rounded-full bg-destructive" />}
        </div>
      )}
    </motion.button>
  )
}
