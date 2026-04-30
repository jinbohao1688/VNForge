import { ipcMain, dialog } from 'electron'

export function setupShellHandler(): void {
  ipcMain.handle('shell:openFile', async (_: unknown, options?: { name?: string; extensions?: string[] }) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options?.extensions
        ? [{ name: options.name || '文件', extensions: options.extensions }]
        : [{ name: '所有文件', extensions: ['*'] }],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' }
    }
    return { success: true, data: result.filePaths[0] }
  })

  ipcMain.handle('shell:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' }
    }
    return { success: true, data: result.filePaths[0] }
  })
}
