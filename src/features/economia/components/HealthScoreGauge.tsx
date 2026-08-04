import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/AnimatedNumber'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function colorForScore(score: number) {
  if (score >= 80) return 'var(--positive)'
  if (score >= 50) return 'var(--chart-3)'
  return 'var(--destructive)'
}

export function HealthScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  const offset = CIRCUMFERENCE * (1 - clamped / 100)
  const color = colorForScore(clamped)

  return (
    <div className="relative flex size-40 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="size-40 -rotate-90">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <AnimatedNumber
          value={clamped}
          formatter={(v) => Math.round(v).toString()}
          className="text-4xl font-bold text-foreground"
        />
        <span className="text-xs text-zinc-400">de 100</span>
      </div>
    </div>
  )
}
