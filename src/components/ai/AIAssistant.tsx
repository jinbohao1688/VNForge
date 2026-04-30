import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, Loader } from 'lucide-react'
import { Button } from '../common/Button'
import { useProjectStore } from '../../stores/useProjectStore'
import { ai } from '../../lib/api'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIAssistantProps {
  projectContext?: {
    name: string
    genre: string
    characters: Array<{ id: string; renpyVariable: string; originalName: string }>
    backgrounds: Array<{ id: string; renpyVariable: string; originalName: string }>
  }
  onInsertToEditor?: (text: string) => void
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  projectContext,
  onInsertToEditor,
}) => {
  const { currentProject } = useProjectStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamBufferRef = useRef('')
  const onTokenRef = useRef<((chunk: string) => void) | null>(null)
  const onErrorRef = useRef<((err: string) => void) | null>(null)
  const onDoneRef = useRef<(() => void) | null>(null)

  const buildSystemPrompt = useCallback(() => {
    const projectName = projectContext?.name || currentProject?.name || '未命名'
    const genre = projectContext?.genre || (currentProject as any)?.config?.genre || '恋爱'
    const chars = projectContext?.characters || []
    const bgs = projectContext?.backgrounds || []
    const charList = chars.length ? chars.map((c) => c.renpyVariable || c.originalName).join(', ') : '暂无'
    const bgList = bgs.length ? bgs.map((b) => b.renpyVariable || b.originalName).join(', ') : '暂无'
    return `你是 VNForge 的 AI 助手，帮助用户创作视觉小说。

当前项目信息：
- 项目名称：${projectName}
- 类型：${genre}
- 已定义角色：${charList}
- 已定义背景：${bgList}

你的职责：
1. 根据用户的想法生成故事大纲和情节
2. 编写 Ren'Py 脚本对话
3. 建议角色设计和场景设置
4. 回答关于视觉小说创作的问题

注意：
- 使用中文回答
- 只返回 Ren'Py 代码时使用代码块包裹
- 保持回答简洁，专业，专注于视觉小说创作`
  }, [projectContext, currentProject])

  useEffect(() => {
    onTokenRef.current = (chunk: string) => {
      streamBufferRef.current += chunk
    }
    onErrorRef.current = (err: string) => {
      toast.error(`AI 错误：${err}`)
      setIsStreaming(false)
      streamBufferRef.current = ''
    }
    onDoneRef.current = () => {
      const finalText = streamBufferRef.current
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = { role: 'assistant', content: finalText }
        } else {
          updated.push({ role: 'assistant', content: finalText })
        }
        return updated
      })
      setIsStreaming(false)
      streamBufferRef.current = ''
    }
  }, [])

  // Refresh display every 80ms during streaming
  useEffect(() => {
    if (!isStreaming) return
    const timer = setInterval(() => {
      const text = streamBufferRef.current
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: text }
        }
        return updated
      })
    }, 80)
    return () => clearInterval(timer)
  }, [isStreaming])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return
    const userMessage = input.trim()
    setInput('')

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    const assistantPlaceholder: Message = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, assistantPlaceholder])

    setIsStreaming(true)
    streamBufferRef.current = ''

    const allMessages = [
      { role: 'system', content: buildSystemPrompt() },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ]

    try {
      ai.streamChat(allMessages)
    } catch (e: any) {
      toast.error(e.message || '请求失败')
      setIsStreaming(false)
      setMessages((prev) => prev.slice(0, -2))
    }
  }

  const handleInsert = (text: string) => {
    onInsertToEditor?.(text)
    toast.success('已插入到剧本')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="font-medium text-text-main text-sm">AI 助手</span>
        </div>
        {isStreaming && (
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Loader size={10} className="animate-spin" /> 生成中...
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles size={24} className="text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-text-main mb-1">AI 创作助手</h4>
            <p className="text-xs text-text-muted max-w-xs leading-relaxed">
              询问我关于故事创作、角色设定、脚本编写等问题
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-bg-card text-text-main rounded-bl-md'
              }`}
            >
              {msg.content.split('\n').map((line, j) => {
                if (line.startsWith('```')) {
                  return (
                    <div key={j} className="mt-2 mb-2">
                      <pre className="bg-black/30 rounded-lg p-2 text-xs overflow-x-auto">
                        <code>{line.replace(/```\w*/, '')}</code>
                      </pre>
                    </div>
                  )
                }
                return (
                  <span key={j}>
                    {line}
                    {j < msg.content.split('\n').length - 1 && <br />}
                  </span>
                )
              })}
              {msg.role === 'assistant' && msg.content && (
                <button
                  onClick={() => handleInsert(msg.content)}
                  className="block mt-2 text-xs text-primary/70 hover:text-primary transition-colors"
                >
                  + 插入剧本
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="输入问题... (Enter 发送)"
            rows={1}
            className="flex-1 px-3 py-2 bg-bg-card border border-border rounded-xl text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 resize-none transition-colors"
          />
          <Button size="sm" onClick={handleSend} disabled={!input.trim() || isStreaming}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
