import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  Image,
  Users,
  Play,
  ArrowLeft,
  Wand2,
  FolderOpen,
} from 'lucide-react'
import ScriptEditor, { ScriptEditorRef } from '../components/editor/ScriptEditor'
import CodePreview, { CodePreviewRef } from '../components/editor/CodePreview'
import { AssetManager } from '../components/editor/AssetManager'
import { CharacterManager } from '../components/editor/CharacterManager'
import { Preview } from '../components/editor/Preview'
import { AIAssistant } from '../components/ai/AIAssistant'
import { useProjectStore } from '../stores/useProjectStore'
import { useEditorStore } from '../stores/useEditorStore'
import { useProjects } from '../hooks/useProjects'
import { renpy, shell, resources } from '../lib/api'
import { toast } from 'sonner'

const tabs = [
  { id: 'script', label: '脚本', icon: FileText },
  { id: 'assets', label: '素材', icon: Image },
  { id: 'characters', label: '角色', icon: Users },
  { id: 'preview', label: '预览', icon: Play },
] as const

export const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentProject, setCurrentProject } = useProjectStore()
  const { activeTab, setActiveTab, aiAssistantOpen } = useEditorStore()
  const { openProject } = useProjects()

  const editorRef = useRef<ScriptEditorRef>(null)
  const codeRef = useRef<CodePreviewRef>(null)
  const [wordCount, setWordCount] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [projectAssets, setProjectAssets] = useState<any[]>([])

  const projectId = searchParams.get('projectId')

  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      openProject(projectId, {
        onSuccess: (project) => {
          if (project) setCurrentProject(project)
        },
      })
    }
  }, [projectId])

  useEffect(() => {
    if (!currentProject) return
    resources.list(currentProject.id).then((r) => {
      if (r.success && r.data) setProjectAssets(r.data as any[])
    })
  }, [currentProject])

  const handleScriptChange = (value: string) => {
    setWordCount(value.replace(/\s+/g, '').length)
  }

  const handleGenerate = async () => {
    const text = editorRef.current?.getValue() ?? ''
    if (!text.trim()) {
      toast.error('请先输入剧本内容')
      return
    }
    setGenerating(true)
    try {
      const result = await renpy.generateCode(text, currentProject!.id)
      if (result?.success && result.data) {
        codeRef.current?.setValue(result.data.code)
        toast.success(`已生成 ${result.data.lineCount} 行代码`)
      } else {
        toast.error(result?.error ?? '生成失败')
      }
    } catch (e: any) {
      toast.error(e.message || '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleImportScript = async () => {
    const result = await shell.openFile({
      name: '剧本文件',
      extensions: ['txt', 'md', 'rpy', 'docx'],
    })
    if (!result.success || !result.data) return

    const importResult = await renpy.importScript(result.data)
    if (importResult?.success && importResult.data) {
      editorRef.current?.setValue(importResult.data)
      toast.success('剧本已导入')
    } else {
      toast.error(importResult?.error ?? '导入失败')
    }
  }

  const handlePreview = async () => {
    if (!currentProject) return
    if (isPreviewing) {
      setIsPreviewing(false)
      toast.info('预览已关闭')
      return
    }
    const result = await renpy.preview(currentProject.directory)
    if (result?.success) {
      setIsPreviewing(true)
      toast.success("Ren'Py 预览已启动")
    } else {
      toast.error(result?.error ?? '预览失败，请检查 Ren\'Py SDK 路径')
    }
  }

  const projectContext = {
    name: currentProject?.name ?? '未命名',
    genre: (currentProject as any)?.config?.genre ?? '恋爱',
    characters: projectAssets.filter((a) => a.type === 'character'),
    backgrounds: projectAssets.filter((a) => a.type === 'background'),
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'script':
        return (
          <div className="flex h-full">
            <div className="flex-1 overflow-hidden">
              <ScriptEditor ref={editorRef} onChange={handleScriptChange} />
            </div>
            <div className="w-[420px] border-l border-border flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-surface/50">
                <span className="text-xs text-text-muted font-mono">生成的代码</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleImportScript}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-sub hover:bg-white/5 transition-colors"
                    title="导入剧本文件"
                  >
                    <FolderOpen size={12} />
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50 transition-colors"
                  >
                    <Wand2 size={12} />
                    {generating ? '生成中...' : '生成'}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodePreview ref={codeRef} />
              </div>
            </div>
          </div>
        )
      case 'assets':
        return <AssetManager />
      case 'characters':
        return <CharacterManager />
      case 'preview':
        return <Preview />
      default:
        return null
    }
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-text-sub mb-4">没有打开的项目</p>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-bg-surface/50">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-sub hover:text-text-main transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-text-main leading-tight">
              {currentProject.name}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {currentProject.description || '未描述'}
            </p>
          </div>
          {activeTab === 'script' && (
            <span className="text-xs text-text-muted font-mono">
              {wordCount} 字
            </span>
          )}
          <button
            onClick={handlePreview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isPreviewing
                ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                : 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
            }`}
          >
            <Play size={14} />
            {isPreviewing ? '停止预览' : '预览'}
          </button>
          <div className="flex gap-1 bg-bg-card rounded-xl p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === id
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-sub hover:text-text-main hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>

      {aiAssistantOpen && (
        <div className="w-80 border-l border-border flex flex-col bg-bg-surface">
          <AIAssistant
            projectContext={projectContext}
            onInsertToEditor={(text) => editorRef.current?.appendText(text)}
          />
        </div>
      )}
    </div>
  )
}
