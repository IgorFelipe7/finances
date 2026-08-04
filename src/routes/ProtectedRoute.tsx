import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/PageLoader'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  if (!isInitialized) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
