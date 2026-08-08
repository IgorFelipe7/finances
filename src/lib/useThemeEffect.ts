import { useEffect } from 'react'
import { applyTheme, type ResolvedTheme } from '@/lib/theme'
import { useResolvedTheme } from '@/lib/useResolvedTheme'

/** Applies the resolved theme to the document. Call once, at the app root. */
export function useThemeEffect(): ResolvedTheme {
  const resolved = useResolvedTheme()

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  return resolved
}
