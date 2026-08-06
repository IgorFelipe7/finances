import { motion } from 'framer-motion'
import type { CalendarDay } from '@/features/calendar/lib/buildCalendarGrid'
import { cn } from '@/lib/utils'

const compactNumberFormatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

interface CalendarDayCellProps {
  day: CalendarDay
  maxExpense: number
  isSelected: boolean
  onSelect: () => void
}

export function CalendarDayCell({ day, maxExpense, isSelected, onSelect }: CalendarDayCellProps) {
  const heat = maxExpense > 0 ? Math.min(day.expense / maxExpense, 1) : 0
  const hasActivity = day.income > 0 || day.expense > 0

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!day.isCurrentMonth && day.entries.length === 0}
      className={cn(
        'group relative flex h-16 flex-col overflow-hidden rounded-lg border border-transparent p-1.5 text-left transition-colors sm:h-24 sm:p-2',
        day.isCurrentMonth ? 'hover:border-white/10 hover:bg-white/[0.04]' : 'opacity-35',
        isSelected && 'border-primary/50 bg-primary/10',
      )}
    >
      {heat > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-destructive/25"
          style={{ height: `${8 + heat * 42}%` }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums sm:size-6',
            day.isToday ? 'bg-primary text-primary-foreground' : day.isWeekend ? 'text-zinc-500' : 'text-zinc-300',
          )}
        >
          {day.date.getDate()}
        </span>
        {day.hasOverdue && (
          <motion.span
            className="size-1.5 shrink-0 rounded-full bg-destructive"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
        {!day.hasOverdue && day.hasPending && <span className="size-1.5 shrink-0 rounded-full bg-chart-3" />}
      </div>

      {hasActivity && (
        <div className="relative mt-auto hidden space-y-0.5 sm:block">
          {day.income > 0 && (
            <p className="truncate text-[11px] font-medium tabular-nums text-positive">
              +{compactNumberFormatter.format(day.income)}
            </p>
          )}
          {day.expense > 0 && (
            <p className="truncate text-[11px] font-medium tabular-nums text-destructive">
              -{compactNumberFormatter.format(day.expense)}
            </p>
          )}
        </div>
      )}

      {hasActivity && (
        <div className="relative mt-auto flex gap-0.5 sm:hidden">
          {day.income > 0 && <span className="size-1.5 rounded-full bg-positive" />}
          {day.expense > 0 && <span className="size-1.5 rounded-full bg-destructive" />}
        </div>
      )}
    </button>
  )
}
