import { motion } from 'framer-motion'
import { CalendarX2, CircleDollarSign, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CalendarDay } from '@/features/calendar/lib/buildCalendarGrid'
import { PayTransactionDialog } from '@/features/transactions/components/PayTransactionDialog'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'
import { TRANSACTION_TYPE_META } from '@/features/transactions/constants'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface DayAgendaContentProps {
  day: CalendarDay
  /** Caps the list height with its own scrollbar — used inside the modal (mobile); the desktop
   * side panel instead lets the page itself scroll, so it stays unbounded there. */
  scrollable?: boolean
}

export function DayAgendaContent({ day, scrollable = false }: DayAgendaContentProps) {
  return (
    <div className="space-y-3">
      {day.entries.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="text-xs text-zinc-400">
            {day.entries.length} lançamento{day.entries.length > 1 ? 's' : ''}
          </span>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              day.net >= 0 ? 'text-positive' : 'text-destructive',
            )}
          >
            {formatCurrency(day.net)}
          </span>
        </div>
      )}

      {day.entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/10 py-8 text-center">
          <CalendarX2 className="size-5 text-zinc-600" />
          <p className="text-xs text-zinc-500">Nenhum lançamento neste dia.</p>
        </div>
      ) : (
        <div className={cn('space-y-1.5', scrollable && 'max-h-[45vh] overflow-y-auto pr-0.5')}>
          {day.entries.map((entry, index) => {
            const meta = TRANSACTION_TYPE_META[entry.transaction_type]
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2) }}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5"
              >
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5', meta.colorClass)}>
                  <meta.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
                  <p className="truncate text-xs text-zinc-400">{entry.category ?? 'Sem categoria'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      entry.transaction_type === 'income' ? 'text-positive' : 'text-destructive',
                    )}
                  >
                    {entry.transaction_type === 'income' ? '+' : '-'}
                    {formatCurrency(entry.amount)}
                  </span>
                  {entry.is_paid ? (
                    <Badge variant="outline" className="text-[10px] text-zinc-400">
                      {entry.transaction_type === 'income' ? 'Recebido' : 'Pago'}
                    </Badge>
                  ) : (
                    <PayTransactionDialog
                      transaction={entry}
                      trigger={
                        <Button type="button" variant="outline" size="sm" className="h-6 gap-1 px-2 text-[11px]">
                          <CircleDollarSign className="size-3" />
                          {entry.transaction_type === 'income' ? 'Receber' : 'Pagar'}
                        </Button>
                      }
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <TransactionFormDialog
        initialValues={{ date: day.iso }}
        trigger={
          <Button type="button" variant="outline" className="w-full gap-1.5">
            <Plus className="size-4" />
            Nova transação neste dia
          </Button>
        }
      />
    </div>
  )
}
