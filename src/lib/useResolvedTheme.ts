import { useEffect, useState } from 'react'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'
import { resolveTheme, type ResolvedTheme } from '@/lib/theme'

/** Read-only: the theme actually in effect right now, reacting live to OS changes when theme is 'system'. */
export function useResolvedTheme(): ResolvedTheme {
  const theme = useUIPreferencesStore((state) => state.theme)
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(theme))

  useEffect(() => {
    setResolved(resolveTheme(theme))
    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      setResolved(resolveTheme('system'))
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  return resolved
}
