import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { buildFallbackInsights } from '@/features/dashboard/lib/fallbackInsights'
import { useFinancialSnapshot } from '@/features/dashboard/hooks/useFinancialSnapshot'
import { generateInsights } from '@/features/dashboard/services/insights.service'

export function useFinancialInsights() {
  const userId = useAuthStore((state) => state.user?.id)
  const { snapshot, isLoading: snapshotLoading } = useFinancialSnapshot()

  // Cache key changes only when numbers that matter actually move, so we don't refetch on every unrelated render.
  const snapshotKey = [
    snapshot.today,
    snapshot.confirmedIncome,
    snapshot.confirmedExpenses,
    snapshot.knownUpcomingExpenses,
    snapshot.knownUpcomingIncome,
    snapshot.overdueCharges.length,
    snapshot.dueTodayCharges.length,
    snapshot.endingInstallments.length,
  ].join('|')

  const query = useQuery({
    queryKey: ['ai-insights', userId, snapshotKey],
    enabled: !!userId && !snapshotLoading,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      try {
        return await generateInsights(snapshot)
      } catch (error) {
        console.error('[useFinancialInsights] IA falhou, usando fallback determinístico:', error)
        return buildFallbackInsights(snapshot)
      }
    },
  })

  return {
    insights: query.data ?? [],
    isLoading: query.isLoading || snapshotLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    snapshot,
  }
}
