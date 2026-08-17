import { Skeleton, SkeletonPanel } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/*
 * Loading stand-ins for the dashboard panels. Each one reproduces the real panel's
 * outer shell (surface-panel, padding, header rhythm, plot height) so nothing shifts
 * when the Supabase query resolves.
 *
 * Bar heights are a fixed sequence rather than Math.random() — a random silhouette
 * reshuffles on every re-render and reads as flicker instead of loading.
 */
const BAR_HEIGHTS = ['38%', '62%', '45%', '78%', '55%', '88%', '48%', '70%', '58%', '82%', '42%', '66%']

function PanelHeaderSkeleton({ withTrailing = true }: { withTrailing?: boolean }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-60 max-w-full" />
      </div>
      {withTrailing && <Skeleton className="h-4 w-20 shrink-0" />}
    </div>
  )
}

/** Silhouette for the area charts — axis baseline plus a staggered column field. */
export function ChartPanelSkeleton({ plotClassName = 'h-56', label }: { plotClassName?: string; label: string }) {
  return (
    <SkeletonPanel label={label} className="surface-panel flex h-full flex-col rounded-xl p-5">
      <PanelHeaderSkeleton />

      {/* Same definite height as the real plot it stands in for, so the panel keeps its
          size across the loading -> loaded swap. */}
      <div className={cn('flex items-end gap-2 border-b border-border/60 pb-px', plotClassName)}>
        {BAR_HEIGHTS.map((height, index) => (
          <Skeleton key={index} className="min-w-0 flex-1 rounded-t-md rounded-b-none" style={{ height }} />
        ))}
      </div>

      <div className="mt-3 flex justify-between">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-3 w-7" />
        ))}
      </div>
    </SkeletonPanel>
  )
}

/**
 * Donut stand-in. The hole is punched with a radial mask instead of stacking an
 * opaque inner circle, so it stays a true ring over the translucent glass surface.
 */
export function DonutPanelSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPanel label={label} className="surface-panel flex h-full flex-col rounded-xl p-5">
      <PanelHeaderSkeleton withTrailing={false} />

      <div className="flex flex-1 items-center justify-center py-2">
        <Skeleton className="size-36 rounded-full [mask-image:radial-gradient(circle,transparent_56%,black_57%)]" />
      </div>

      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Skeleton className="size-2 shrink-0 rounded-full" />
              <Skeleton className="h-3 w-24 max-w-full" />
            </div>
            <Skeleton className="h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </SkeletonPanel>
  )
}

/** Rows of label + progress bar — used by the budgets panel and other metered lists. */
export function MeteredListSkeleton({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <SkeletonPanel label={label} className="surface-panel h-full rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-52 max-w-[60%]" />
        <Skeleton className="h-7 w-20 shrink-0 rounded-lg" />
      </div>

      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="space-y-2 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-28 max-w-full" />
              <Skeleton className="h-3 w-24 shrink-0" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonPanel>
  )
}

/** Single metric tile — matches the label/value rhythm of the real ribbon tiles. */
export function MetricTileSkeleton({ lines = 1, label }: { lines?: number; label: string }) {
  return (
    <SkeletonPanel label={label} className="surface-panel flex h-full flex-col gap-4 rounded-xl p-5">
      <Skeleton className="h-3 w-28" />
      {lines === 1 ? (
        <Skeleton className="h-8 w-36" />
      ) : (
        <div className="space-y-2">
          {Array.from({ length: lines }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Skeleton className="size-2 shrink-0 rounded-full" />
                <Skeleton className="h-3.5 w-20 max-w-full" />
              </div>
              <Skeleton className="h-3.5 w-16 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </SkeletonPanel>
  )
}
