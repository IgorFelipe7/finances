import type { ReactNode } from 'react'
import { useAuthListener } from '@/features/auth/hooks/useAuthListener'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  useAuthListener()
  return <>{children}</>
}
