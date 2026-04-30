import { create } from 'zustand'
import type { ChatMessage } from '@/types'

interface AIStore {
  messages: ChatMessage[]
  isStreaming: boolean
  streamedContent: string
  addMessage: (msg: ChatMessage) => void
  updateStreaming: (content: string) => void
  finalizeStream: () => void
  clearMessages: () => void
  setStreaming: (v: boolean) => void
}

export const useAIStore = create<AIStore>((set) => ({
  messages: [],
  isStreaming: false,
  streamedContent: '',
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  updateStreaming: (content) =>
    set({ streamedContent: content }),
  finalizeStream: () =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: state.streamedContent,
          timestamp: Date.now(),
        },
      ],
      streamedContent: '',
      isStreaming: false,
    })),
  clearMessages: () => set({ messages: [], streamedContent: '' }),
  setStreaming: (isStreaming) => set({ isStreaming }),
}))