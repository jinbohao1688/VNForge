import { useState, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import * as Select from '@radix-ui/react-select'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Sparkles, ChevronRight, ChevronDown, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { projects, dialog, ai } from '../../lib/api'
import type { AIChapter, AICharacter, AIPlan } from '../../types/plan'

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                done
                  ? 'bg-violet-600 text-white'
                  : active
                  ? 'bg-violet-600 text-white ring-4 ring-violet-600/20'
                  : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              {done ? '✓' : step}
            </div>
            {i < total - 1 && (
              <div className={`w-12 h-0.5 ${done ? 'bg-violet-600' : 'bg-zinc-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sortable chapter item ────────────────────────────────────────────────────

function SortableChapterItem({
  chapter,
  onUpdate,
  onDelete,
}: {
  chapter: AIChapter
  onUpdate: (updated: AIChapter) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className="bg-zinc-800 rounded-lg p-3 flex gap-3 items-start border border-zinc-700"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">章节标题</label>
          <input
            value={chapter.title}
            onChange={(e) => onUpdate({ ...chapter, title: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-zinc-500 mb-1 block">章节概要</label>
          <input
            value={chapter.summary}
            onChange={(e) => onUpdate({ ...chapter, summary: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">关键选择点</label>
          <input
            type="number"
            min={0}
            max={10}
            value={chapter.keyChoices}
            onChange={(e) => onUpdate({ ...chapter, keyChoices: Number(e.target.value) })}
            className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={onDelete}
        className="mt-1 text-zinc-500 hover:text-red-400 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Editable plan panel ──────────────────────────────────────────────────────

function EditablePlanPanel({
  plan,
  onChange,
}: {
  plan: AIPlan
  onChange: (updated: AIPlan) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = plan.chapterOutline.findIndex((c) => c.id === active.id)
    const newIndex = plan.chapterOutline.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(plan.chapterOutline, oldIndex, newIndex)
    onChange({ ...plan, chapterOutline: reordered })
  }

  const updateChapter = (index: number, updated: AIChapter) => {
    const chapters = [...plan.chapterOutline]
    chapters[index] = updated
    onChange({ ...plan, chapterOutline: chapters })
  }

  const deleteChapter = (index: number) => {
    onChange({ ...plan, chapterOutline: plan.chapterOutline.filter((_, i) => i !== index) })
  }

  const addChapter = () => {
    onChange({
      ...plan,
      chapterOutline: [
        ...plan.chapterOutline,
        { id: `ch-${Date.now()}`, title: '新章节', summary: '', keyChoices: 1 },
      ],
    })
  }

  const updateHeroine = (index: number, updated: AICharacter) => {
    const heroines = [...plan.heroines]
    heroines[index] = updated
    onChange({ ...plan, heroines })
  }

  const deleteHeroine = (index: number) => {
    onChange({ ...plan, heroines: plan.heroines.filter((_, i) => i !== index) })
  }

  const addHeroine = () => {
    onChange({
      ...plan,
      heroines: [
        ...plan.heroines,
        { name: '新角色', personality: '', endings: ['HE'] },
      ],
    })
  }

  const toggleEnding = (heroineIdx: number, ending: 'HE' | 'BE') => {
    const h = plan.heroines[heroineIdx]
    const endings = h.endings.includes(ending)
      ? h.endings.filter((e) => e !== ending)
      : [...h.endings, ending]
    updateHeroine(heroineIdx, { ...h, endings })
  }

  const addBackground = () => {
    onChange({
      ...plan,
      requiredAssets: {
        ...plan.requiredAssets,
        backgrounds: [...plan.requiredAssets.backgrounds, ''],
      },
    })
  }

  const updateBackground = (idx: number, value: string) => {
    const backgrounds = [...plan.requiredAssets.backgrounds]
    backgrounds[idx] = value
    onChange({ ...plan, requiredAssets: { ...plan.requiredAssets, backgrounds } })
  }

  const deleteBackground = (idx: number) => {
    onChange({
      ...plan,
      requiredAssets: {
        ...plan.requiredAssets,
        backgrounds: plan.requiredAssets.backgrounds.filter((_, i) => i !== idx),
      },
    })
  }

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
      {/* Game info card */}
      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
        <h3 className="text-sm font-semibold text-violet-400 mb-3">游戏信息</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">游戏名称</label>
            <input
              value={plan.title}
              onChange={(e) => onChange({ ...plan, title: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">游戏类型</label>
            <select
              value={plan.genre}
              onChange={(e) => onChange({ ...plan, genre: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
            >
              <option value="恋爱">恋爱</option>
              <option value="悬疑">悬疑</option>
              <option value="奇幻">奇幻</option>
              <option value="现代">现代</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">世界观设定</label>
            <textarea
              value={plan.worldSetting}
              onChange={(e) => onChange({ ...plan, worldSetting: e.target.value })}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">主角姓名</label>
              <input
                value={plan.protagonist.name}
                onChange={(e) =>
                  onChange({ ...plan, protagonist: { ...plan.protagonist, name: e.target.value } })
                }
                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">预计字数</label>
              <input
                type="number"
                value={plan.estimatedWords}
                onChange={(e) =>
                  onChange({ ...plan, estimatedWords: Number(e.target.value) })
                }
                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Character cards */}
      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-violet-400">角色设定</h3>
          <button
            onClick={addHeroine}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus size={12} /> 添加角色
          </button>
        </div>
        <div className="space-y-3">
          {plan.heroines.map((h, idx) => (
            <div key={idx} className="bg-zinc-900 rounded-lg p-3 border border-zinc-700">
              <div className="flex items-start justify-between mb-2">
                <input
                  value={h.name}
                  onChange={(e) => updateHeroine(idx, { ...h, name: e.target.value })}
                  placeholder="角色名称"
                  className="bg-transparent border-b border-zinc-600 text-sm font-medium text-zinc-100 focus:border-violet-500 focus:outline-none w-32"
                />
                <button
                  onClick={() => deleteHeroine(idx)}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  value={h.personality}
                  onChange={(e) => updateHeroine(idx, { ...h, personality: e.target.value })}
                  placeholder="性格特点"
                  className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-300 focus:border-violet-500 focus:outline-none"
                />
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">结局类型</label>
                  <div className="flex gap-2">
                    {(['HE', 'BE'] as const).map((ending) => (
                      <button
                        key={ending}
                        onClick={() => toggleEnding(idx, ending)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          h.endings.includes(ending)
                            ? ending === 'HE'
                              ? 'bg-green-600/30 text-green-400 ring-1 ring-green-500/50'
                              : 'bg-red-600/30 text-red-400 ring-1 ring-red-500/50'
                            : 'bg-zinc-700 text-zinc-500'
                        }`}
                      >
                        {ending}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chapter outline — drag-and-drop sortable */}
      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-violet-400">章节结构</h3>
          <button
            onClick={addChapter}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus size={12} /> 添加章节
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-3">拖拽排序</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={plan.chapterOutline.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {plan.chapterOutline.map((chapter, idx) => (
                <SortableChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  onUpdate={(updated) => updateChapter(idx, updated)}
                  onDelete={() => deleteChapter(idx)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Asset list */}
      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-violet-400">所需资源清单</h3>
          <button
            onClick={addBackground}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus size={12} /> 添加背景
          </button>
        </div>
        <div className="space-y-2">
          {plan.requiredAssets.backgrounds.map((bg, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs text-zinc-600 w-4">{idx + 1}.</span>
              <input
                value={bg}
                onChange={(e) => updateBackground(idx, e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-300 focus:border-violet-500 focus:outline-none"
              />
              <button
                onClick={() => deleteBackground(idx)}
                className="text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── AI Plan Tab (3-step wizard) ──────────────────────────────────────────────

function AIPlanTab({ onCreated }: { onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [ideaText, setIdeaText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [plan, setPlan] = useState<AIPlan | null>(null)
  const [savingLocation, setSavingLocation] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleGenerate = async () => {
    if (!ideaText.trim()) return
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const result = await ai.generatePlan(ideaText)
      if (result.success && result.data) {
        const data = result.data as {
          title: string
          genre: string
          worldSetting: string
          protagonist: { name: string }
          heroines: Array<{ name: string; personality: string; endings: string[] }>
          chapterOutline: Array<{ title: string; summary: string; keyChoices: number }>
          requiredAssets: { backgrounds: string[] }
          estimatedWords?: number
        }
        const enrichedPlan: AIPlan = {
          title: data.title || '未命名游戏',
          genre: data.genre || '其他',
          worldSetting: data.worldSetting || '',
          protagonist: data.protagonist ? { name: data.protagonist.name || '主角', description: '' } : { name: '主角', description: '' },
          heroines: (data.heroines || []).map((h) => ({
            name: h.name || '新角色',
            personality: h.personality || '',
            routeTheme: undefined,
            description: undefined,
            endings: (h.endings || ['HE']) as ('HE' | 'BE')[],
          })),
          chapterOutline: (data.chapterOutline || []).map((ch, i) => ({
            id: `ch-${Date.now()}-${i}`,
            title: ch.title,
            summary: ch.summary,
            keyChoices: ch.keyChoices,
          })),
          requiredAssets: { backgrounds: (data.requiredAssets?.backgrounds || []), characters: [] },
          estimatedWords: data.estimatedWords || 10000,
        }
        setPlan(enrichedPlan)
        setStep(2)
      } else {
        setGenerateError(result.error || 'AI 企划生成失败')
      }
    } catch {
      setGenerateError('请求失败，请检查 AI 配置')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBrowseSaveLocation = async () => {
    const result = await dialog.selectDirectory()
    if (result.success && result.data) {
      setSavingLocation(result.data)
    }
  }

  const handleCreate = async () => {
    if (!plan || !savingLocation) return
    setIsCreating(true)
    setCreateError(null)
    try {
      const result = await projects.createWithPlan({
        directory: savingLocation,
        plan,
      })
      if (result.success) {
        onCreated()
        navigate('/editor')
      } else {
        setCreateError(result.error || '创建项目失败')
      }
    } catch {
      setCreateError('创建项目失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div>
      <StepBar current={step} total={3} />

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-300 mb-2 block">
              描述你的游戏想法
            </label>
            <textarea
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder={`例如：我想做一个发生在古风仙侠世界的恋爱游戏，\n主角是落魄书生，有两条感情线，一个 BE 一个 HE，\n大概 2 万字，希望有悬疑元素...`}
              rows={10}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>
          {generateError && (
            <p className="text-red-400 text-sm">{generateError}</p>
          )}
          <button
            onClick={handleGenerate}
            disabled={!ideaText.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> AI 解析企划中...
              </>
            ) : (
              <>
                <Sparkles size={16} /> AI 解析企划
              </>
            )}
          </button>
        </div>
      )}

      {step === 2 && plan && (
        <div className="space-y-4">
          <EditablePlanPanel plan={plan} onChange={setPlan} />
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg py-2.5 text-sm transition-colors"
            >
              上一步
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              下一步 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-200 mb-1">确认创建</h3>
            <p className="text-xs text-zinc-500 mb-4">
              项目「{plan?.title}」将保存在以下位置
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-400 truncate">
                {savingLocation || '请选择保存位置'}
              </div>
              <button
                onClick={handleBrowseSaveLocation}
                className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <FolderOpen size={14} /> 浏览
              </button>
            </div>
          </div>
          {createError && (
            <p className="text-red-400 text-sm">{createError}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              disabled={isCreating}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-zinc-200 rounded-lg py-2.5 text-sm transition-colors"
            >
              上一步
            </button>
            <button
              onClick={handleCreate}
              disabled={!savingLocation || isCreating}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> 创建中...
                </>
              ) : (
                <>
                  <ChevronRight size={16} /> 开始创建
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Blank project form ────────────────────────────────────────────────────────

const GENRES = ['恋爱', '悬疑', '奇幻', '现代', '其他'] as const
const PLATFORMS = [
  { value: 'windows', label: 'Windows' },
  { value: 'mac', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'android', label: 'Android' },
] as const

interface BlankForm {
  name: string
  nameError: string
  directory: string
  dirError: string
  genre: string
  platforms: string[]
  description: string
}

function BlankTab({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<BlankForm>({
    name: '',
    nameError: '',
    directory: '',
    dirError: '',
    genre: '恋爱',
    platforms: ['windows'],
    description: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const navigate = useNavigate()

  const validateName = (name: string) => {
    if (!name.trim()) return '游戏名称不能为空'
    if (/[<>:"/\\|?*\x00-\x1f]/.test(name)) return '名称不能包含特殊字符'
    if (name.length > 50) return '名称不能超过50个字符'
    return ''
  }

  const handleNameChange = (value: string) => {
    setForm((f) => ({ ...f, name: value, nameError: validateName(value) }))
  }

  const handleBrowse = async () => {
    const result = await dialog.selectDirectory()
    if (result.success && result.data) {
      setForm((f) => ({ ...f, directory: result.data!, dirError: '' }))
    }
  }

  const togglePlatform = (value: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(value)
        ? f.platforms.filter((p) => p !== value)
        : [...f.platforms, value],
    }))
  }

  const handleSubmit = async () => {
    const nameError = validateName(form.name)
    const dirError = form.directory ? '' : '请选择保存位置'
    if (nameError || dirError) {
      setForm((f) => ({ ...f, nameError, dirError }))
      return
    }
    setIsCreating(true)
    setCreateError(null)
    try {
      const result = await projects.create({
        name: form.name.trim(),
        description: form.description,
        directory: form.directory,
        genre: form.genre,
        targetPlatforms: form.platforms as ('windows' | 'mac' | 'linux' | 'android')[],
      })
      if (result.success) {
        onCreated()
        navigate('/editor')
      } else {
        setCreateError(result.error || '创建失败')
      }
    } catch {
      setCreateError('创建项目失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Game name */}
      <div>
        <label className="text-sm text-zinc-300 mb-1.5 block">
          游戏名称 <span className="text-red-400">*</span>
        </label>
        <input
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="输入游戏名称"
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
        />
        {form.nameError && (
          <p className="text-red-400 text-xs mt-1">{form.nameError}</p>
        )}
      </div>

      {/* Save location */}
      <div>
        <label className="text-sm text-zinc-300 mb-1.5 block">
          保存位置 <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-400 truncate">
            {form.directory || '请选择保存位置'}
          </div>
          <button
            onClick={handleBrowse}
            className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <FolderOpen size={14} /> 浏览
          </button>
        </div>
        {form.dirError && (
          <p className="text-red-400 text-xs mt-1">{form.dirError}</p>
        )}
      </div>

      {/* Genre */}
      <div>
        <label className="text-sm text-zinc-300 mb-1.5 block">类型</label>
        <select
          value={form.genre}
          onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
        >
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Target platforms */}
      <div>
        <label className="text-sm text-zinc-300 mb-1.5 block">目标平台</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => togglePlatform(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                form.platforms.includes(p.value)
                  ? 'bg-violet-600/30 text-violet-300 ring-1 ring-violet-500/50'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm text-zinc-300 mb-1.5 block">简介（可选）</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="简单描述你的游戏..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none resize-none"
        />
      </div>

      {createError && (
        <p className="text-red-400 text-sm">{createError}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          disabled={isCreating}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-zinc-200 rounded-lg py-2.5 text-sm transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={isCreating || !!form.nameError}
          className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all"
        >
          {isCreating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> 创建中...
            </>
          ) : (
            '创建项目'
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Root dialog ──────────────────────────────────────────────────────────────

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export default function NewProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: NewProjectDialogProps) {
  const handleCreated = useCallback(() => {
    onOpenChange(false)
    onCreated()
  }, [onOpenChange, onCreated])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[85vh] bg-zinc-900 rounded-2xl shadow-2xl z-50 flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="px-6 pt-6 pb-0">
            <Dialog.Title className="text-lg font-semibold text-zinc-100">
              新建项目
            </Dialog.Title>
            <Dialog.Description className="text-sm text-zinc-500 mt-0.5 mb-5">
              创建一个新的视觉小说项目
            </Dialog.Description>
          </div>
          <div className="px-6 pb-6 overflow-y-auto">
            <Tabs.Root defaultValue="blank" className="w-full">
              <Tabs.List className="flex gap-1 bg-zinc-800/70 rounded-lg p-1 mb-5">
                <Tabs.Trigger
                  value="blank"
                  className="flex-1 py-2 text-sm rounded-md text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 transition-all"
                >
                  空白项目
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="ai"
                  className="flex-1 py-2 text-sm rounded-md text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} /> AI 企划
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="blank">
                <BlankTab onCreated={handleCreated} />
              </Tabs.Content>
              <Tabs.Content value="ai">
                <AIPlanTab onCreated={handleCreated} />
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
