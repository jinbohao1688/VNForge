import React, { useState } from 'react'
import { Play, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '../common/Button'
import { useProjectStore } from '../../stores/useProjectStore'
import { toast } from 'sonner'

const api = (window as any).api

export const Preview: React.FC = () => {
  const { currentProject } = useProjectStore()
  const [launching, setLaunching] = useState(false)

  const handleLaunch = async () => {
    if (!currentProject) return
    setLaunching(true)
    try {
      const result = await api.invoke('renpy:launch', currentProject.directory)
      if (result.success) {
        toast.success('正在启动 Ren\'Py...')
      } else {
        toast.error(result.error || '启动失败')
      }
    } finally {
      setLaunching(false)
    }
  }

  const handleShowFolder = () => {
    if (!currentProject) return
    api.invoke('project:showInExplorer', currentProject.directory)
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted text-sm">没有打开的项目</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-text-main text-lg">
            {currentProject.name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 font-mono">
            {currentProject.directory}
          </p>
        </div>
        <Button onClick={handleLaunch} loading={launching}>
          <Play size={16} />
          启动预览
        </Button>
      </div>

      <div className="flex-1 glass-panel rounded-2xl p-8 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Play size={40} className="text-primary ml-1" />
        </div>
        <h4 className="text-xl font-bold text-text-main mb-2">准备预览</h4>
        <p className="text-sm text-text-sub text-center max-w-sm mb-6 leading-relaxed">
          点击启动按钮在 Ren'Py 中预览你的视觉小说。确保已安装 Ren'Py SDK。
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleShowFolder}>
            <ExternalLink size={14} />
            打开文件夹
          </Button>
          <Button variant="secondary" onClick={handleLaunch} loading={launching}>
            <RefreshCw size={14} />
            重新启动
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-main">
            {currentProject.stats.sceneCount}
          </p>
          <p className="text-xs text-text-muted mt-1">场景</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-main">
            {currentProject.stats.wordCount.toLocaleString()}
          </p>
          <p className="text-xs text-text-muted mt-1">字数</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-main">
            {currentProject.stats.assetCount}
          </p>
          <p className="text-xs text-text-muted mt-1">素材</p>
        </div>
      </div>
    </div>
  )
}