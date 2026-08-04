import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'

interface AnimatedNumberProps {
  value: number
  formatter: (value: number) => string
  className?: string
}

export function AnimatedNumber({ value, formatter, className }: AnimatedNumberProps) {
  const reduceMotion = useUIPreferencesStore((state) => state.reduceMotion)
  const [display, setDisplay] = useState(value)
  const previousValue = useRef(value)

  useEffect(() => {
    const controls = animate(previousValue.current, value, {
      duration: reduceMotion ? 0 : 0.7,
      ease: 'easeOut',
      onUpdate: setDisplay,
    })
    previousValue.current = value
    return () => controls.stop()
  }, [value, reduceMotion])

  return <span className={className}>{formatter(display)}</span>
}
