import { Skeleton, SkeletonPanel } from '@/components/ui/skeleton'

/**
 * Full-screen loader for the brief auth check and for the login chunk, where no app
 * shell exists yet to imitate. Deliberately minimal — a shell skeleton here would
 * promise a layout that the login screen never renders.
 */
export function PageLoader() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando"
      className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5 shadow-lg shadow-primary/30">
        <span className="size-4 rounded-full bg-primary-foreground/90" />
      </span>
      <Skeleton className="h-1 w-32 rounded-full" />
    </div>
  )
}

/**
 * Suspense fallback for lazy pages behind the app shell. Mirrors the real chrome —
 * 16rem sidebar, h-16 brand block, the topbar rule — so the sidebar and header don't
 * visibly snap into place once the route chunk arrives.
 */
export function AppShellSkeleton() {
  return (
    <SkeletonPanel label="Carregando página" className="flex min-h-svh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/60 backdrop-blur-xl md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-1.5 px-3 py-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-8">
          <Skeleton className="h-6 w-40" />
          <div className="flex shrink-0 items-center gap-3">
            <Skeleton className="hidden h-8 w-40 rounded-lg sm:block" />
            <Skeleton className="h-8 w-24 rounded-lg sm:w-40" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </header>

        <main className="flex-1 space-y-4 p-4 pb-24 md:p-8 md:pb-8">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Skeleton className="h-44 rounded-xl md:col-span-2 xl:col-span-2" />
            <Skeleton className="h-44 rounded-xl md:col-span-2 xl:col-span-4" />
            <Skeleton className="h-64 rounded-xl md:col-span-2 xl:col-span-4" />
            <Skeleton className="h-64 rounded-xl md:col-span-2 xl:col-span-2" />
          </div>
        </main>
      </div>
    </SkeletonPanel>
  )
}
