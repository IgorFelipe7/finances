import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { getCurrentPushSubscription, subscribeToPush, unsubscribeFromPush } from '@/lib/pushNotifications'

export function usePushSubscriptionStatus() {
  return useQuery({
    queryKey: ['push-subscription-status'],
    queryFn: async () => !!(await getCurrentPushSubscription()),
  })
}

export function useEnablePushNotifications() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Usuário não autenticado.')

      const subscription = await subscribeToPush()
      const json = subscription.toJSON()
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      })
      // 23505 = unique violation on endpoint — already subscribed from this device, not a real error.
      if (error && error.code !== '23505') throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-subscription-status'] })
      toast.success('Notificações ativadas!')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível ativar as notificações.')
    },
  })
}

export function useDisablePushNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const subscription = await getCurrentPushSubscription()
      if (subscription) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
      }
      await unsubscribeFromPush()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-subscription-status'] })
      toast.success('Notificações desativadas.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível desativar as notificações.')
    },
  })
}
