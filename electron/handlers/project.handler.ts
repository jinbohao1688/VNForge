import { ipcMain, dialog, app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync, statSync } from 'fs'
import { randomUUID } from 'crypto'
import Store from 'electron-store'

const projectStore = new Store({ name: 'projects' })

export function setupProjectHandler(): void {
  ipcMain.handle('project:list', () => {
    const projects = projectStore.get('projects', []) as unknown[]
    return { success: true, data: projects }
  })

  ipcMain.handle('project:create', async (_: unknown, data: {
    name: string
    description: string
    directory: string
  }) => {
    try {
      const projectDir = join(data.directory, data.name)
      if (!existsSync(projectDir)) {
        mkdirSync(projectDir, { recursive: true })
      }

      const project = {
        id: randomUUID(),
        name: data.name,
        description: data.description,
        directory: projectDir,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'planning',
        stats: { wordCount: 0, sceneCount: 0, characterCount: 0, assetCount: 0 },
        config: {
          genre: 'visual_novel',
          targetPlatforms: ['windows'] as ('windows' | 'mac' | 'linux' | 'android')[]
        }
      }

      const projects = (projectStore.get('projects', []) as unknown[]).concat(project)
      projectStore.set('projects', projects)

      writeFileSync(join(projectDir, 'project.json'), JSON.stringify(project, null, 2))
      mkdirSync(join(projectDir, 'scripts'), { recursive: true })
      mkdirSync(join(projectDir, 'assets'), { recursive: true })
      mkdirSync(join(projectDir, 'characters'), { recursive: true })
      mkdirSync(join(projectDir, 'backgrounds'), { recursive: true })
      mkdirSync(join(projectDir, 'audio'), { recursive: true })

      return { success: true, data: project }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('project:open', async (_: unknown, projectId: string) => {
    try {
      const projects = projectStore.get('projects', []) as Array<{ id: string }>
      const project = projects.find((p: { id: string }) => p.id === projectId)
      if (!project) return { success: false, error: 'Project not found' }
      return { success: true, data: project }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('project:delete', async (_: unknown, projectId: string) => {
    try {
      const projects = projectStore.get('projects', []) as Array<{ id: string }>
      const filtered = projects.filter((p: { id: string }) => p.id !== projectId)
      projectStore.set('projects', filtered)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择项目保存位置',
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, data: null }
    }
    return { success: true, data: result.filePaths[0] }
  })

  ipcMain.handle('project:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Project Directory'
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' }
    }
    return { success: true, data: result.filePaths[0] }
  })

  ipcMain.handle('project:readScript', async (_: unknown, projectId: string, scriptPath: string) => {
    try {
      const projects = projectStore.get('projects', []) as Array<{ id: string; directory: string }>
      const project = projects.find((p) => p.id === projectId)
      if (!project) return { success: false, error: 'Project not found' }
      const fullPath = join(project.directory, 'scripts', scriptPath)
      if (!existsSync(fullPath)) return { success: false, error: 'Script not found' }
      const content = readFileSync(fullPath, 'utf-8')
      return { success: true, data: { path: fullPath, content } }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('project:saveScript', async (_: unknown, projectId: string, scriptPath: string, content: string) => {
    try {
      const projects = projectStore.get('projects', []) as Array<{ id: string; directory: string }>
      const project = projects.find((p) => p.id === projectId)
      if (!project) return { success: false, error: 'Project not found' }
      const fullPath = join(project.directory, 'scripts', scriptPath)
      writeFileSync(fullPath, content, 'utf-8')
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('project:showInExplorer', async (_: unknown, directory: string) => {
    try {
      const { shell } = await import('electron')
      shell.openPath(directory)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('project:createWithPlan', async (_: unknown, data: {
    directory: string
    plan: {
      title: string
      genre: string
      worldSetting: string
      protagonist: { name: string }
      heroines: Array<{ name: string; personality: string; endings: string[] }>
      chapterOutline: Array<{ title: string; summary: string; keyChoices: number }>
      requiredAssets: { backgrounds: string[] }
    }
  }) => {
    try {
      const projectDir = join(data.directory, data.plan.title)
      mkdirSync(projectDir, { recursive: true })

      const project = {
        id: randomUUID(),
        name: data.plan.title,
        description: data.plan.worldSetting,
        directory: projectDir,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'planning' as const,
        stats: { wordCount: 0, sceneCount: data.plan.chapterOutline.length, characterCount: data.plan.heroines.length, assetCount: 0 },
        config: {
          genre: data.plan.genre,
          targetPlatforms: ['windows'] as ('windows' | 'mac' | 'linux' | 'android')[],
          plan: data.plan,
        }
      }

      const projects = (projectStore.get('projects', []) as unknown[]).concat(project)
      projectStore.set('projects', projects)

      writeFileSync(join(projectDir, 'project.json'), JSON.stringify(project, null, 2))
      mkdirSync(join(projectDir, 'scripts'), { recursive: true })
      mkdirSync(join(projectDir, 'assets'), { recursive: true })
      mkdirSync(join(projectDir, 'characters'), { recursive: true })
      mkdirSync(join(projectDir, 'backgrounds'), { recursive: true })
      mkdirSync(join(projectDir, 'audio'), { recursive: true })

      return { success: true, data: project }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
