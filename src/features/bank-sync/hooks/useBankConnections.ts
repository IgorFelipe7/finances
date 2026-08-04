import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { bankConnectionSchema } from '@/features/bank-sync/schemas/bankConnection.schema'

const bankConnectionListSchema = z.array(bankConnectionSchema)

export function useBankConnections() {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: ['bank-connections', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_connections')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return bankConnectionListSchema.parse(data)
    },
  })
}
