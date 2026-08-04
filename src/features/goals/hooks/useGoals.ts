import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { goalSchema } from '@/features/goals/schemas/goal.schema'

const goalListSchema = z.array(goalSchema)

export function useGoals() {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: ['goals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      return goalListSchema.parse(data)
    },
  })
}
