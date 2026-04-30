import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '@/types'

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

interface SettingsStore {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    { name: 'vnforge-settings' }
  )
)