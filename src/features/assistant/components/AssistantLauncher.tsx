import { motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useFinancialInsights } from '@/features/dashboard/hooks/useFinancialInsights'
import { useAssistantStore } from '@/features/assistant/store/useAssistantStore'
import { cn } from '@/lib/utils'

export function AssistantLauncher() {
  const isOpen = useAssistantStore((state) => state.isOpen)
  const toggle = useAssistantStore((state) => state.toggle)
  const { insights } = useFinancialInsights()

  const hasUrgentInsight = insights.some((insight) => insight.tone === 'danger' || insight.tone === 'warning')

  return (
    <motion.button
      type="button"
      onClick={toggle}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className="fixed right-4 bottom-24 z-50 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-5 text-primary-foreground shadow-lg shadow-primary/40 md:right-6 md:bottom-6"
      aria-label={isOpen ? 'Fechar assistente financeiro' : 'Abrir assistente financeiro'}
    >
      {!isOpen && (
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/50"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {isOpen ? <X className="relative z-10 size-6" /> : <Sparkles className="relative z-10 size-6" />}

      {!isOpen && hasUrgentInsight && (
        <span className="absolute top-0.5 right-0.5 flex size-3 items-center justify-center">
          <span className={cn('absolute size-3 animate-ping rounded-full bg-destructive opacity-75')} />
          <span className="relative size-2 rounded-full bg-destructive ring-2 ring-background" />
        </span>
      )}
    </motion.button>
  )
}
