import { create } from 'zustand'
import type { ChatMessage } from '@/features/assistant/types'

interface AssistantState {
  isOpen: boolean
  messages: ChatMessage[]
  isStreaming: boolean
  open: () => void
  close: () => void
  toggle: () => void
  addMessage: (message: ChatMessage) => void
  updateLastMessage: (content: string) => void
  setStreaming: (value: boolean) => void
  clear: () => void
}

export const useAssistantStore = create<AssistantState>((set) => ({
  isOpen: false,
  messages: [],
  isStreaming: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessage: (content) =>
    set((state) => {
      if (state.messages.length === 0) return state
      const messages = state.messages.slice()
      messages[messages.length - 1] = { ...messages[messages.length - 1], content }
      return { messages }
    }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  clear: () => set({ messages: [] }),
}))
