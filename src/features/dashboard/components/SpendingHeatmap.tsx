import { CalendarBlank } from '@phosphor-icons/react'
import { Skeleton, SkeletonPanel } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDailySpending } from '@/features/dashboard/hooks/useDailySpending'
import type { SpendingDay } from '@/features/dashboard/lib/computeDailySpending'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const WEEKDAY_TITLES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

/** Level 0 is an empty well rather than a faint tint, so "no spend" reads as absence. */
const LEVEL_CLASSES: Record<SpendingDay['level'], string> = {
  0: 'bg-muted/40',
  1: 'bg-primary/25',
  2: 'bg-primary/45',
  3: 'bg-primary/70',
  4: 'bg-primary',
}

function DayCell({ cell }: { cell: SpendingDay }) {
  const { formatMoney } = useMoneyFormatter()

  if (cell.day === null) return <div className="aspect-square rounded-[5px]" />

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'aspect-square cursor-default rounded-[5px] transition-transform hover:scale-110',
            LEVEL_CLASSES[cell.level],
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        <span className="num">
          Dia {cell.day} · {formatMoney(cell.amount)}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

export function SpendingHeatmap() {
  const { weeks, isLoading } = useDailySpending()

  if (isLoading) {
    return (
      <SkeletonPanel label="Carregando intensidade de gastos" className="surface-panel h-full rounded-xl p-5">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-[5px]" />
          ))}
        </div>
      </SkeletonPanel>
    )
  }

  return (
    <div className="surface-panel flex h-full flex-col rounded-xl p-5">
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <CalendarBlank className="size-4 text-primary" weight="duotone" />
        Intensidade de gastos
      </h3>
      <p className="text-xs text-muted-foreground">Quanto mais claro, maior o gasto do dia</p>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((label, index) => (
          <span
            key={index}
            title={WEEKDAY_TITLES[index]}
            className="text-center text-[10px] font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-1.5 flex flex-1 flex-col gap-1.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
            {week.map((cell, dayIndex) => (
              <DayCell key={`${weekIndex}-${dayIndex}`} cell={cell} />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        Menos
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={cn('size-2.5 rounded-[3px]', LEVEL_CLASSES[level])} />
        ))}
        Mais
      </div>
    </div>
  )
}
