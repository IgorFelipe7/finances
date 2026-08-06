import { CircleDollarSign, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CalendarDay } from '@/features/calendar/lib/buildCalendarGrid'
import { TRANSACTION_TYPE_META } from '@/features/transactions/constants'
import { PayTransactionDialog } from '@/features/transactions/components/PayTransactionDialog'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface DayDetailDialogProps {
  day: CalendarDay | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDialogDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

export function DayDetailDialog({ day, open, onOpenChange }: DayDetailDialogProps) {
  if (!day) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{formatDialogDate(day.date)}</DialogTitle>
          <DialogDescription>
            {day.entries.length === 0
              ? 'Nenhum lançamento neste dia.'
              : `${day.entries.length} lançamento${day.entries.length > 1 ? 's' : ''} · saldo do dia ${formatCurrency(day.net)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
          {day.entries.map((entry) => {
            const meta = TRANSACTION_TYPE_META[entry.transaction_type]
            return (
              <div
                key={entry.id}
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
              </div>
            )
          })}
        </div>

        <TransactionFormDialog
          initialValues={{ date: day.iso }}
          trigger={
            <Button type="button" variant="outline" className="w-full gap-1.5">
              <Plus className="size-4" />
              Nova transação neste dia
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
