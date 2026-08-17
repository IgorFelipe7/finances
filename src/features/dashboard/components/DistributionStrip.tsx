import { motion } from 'framer-motion'
import { Skeleton, SkeletonPanel } from '@/components/ui/skeleton'
import { useCategoryBreakdown } from '@/features/dashboard/hooks/useCategoryBreakdown'
import { useTimeTravelStore } from '@/features/dashboard/store/useTimeTravelStore'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { MONTH_NAMES_PT_BR } from '@/lib/date'
import { cn } from '@/lib/utils'

const SEGMENT_COLORS = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-2)', 'var(--chart-4)']

/**
 * Where the month's spending went: one column per category, divided by hairline rules,
 * with column *width* proportional to spend and bar *height* proportional to share. A
 * dashed marker sits at the average share so outliers read at a glance.
 *
 * Labels and bars are separate rows sharing the same width math, which lets the average
 * marker span the full track as a single overlay instead of being stitched per column.
 */
export function DistributionStrip() {
  const { slices, total, isLoading } = useCategoryBreakdown()
  const { formatMoney } = useMoneyFormatter()
  const selectedMonth = useTimeTravelStore((state) => state.selectedMonth)
  const selectedYear = useTimeTravelStore((state) => state.selectedYear)
  const reduceMotion = useUIPreferencesStore((state) => state.reduceMotion)

  if (isLoading) {
    return (
      <SkeletonPanel label="Carregando distribuição" className="flex h-full flex-col justify-end">
        <Skeleton className="h-3 w-28" />
        <div className="mt-4 flex items-end gap-3">
          {[60, 85, 45, 70].map((height, index) => (
            <div key={index} className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16 max-w-full" />
              <Skeleton className="w-full rounded-sm" style={{ height }} />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    )
  }

  if (slices.length === 0) {
    return (
      <div className="flex h-full min-h-44 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium text-foreground">Sem despesas neste mês</p>
        <p className="text-xs text-muted-foreground">Lance uma transação e a distribuição aparece aqui.</p>
      </div>
    )
  }

  const averageShare = 1 / slices.length
  const peakShare = Math.max(...slices.map((slice) => slice.percent))
  const widthFor = (percent: number) => `${Math.max(percent * 100, 12)}%`

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Para onde foi</p>
        <p className="num text-sm font-medium text-foreground">{formatMoney(total)}</p>
      </div>

      <div className="flex">
        {slices.map((slice, index) => (
          <div
            key={slice.category}
            className={cn('min-w-0 px-2 sm:px-3', index > 0 && 'border-l border-border')}
            style={{ width: widthFor(slice.percent) }}
          >
            <p className="num text-xs font-medium text-foreground">{(slice.percent * 100).toFixed(0)}%</p>
            <p className="truncate text-[11px] text-muted-foreground">{slice.category}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-2 flex min-h-20 flex-1 items-end">
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-muted-foreground/40"
          style={{ bottom: `${(averageShare / peakShare) * 100}%` }}
        >
          <span className="absolute right-0 -translate-y-1/2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            Média
          </span>
        </div>

        {slices.map((slice, index) => (
          <div
            key={slice.category}
            className={cn('h-full min-w-0 px-2 sm:px-3', index > 0 && 'border-l border-border')}
            style={{ width: widthFor(slice.percent) }}
          >
            <div className="relative h-full">
              <motion.div
                className="absolute inset-x-0 bottom-0 rounded-sm"
                style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                initial={reduceMotion ? false : { height: 0 }}
                animate={{ height: `${Math.max((slice.percent / peakShare) * 100, 4)}%` }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
        {MONTH_NAMES_PT_BR[selectedMonth]} {selectedYear}
      </p>
    </div>
  )
}
