import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

interface PublicRouteProps {
  children: ReactNode
}

/** Mirror of ProtectedRoute: keeps an already-authenticated user off /login and reacts the moment sign-in succeeds. */
export function PublicRoute({ children }: PublicRouteProps) {
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  if (!isInitialized) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
