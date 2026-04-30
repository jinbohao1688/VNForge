import { create } from 'zustand'

interface EditorState {
  activeTab: 'script' | 'assets' | 'characters' | 'preview'
  scriptContent: string
  scriptPath: string
  dirty: boolean
  aiAssistantOpen: boolean
  setActiveTab: (tab: EditorState['activeTab']) => void
  setScriptContent: (content: string) => void
  setScriptPath: (path: string) => void
  setDirty: (dirty: boolean) => void
  toggleAIAssistant: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTab: 'script',
  scriptContent: '',
  scriptPath: 'script.rpy',
  dirty: false,
  aiAssistantOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setScriptContent: (content) => set({ scriptContent: content, dirty: true }),
  setScriptPath: (path) => set({ scriptPath: path }),
  setDirty: (dirty) => set({ dirty }),
  toggleAIAssistant: () =>
    set((state) => ({ aiAssistantOpen: !state.aiAssistantOpen })),
}))
