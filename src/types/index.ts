// ─── Enums / Literals ─────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'writing' | 'developing' | 'completed'
export type TargetPlatform = 'windows' | 'mac' | 'linux' | 'android'
export type EndingType = 'HE' | 'BE'
export type AIProvider = 'openai' | 'claude' | 'gemini'
export type AssetType = 'background' | 'character' | 'avatar' | 'bgm' | 'sfx'

// ─── Project ─────────────────────────────────────────────────────────────────

export interface ProjectStats {
  wordCount: number
  sceneCount: number
  characterCount: number
  assetCount: number
}

export interface ProjectConfig {
  genre: string
  targetPlatforms: TargetPlatform[]
  mainHeroine?: string
}

export interface VNProject {
  id: string
  name: string
  description: string
  coverImage?: string
  createdAt: string
  updatedAt: string
  directory: string
  status: ProjectStatus
  stats: ProjectStats
  config: ProjectConfig
}

// ─── Heroine / Character ─────────────────────────────────────────────────────

export interface Heroine {
  name: string
  personality: string
  routeTheme?: string
  description?: string
  endings: EndingType[]
}

export interface Character {
  id: string
  name: string
  displayName: string
  color: string
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export interface ChapterOutline {
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
  heroines: Heroine[]
  chapterOutline: ChapterOutline[]
  requiredAssets: { backgrounds: string[]; characters: string[] }
  estimatedWords: number
}

// ─── Chat / Messaging ────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export interface Asset {
  id: string
  projectId: string
  type: AssetType
  originalName: string
  fileName: string
  renpyVariable: string
  thumbnailPath?: string
  metadata: {
    characterName?: string
    sceneName?: string
    emotions?: string[]
    loop?: boolean
  }
  createdAt: string
}

// ─── Environment ─────────────────────────────────────────────────────────────

export interface EnvStatus {
  python: { status: string; version?: string; hint?: string }
  renpy: { status: string; version?: string; hint?: string }
  java: { status: string; version?: string; hint?: string }
  androidSdk: { status: string; version?: string; hint?: string }
  nodejs: { status: string; version?: string; hint?: string }
}

export interface EnvItemResult {
  status: 'ok' | 'warn' | 'missing' | 'checking'
  version?: string
  hint?: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ─── Scene / Dialogue ────────────────────────────────────────────────────────

export interface Scene {
  id: string
  projectId: string
  title: string
  content: string
  order: number
  type: 'dialogue' | 'narration'
}

export interface DialogueEntry {
  id: string
  speaker: string
  text: string
  emotion?: string
  position?: string
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: 'dark' | 'light'
  language: string
  aiProvider: AIProvider
  aiApiKey: string
  defaultProjectDir: string
  editorFontSize: number
  editorFontFamily: string
  autoSave: boolean
  autoSaveInterval: number
}
