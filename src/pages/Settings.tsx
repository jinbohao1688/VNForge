import { useState } from 'react'
import { useApp } from '../AppContext'
import { AppSettings } from '../types'

const providers = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'], defaultModel: 'gpt-4o' },
  { id: 'claude', name: 'Claude', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'], defaultModel: 'claude-3-5-sonnet-20241022' },
  { id: 'gemini', name: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'], defaultModel: 'gemini-2.0-flash' },
]

export default function Settings() {
  const { settings, updateSettings } = useApp()
  const [apiKey, setApiKey] = useState(settings.aiApiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveApiKey = async () => {
    setSaving(true)
    await updateSettings('aiApiKey', apiKey)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleProviderChange = (provider: 'openai' | 'claude' | 'gemini') => {
    updateSettings('aiProvider', provider)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-gray-400">Configure your VNForge preferences</p>
      </div>

      <div className="space-y-6">
        {/* AI Provider Settings */}
        <div className="bg-[#111118] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI Provider
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id as 'openai' | 'claude' | 'gemini')}
                    className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                      settings.aiProvider === p.id
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 pr-10"
                    placeholder="sk-..."
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showApiKey ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleSaveApiKey}
                  disabled={saving}
                  className="px-4 py-2.5 bg-purple-500/20 text-purple-400 text-sm rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1.5">
                Your API key is stored securely on your device.
                {settings.aiProvider === 'openai' && ' Get your key from platform.openai.com'}
                {settings.aiProvider === 'claude' && ' Get your key from console.anthropic.com'}
                {settings.aiProvider === 'gemini' && ' Get your key from aistudio.google.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Editor Settings */}
        <div className="bg-[#111118] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editor
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Font Size</label>
                <input
                  type="number"
                  value={settings.editorFontSize}
                  onChange={(e) => updateSettings('editorFontSize', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  min={10}
                  max={24}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Font Family</label>
                <select
                  value={settings.editorFontFamily}
                  onChange={(e) => updateSettings('editorFontFamily', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="JetBrains Mono, Consolas, monospace">JetBrains Mono</option>
                  <option value="Fira Code, Consolas, monospace">Fira Code</option>
                  <option value="Source Code Pro, Consolas, monospace">Source Code Pro</option>
                  <option value="Consolas, monospace">Consolas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Save */}
        <div className="bg-[#111118] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Auto Save
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Enable Auto Save</p>
              <p className="text-[10px] text-gray-500">Automatically save your work every {settings.autoSaveInterval} seconds</p>
            </div>
            <button
              onClick={() => updateSettings('autoSave', !settings.autoSave)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.autoSave ? 'bg-purple-500' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoSave ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Default Project Directory */}
        <div className="bg-[#111118] rounded-xl border border-white/5 p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Projects
          </h2>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Default Project Directory</label>
            <input
              type="text"
              value={settings.defaultProjectDir}
              onChange={(e) => updateSettings('defaultProjectDir', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              placeholder="Select a default directory for new projects..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
