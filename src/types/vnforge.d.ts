export interface DialogAPI {
  selectDirectory: () => Promise<{ success: boolean; data: string | null; error?: string; code?: string }>
}

export interface ProjectsAPI {
  list: () => Promise<{ success: boolean; data: VNProject[]; error?: string; code?: string }>
  create: (config: BlankProjectConfig) => Promise<{ success: boolean; data: VNProject | null; error?: string; code?: string }>
  createWithPlan: (config: PlanProjectConfig) => Promise<{ success: boolean; data: VNProject | null; error?: string; code?: string }>
  open: (id: string) => Promise<{ success: boolean; data: VNProject | null; error?: string; code?: string }>
  delete: (id: string) => Promise<{ success: boolean; data: boolean; error?: string; code?: string }>
  showInExplorer: (directory: string) => Promise<{ success: boolean; data: boolean; error?: string; code?: string }>
}

export interface AIAPI {
  streamStart: (messages: unknown[], provider?: string) => Promise<void>
  abort: () => Promise<void>
  testConnection: (payload: unknown) => Promise<{ success: boolean; data: unknown }>
  generatePlan: (text: string) => Promise<{ success: boolean; data: AIPlan | null; error?: string; code?: string }>
  generateScript: (planJson: string) => Promise<{ success: boolean; data: string | null; error?: string; code?: string }>
}

export interface SettingsAPI {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<void>
  getDecrypted: (key: string) => Promise<string | null>
}

export interface EnvAPI {
  checkAll: () => Promise<{ success: boolean; data: EnvCheckItem[]; error?: string }>
  checkItem: (id: string) => Promise<{ success: boolean; data: EnvCheckItem | null; error?: string }>
  installItem: (id: string) => Promise<{ success: boolean; data: boolean }>
  abortInstall: () => Promise<void>
  onInstallLog: (handler: (event: unknown, line: string) => void) => void
  offInstallLog: (handler: (event: unknown, line: string) => void) => void
}

export interface RenpyAPI {
  generateCode: (payload: unknown) => Promise<{ success: boolean; data: string }>
  preview: (projectId: string) => Promise<{ success: boolean; data: number }>
  stopPreview: (pid: number) => Promise<{ success: boolean }>
}

export interface ResourcesAPI {
  pickFiles: () => Promise<{ success: boolean; data: string[] }>
  listAssets: (projectId: string) => Promise<{ success: boolean; data: unknown[] }>
  uploadAsset: (payload: unknown) => Promise<{ success: boolean; data: unknown }>
  updateAsset: (projectId: string, assetId: string, patch: unknown) => Promise<{ success: boolean; data: unknown }>
  deleteAsset: (projectId: string, assetId: string, projectDirectory: string) => Promise<{ success: boolean; data: boolean }>
  aiClassify: (imageBase64: string) => Promise<{ success: boolean; data: string }>
}

export interface ShellAPI {
  openExternal: (url: string) => Promise<void>
}

export interface VNForgeAPI {
  settings: SettingsAPI
  projects: ProjectsAPI
  env: EnvAPI
  ai: AIAPI
  renpy: RenpyAPI
  resources: ResourcesAPI
  dialog: DialogAPI
  shell: ShellAPI
}

export interface VNProject {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  directory: string
  status: 'planning' | 'writing' | 'developing' | 'completed'
  stats: {
    wordCount: number
    sceneCount: number
    characterCount: number
    assetCount: number
  }
  config: {
    genre: string
    targetPlatforms: ('windows' | 'mac' | 'linux' | 'android')[]
    mainHeroine?: string
  }
}

export interface EnvCheckItem {
  id: string
  name: string
  status: 'installed' | 'not-installed' | 'checking' | 'installing' | 'error'
  installedVersion?: string
  requiredVersion?: string
  errorMessage?: string
}

export interface BlankProjectConfig {
  name: string
  description: string
  directory: string
  genre: string
  targetPlatforms: ('windows' | 'mac' | 'linux' | 'android')[]
}

export interface PlanProjectConfig {
  directory: string
  plan: AIPlan
  initialScript?: string
}

declare global {
  interface Window {
    vnforge: VNForgeAPI
  }
}

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

