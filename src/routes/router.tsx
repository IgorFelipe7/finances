import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { LoginPage } from '@/routes/LoginPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { AccountsPage } from '@/routes/AccountsPage'
import { TransactionsPage } from '@/routes/TransactionsPage'
import { FixedExpensesPage } from '@/routes/FixedExpensesPage'
import { SettingsPage } from '@/routes/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/transactions',
    element: (
      <ProtectedRoute>
        <TransactionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/fixed-expenses',
    element: (
      <ProtectedRoute>
        <FixedExpensesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/accounts',
    element: (
      <ProtectedRoute>
        <AccountsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
])
