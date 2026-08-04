import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { budgetSchema } from '@/features/budgets/schemas/budget.schema'

const budgetListSchema = z.array(budgetSchema)

export function useBudgets() {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: ['budgets', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return budgetListSchema.parse(data)
    },
  })
}
