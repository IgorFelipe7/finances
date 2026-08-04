import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/components/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RealtimeProvider } from '@/components/RealtimeProvider'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'
import { queryClient } from '@/lib/query-client'
import { router } from '@/routes/router'

function App() {
  const reduceMotion = useUIPreferencesStore((state) => state.reduceMotion)

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
          <AuthProvider>
            <RealtimeProvider>
              <RouterProvider router={router} />
              <Toaster theme="dark" richColors position="top-center" />
            </RealtimeProvider>
          </AuthProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
