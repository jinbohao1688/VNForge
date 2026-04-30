import { ipcMain } from 'electron'
import Store from 'electron-store'

interface StoreSchema {
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

const store = new Store<StoreSchema>({
  defaults: {
    theme: 'dark',
    language: 'en',
    aiProvider: 'openai',
    aiApiKey: '',
    defaultProjectDir: '',
    editorFontSize: 14,
    editorFontFamily: 'JetBrains Mono, Consolas, monospace',
    autoSave: true,
    autoSaveInterval: 30
  }
})

export function setupSettingsHandler(): void {
  ipcMain.handle('settings:get', (_: unknown, key: keyof StoreSchema) => {
    return { success: true, data: store.get(key) }
  })

  ipcMain.handle('settings:getAll', () => {
    return { success: true, data: store.store }
  })

  ipcMain.handle('settings:set', (_: unknown, key: keyof StoreSchema, value: unknown) => {
    store.set(key, value as StoreSchema[keyof StoreSchema])
    return { success: true }
  })

  ipcMain.handle('settings:setMany', (_: unknown, entries: Partial<StoreSchema>) => {
    Object.entries(entries).forEach(([k, v]) => store.set(k as keyof StoreSchema, v))
    return { success: true }
  })
}
