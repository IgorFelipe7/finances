import { TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { useCashFlowSeries } from '@/features/dashboard/hooks/useCashFlowSeries'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'
import { cn } from '@/lib/utils'

function CashFlowTooltip({ active, payload, label }: TooltipContentProps) {
  const { formatMoney } = useMoneyFormatter()
  if (!active || !payload?.length) return null
  const income = payload.find((entry) => entry.dataKey === 'income')?.value ?? 0
  const expense = payload.find((entry) => entry.dataKey === 'expense')?.value ?? 0
  const net = Number(income) - Number(expense)

  return (
    <div className="min-w-44 rounded-lg border border-border bg-popover p-3 text-xs shadow-2xl backdrop-blur-xl">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full bg-positive" />
            Receitas
          </span>
          <span className="font-semibold tabular-nums text-foreground">{formatMoney(Number(income))}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full bg-destructive" />
            Despesas
          </span>
          <span className="font-semibold tabular-nums text-foreground">{formatMoney(Number(expense))}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-border pt-1.5">
          <span className="text-muted-foreground">Saldo</span>
          <span className={cn('font-semibold tabular-nums', net >= 0 ? 'text-positive' : 'text-destructive')}>
            {formatMoney(net)}
          </span>
        </div>
      </div>
    </div>
  )
}

function LegendSwatch({ colorClassName, label }: { colorClassName: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn('h-0.5 w-3 rounded-full', colorClassName)} />
      {label}
    </span>
  )
}

export function CashFlowAreaChart() {
  const points = useCashFlowSeries()
  const { formatMoneyCompact } = useMoneyFormatter()
  const todayIndex = points.findIndex((point) => point.isFuture)
  const referenceLabel = todayIndex > 0 ? points[todayIndex - 1].label : null

  return (
    <div className="glass-panel flex h-full flex-col rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <TrendingUp className="size-4 text-primary" />
            Fluxo de Caixa
          </h3>
          <p className="text-xs text-muted-foreground">Receitas vs despesas dos últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-3">
          <LegendSwatch colorClassName="bg-positive" label="Receitas" />
          <LegendSwatch colorClassName="bg-destructive" label="Despesas" />
        </div>
      </div>

      <div className="h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cashFlowIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--positive)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cashFlowExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
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
              tickFormatter={(value) => formatMoneyCompact(Number(value))}
            />

            <Tooltip content={CashFlowTooltip} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

            {referenceLabel && (
              <ReferenceLine
                x={referenceLabel}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: 'Hoje', position: 'insideTopRight', fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
            )}

            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--positive)"
              strokeWidth={2}
              fill="url(#cashFlowIncome)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--destructive)"
              strokeWidth={2}
              fill="url(#cashFlowExpense)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
