import React from 'react'
import { FolderOpen, Trash2, ExternalLink, MoreVertical } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { VNProject } from '../../types'
import { StatusBadge } from '../common/StatusBadge'
import { useNavigate } from 'react-router-dom'

dayjs.extend(relativeTime)

interface ProjectCardProps {
  project: VNProject
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onShowInExplorer: (directory: string) => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpen,
  onDelete,
  onShowInExplorer,
}) => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <div
      className="group relative glass-panel rounded-2xl p-5 hover:border-primary/20 transition-all duration-300 cursor-pointer"
      onClick={() => {
        onOpen(project.id)
        navigate(`/editor?projectId=${project.id}`)
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
            <FolderOpen size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-main text-base leading-tight">
              {project.name}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {dayjs(project.updatedAt).fromNow()}
            </p>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="text-sm text-text-sub line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white/3 rounded-lg px-3 py-2">
          <p className="text-xs text-text-muted">场景</p>
          <p className="text-sm font-semibold text-text-main">
            {project.stats.sceneCount}
          </p>
        </div>
        <div className="bg-white/3 rounded-lg px-3 py-2">
          <p className="text-xs text-text-muted">角色</p>
          <p className="text-sm font-semibold text-text-main">
            {project.stats.characterCount}
          </p>
        </div>
        <div className="bg-white/3 rounded-lg px-3 py-2">
          <p className="text-xs text-text-muted">字数</p>
          <p className="text-sm font-semibold text-text-main">
            {project.stats.wordCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/3 rounded-lg px-3 py-2">
          <p className="text-xs text-text-muted">素材</p>
          <p className="text-sm font-semibold text-text-main">
            {project.stats.assetCount}
          </p>
        </div>
      </div>

      {project.config.genre && (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/10">
            {project.config.genre}
          </span>
          {project.config.targetPlatforms.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded text-xs bg-white/5 text-text-muted"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-text-sub hover:text-text-main transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-40 glass-panel rounded-xl py-1 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onShowInExplorer(project.directory)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-sub hover:text-text-main hover:bg-white/5 transition-colors"
              >
                <ExternalLink size={14} />
                在文件夹中显示
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(project.id)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/5 transition-colors"
              >
                <Trash2 size={14} />
                删除项目
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}