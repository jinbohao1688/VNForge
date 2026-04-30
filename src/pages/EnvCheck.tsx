import { useState, useEffect } from 'react'
import { env } from '../lib/api'
import type { EnvStatus } from '../types'

export default function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    checkEnv()
  }, [])

  const checkEnv = async () => {
    setLoading(true)
    try {
      const result = await env.check()
      if (result.success && result.data) {
        setEnvStatus(result.data as EnvStatus)
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  const handleRecheck = async () => {
    setChecking(true)
    await checkEnv()
    setChecking(false)
  }

  const envItems = envStatus ? [
    { key: 'nodejs', label: 'Node.js', description: 'Required for the application', info: envStatus.nodejs },
    { key: 'python', label: 'Python', description: "Required for Ren'Py scripting tools", info: envStatus.python },
    { key: 'renpy', label: "Ren'Py SDK", description: 'Required to run and build visual novels', info: envStatus.renpy },
    { key: 'java', label: 'Java (JDK)', description: 'Required for Android builds', info: envStatus.java },
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Checking environment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Environment Check</h1>
          <p className="text-sm text-gray-400">Verify that required tools are installed</p>
        </div>
        <button
          onClick={handleRecheck}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-sm text-gray-300 rounded-lg hover:bg-white/15 transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {checking ? 'Checking...' : 'Recheck'}
        </button>
      </div>

      <div className="grid gap-4">
        {envItems.map((item) => {
          const status = item.info.status
          const isOk = status === 'ok'
          const isWarn = status === 'warn'
          const colorClass = isOk ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : isWarn ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            : 'bg-red-500/20 text-red-400 border-red-500/30'
          const label = isOk ? 'Installed' : isWarn ? 'Warning' : 'Not Found'

          return (
            <div key={item.key} className="bg-[#111118] rounded-xl border border-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                    {isOk ? <CheckIcon /> : isWarn ? <WarningIcon /> : <XIcon />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{item.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full border ${colorClass}`}>
                    {label}
                  </span>
                  {item.info.version && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">{item.info.version}</p>
                  )}
                  {item.info.hint && (
                    <p className="text-[10px] text-gray-600 mt-1 max-w-xs text-right">{item.info.hint}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-[#111118] rounded-xl border border-white/5 p-5">
        <h3 className="text-sm font-medium text-white mb-3">Installation Guides</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Python', url: 'https://www.python.org/downloads/', desc: 'Download from python.org' },
            { name: "Ren'Py", url: 'https://www.renpy.org/latest.html', desc: 'Download from renpy.org' },
            { name: 'JDK', url: 'https://adoptium.net/temurin/releases/', desc: 'Download from Eclipse Adoptium' },
            { name: 'Node.js', url: 'https://nodejs.org/', desc: 'Download from nodejs.org' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <div>
                <p className="text-xs font-medium text-gray-300">{item.name}</p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}
