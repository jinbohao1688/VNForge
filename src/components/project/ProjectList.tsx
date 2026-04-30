import React from 'react'
import { Plus, Search } from 'lucide-react'
import { ProjectCard } from './ProjectCard'
import { Button } from '../common/Button'
import { useProjects } from '../../hooks/useProjects'
import { useNavigate } from 'react-router-dom'

interface ProjectListProps {
  onCreateNew: () => void
}

export const ProjectList: React.FC<ProjectListProps> = ({ onCreateNew }) => {
  const navigate = useNavigate()
  const { projects, isLoading, deleteProject, openProject } = useProjects()
  const [search, setSearch] = React.useState('')

  const api = (window as any).api

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpen = (id: string) => {
    openProject(id, {
      onSuccess: () => navigate(`/editor?projectId=${id}`),
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此项目吗？此操作不可撤销。')) {
      deleteProject(id)
    }
  }

  const handleShowInExplorer = (directory: string) => {
    api.invoke('project:showInExplorer', directory)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="搜索项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>
        <Button onClick={onCreateNew}>
          <Plus size={16} />
          新建项目
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Plus size={28} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-main mb-2">
            {search ? '没有找到匹配的项目' : '开始你的创作之旅'}
          </h3>
          <p className="text-sm text-text-sub mb-4">
            {search
              ? '尝试使用其他关键词搜索'
              : '创建你的第一个视觉小说项目'}
          </p>
          {!search && (
            <Button onClick={onCreateNew}>
              <Plus size={16} />
              新建项目
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={handleOpen}
              onDelete={handleDelete}
              onShowInExplorer={handleShowInExplorer}
            />
          ))}
        </div>
      )}
    </div>
  )
}