import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupSettingsHandler } from './handlers/settings.handler'
import { setupAIHandler } from './handlers/ai.handler'
import { setupEnvHandler } from './handlers/env.handler'
import { setupProjectHandler } from './handlers/project.handler'
import { setupResourceHandler } from './handlers/resource.handler'
import { setupRenpyHandler } from './handlers/renpy.handler'
import { setupShellHandler } from './handlers/shell.handler'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    backgroundColor: '#0A0A0F',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.vnforge.app')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupSettingsHandler()
  setupAIHandler()
  setupEnvHandler()
  setupProjectHandler()
  setupResourceHandler()
  setupRenpyHandler()
  setupShellHandler()

  ipcMain.handle('app:version', () => app.getVersion())
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
