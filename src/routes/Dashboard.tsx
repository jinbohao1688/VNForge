import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as ContextMenu from '@radix-ui/react-context-menu'
import {
  FolderOpen,
  Plus,
  FolderSearch,
  Trash2,
  FolderHeart,
  ExternalLink,
} from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'
import { projects } from '../lib/api'
import NewProjectDialog from '../components/project/NewProjectDialog'
import type { VNProject } from '../types'

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  planning: { label: '规划中', bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  writing: { label: '编写中', bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  developing: { label: '开发中', bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  completed: { label: '已完成', bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
} as const

function StatusBadge({ status }: { status: VNProject['status'] }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

// ─── Notion-style cover gradient ───────────────────────────────────────────────

const COVER_GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-cyan-500 to-blue-600',
]

function getGradient(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length]
}

function CoverGradient({ name }: { name: string }) {
  const firstChar = name.charAt(0) || 'V'
  const gradient = getGradient(name)
  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      <span className="text-6xl font-black text-white/80 select-none">{firstChar}</span>
    </div>
  )
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onDelete,
}: {
  project: VNProject
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const handleOpen = async () => {
    const result = await projects.open(project.id) as { success: boolean; data: VNProject | null }
    if (result.success && result.data) {
      navigate(`/editor?projectId=${project.id}`)
    }
  }

  const handleShowInExplorer = () => {
    projects.showInExplorer(project.directory)
  }

  const handleDelete = () => {
    onDelete(project.id)
  }

  const updatedDate = new Date(project.updatedAt)
  const timeAgo = formatRelativeTime(updatedDate)

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          className="group relative bg-zinc-800/60 rounded-2xl border border-zinc-700/50 overflow-hidden cursor-pointer transition-all duration-200 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={handleOpen}
        >
          {/* Cover */}
          <div className="h-36 relative overflow-hidden">
            <CoverGradient name={project.name} />
            {/* Hover overlay */}
            <div
              className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                <ExternalLink size={14} /> 打开
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">{project.name}</h3>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{project.description}</p>
            )}
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>{timeAgo}</span>
              {project.config.genre && (
                <span className="text-zinc-500">{project.config.genre}</span>
              )}
            </div>
          </div>
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl shadow-black/40 p-1 min-w-48 z-50">
          <ContextMenu.Item
            onSelect={handleOpen}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-700 focus:bg-zinc-700 outline-none transition-colors"
          >
            <FolderOpen size={14} className="text-violet-400" />
            打开
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={handleShowInExplorer}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-700 focus:bg-zinc-700 outline-none transition-colors"
          >
            <FolderSearch size={14} className="text-blue-400" />
            在资源管理器中显示
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px bg-zinc-700 my-1" />
          <AlertDialog.Root>
            <AlertDialog.Trigger asChild>
              <ContextMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded-lg cursor-pointer hover:bg-zinc-700 focus:bg-zinc-700 outline-none transition-colors w-full text-left"
              >
                <Trash2 size={14} />
                删除项目
              </ContextMenu.Item>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
              <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl z-50 w-full max-w-sm">
                <AlertDialog.Title className="text-base font-semibold text-zinc-100 mb-2">
                  删除项目
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-zinc-400 mb-5">
                  确定要删除「{project.name}」吗？此操作不可撤销，项目文件将从磁盘上被删除。
                </AlertDialog.Description>
                <div className="flex gap-3">
                  <AlertDialog.Cancel asChild>
                    <button className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg py-2 text-sm transition-colors">
                      取消
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      onClick={handleDelete}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                    >
                      删除
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 30) {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  if (minutes > 0) return `${minutes} 分钟前`
  return '刚刚'
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-5">
        <FolderHeart size={36} className="text-zinc-600" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">还没有项目</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
        创建你的第一个视觉小说，开始这段精彩的创作之旅吧
      </p>
      <button
        onClick={onCreate}
        className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-violet-600/20"
      >
        <Plus size={16} />
        创建你的第一个视觉小说
      </button>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { projects: storeProjects, setProjects, setLoading } = useProjectStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const result = await projects.list() as { success: boolean; data: VNProject[] | undefined }
      if (result.success && result.data) {
        setProjects(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [setProjects, setLoading])

  const handleDelete = useCallback(
    async (id: string) => {
      await projects.delete(id)
      await loadProjects()
    },
    [loadProjects]
  )

  const handleCreated = useCallback(() => {
    loadProjects()
  }, [loadProjects])

  // Load on mount
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <h1 className="text-base font-semibold text-zinc-100">VNForge</h1>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={14} />
            新建项目
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-zinc-100">我的项目</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {storeProjects.length > 0
              ? `共 ${storeProjects.length} 个项目`
              : '开始创作你的视觉小说吧'}
          </p>
        </div>

        {storeProjects.length === 0 ? (
          <EmptyState onCreate={() => setDialogOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {storeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}
