import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import type {
  TransactionCategoryType,
  TransactionRecurrence,
} from '@/features/transactions/schemas/transaction.schema'

export interface CreateTransactionInput {
  account_id: string
  destination_account_id: string | null
  title: string
  amount: number
  transaction_type: TransactionCategoryType
  recurrence: TransactionRecurrence
  category: string | null
  date: string
  is_paid?: boolean
  installments_total?: number
  installment_current?: number
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!userId) {
        throw new Error('Usuário não autenticado.')
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...input, user_id: userId, is_paid: input.is_paid ?? true })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transação registrada com sucesso!')
    },
  })
}

export interface UpdateTransactionInput {
  id: string
  title: string
  amount: number
  category: string | null
  date: string
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTransactionInput) => {
      const { error } = await supabase.from('transactions').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Gasto fixo atualizado.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível atualizar o gasto fixo.')
    },
  })
}

export function useDeactivateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transação removida.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível remover a transação.')
    },
  })
}

/**
 * Stops a `fixed` transaction from replicating into future months. Flips the anchor
 * row back to `variable` rather than deleting it, so its own history stays intact —
 * only the projection engine (`withProjections`) reads `recurrence` going forward.
 */
export function useCancelRecurrence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').update({ recurrence: 'variable' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Recorrência cancelada. Os próximos meses não terão mais essa despesa fixa.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível cancelar a recorrência.')
    },
  })
}
