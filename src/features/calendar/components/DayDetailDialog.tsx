import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DayAgendaContent } from '@/features/calendar/components/DayAgendaContent'
import type { CalendarDay } from '@/features/calendar/lib/buildCalendarGrid'

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
        </DialogHeader>
        <DayAgendaContent day={day} scrollable />
      </DialogContent>
    </Dialog>
  )
}
