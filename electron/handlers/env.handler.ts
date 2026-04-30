import { ipcMain, app } from 'electron'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

interface EnvCheckResult {
  python: { status: string; version?: string; hint?: string }
  renpy: { status: string; version?: string; hint?: string }
  java: { status: string; version?: string; hint?: string }
  androidSdk: { status: string; version?: string; hint?: string }
  nodejs: { status: string; version?: string; hint?: string }
}

export function setupEnvHandler(): void {
  ipcMain.handle('env:check', async () => {
    return checkAllEnv()
  })

  ipcMain.handle('env:checkPython', async () => {
    return checkPython()
  })

  ipcMain.handle('env:checkRenpy', async () => {
    return checkRenpy()
  })

  ipcMain.handle('env:checkJava', async () => {
    return checkJava()
  })

  ipcMain.handle('env:runPythonScript', async (_: unknown, scriptPath: string, args: string[]) => {
    return runPythonScript(scriptPath, args)
  })
}

function execCommand(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { shell: true })
    let stdout = ''
    let stderr = ''
    proc.stdout?.on('data', (d) => { stdout += d.toString() })
    proc.stderr?.on('data', (d) => { stderr += d.toString() })
    proc.on('close', (code) => resolve({ stdout, stderr, code: code || 0 }))
    proc.on('error', (e) => resolve({ stdout: '', stderr: e.message, code: 1 }))
  })
}

async function checkAllEnv(): Promise<{ success: boolean; data?: EnvCheckResult; error?: string }> {
  const [python, renpy, java, nodejs] = await Promise.all([
    checkPython(),
    checkRenpy(),
    checkJava(),
    checkNode()
  ])
  return {
    success: true,
    data: { python, renpy, java, nodejs, androidSdk: java }
  }
}

async function checkPython(): Promise<{ status: string; version?: string; hint?: string }> {
  try {
    const result = await execCommand('python', ['--version'])
    if (result.code === 0) {
      return { status: 'ok', version: result.stdout.trim() }
    }
    const result3 = await execCommand('python3', ['--version'])
    if (result3.code === 0) {
      return { status: 'ok', version: result3.stdout.trim() }
    }
    return { status: 'missing', hint: 'Install Python 3.8+ from python.org' }
  } catch {
    return { status: 'missing', hint: 'Python not found in PATH' }
  }
}

async function checkRenpy(): Promise<{ status: string; version?: string; hint?: string }> {
  try {
    const result = await execCommand('renpy', ['--version'])
    if (result.code === 0) {
      return { status: 'ok', version: result.stdout.trim() }
    }
    return { status: 'missing', hint: 'Download Ren\'Py SDK from renpy.org' }
  } catch {
    return { status: 'missing', hint: 'Ren\'Py not found in PATH' }
  }
}

async function checkJava(): Promise<{ status: string; version?: string; hint?: string }> {
  try {
    const result = await execCommand('java', ['-version'])
    if (result.code === 0) {
      const firstLine = result.stderr.split('\n')[0]
      return { status: 'ok', version: firstLine }
    }
    return { status: 'missing', hint: 'Install JDK 17+ from adoptium.net' }
  } catch {
    return { status: 'missing', hint: 'Java not found in PATH' }
  }
}

async function checkNode(): Promise<{ status: string; version?: string; hint?: string }> {
  const version = process.version
  const major = parseInt(version.replace('v', '').split('.')[0])
  if (major >= 18) {
    return { status: 'ok', version: `Node.js ${version}` }
  }
  return { status: 'warn', version: `Node.js ${version}`, hint: 'Node.js 18+ recommended' }
}

async function runPythonScript(
  scriptPath: string,
  args: string[]
): Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }> {
  return new Promise((resolve) => {
    if (!existsSync(scriptPath)) {
      resolve({ success: false, error: `Script not found: ${scriptPath}` })
      return
    }
    const proc = spawn('python', [scriptPath, ...args], {
      cwd: app.isPackaged ? join(app.getAppPath(), '..') : app.getAppPath()
    })
    let stdout = ''
    let stderr = ''
    proc.stdout?.on('data', (d) => { stdout += d.toString() })
    proc.stderr?.on('data', (d) => { stderr += d.toString() })
    proc.on('close', (code) => {
      resolve({ success: code === 0, stdout, stderr })
    })
    proc.on('error', (e) => resolve({ success: false, error: e.message }))
  })
}
