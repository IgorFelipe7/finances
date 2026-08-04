import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/PageLoader'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicRoute } from '@/routes/PublicRoute'

const LoginPage = lazy(() => import('@/routes/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/routes/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const AccountsPage = lazy(() => import('@/routes/AccountsPage').then((m) => ({ default: m.AccountsPage })))
const TransactionsPage = lazy(() => import('@/routes/TransactionsPage').then((m) => ({ default: m.TransactionsPage })))
const FixedExpensesPage = lazy(() =>
  import('@/routes/FixedExpensesPage').then((m) => ({ default: m.FixedExpensesPage })),
)
const EconomiaPage = lazy(() => import('@/routes/EconomiaPage').then((m) => ({ default: m.EconomiaPage })))
const RetrospectivePage = lazy(() =>
  import('@/routes/RetrospectivePage').then((m) => ({ default: m.RetrospectivePage })),
)
const SettingsPage = lazy(() => import('@/routes/SettingsPage').then((m) => ({ default: m.SettingsPage })))

/** Each route's chunk loads on first visit — this is the Suspense boundary that shows while it fetches. */
function lazyPage(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        {lazyPage(<LoginPage />)}
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute>{lazyPage(<DashboardPage />)}</ProtectedRoute>,
  },
  {
    path: '/transactions',
    element: <ProtectedRoute>{lazyPage(<TransactionsPage />)}</ProtectedRoute>,
  },
  {
    path: '/fixed-expenses',
    element: <ProtectedRoute>{lazyPage(<FixedExpensesPage />)}</ProtectedRoute>,
  },
  {
    path: '/economia',
    element: <ProtectedRoute>{lazyPage(<EconomiaPage />)}</ProtectedRoute>,
  },
  {
    path: '/retrospectiva',
    element: <ProtectedRoute>{lazyPage(<RetrospectivePage />)}</ProtectedRoute>,
  },
  {
    path: '/accounts',
    element: <ProtectedRoute>{lazyPage(<AccountsPage />)}</ProtectedRoute>,
  },
  {
    path: '/settings',
    element: <ProtectedRoute>{lazyPage(<SettingsPage />)}</ProtectedRoute>,
  },
])
