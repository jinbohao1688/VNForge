// ─── IPC API ─────────────────────────────────────────────────────────────────────

interface IpcApi {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AP = Promise<any>

// Get the api from window - it's set by preload.ts
const getApi = (): IpcApi => (window as unknown as { api: IpcApi }).api

// ─── Settings ──────────────────────────────────────────────────────────────────

export const settings = {
  get: (key: string) =>
    getApi().invoke('settings:get', key) as AP,
  getAll: () =>
    getApi().invoke('settings:getAll') as AP,
  set: (key: string, value: unknown) =>
    getApi().invoke('settings:set', key, value) as AP,
  setMany: (entries: Record<string, unknown>) =>
    getApi().invoke('settings:setMany', entries) as AP,
  testConnection: (provider: string, config: { apiKey: string; baseUrl?: string; model?: string }) =>
    getApi().invoke('ai:testConnection', provider, config) as AP,
}

// ─── Project ──────────────────────────────────────────────────────────────────

export const projects = {
  list: () =>
    getApi().invoke('project:list') as AP,
  create: (data: {
    name: string
    description: string
    directory: string
    genre?: string
    targetPlatforms?: ('windows' | 'mac' | 'linux' | 'android')[]
  }) => getApi().invoke('project:create', data) as AP,
  createWithPlan: (data: { directory: string; plan: unknown }) =>
    getApi().invoke('project:createWithPlan', data) as AP,
  open: (id: string) =>
    getApi().invoke('project:open', id) as AP,
  delete: (id: string) =>
    getApi().invoke('project:delete', id) as AP,
  selectDirectory: () =>
    getApi().invoke('project:selectDirectory') as AP,
  showInExplorer: (directory: string) =>
    getApi().invoke('project:showInExplorer', directory) as AP,
  readScript: (projectId: string, scriptPath: string) =>
    getApi().invoke('project:readScript', projectId, scriptPath) as AP,
  saveScript: (projectId: string, scriptPath: string, content: string) =>
    getApi().invoke('project:saveScript', projectId, scriptPath, content) as AP,
}

// ─── Env ──────────────────────────────────────────────────────────────────────

export const env = {
  check: () =>
    getApi().invoke('env:check') as AP,
  checkPython: () =>
    getApi().invoke('env:checkPython') as AP,
  checkRenpy: () =>
    getApi().invoke('env:checkRenpy') as AP,
  checkJava: () =>
    getApi().invoke('env:checkJava') as AP,
  runPythonScript: (scriptPath: string, args: string[]) =>
    getApi().invoke('env:runPythonScript', scriptPath, args) as AP,
}

// ─── Resource ─────────────────────────────────────────────────────────────────

export const resources = {
  import: (projectId: string) =>
    getApi().invoke('resource:import', projectId) as AP,
  list: (projectId: string, type?: string) =>
    getApi().invoke('resource:list', projectId, type) as AP,
  delete: (projectId: string, assetId: string) =>
    getApi().invoke('resource:delete', projectId, assetId) as AP,
  updateMetadata: (projectId: string, assetId: string, metadata: unknown) =>
    getApi().invoke('resource:updateMetadata', projectId, assetId, metadata) as AP,
  selectAsset: () =>
    getApi().invoke('resource:selectAsset') as AP,
  uploadAsset: (projectId: string, filePath: string, metadata: unknown) =>
    getApi().invoke('resource:upload-asset', projectId, filePath, metadata) as AP,
  openInExplorer: (filePath: string) =>
    getApi().invoke('resource:open-in-explorer', filePath) as AP,
}

// ─── Renpy ────────────────────────────────────────────────────────────────────

export const renpy = {
  generate: (projectId: string, data: {
    projectDir: string
    scripts: Array<{ path: string; content: string }>
    characters: Array<{ name: string; color: string }>
    assets: Record<string, string>
  }) => getApi().invoke('renpy:generate', projectId, data) as AP,
  launch: (projectPath: string) =>
    getApi().invoke('renpy:launch', projectPath) as AP,
  build: (projectPath: string, platform: string) =>
    getApi().invoke('renpy:build', projectPath, platform) as AP,
  generateScript: (storyContent: string, projectDir: string) =>
    getApi().invoke('renpy:generateScript', storyContent, projectDir) as AP,
  generateCode: (scriptText: string, projectId: string) =>
    getApi().invoke('renpy:generateCode', scriptText, projectId) as AP,
  preview: (projectId: string) =>
    getApi().invoke('renpy:preview', projectId) as AP,
  stopPreview: (projectId: string) =>
    getApi().invoke('renpy:stopPreview', projectId) as AP,
  importScript: (filePath: string) =>
    getApi().invoke('renpy:importScript', filePath) as AP,
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export const shell = {
  openFile: (options?: { name?: string; extensions?: string[] }) =>
    getApi().invoke('shell:openFile', options) as AP,
  openDirectory: () =>
    getApi().invoke('shell:openDirectory') as AP,
}

// ─── AI ─────────────────────────────────────────────────────────────────────

export const ai = {
  chat: (messages: Array<{ role: string; content: string }>, model?: string) =>
    getApi().invoke('ai:chat', messages, model) as AP,
  generatePlan: (idea: string) =>
    getApi().invoke('ai:generatePlan', idea) as AP,
  streamChat: (messages: Array<{ role: string; content: string }>, model?: string) =>
    getApi().invoke('ai:streamChat', messages, model) as AP,
  testConnection: (provider: string, config: { apiKey: string; baseUrl?: string; model?: string }) =>
    getApi().invoke('ai:testConnection', provider, config) as AP,
  onToken: (callback: (token: string) => void) => {
    return getApi().on('ai:streamToken', (...args: unknown[]) => callback(args[0] as string))
  },
  onError: (callback: (error: string) => void) => {
    return getApi().on('ai:streamError', (...args: unknown[]) => callback(args[0] as string))
  },
  onDone: (callback: () => void) => {
    return getApi().on('ai:streamDone', () => callback())
  },
}

// ─── Dialog (shortcut) ─────────────────────────────────────────────────────

export const dialog = {
  selectDirectory: () => getApi().invoke('dialog:selectDirectory') as AP,
}
