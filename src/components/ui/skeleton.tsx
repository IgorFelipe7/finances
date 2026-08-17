import type { ComponentProps } from 'react'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'
import { cn } from '@/lib/utils'

/**
 * Loading placeholder. Honours the same `reduceMotion` preference as AnimatedNumber —
 * when it's on, the sheen animation is swapped for a flat block rather than being
 * left running behind a media query.
 *
 * Skeletons should mirror the geometry of the content they stand in for (same heights,
 * same column rhythm), so the panel doesn't reflow when real data lands.
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  const reduceMotion = useUIPreferencesStore((state) => state.reduceMotion)

  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('rounded-md', reduceMotion ? 'skeleton-flat' : 'skeleton-sweep', className)}
      {...props}
    />
  )
}

/**
 * Wrapper for a panel-sized loading region. Announces busy state once for the whole
 * panel instead of letting every child Skeleton chatter at a screen reader.
 */
export function SkeletonPanel({ className, children, label = 'Carregando', ...props }: ComponentProps<'div'> & { label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className} {...props}>
      {children}
    </div>
  )
}
