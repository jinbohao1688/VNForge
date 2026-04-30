import { ipcMain, BrowserWindow } from 'electron'
import Store from 'electron-store'

const store = new Store()

function getWin() {
  return BrowserWindow.getFocusedWindow()
}

export function setupAIHandler(): void {
  ipcMain.handle('ai:chat', async (_: unknown, messages: Array<{ role: string; content: string }>, model?: string) => {
    const apiKey = store.get('aiApiKey', '') as string
    const provider = store.get('aiProvider', 'openai') as string

    if (!apiKey) {
      return { success: false, error: 'AI API key not configured. Go to Settings.' }
    }

    try {
      let result: string

      if (provider === 'openai') {
        result = await callOpenAI(apiKey, messages, model || 'gpt-4o')
      } else if (provider === 'claude') {
        result = await callClaude(apiKey, messages, model || 'claude-3-5-sonnet-20241022')
      } else {
        result = await callGemini(apiKey, messages, model || 'gemini-2.0-flash')
      }

      return { success: true, data: result }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('ai:generatePlan', async (_: unknown, idea: string) => {
    const apiKey = store.get('aiApiKey', '') as string
    const provider = store.get('aiProvider', 'openai') as string

    if (!apiKey) {
      return { success: false, error: 'AI API key not configured. Go to Settings.' }
    }

    try {
      const messages: Array<{ role: string; content: string }> = [
        {
          role: 'user',
          content: `你是一个专业的视觉小说游戏策划。请根据以下想法，生成一个详细的大纲规划。\n\n用户想法：${idea}\n\n请以JSON格式返回，包含以下字段：\n- title: 游戏名称\n- genre: 游戏类型（从以下选择：恋爱,悬疑,奇幻,现代,其他）\n- worldSetting: 世界观设定（100字左右）\n- protagonist: { name: 主角姓名 }\n- heroines: Array<{ name: 角色名, personality: 性格特点, endings: 结局类型数组如["HE","BE"] }>\n- chapterOutline: Array<{ title: 章节标题, summary: 章节概要（50字）, keyChoices: 关键选择点数量(0-3) }>（至少5章）\n- requiredAssets: { backgrounds: Array<string> }（至少5个背景场景）\n- estimatedWords: 预计字数\n\n只返回JSON，不要有其他内容。`
        }
      ]

      let result: string
      if (provider === 'openai') {
        result = await callOpenAI(apiKey, messages, 'gpt-4o')
      } else if (provider === 'claude') {
        result = await callClaude(apiKey, messages, 'claude-3-5-sonnet-20241022')
      } else {
        result = await callGemini(apiKey, messages, 'gemini-2.0-flash')
      }

      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { success: false, error: 'AI 返回格式异常，无法解析' }
      }

      const planData = JSON.parse(jsonMatch[0])
      return { success: true, data: planData }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('ai:testConnection', async (_: unknown, provider: string, config: {
    apiKey: string
    baseUrl?: string
    model?: string
  }) => {
    const start = Date.now()
    try {
      const messages = [{ role: 'user' as const, content: 'Hi' }]
      if (provider === 'openai') {
        await callOpenAI(config.apiKey, messages, config.model || 'gpt-4o')
      } else if (provider === 'claude') {
        await callClaude(config.apiKey, messages, config.model || 'claude-3-5-sonnet-20241022')
      } else {
        await callGemini(config.apiKey, messages, config.model || 'gemini-2.0-flash')
      }
      const latency = Date.now() - start
      return { success: true, data: { latency } }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('ai:streamChat', async (_: unknown, messages: Array<{ role: string; content: string }>, model?: string) => {
    const apiKey = store.get('aiApiKey', '') as string
    const provider = store.get('aiProvider', 'openai') as string

    if (!apiKey) {
      getWin()?.webContents.send('ai:streamError', 'AI API key not configured.')
      return
    }

    try {
      if (provider === 'openai') {
        await streamOpenAI(apiKey, messages, model || 'gpt-4o')
      } else if (provider === 'claude') {
        await streamClaude(apiKey, messages, model || 'claude-3-5-sonnet-20241022')
      } else {
        await streamGemini(apiKey, messages, model || 'gemini-2.0-flash')
      }
    } catch (e: any) {
      getWin()?.webContents.send('ai:streamError', e.message)
    }
  })
}

// ─── Non-streaming helpers ─────────────────────────────────────────────────────

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

// ─── Streaming helpers ─────────────────────────────────────────────────────────

async function streamOpenAI(apiKey: string, messages: Array<{ role: string; content: string }>, model: string): Promise<void> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, stream: true })
  })
  if (!resp.ok) {
    throw new Error(`OpenAI stream error: ${resp.status}`)
  }

  // @ts-ignore
  const { Readable } = await import('stream')
  const reader = resp.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          getWin()?.webContents.send('ai:streamDone')
          return
        }
        try {
          const parsed = JSON.parse(data)
          const token = parsed.choices?.[0]?.delta?.content
          if (token) {
            getWin()?.webContents.send('ai:streamToken', token)
          }
        } catch {}
      }
    }
  }
  getWin()?.webContents.send('ai:streamDone')
}

async function streamClaude(apiKey: string, messages: Array<{ role: string; content: string }>, model: string): Promise<void> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-stream': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    })
  })
  if (!resp.ok) throw new Error(`Claude stream error: ${resp.status}`)

  // @ts-ignore
  const { Readable } = await import('stream')
  const reader = resp.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta') {
            getWin()?.webContents.send('ai:streamToken', parsed.delta?.text || '')
          } else if (parsed.type === 'message_stop') {
            getWin()?.webContents.send('ai:streamDone')
            return
          }
        } catch {}
      }
    }
  }
  getWin()?.webContents.send('ai:streamDone')
}

async function streamGemini(apiKey: string, messages: Array<{ role: string; content: string }>, model: string): Promise<void> {
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents })
  })
  if (!resp.ok) throw new Error(`Gemini stream error: ${resp.status}`)

  // @ts-ignore
  const { Readable } = await import('stream')
  const reader = resp.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text
        if (token) {
          getWin()?.webContents.send('ai:streamToken', token)
        }
      } catch {}
    }
  }
  getWin()?.webContents.send('ai:streamDone')
}
