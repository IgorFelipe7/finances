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
import { useNetWorthHistory } from '@/features/dashboard/hooks/useNetWorthHistory'
import { formatCompactCurrency, formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

function NetWorthTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const value = Number(payload[0]?.value ?? 0)

  return (
    <div className="min-w-36 rounded-lg border border-white/10 bg-black/80 p-3 text-xs shadow-2xl backdrop-blur-xl">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      <p className={cn('font-semibold tabular-nums', value >= 0 ? 'text-positive' : 'text-destructive')}>
        {formatCurrency(value)}
      </p>
    </div>
  )
}

export function NetWorthHistoryChart() {
  const points = useNetWorthHistory()
  const first = points[0]?.netWorth ?? 0
  const last = points.at(-1)?.netWorth ?? 0
  const change = last - first
  const hasData = points.length > 0

  return (
    <div className="glass-panel flex h-full flex-col rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Landmark className="size-4 text-primary" />
            Patrimônio ao Longo do Tempo
          </h3>
          <p className="text-xs text-zinc-400">Evolução do patrimônio líquido nos últimos {points.length} meses</p>
        </div>
        {hasData && (
          <span className={cn('text-xs font-semibold tabular-nums', change >= 0 ? 'text-positive' : 'text-destructive')}>
            {change >= 0 ? '+' : ''}
            {formatCurrency(change)}
          </span>
        )}
      </div>

      <div className="h-56 flex-1">
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
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickFormatter={(value) => formatCompactCurrency(Number(value))}
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
