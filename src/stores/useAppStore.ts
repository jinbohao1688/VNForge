import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppSettings {
  theme: 'dark' | 'light'
  language: string
  aiProvider: 'openai' | 'claude' | 'gemini'
  aiApiKey: string
  defaultProjectDir: string
  editorFontSize: number
  editorFontFamily: string
  autoSave: boolean
  autoSaveInterval: number
}

interface AppState {
  settings: AppSettings
  sidebarCollapsed: boolean
  updateSettings: (partial: Partial<AppSettings>) => void
  toggleSidebar: () => void
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'zh-CN',
  aiProvider: 'openai',
  aiApiKey: '',
  defaultProjectDir: '',
  editorFontSize: 14,
  editorFontFamily: 'JetBrains Mono, Consolas, monospace',
  autoSave: true,
  autoSaveInterval: 30,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      sidebarCollapsed: false,
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: 'vnforge-app-store' }
  )
)
