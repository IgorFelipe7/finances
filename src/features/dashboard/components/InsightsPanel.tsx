import { motion } from 'framer-motion'
import { AlertOctagon, AlertTriangle, Lightbulb, PartyPopper, RotateCw, Sparkles, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFinancialInsights } from '@/features/dashboard/hooks/useFinancialInsights'
import type { Insight, InsightTone } from '@/features/dashboard/schemas/insight.schema'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { cn } from '@/lib/utils'

const TONE_META: Record<
  InsightTone,
  { icon: LucideIcon; text: string; bar: string; border: string; ring: string; glow: string }
> = {
  danger: {
    icon: AlertOctagon,
    text: 'text-destructive',
    bar: 'bg-destructive',
    border: 'border-l-destructive',
    ring: 'ring-destructive/25',
    glow: 'shadow-[0_0_40px_-12px_var(--destructive)]',
  },
  warning: {
    icon: AlertTriangle,
    text: 'text-chart-3',
    bar: 'bg-chart-3',
    border: 'border-l-chart-3',
    ring: 'ring-chart-3/25',
    glow: 'shadow-[0_0_40px_-12px_var(--chart-3)]',
  },
  success: {
    icon: PartyPopper,
    text: 'text-positive',
    bar: 'bg-positive',
    border: 'border-l-positive',
    ring: 'ring-positive/25',
    glow: 'shadow-[0_0_40px_-12px_var(--positive)]',
  },
  info: {
    icon: Lightbulb,
    text: 'text-primary',
    bar: 'bg-primary',
    border: 'border-l-primary',
    ring: 'ring-primary/25',
    glow: 'shadow-[0_0_40px_-12px_var(--primary)]',
  },
}

function InsightHero({ insight }: { insight: Insight }) {
  const meta = TONE_META[insight.tone]
  const { maskText } = useMoneyFormatter()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('glass-panel relative flex items-start gap-4 overflow-hidden rounded-xl p-5 ring-1', meta.ring, meta.glow)}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', meta.bar)} />
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-muted', meta.text)}>
        <meta.icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className={cn('text-sm font-semibold', meta.text)}>{maskText(insight.headline)}</p>
        <p className="mt-1 text-sm text-foreground/80">{maskText(insight.message)}</p>
      </div>
    </motion.div>
  )
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const meta = TONE_META[insight.tone]
  const { maskText } = useMoneyFormatter()
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.06 + index * 0.05 }}
      className={cn(
        'relative flex w-64 shrink-0 flex-col gap-2 overflow-hidden rounded-xl border-l-2 bg-muted/30 p-4',
        meta.border,
      )}
    >
      <div className="flex items-center gap-2">
        <meta.icon className={cn('size-4 shrink-0', meta.text)} />
        <p className={cn('text-xs font-semibold', meta.text)}>{maskText(insight.headline)}</p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{maskText(insight.message)}</p>
    </motion.div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="glass-panel h-20 animate-pulse rounded-xl" />
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 w-64 shrink-0 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

export function InsightsPanel() {
  const { insights, isLoading, isFetching, refetch } = useFinancialInsights()

  if (isLoading) return <InsightsSkeleton />
  if (insights.length === 0) return null

  const [hero, ...rest] = insights

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Sparkles className="size-4 text-primary" />
          Para você
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Atualizar insights"
        >
          <RotateCw className={cn('size-3.5', isFetching && 'animate-spin')} />
        </Button>
      </div>

      <InsightHero insight={hero} />

      {rest.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {rest.map((insight, index) => (
            <InsightCard key={`${insight.headline}-${index}`} insight={insight} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
