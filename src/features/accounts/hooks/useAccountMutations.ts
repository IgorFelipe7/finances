import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import type { AccountFormInput } from '@/features/accounts/schemas/account.schema'

export function useCreateAccount() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: async (input: AccountFormInput) => {
      if (!userId) {
        throw new Error('Usuário não autenticado.')
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...input, user_id: userId, is_active: true })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Conta adicionada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível adicionar a conta.')
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AccountFormInput }) => {
      const { data, error } = await supabase.from('accounts').update(input).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Conta atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível atualizar a conta.')
    },
  })
}

/** Soft delete: flips `is_active` off rather than removing the row, so historical transactions keep a valid `account_id` reference. */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Conta removida.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível remover a conta.')
    },
  })
}
