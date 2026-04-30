import { ipcMain } from 'electron'
import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs'
import Store from 'electron-store'

export function setupRenpyHandler(): void {
  ipcMain.handle('renpy:generate', async (_: unknown, projectId: string, data: {
    projectDir: string
    scripts: Array<{ path: string; content: string }>
    characters: Array<{ name: string; color: string }>
    assets: Record<string, string>
  }) => {
    try {
      for (const script of data.scripts) {
        const fullPath = join(data.projectDir, 'scripts', script.path)
        if (!existsSync(join(data.projectDir, 'scripts'))) {
          mkdirSync(join(data.projectDir, 'scripts'), { recursive: true })
        }
        writeFileSync(fullPath, script.content, 'utf-8')
      }

      for (const char of data.characters) {
        const defContent = `define ${char.name.toLowerCase().replace(/\s/g, '_')} = Character("${char.name}", color="${char.color}")\n`
        const defPath = join(data.projectDir, 'scripts', 'definitions.rpy')
        const existing = existsSync(defPath) ? require('fs').readFileSync(defPath, 'utf-8') : ''
        writeFileSync(defPath, existing + defContent, 'utf-8')
      }

      return { success: true, data: { message: 'Ren\'Py project generated successfully' } }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('renpy:launch', async (_: unknown, projectPath: string) => {
    try {
      if (!existsSync(projectPath)) {
        return { success: false, error: 'Project directory not found' }
      }
      spawn('renpy', [projectPath], { detached: true, stdio: 'ignore' }).unref()
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('renpy:build', async (_: unknown, projectPath: string, platform: string) => {
    try {
      const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
        const proc = spawn('renpy', ['launch', projectPath, '--build-only'], { shell: true })
        let stdout = ''
        let stderr = ''
        proc.stdout?.on('data', (d) => { stdout += d.toString() })
        proc.stderr?.on('data', (d) => { stderr += d.toString() })
        proc.on('close', (code) => resolve({ stdout, stderr, code: code || 0 }))
        proc.on('error', (e) => resolve({ stdout: '', stderr: e.message, code: 1 }))
      })
      return {
        success: result.code === 0,
        data: { stdout: result.stdout, stderr: result.stderr },
        error: result.code !== 0 ? result.stderr : undefined
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('renpy:generateScript', async (_: unknown, storyContent: string, projectDir: string) => {
    try {
      const scriptPath = join(projectDir, 'scripts', 'auto_generated.rpy')
      writeFileSync(scriptPath, storyContent, 'utf-8')
      return { success: true, data: { path: scriptPath } }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  // Generate Ren'Py code from VN script text via AI
  ipcMain.handle('renpy:generateCode', async (_: unknown, scriptText: string, projectId: string) => {
    try {
      const store = (await import('electron-store')).default
      const s = new store()
      const apiKey = s.get('aiApiKey', '') as string
      const provider = s.get('aiProvider', 'openai') as string
      if (!apiKey) {
        return { success: false, error: '请先在设置中配置 AI API Key' }
      }

      const systemPrompt = `你是一个 Ren'Py 视觉小说脚本生成器。将用户输入的剧本格式转换为标准的 Ren'Py 脚本代码。

规则：
- [背景：xxx] → scene bg_name with dissolve（背景文件对应 game/images/bg/bg_name.png）
- 白雪 "对话" → 角色名 "对话"
- （动作描述）→ narrator "动作描述"
- [选项] / A. B. → menu: ... end menu，配合 choice
- [章节：xxx] → # 第x章 注释
- # 开头的行 → 作为注释保留
- 保持原有格式，只转换语义标记

只返回 Ren'Py 代码，不要有其他解释。`

      const userContent = `请将以下剧本转换为 Ren'Py 代码：\n\n${scriptText}`
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userContent },
      ]

      let code = ''
      if (provider === 'openai') {
        code = await callOpenAI(apiKey, messages, 'gpt-4o')
      } else if (provider === 'claude') {
        code = await callClaude(apiKey, messages, 'claude-3-5-sonnet-20241022')
      } else {
        code = await callGemini(apiKey, messages, 'gemini-2.0-flash')
      }

      const lineCount = code.split('\n').length
      return { success: true, data: { code, lineCount, missingAssets: [] } }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  // Preview: launch Ren'Py in non-detached mode and track process
  ipcMain.handle('renpy:preview', async (_: unknown, projectPath: string) => {
    try {
      if (!existsSync(projectPath)) {
        return { success: false, error: '项目目录不存在' }
      }
      const proc = spawn('renpy', [projectPath], { stdio: 'ignore' })
      proc.unref()
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  // Import script from external file
  ipcMain.handle('renpy:importScript', async (_: unknown, filePath: string) => {
    try {
      if (!existsSync(filePath)) {
        return { success: false, error: '文件不存在' }
      }
      const content = readFileSync(filePath, 'utf-8')
      return { success: true, data: content }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  // Open file picker for script import
  ipcMain.handle('renpy:openScriptFile', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '剧本文件', extensions: ['txt', 'md', 'rpy', 'docx'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' }
    }
    return { success: true, data: result.filePaths[0] }
  })
}

// ─── AI Helpers (shared) ───────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, messages: Array<{ role: string; content: string }>, model: string): Promise<string> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, stream: false })
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`OpenAI API error: ${resp.status} ${err}`)
  }
  const data = await resp.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content || ''
}

async function callClaude(apiKey: string, messages: Array<{ role: string; content: string }>, model: string): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    })
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Claude API error: ${resp.status} ${err}`)
  }
  const data = await resp.json() as { content: Array<{ text: string }> }
  return data.content[0]?.text || ''
}

async function callGemini(apiKey: string, messages: Array<{ role: string; content: string }>, model: string): Promise<string> {
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents })
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Gemini API error: ${resp.status} ${err}`)
  }
  const data = await resp.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> }
  return data.candidates[0]?.content?.parts[0]?.text || ''
}
