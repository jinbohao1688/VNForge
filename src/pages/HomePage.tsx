import React, { useState } from 'react'
import { Cpu, Zap } from 'lucide-react'
import { ProjectList } from '../components/project/ProjectList'
import { CreateProjectModal } from '../components/project/CreateProjectModal'
import { useEnvCheck } from '../hooks/useEnvCheck'

export const HomePage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const { data: envStatus } = useEnvCheck()

  const hasWarning = envStatus && Object.values(envStatus).some(
    (v: { status: string }) => v.status === 'missing' || v.status === 'warn'
  )

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20">
            <Cpu size={22} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">
            VNForge
          </h1>
        </div>
        <p className="text-sm text-text-sub ml-13">
          AI 驱动的视觉小说创作工作室
        </p>

        {hasWarning && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
            <Zap size={14} />
            部分环境未配置。前往设置检查 Python、Ren'Py 等依赖。
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <ProjectList onCreateNew={() => setModalOpen(true)} />
      </div>

      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}