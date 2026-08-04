import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TipsProgressState {
  appliedTipIds: string[]
  toggleApplied: (tipId: string) => void
  isApplied: (tipId: string) => boolean
}

export const useTipsProgressStore = create<TipsProgressState>()(
  persist(
    (set, get) => ({
      appliedTipIds: [],
      toggleApplied: (tipId) =>
        set((state) => ({
          appliedTipIds: state.appliedTipIds.includes(tipId)
            ? state.appliedTipIds.filter((id) => id !== tipId)
            : [...state.appliedTipIds, tipId],
        })),
      isApplied: (tipId) => get().appliedTipIds.includes(tipId),
    }),
    { name: 'savings-tips-progress' },
  ),
)
