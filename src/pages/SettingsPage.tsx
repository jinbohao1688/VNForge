import React, { useEffect, useState } from 'react'
import { Settings, Key, FolderOpen, Type, Globe, Bot, Cpu, Loader } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useEnvCheck } from '../hooks/useEnvCheck'
import { Button } from '../components/common/Button'
import { settings as settingsApi, ai } from '../lib/api'
import { toast } from 'sonner'
import type { AIProvider } from '../types'

const envIcons: Record<string, string> = {
  python: '🐍',
  renpy: '🎮',
  java: '☕',
  nodejs: '🟢',
  androidSdk: '📱',
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••'
  return key.slice(0, 4) + '••••' + key.slice(-4)
}

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, isUpdating } = useSettings()
  const { data: envStatus, refetch: refetchEnv } = useEnvCheck()

  const [testStatus, setTestStatus] = useState<{ ok: boolean; latency?: number; error?: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setApiKeyInput('')
    }
  }, [settings?.aiProvider])

  const handleProviderChange = async (provider: AIProvider) => {
    setSaving(true)
    try {
      await settingsApi.set('aiProvider', provider)
      setTestStatus(null)
      toast.success('AI 提供商已切换')
    } finally {
      setSaving(false)
    }
  }

  const handleApiKeyChange = async (value: string) => {
    setApiKeyInput(value)
    if (value.length >= 8) {
      setSaving(true)
      try {
        await settingsApi.set('aiApiKey', value)
        setTestStatus(null)
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return
    setSaving(true)
    try {
      await settingsApi.set('aiApiKey', apiKeyInput.trim())
      toast.success('API Key 已保存')
    } catch (e: any) {
      toast.error(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    const key = apiKeyInput || (settings?.aiApiKey ?? '')
    if (!key) {
      toast.error('请先输入 API Key')
      return
    }
    setTesting(true)
    setTestStatus(null)
    try {
      const provider = settings?.aiProvider || 'openai'
      const result = await ai.testConnection(provider, { apiKey: key })
      if (result?.success && result.data) {
        setTestStatus({ ok: true, latency: result.data.latency })
        toast.success(`连接成功，延迟 ${result.data.latency}ms`)
      } else {
        setTestStatus({ ok: false, error: result?.error || '连接失败' })
        toast.error(result?.error || '连接失败')
      }
    } catch (e: any) {
      setTestStatus({ ok: false, error: e.message })
      toast.error(e.message || '连接失败')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveSetting = async (key: string, value: unknown) => {
    try {
      await settingsApi.set(key, value)
    } catch (e: any) {
      toast.error(e.message || '保存失败')
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size={20} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8 space-y-8">
        <header>
          <div className="flex items-center gap-3 mb-1">
            <Settings size={24} className="text-text-sub" />
            <h1 className="text-2xl font-bold text-text-main">设置</h1>
          </div>
          <p className="text-sm text-text-sub ml-9">
            配置 VNForge 的各项参数
          </p>
        </header>

        {/* Environment */}
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-primary" />
            <h2 className="font-semibold text-text-main">环境状态</h2>
            <button
              onClick={() => refetchEnv()}
              className="ml-auto text-xs text-text-muted hover:text-primary transition-colors"
            >
              重新检测
            </button>
          </div>
          <div className="space-y-2">
            {envStatus &&
              (Object.entries(envStatus) as [string, { status: string; version?: string; hint?: string }][]).map(([key, info]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 px-3 py-2.5 bg-bg-card rounded-xl"
                >
                  <span className="text-lg">{envIcons[key] || '📦'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-main capitalize">
                      {key === 'androidSdk' ? 'Android SDK' : key}
                    </p>
                    <p className="text-xs text-text-muted font-mono">
                      {info.version || '未检测到'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      info.status === 'ok'
                        ? 'bg-green-500/10 text-green-400'
                        : info.status === 'warn'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {info.status === 'ok' ? '就绪' : info.status === 'warn' ? '警告' : '缺失'}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* AI Settings */}
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={18} className="text-primary" />
            <h2 className="font-semibold text-text-main">AI 设置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-sub mb-2">AI 提供商</label>
              <div className="flex gap-2">
                {(['openai', 'claude', 'gemini'] as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      settings.aiProvider === p
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-bg-card border-border text-text-sub hover:text-text-main hover:border-white/10'
                    }`}
                  >
                    {p === 'openai' ? 'OpenAI' : p === 'claude' ? 'Claude' : 'Gemini'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-sub mb-2">
                API Key
                {saving && <Loader size={12} className="inline ml-2 animate-spin" />}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder={
                    apiKeyInput
                      ? ''
                      : settings.aiApiKey
                      ? `当前：${maskKey(settings.aiApiKey)}`
                      : settings.aiProvider === 'openai'
                      ? 'sk-...'
                      : settings.aiProvider === 'claude'
                      ? 'sk-ant-...'
                      : 'AIza...'
                  }
                  className="flex-1 px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors font-mono"
                />
                <Button size="sm" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim() || saving}>
                  保存
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleTestConnection}
                  disabled={testing || (!apiKeyInput && !settings.aiApiKey)}
                >
                  {testing ? <Loader size={12} className="animate-spin" /> : null}
                  {testing ? '测试中...' : '测试连接'}
                </Button>
              </div>
              {testStatus && (
                <p className={`text-xs mt-1.5 ${testStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {testStatus.ok
                    ? `✓ 连接成功 (${testStatus.latency}ms)`
                    : `✗ ${testStatus.error}`}
                </p>
              )}
              <p className="text-xs text-text-muted mt-1.5">
                {settings.aiProvider === 'openai'
                  ? '从 platform.openai.com 获取 API Key'
                  : settings.aiProvider === 'claude'
                  ? '从 console.anthropic.com 获取 API Key'
                  : '从 aistudio.google.com 获取 API Key'}
              </p>
            </div>
          </div>
        </section>

        {/* General */}
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen size={18} className="text-primary" />
            <h2 className="font-semibold text-text-main">通用设置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-sub mb-2">
                默认项目保存位置
              </label>
              <input
                type="text"
                value={settings.defaultProjectDir}
                onChange={(e) => handleSaveSetting('defaultProjectDir', e.target.value)}
                placeholder="留空则每次询问"
                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-sub mb-2">语言</label>
              <select
                value={settings.language}
                onChange={(e) => handleSaveSetting('language', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-sub">自动保存</p>
                <p className="text-xs text-text-muted mt-0.5">
                  启用后每隔 {settings.autoSaveInterval} 秒自动保存
                </p>
              </div>
              <button
                onClick={() => handleSaveSetting('autoSave', !settings.autoSave)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.autoSave ? 'bg-primary' : 'bg-bg-card border border-border'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoSave ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Type size={18} className="text-primary" />
            <h2 className="font-semibold text-text-main">编辑器设置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-sub mb-2">字体大小</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={settings.editorFontSize}
                  onChange={(e) => handleSaveSetting('editorFontSize', parseInt(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm text-text-main font-mono w-8 text-right">
                  {settings.editorFontSize}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-sub mb-2">字体</label>
              <select
                value={settings.editorFontFamily}
                onChange={(e) => handleSaveSetting('editorFontFamily', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="JetBrains Mono, Consolas, monospace">JetBrains Mono</option>
                <option value="Consolas, monospace">Consolas</option>
                <option value="'Fira Code', monospace">Fira Code</option>
                <option value="'Source Code Pro', monospace">Source Code Pro</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
