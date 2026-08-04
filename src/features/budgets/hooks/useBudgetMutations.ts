import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import type { BudgetFormInput } from '@/features/budgets/schemas/budget.schema'

/** One row per (user, category) — upsert so setting a limit on an already-budgeted category just updates it. */
export function useSaveBudget() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: async (input: BudgetFormInput) => {
      if (!userId) throw new Error('Usuário não autenticado.')

      const { error } = await supabase
        .from('budgets')
        .upsert({ user_id: userId, category: input.category, monthly_limit: input.monthly_limit }, { onConflict: 'user_id,category' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Orçamento salvo.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível salvar o orçamento.')
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Orçamento removido.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível remover o orçamento.')
    },
  })
}
