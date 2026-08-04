import { PieChart as PieChartIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts'
import { useCategoryBreakdown } from '@/features/dashboard/hooks/useCategoryBreakdown'
import { formatCurrency } from '@/lib/currency'

const CATEGORY_COLORS = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-4)', 'var(--chart-2)']
const OTHERS_COLOR = 'var(--muted-foreground)'

function colorFor(category: string, index: number) {
  return category === 'Outros' ? OTHERS_COLOR : CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

function CategoryTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const percent = (entry.payload as { percent: number }).percent

  return (
    <div className="min-w-40 rounded-lg border border-white/10 bg-black/80 p-3 text-xs shadow-2xl backdrop-blur-xl">
      <p className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
        {entry.name}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-zinc-400">{(percent * 100).toFixed(0)}% do total</span>
        <span className="font-semibold tabular-nums text-foreground">{formatCurrency(Number(entry.value))}</span>
      </div>
    </div>
  )
}

export function CategoryDonutChart() {
  const { slices, total } = useCategoryBreakdown()

  return (
    <div className="glass-panel flex h-full flex-col rounded-xl p-5">
      <div className="mb-4">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <PieChartIcon className="size-4 text-primary" />
          Despesas por Categoria
        </h3>
        <p className="text-xs text-zinc-400">Distribuição do mês selecionado</p>
      </div>

      {slices.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-xs text-zinc-400">
          Nenhuma despesa registrada neste mês.
        </div>
      ) : (
        <>
          <div className="relative h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="none"
                >
                  {slices.map((slice, index) => (
                    <Cell key={slice.category} fill={colorFor(slice.category, index)} />
                  ))}
                </Pie>
                <Tooltip content={CategoryTooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(total)}</p>
              <p className="text-[11px] text-zinc-400">total no mês</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
            {slices.map((slice, index) => (
              <li key={slice.category} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-zinc-400">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colorFor(slice.category, index) }}
                  />
                  <span className="truncate">{slice.category}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span className="text-zinc-500">{(slice.percent * 100).toFixed(0)}%</span>
                  <span className="font-medium text-foreground">{formatCurrency(slice.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
