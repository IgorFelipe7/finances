import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  hasSeenOnboarding: boolean
  active: boolean
  step: number
  open: () => void
  setStep: (step: number) => void
  finish: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      active: false,
      step: 0,
      open: () => set({ active: true, step: 0 }),
      setStep: (step) => set({ step }),
      finish: () => set({ hasSeenOnboarding: true, active: false }),
    }),
    // `active`/`step` deliberately not persisted — only whether the user has ever finished it.
    { name: 'onboarding', partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding }) },
  ),
)
