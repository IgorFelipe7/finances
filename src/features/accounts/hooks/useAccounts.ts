import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { accountSchema } from '@/features/accounts/schemas/account.schema'

const accountListSchema = z.array(accountSchema)

export function useAccounts() {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: ['accounts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      return accountListSchema.parse(data)
    },
  })
}
