import React, { useState } from 'react'
import { Wand2, FolderOpen, BookOpen, Sparkles } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { useProjects, useAIPlanning } from '../../hooks/useProjects'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import type { AIPlan, TargetPlatform } from '../../types'

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
}

type TabType = 'blank' | 'ai'

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
}) => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabType>('ai')
  const [step, setStep] = useState(1)

  // Blank project state
  const [blankForm, setBlankForm] = useState({
    name: '',
    description: '',
    genre: '',
    targetPlatforms: ['windows'] as TargetPlatform[],
  })

  // AI project state
  const [ideaText, setIdeaText] = useState('')
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null)
  const [projectDir, setProjectDir] = useState('')

  const { createProject, createProjectWithPlan, isCreating } = useProjects()
  const { generatePlan, generateScript } = useAIPlanning()

  const api = (window as any).api

  const handleSelectDir = async () => {
    const result = await api.invoke('dialog:selectDirectory')
    if (result.success && result.data) {
      setProjectDir(result.data)
    }
  }

  const handleGeneratePlan = async () => {
    if (!ideaText.trim()) {
      toast.error('请输入你的创意想法')
      return
    }
    try {
      const plan = await generatePlan.mutateAsync(ideaText)
      setAiPlan(plan)
      setStep(2)
    } catch (e: any) {
      toast.error(e.message || '生成大纲失败')
    }
  }

  const handleGenerateScript = async () => {
    if (!aiPlan) return
    try {
      const script = await generateScript.mutateAsync(JSON.stringify(aiPlan))
      return script
    } catch (e: any) {
      toast.error(e.message || '生成剧本失败')
      return null
    }
  }

  const handleCreate = async () => {
    if (!projectDir) {
      toast.error('请选择保存位置')
      return
    }
    if (tab === 'blank') {
      if (!blankForm.name.trim()) {
        toast.error('请输入项目名称')
        return
      }
      createProject({ ...blankForm, directory: projectDir }, {
        onSuccess: (project) => {
          if (!project) return
          toast.success('项目创建成功')
          navigate(`/editor?projectId=${project.id}`)
          onClose()
          resetForm()
        },
        onError: (e: any) => toast.error(e.message),
      })
    } else if (tab === 'ai' && aiPlan) {
      const script = await handleGenerateScript()
      createProjectWithPlan(
        {
          directory: projectDir,
          plan: aiPlan,
          initialScript: script || undefined,
        },
        {
          onSuccess: (project) => {
            if (!project) return
            toast.success('AI 项目创建成功')
            navigate(`/editor?projectId=${project.id}`)
            onClose()
            resetForm()
          },
          onError: (e: any) => toast.error(e.message),
        }
      )
    }
  }

  const resetForm = () => {
    setStep(1)
    setBlankForm({ name: '', description: '', genre: '', targetPlatforms: ['windows'] })
    setIdeaText('')
    setAiPlan(null)
    setProjectDir('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="新建项目" size="lg">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab('ai'); resetForm() }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            tab === 'ai'
              ? 'bg-primary/15 border-primary/30 text-primary'
              : 'bg-bg-card border-border text-text-sub hover:text-text-main hover:border-white/10'
          }`}
        >
          <Sparkles size={18} />
          <span className="font-medium">AI 智能生成</span>
        </button>
        <button
          onClick={() => { setTab('blank'); resetForm() }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            tab === 'blank'
              ? 'bg-primary/15 border-primary/30 text-primary'
              : 'bg-bg-card border-border text-text-sub hover:text-text-main hover:border-white/10'
          }`}
        >
          <BookOpen size={18} />
          <span className="font-medium">空白项目</span>
        </button>
      </div>

      {tab === 'blank' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-sub mb-1.5">
              项目名称 *
            </label>
            <input
              type="text"
              value={blankForm.name}
              onChange={(e) =>
                setBlankForm({ ...blankForm, name: e.target.value })
              }
              placeholder="我的视觉小说"
              className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-sub mb-1.5">
              简介
            </label>
            <textarea
              value={blankForm.description}
              onChange={(e) =>
                setBlankForm({ ...blankForm, description: e.target.value })
              }
              placeholder="描述你的故事..."
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-sub mb-1.5">
              类型
            </label>
            <input
              type="text"
              value={blankForm.genre}
              onChange={(e) =>
                setBlankForm({ ...blankForm, genre: e.target.value })
              }
              placeholder="例如：校园恋爱、奇幻冒险"
              className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-sub mb-1.5">
              保存位置 *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={projectDir}
                onChange={(e) => setProjectDir(e.target.value)}
                placeholder="选择保存文件夹"
                className="flex-1 px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
              <Button variant="secondary" onClick={handleSelectDir}>
                <FolderOpen size={16} />
                选择
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={!blankForm.name.trim() || !projectDir}
            >
              创建项目
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-text-sub mb-1.5">
                  描述你的创意 *
                </label>
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder={`描述你的视觉小说创意，例如：\n一个发生在未来城市的赛博朋克故事，主角是一个黑客，意外发现了一个AI的秘密...`}
                  rows={6}
                  className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-sub mb-1.5">
                  保存位置 *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectDir}
                    onChange={(e) => setProjectDir(e.target.value)}
                    placeholder="选择保存文件夹"
                    className="flex-1 px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <Button variant="secondary" onClick={handleSelectDir}>
                    <FolderOpen size={16} />
                    选择
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={handleClose}>
                  取消
                </Button>
                <Button
                  onClick={handleGeneratePlan}
                  loading={generatePlan.isPending}
                  disabled={!ideaText.trim() || !projectDir}
                >
                  <Wand2 size={16} />
                  AI 生成大纲
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-main mb-2">
                    {aiPlan?.title}
                  </h3>
                  <p className="text-xs text-text-sub mb-3 leading-relaxed">
                    {aiPlan?.worldSetting}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-card rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">主角</p>
                    <p className="text-sm font-medium text-text-main">
                      {aiPlan?.protagonist.name}
                    </p>
                  </div>
                  <div className="bg-bg-card rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">女主</p>
                    <p className="text-sm font-medium text-text-main">
                      {aiPlan?.heroines[0]?.name}
                    </p>
                  </div>
                  <div className="bg-bg-card rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">章节</p>
                    <p className="text-sm font-medium text-text-main">
                      {aiPlan?.chapterOutline.length} 章
                    </p>
                  </div>
                  <div className="bg-bg-card rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">预计字数</p>
                    <p className="text-sm font-medium text-text-main">
                      {aiPlan?.estimatedWords.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-text-muted mb-2">章节大纲</p>
                  {aiPlan?.chapterOutline.map((ch) => (
                    <div key={ch.id} className="mb-2 last:mb-0">
                      <p className="text-sm font-medium text-text-main">
                        {ch.title}
                      </p>
                      <p className="text-xs text-text-sub mt-0.5 line-clamp-2">
                        {ch.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  上一步
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleClose}>
                    取消
                  </Button>
                  <Button
                    onClick={handleCreate}
                    loading={isCreating || generateScript.isPending}
                  >
                    <Wand2 size={16} />
                    创建项目
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}