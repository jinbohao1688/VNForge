import { VNProject } from '../types'

export interface AICharacter {
  name: string
  personality: string
  routeTheme?: string
  description?: string
  endings: ('HE' | 'BE')[]
}

export interface AIChapter {
  id: string
  title: string
  summary: string
  keyChoices: number
}

export interface AIPlan {
  title: string
  genre: string
  worldSetting: string
  protagonist: { name: string; description: string }
  heroines: AICharacter[]
  chapterOutline: AIChapter[]
  requiredAssets: {
    backgrounds: string[]
    characters: string[]
  }
  estimatedWords: number
}

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface VNProject {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  directory: string
  status: 'planning' | 'writing' | 'development' | 'completed'
  stats: {
    wordCount: number
    sceneCount: number
    characterCount: number
    assetCount: number
  }
  config: {
    genre: string
    targetPlatforms: Array<'windows' | 'mac' | 'linux' | 'android'>
    mainHeroine?: string
  }
}

export interface Window {
  vnforge: {
    settings: {
      get: (key: string) => Promise<IpcResponse>
      set: (key: string, value: unknown) => Promise<IpcResponse>
      getDecrypted: (key: string) => Promise<IpcResponse>
    }
    projects: {
      list: () => Promise<IpcResponse<VNProject[]>>
      create: (payload: {
        name: string
        description: string
        directory: string
        genre: string
        targetPlatforms: Array<'windows' | 'mac' | 'linux' | 'android'>
      }) => Promise<IpcResponse<VNProject>>
      createWithPlan: (payload: {
        directory: string
        plan: {
          title: string
          genre: string
          worldSetting: string
          protagonist: { name: string; description: string }
          heroines: AICharacter[]
          chapterOutline: AIChapter[]
          requiredAssets: { backgrounds: string[]; characters: string[] }
          estimatedWords: number
        }
        initialScript?: string
      }) => Promise<IpcResponse<VNProject>>
      open: (projectId: string) => Promise<IpcResponse<VNProject | null>>
      delete: (projectId: string) => Promise<IpcResponse<boolean>>
      showInExplorer: (directory: string) => Promise<IpcResponse<boolean>>
    }
    env: {
      checkAll: () => Promise<IpcResponse>
      checkItem: (id: string) => Promise<IpcResponse>
      installItem: (id: string) => Promise<IpcResponse>
      abortInstall: () => Promise<IpcResponse>
      onInstallLog: (handler: (event: unknown, line: string) => void) => void
      offInstallLog: (handler: (event: unknown, line: string) => void) => void
    }
    ai: {
      streamStart: (messages: unknown[], provider?: string) => Promise<IpcResponse>
      abort: () => Promise<IpcResponse>
      testConnection: (payload: unknown) => Promise<IpcResponse>
      generatePlan: (text: string) => Promise<IpcResponse<AIPlan>>
      generateScript: (planJson: string) => Promise<IpcResponse<string>>
    }
    renpy: {
      generateCode: (payload: unknown) => Promise<IpcResponse>
      preview: (projectId: string) => Promise<IpcResponse>
      stopPreview: (pid: number) => Promise<IpcResponse>
    }
    resources: {
      pickFiles: () => Promise<IpcResponse>
      listAssets: (projectId: string) => Promise<IpcResponse>
      uploadAsset: (payload: unknown) => Promise<IpcResponse>
      updateAsset: (projectId: string, assetId: string, patch: unknown) => Promise<IpcResponse>
      deleteAsset: (projectId: string, assetId: string, projectDirectory: string) => Promise<IpcResponse>
      aiClassify: (imageBase64: string) => Promise<IpcResponse>
    }
    dialog: {
      selectDirectory: () => Promise<IpcResponse<string | null>>
    }
    shell: {
      openExternal: (url: string) => Promise<void>
    }
  }
}

export {}
