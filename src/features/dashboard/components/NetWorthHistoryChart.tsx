import { Landmark } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { ChartPanelSkeleton } from '@/features/dashboard/components/PanelSkeletons'
import { useNetWorthHistory } from '@/features/dashboard/hooks/useNetWorthHistory'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { cn } from '@/lib/utils'

function NetWorthTooltip({ active, payload, label }: TooltipContentProps) {
  const { formatMoney } = useMoneyFormatter()
  if (!active || !payload?.length) return null
  const value = Number(payload[0]?.value ?? 0)

  return (
    <div className="min-w-36 rounded-lg border border-border bg-popover p-3 text-xs shadow-2xl backdrop-blur-xl">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      <p className={cn('font-semibold num', value >= 0 ? 'text-positive' : 'text-destructive')}>
        {formatMoney(value)}
      </p>
    </div>
  )
}

export function NetWorthHistoryChart() {
  const { points, isLoading } = useNetWorthHistory()
  const { formatMoney, formatMoneyCompact } = useMoneyFormatter()
  const first = points[0]?.netWorth ?? 0
  const last = points.at(-1)?.netWorth ?? 0
  const change = last - first
  const hasData = points.length > 0

  if (isLoading) return <ChartPanelSkeleton plotClassName="h-56" label="Carregando patrimônio ao longo do tempo" />

  return (
    <div className="surface-panel flex h-full flex-col rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Landmark className="size-4 text-primary" />
            Patrimônio ao Longo do Tempo
          </h3>
          <p className="text-xs text-muted-foreground">Evolução do patrimônio líquido nos últimos {points.length} meses</p>
        </div>
        {hasData && (
          <span className={cn('text-xs font-semibold num', change >= 0 ? 'text-positive' : 'text-destructive')}>
            {change >= 0 ? '+' : ''}
            {formatMoney(change)}
          </span>
        )}
      </div>

      {/* Definite height, and deliberately no `flex-1`. ResponsiveContainer is height="100%",
          so it needs a definite parent height to resolve against — min-height alone leaves
          height:auto and it measures 0. `flex-1` would set flex-basis:0 and collapse it too. */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              dy={8}
            />
            {/* width 80: mono digits are wider than Geist's, and 64 clipped "R$ 1,4 mil". */}
            <YAxis
              axisLine={false}
              tickLine={false}
              width={80}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickFormatter={(value) => formatMoneyCompact(Number(value))}
            />

            <Tooltip content={NetWorthTooltip} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#netWorthFill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
