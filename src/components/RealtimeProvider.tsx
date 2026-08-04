import type { ReactNode } from 'react'
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime'

interface RealtimeProviderProps {
  children: ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  useSupabaseRealtime()
  return <>{children}</>
}
