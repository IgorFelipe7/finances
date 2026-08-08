import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'

export function HideValuesToggle() {
  const hideValues = useUIPreferencesStore((state) => state.hideValues)
  const toggleHideValues = useUIPreferencesStore((state) => state.toggleHideValues)

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleHideValues}
      aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
      aria-pressed={hideValues}
      className="relative overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {hideValues ? (
          <motion.span
            key="hidden"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <EyeOff className="size-4" />
          </motion.span>
        ) : (
          <motion.span
            key="visible"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <Eye className="size-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  )
}
