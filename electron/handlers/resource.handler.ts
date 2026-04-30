import { ipcMain, dialog, app, shell } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync, readFileSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

const assetRegistry = new Map<string, unknown[]>()

export function setupResourceHandler(): void {
  ipcMain.handle('resource:import', async (_: unknown, projectId: string) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
          { name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'flac'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      if (result.canceled) return { success: false, error: 'Cancelled' }

      const assets = result.filePaths.map((filePath) => {
        const name = filePath.split(/[\\/]/).pop() || 'unknown'
        const ext = name.split('.').pop()?.toLowerCase() || ''
        const type = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) ? 'image' : 'audio'
        return {
          id: randomUUID(),
          projectId,
          type,
          originalName: name,
          fileName: `${randomUUID()}.${ext}`,
          createdAt: new Date().toISOString()
        }
      })

      return { success: true, data: assets }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('resource:list', async (_: unknown, projectId: string) => {
    const assets = assetRegistry.get(projectId) || []
    return { success: true, data: assets }
  })

  ipcMain.handle('resource:delete', async (_: unknown, projectId: string, assetId: string) => {
    try {
      const assets = assetRegistry.get(projectId) || []
      const filtered = assets.filter((a: any) => a.id !== assetId)
      assetRegistry.set(projectId, filtered)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('resource:updateMetadata', async (_: unknown, projectId: string, assetId: string, metadata: unknown) => {
    try {
      const assets = assetRegistry.get(projectId) || []
      const asset = assets.find((a: any) => a.id === assetId)
      if (!asset) return { success: false, error: 'Asset not found' }
      ;(asset as any).metadata = metadata
      return { success: true, data: asset }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('resource:selectAsset', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
        { name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'flac'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' }
    }
    return { success: true, data: result.filePaths[0] }
  })

  ipcMain.handle('resource:upload-asset', async (_: unknown, projectId: string, filePath: string, metadata: any) => {
    try {
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      const id = randomUUID()
      const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)

      const projectStore = new (await import('electron-store')).default()
      const projects = projectStore.get('projects', []) as Array<{ id: string; directory: string }>
      const project = projects.find((p) => p.id === projectId)
      if (!project) return { success: false, error: 'Project not found' }

      const typeDirMap: Record<string, string> = {
        background: 'backgrounds',
        character: 'characters',
        avatar: 'characters',
        bgm: 'audio/bgm',
        sfx: 'audio/sfx',
      }
      const assetDir = typeDirMap[metadata.type] || 'assets'
      const targetDir = join(project.directory, assetDir)
      mkdirSync(targetDir, { recursive: true })

      const baseName = (metadata.renpyVariable || id).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')
      const fileName = `${baseName}.${ext}`
      const targetPath = join(targetDir, fileName)
      copyFileSync(filePath, targetPath)

      let thumbnailPath = ''
      if (isImage) {
        try {
          const { Jimp } = await import('jimp')
          const thumbDir = join(project.directory, '.vnforge', 'thumbnails')
          mkdirSync(thumbDir, { recursive: true })
          thumbnailPath = join(thumbDir, `${id}.jpg`)
          const image = await Jimp.read(targetPath)
          image.cover({ w: 200, h: 150 }).write(thumbnailPath as `${string}.${string}`)
        } catch {
          thumbnailPath = targetPath
        }
      }

      const asset = {
        id,
        projectId,
        type: metadata.type || 'unknown',
        originalName: metadata.originalName || fileName,
        fileName,
        filePath: targetPath,
        renpyVariable: metadata.renpyVariable || '',
        thumbnailPath,
        metadata: {
          characterName: metadata.characterName || '',
          sceneName: metadata.sceneName || '',
          emotions: metadata.emotions || [],
          loop: metadata.loop || false,
        },
        createdAt: new Date().toISOString(),
      }

      const assets = assetRegistry.get(projectId) || []
      assets.push(asset)
      assetRegistry.set(projectId, assets)

      return { success: true, data: asset }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('resource:open-in-explorer', async (_: unknown, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
