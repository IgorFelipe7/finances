import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface UIPreferencesState {
  reduceMotion: boolean
  setReduceMotion: (value: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean) => void
  confirmAiTransactions: boolean
  setConfirmAiTransactions: (value: boolean) => void
  theme: Theme
  setTheme: (value: Theme) => void
  hideValues: boolean
  setHideValues: (value: boolean) => void
  toggleHideValues: () => void
}

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      reduceMotion: false,
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      // Default true: matches the review-before-saving flow the app always had.
      confirmAiTransactions: true,
      setConfirmAiTransactions: (confirmAiTransactions) => set({ confirmAiTransactions }),
      // Default 'dark': preserves the app's original look for existing users.
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      hideValues: false,
      setHideValues: (hideValues) => set({ hideValues }),
      toggleHideValues: () => set((state) => ({ hideValues: !state.hideValues })),
    }),
    { name: 'ui-preferences' },
  ),
)
