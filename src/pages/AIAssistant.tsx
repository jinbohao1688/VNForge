import { useState, useEffect, useRef } from 'react'
import { useApp } from '../AppContext'
import { ai } from '../lib/api'
import { ChatMessage } from '../types'

const SYSTEM_PROMPT = `You are an AI assistant specialized in visual novel and Ren'Py game development. You help writers and developers with:

1. **Story Writing**: Create compelling dialogue, plot outlines, character development, branching narratives
2. **Ren'Py Scripting**: Write efficient .rpy code, use screen language, implement menus and conditional logic
3. **Character Design**: Develop character personalities, backstories, dialogue patterns
4. **Game Design**: Plan branching storylines, manage game state, optimize player experience
5. **Debugging**: Help fix Ren'Py errors and game logic issues

Be concise, helpful, and provide code examples when relevant. Use Ren'Py syntax for scripting examples.`

const quickPrompts = [
  { label: 'Generate a scene', prompt: 'Write a romantic scene between two characters in a coffee shop. Include dialogue and narration.' },
  { label: 'Create a branching choice', prompt: 'Create a branching dialogue choice with 3 options that lead to different story paths.' },
  { label: 'Character dialogue', prompt: 'Write dialogue for a mysterious stranger character that hints at a dark secret.' },
  { label: "Ren'Py code", prompt: "Write Ren'Py code for a scene transition with a dissolve effect and background music." },
]

export default function AIAssistant() {
  const { settings } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamedResponse, setStreamedResponse] = useState('')
  const [selectedQuickPrompt, setSelectedQuickPrompt] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamedResponse])

  useEffect(() => {
    if (!settings.aiApiKey) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Please configure your AI API key in Settings to use the AI Assistant.',
        timestamp: Date.now()
      }])
    }
  }, [settings.aiApiKey])

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return
    if (!settings.aiApiKey) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setStreamedResponse('')

    const chatHistory: Array<{ role: string; content: string }> = messages.map((m) => ({ role: m.role, content: m.content }))
    chatHistory.push({ role: 'user', content })
    chatHistory.unshift({ role: 'system', content: SYSTEM_PROMPT })

    const cleanupToken = ai.onToken((token: string) => {
      setStreamedResponse((prev) => prev + token)
    })

    const cleanupError = ai.onError((error: string) => {
      setStreamedResponse(`Error: ${error}`)
      setIsLoading(false)
    })

    const cleanupDone = ai.onDone(() => {
      if (streamedResponse) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: streamedResponse,
          timestamp: Date.now()
        }
        setMessages((prev) => [...prev, assistantMsg])
      }
      setStreamedResponse('')
      setIsLoading(false)
      cleanupToken()
      cleanupError()
      cleanupDone()
    })

    try {
      await ai.streamChat(chatHistory)
    } catch (e: unknown) {
      setStreamedResponse(`Error: ${(e as Error).message}`)
      setIsLoading(false)
      cleanupToken()
      cleanupError()
      cleanupDone()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setSelectedQuickPrompt(prompt)
    handleSend(prompt)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#111118]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">AI Assistant</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Powered by {settings.aiProvider === 'openai' ? 'OpenAI GPT-4o' : settings.aiProvider === 'claude' ? 'Claude 3.5' : 'Google Gemini'}
            </p>
          </div>
          <button
            onClick={() => setMessages([])}
            className="px-3 py-1.5 bg-white/5 text-xs text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-300 mb-2">AI Story Assistant</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
              I can help you write scenes, create branching narratives, develop characters, and write Ren'Py code.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
              {quickPrompts.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleQuickPrompt(qp.prompt)}
                  disabled={isLoading || !settings.aiApiKey}
                  className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 text-left transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <p className="text-xs font-medium text-gray-300 mb-1">{qp.label}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{qp.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-[#1a1a24] text-gray-300'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}

        {streamedResponse && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-[#1a1a24] text-gray-300">
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {streamedResponse}
                <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {isLoading && !streamedResponse && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a24] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-[#111118]">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(input)
              }
            }}
            placeholder="Ask me to write a scene, create a character, or help with Ren'Py code..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none outline-none focus:border-purple-500/50 transition-colors"
            rows={1}
            disabled={isLoading || !settings.aiApiKey}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading || !settings.aiApiKey}
            className="px-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-2 max-w-4xl mx-auto">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
