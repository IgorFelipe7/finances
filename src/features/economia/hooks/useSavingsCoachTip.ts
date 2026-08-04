import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useCategoryBreakdown } from '@/features/dashboard/hooks/useCategoryBreakdown'
import { useFinancialSnapshot } from '@/features/dashboard/hooks/useFinancialSnapshot'
import { SAVINGS_TIPS } from '@/features/economia/data/savingsTips'
import { generateCoachTip, type CoachTip } from '@/features/economia/services/savingsCoach.service'
import { hasOpenAIKey } from '@/lib/openai'

function fallbackTip(topCategory: string | null): CoachTip {
  const tip = SAVINGS_TIPS[Math.floor(Math.random() * SAVINGS_TIPS.length)]
  return {
    headline: tip.title,
    message: topCategory
      ? `${tip.description} Sua maior categoria de gasto este mês é "${topCategory}" — um bom lugar pra revisar primeiro.`
      : tip.description,
  }
}

export function useSavingsCoachTip() {
  const userId = useAuthStore((state) => state.user?.id)
  const { snapshot, isLoading: snapshotLoading } = useFinancialSnapshot()
  const { slices } = useCategoryBreakdown()
  const topCategory = slices[0]?.category ?? null

  const snapshotKey = [
    snapshot.today,
    snapshot.confirmedExpenses,
    snapshot.totalSaved,
    snapshot.recommendedSavings,
    topCategory,
  ].join('|')

  const query = useQuery({
    queryKey: ['savings-coach-tip', userId, snapshotKey],
    enabled: !!userId && !snapshotLoading,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!hasOpenAIKey()) return fallbackTip(topCategory)
      try {
        return await generateCoachTip(snapshot, topCategory)
      } catch (error) {
        console.error('[useSavingsCoachTip] IA falhou, usando fallback:', error)
        return fallbackTip(topCategory)
      }
    },
  })

  return {
    tip: query.data,
    isLoading: query.isLoading || snapshotLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}
