import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  hasSeenOnboarding: boolean
  markSeen: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      markSeen: () => set({ hasSeenOnboarding: true }),
    }),
    { name: 'onboarding' },
  ),
)
