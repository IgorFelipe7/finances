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

export interface PayTransactionInput {
  id: string
  /** Projected (virtual) occurrences don't exist in the DB yet — paying one inserts a new settled row instead of updating. */
  isProjected: boolean
  account_id: string
  destination_account_id: string | null
  title: string
  amount: number
  transaction_type: TransactionCategoryType
  category: string | null
  date: string
}

/**
 * Settles a single occurrence — the anchor's own pending charge, or one specific future month
 * of a fixed/installment series — without touching any other month. A projected occurrence has
 * no DB row, so paying it inserts a plain one-off `variable` row (never `fixed`/multi-installment,
 * so it can't itself spawn new projections); `withProjections` then recognizes the matching
 * (account, type, title, date) slot and stops generating that month's virtual instance.
 */
export function usePayTransaction() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: async (input: PayTransactionInput) => {
      if (input.isProjected) {
        if (!userId) throw new Error('Usuário não autenticado.')

        const { error } = await supabase.from('transactions').insert({
          user_id: userId,
          account_id: input.account_id,
          destination_account_id: input.destination_account_id,
          title: input.title,
          amount: input.amount,
          transaction_type: input.transaction_type,
          recurrence: 'variable',
          category: input.category,
          date: input.date,
          is_paid: true,
          installments_total: 1,
          installment_current: 1,
          is_active: true,
        })
        if (error) throw error
        return
      }

      const { error } = await supabase
        .from('transactions')
        .update({ is_paid: true, account_id: input.account_id, amount: input.amount })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Pagamento registrado!')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível registrar o pagamento.')
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

export interface StopRecurrenceInput {
  id: string
  recurrence: TransactionRecurrence
  installments_total: number
  installment_current: number
}

/**
 * Stops a `fixed` or installment transaction from replicating into future months, without
 * touching its own history. `fixed` recurrence is controlled by the `recurrence` field, so it
 * just flips back to `variable`; installments are controlled by `installments_total` instead
 * (recurrence stays `variable` the whole time), so stopping one caps the total at whichever
 * installment this row represents — anything after that stops projecting.
 */
export function useCancelRecurrence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: StopRecurrenceInput) => {
      const update =
        input.recurrence === 'fixed' ? { recurrence: 'variable' as const } : { installments_total: input.installment_current }
      const { error } = await supabase.from('transactions').update(update).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Recorrência cancelada. Os próximos meses não terão mais essa despesa.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível cancelar a recorrência.')
    },
  })
}
