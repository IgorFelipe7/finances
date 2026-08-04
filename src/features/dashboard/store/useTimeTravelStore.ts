import { create } from 'zustand'

interface TimeTravelState {
  selectedMonth: number
  selectedYear: number
  setSelectedPeriod: (month: number, year: number) => void
}

export const useTimeTravelStore = create<TimeTravelState>((set) => ({
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
  setSelectedPeriod: (month, year) => set({ selectedMonth: month, selectedYear: year }),
}))
