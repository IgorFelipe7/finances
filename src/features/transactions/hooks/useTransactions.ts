import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { transactionSchema } from '@/features/transactions/schemas/transaction.schema'

const transactionListSchema = z.array(transactionSchema)

export function useTransactions() {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: ['transactions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false })

      if (error) throw error
      return transactionListSchema.parse(data)
    },
  })
}
