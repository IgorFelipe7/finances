import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import type { GoalFormInput } from '@/features/goals/schemas/goal.schema'

/** Creates the goal's dedicated savings account first, then the goal metadata row pointing at it. */
export function useCreateGoal() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: async (input: GoalFormInput) => {
      if (!userId) throw new Error('Usuário não autenticado.')

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          name: input.name,
          type: 'savings',
          initial_balance: 0,
          color: input.color,
          is_active: true,
        })
        .select()
        .single()
      if (accountError) throw accountError

      const { error: goalError } = await supabase.from('goals').insert({
        user_id: userId,
        account_id: account.id,
        name: input.name,
        target_amount: input.target_amount,
        target_date: input.target_date,
        color: input.color,
        is_active: true,
      })
      if (goalError) throw goalError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Meta criada!')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível criar a meta.')
    },
  })
}

/** Soft-deletes the goal only — the linked account (and its history) stays intact. */
export function useDeactivateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Meta removida.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível remover a meta.')
    },
  })
}
