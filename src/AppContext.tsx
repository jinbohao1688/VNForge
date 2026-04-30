import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import type { AppSettings, VNProject } from './types'

interface AppContextType {
  settings: AppSettings
  updateSettings: (key: keyof AppSettings, value: unknown) => Promise<void>
  currentProject: VNProject | null
  setCurrentProject: (p: VNProject | null) => void
  navigate: (page: string) => void
  currentPage: string
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

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [currentProject, setCurrentProject] = useState<VNProject | null>(null)
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    const api = (window as any).api
    api.invoke('settings:getAll').then((result: any) => {
      if (result.success && result.data) {
        setSettings(result.data)
      }
    }).catch(() => {})
  }, [])

  const updateSettings = useCallback(async (key: keyof AppSettings, value: unknown) => {
    const api = (window as any).api
    await api.invoke('settings:set', key, value)
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const navigate = useCallback((page: string) => {
    setCurrentPage(page)
  }, [])

  return (
    <AppContext.Provider value={{ settings, updateSettings, currentProject, setCurrentProject, navigate, currentPage }}>
      {children}
    </AppContext.Provider>
  )
}