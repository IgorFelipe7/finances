import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIPreferencesState {
  reduceMotion: boolean
  setReduceMotion: (value: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean) => void
  confirmAiTransactions: boolean
  setConfirmAiTransactions: (value: boolean) => void
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
    }),
    { name: 'ui-preferences' },
  ),
)
