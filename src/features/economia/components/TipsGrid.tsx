import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { SAVINGS_TIPS, TIP_CATEGORY_LABELS } from '@/features/economia/data/savingsTips'
import { useTipsProgressStore } from '@/features/economia/store/useTipsProgressStore'
import { cn } from '@/lib/utils'

export function TipsGrid() {
  const appliedTipIds = useTipsProgressStore((state) => state.appliedTipIds)
  const toggleApplied = useTipsProgressStore((state) => state.toggleApplied)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-foreground">Dicas de Economia</h2>
        <span className="text-xs text-zinc-400">
          {appliedTipIds.length} de {SAVINGS_TIPS.length} já aplicadas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SAVINGS_TIPS.map((tip, index) => {
          const applied = appliedTipIds.includes(tip.id)
          return (
            <motion.button
              key={tip.id}
              type="button"
              onClick={() => toggleApplied(tip.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className={cn(
                'flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors',
                applied
                  ? 'border-positive/30 bg-positive/5'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    applied ? 'bg-positive/15 text-positive' : 'bg-primary/10 text-primary',
                  )}
                >
                  {applied ? <Check className="size-4" /> : <tip.icon className="size-4" />}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400 uppercase tracking-wide">
                  {TIP_CATEGORY_LABELS[tip.category]}
                </span>
              </div>
              <p className={cn('text-sm font-medium', applied ? 'text-positive' : 'text-foreground')}>{tip.title}</p>
              <p className="text-xs leading-relaxed text-zinc-400">{tip.description}</p>
              <span className="mt-auto pt-1 text-[11px] font-medium text-zinc-500">
                {applied ? 'Marcada como já faço isso — toque pra desmarcar' : 'Toque quando já fizer isso'}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
