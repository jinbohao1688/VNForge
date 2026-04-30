import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../AppContext'
import { projects as projectsApi, renpy as renpyApi } from '../lib/api'
import type { Scene, Character, DialogueEntry } from '../types'

export default function ProjectEditor() {
  const { currentProject, navigate } = useApp()
  const [activeTab, setActiveTab] = useState<'scenes' | 'characters' | 'assets'>('scenes')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeScene, setActiveScene] = useState<Scene | null>(null)
  const [scriptContent, setScriptContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (currentProject) {
      loadProjectData()
    }
  }, [currentProject])

  const loadProjectData = async () => {
    if (!currentProject) return
    const savedScenes = localStorage.getItem(`scenes_${currentProject.id}`)
    const savedChars = localStorage.getItem(`characters_${currentProject.id}`)
    if (savedScenes) setScenes(JSON.parse(savedScenes))
    if (savedChars) setCharacters(JSON.parse(savedChars))
  }

  const saveToStorage = useCallback((key: string, data: unknown) => {
    if (!currentProject) return
    localStorage.setItem(`${key}_${currentProject.id}`, JSON.stringify(data))
  }, [currentProject])

  const handleAddScene = () => {
    if (!currentProject) return
    const newScene: Scene = {
      id: Date.now().toString(),
      projectId: currentProject.id,
      title: `Scene ${scenes.length + 1}`,
      content: '# Scene\n\nWrite your story here...',
      order: scenes.length,
      type: 'dialogue'
    }
    const updated = [...scenes, newScene]
    setScenes(updated)
    saveToStorage('scenes', updated)
    setActiveScene(newScene)
  }

  const handleAddCharacter = () => {
    if (!currentProject) return
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43']
    const newChar: Character = {
      id: Date.now().toString(),
      name: `Character ${characters.length + 1}`,
      displayName: `Character ${characters.length + 1}`,
      color: colors[characters.length % colors.length]
    }
    const updated = [...characters, newChar]
    setCharacters(updated)
    saveToStorage('characters', updated)
  }

  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    const updated = characters.map((c) => c.id === id ? { ...c, ...updates } : c)
    setCharacters(updated)
    saveToStorage('characters', updated)
  }

  const handleDeleteCharacter = (id: string) => {
    const updated = characters.filter((c) => c.id !== id)
    setCharacters(updated)
    saveToStorage('characters', updated)
  }

  const handleSaveScript = async () => {
    if (!currentProject || !activeScene) return
    const updated = scenes.map((s) => s.id === activeScene.id ? { ...s, content: scriptContent } : s)
    setScenes(updated)
    saveToStorage('scenes', updated)
    await projectsApi.saveScript(currentProject.id, `${activeScene.title}.rpy`, scriptContent)
  }

  const handleSelectScene = (scene: Scene) => {
    setActiveScene(scene)
    setScriptContent(scene.content)
  }

  const handleDeleteScene = (id: string) => {
    const updated = scenes.filter((s) => s.id !== id)
    setScenes(updated)
    saveToStorage('scenes', updated)
    if (activeScene?.id === id) {
      setActiveScene(null)
      setScriptContent('')
    }
  }

  const handleExportRenpy = async () => {
    if (!currentProject) return
    const scripts = scenes.map((s) => ({ path: `${s.title.replace(/\s+/g, '_')}.rpy`, content: s.content }))
    const charDefs = characters.map((c) => ({ name: c.name, color: c.color }))
    await renpyApi.generate(currentProject.id, {
      projectDir: currentProject.directory,
      scripts,
      characters: charDefs,
      assets: {}
    })
  }

  const handleLaunchRenpy = async () => {
    if (!currentProject) return
    await renpyApi.launch(currentProject.directory)
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-1">No Project Selected</h3>
          <p className="text-sm text-gray-500 mb-4">Open a project from the dashboard</p>
          <button
            onClick={() => navigate('dashboard')}
            className="px-4 py-2 bg-white/10 text-sm text-gray-300 rounded-lg hover:bg-white/15 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Scene/Character List */}
      <div className="w-64 bg-[#111118] border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white truncate">{currentProject.name}</h2>
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">{currentProject.directory}</p>
        </div>

        <div className="flex border-b border-white/5">
          {(['scenes', 'characters', 'assets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                activeTab === tab ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-3">
          {activeTab === 'scenes' && (
            <div className="space-y-1">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    activeScene?.id === scene.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  onClick={() => handleSelectScene(scene)}
                >
                  <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs text-gray-300 truncate flex-1">{scene.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene.id) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition-all shrink-0"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddScene}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Scene
              </button>
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="space-y-1">
              {characters.map((char) => (
                <div key={char.id} className="group bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: char.color }} />
                    <input
                      value={char.name}
                      onChange={(e) => handleUpdateCharacter(char.id, { name: e.target.value, displayName: e.target.value })}
                      className="flex-1 bg-transparent text-xs text-white border-none outline-none"
                    />
                    <button
                      onClick={() => handleDeleteCharacter(char.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition-all shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Color:</span>
                    <input
                      type="color"
                      value={char.color}
                      onChange={(e) => handleUpdateCharacter(char.id, { color: e.target.value })}
                      className="w-6 h-6 rounded border-none cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddCharacter}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Character
              </button>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="text-center py-8">
              <p className="text-xs text-gray-500">Asset management coming soon</p>
            </div>
          )}
        </div>

        {/* RenPy Actions */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <button
            onClick={handleExportRenpy}
            className="w-full py-2 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            Export to Ren'Py
          </button>
          <button
            onClick={handleLaunchRenpy}
            className="w-full py-2 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/30 transition-colors"
          >
            Launch in Ren'Py
          </button>
        </div>
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 flex flex-col">
        {activeScene ? (
          <>
            <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 bg-[#111118]">
              <input
                value={activeScene.title}
                onChange={(e) => {
                  const updated = scenes.map((s) => s.id === activeScene.id ? { ...s, title: e.target.value } : s)
                  setScenes(updated)
                  setActiveScene({ ...activeScene, title: e.target.value })
                  saveToStorage('scenes', updated)
                }}
                className="bg-transparent text-sm text-white font-medium border-none outline-none"
              />
              <button
                onClick={handleSaveScript}
                className="px-3 py-1.5 bg-white/10 text-xs text-gray-300 rounded-md hover:bg-white/15 transition-colors"
              >
                Save
              </button>
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                className="w-full h-full bg-[#0A0A0F] text-gray-300 text-sm font-mono p-6 border-none outline-none resize-none leading-relaxed"
                placeholder={"# Write your Ren'Py script here...\n\nlabel start:\n    \"Welcome to your visual novel!\"\n    e \"Let's create something amazing.\""}
                spellCheck={false}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">No Scene Selected</h3>
              <p className="text-xs text-gray-600">Select a scene from the left panel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
