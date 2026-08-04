import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

const WATCHED_TABLES = ['transactions', 'accounts'] as const

/** Invalidates the matching TanStack Query cache whenever another session/device changes the user's data. */
export function useSupabaseRealtime() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel(`realtime-${userId}`)

    for (const table of WATCHED_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: [table] })
        },
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
