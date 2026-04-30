import React, { useState, useEffect, useCallback } from 'react'
import { Upload, Image, Music, Trash2, Search } from 'lucide-react'
import { Button } from '../common/Button'
import { useProjectStore } from '../../stores/useProjectStore'
import { resources } from '../../lib/api'
import { toast } from 'sonner'
import type { Asset } from '../../types'

export const AssetManager: React.FC = () => {
  const { currentProject } = useProjectStore()
  const [assets, setAssets] = useState<Asset[]>([])
  const [filter, setFilter] = useState<'all' | 'image' | 'audio'>('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadAssets = useCallback(async () => {
    if (!currentProject) return
    const result = await resources.list(currentProject.id)
    if (result.success && result.data) {
      setAssets(result.data as Asset[])
    }
  }, [currentProject])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const handleImport = async () => {
    if (!currentProject) return
    const result = await resources.import(currentProject.id)
    if (!result.success || !result.data?.length) return

    setUploading(true)
    let imported = 0
    for (const filePath of result.data) {
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)
      const assetType = isImage ? 'character' : 'bgm'
      const fileName = filePath.split(/[\\/]/).pop() || 'unknown'
      const baseName = fileName.replace(/\.[^.]+$/, '').replace(/\s+/g, '_').toLowerCase()

      const uploadResult = await resources.uploadAsset(currentProject.id, filePath, {
        type: assetType,
        renpyVariable: baseName,
        originalName: fileName,
      })

      if (uploadResult.success) {
        imported++
        setAssets((prev) => [...prev, uploadResult.data as Asset])
      }
    }
    setUploading(false)

    if (imported > 0) {
      toast.success(`成功导入 ${imported} 个素材`)
    } else {
      toast.error('导入失败')
    }
  }

  const handleDelete = async (assetId: string) => {
    if (!currentProject) return
    const result = await resources.delete(currentProject.id, assetId)
    if (result.success) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId))
      toast.success('素材已删除')
    }
  }

  const filtered = assets.filter((a) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'image' && a.type !== 'bgm' && a.type !== 'sfx') ||
      (filter === 'audio' && (a.type === 'bgm' || a.type === 'sfx'))
    const matchSearch = a.originalName.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const getThumbnailSrc = (asset: Asset) => {
    if (!asset.thumbnailPath) return null
    return `file://${asset.thumbnailPath.replace(/\\/g, '/')}`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="搜索素材..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-bg-card border border-border rounded-lg text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'image', 'audio'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-sub hover:text-text-main hover:bg-white/5'
              }`}
            >
              {f === 'all' ? '全部' : f === 'image' ? '图片' : '音频'}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={handleImport} disabled={uploading}>
          <Upload size={14} />
          {uploading ? '导入中...' : '导入'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <Image size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-sub">还没有素材</p>
            <p className="text-xs text-text-muted mt-1">点击上方"导入"按钮添加图片或音频</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((asset) => {
              const thumbSrc = getThumbnailSrc(asset)
              const isImage = asset.type !== 'bgm' && asset.type !== 'sfx'

              return (
                <div
                  key={asset.id}
                  className="group relative glass-panel rounded-xl overflow-hidden hover:border-primary/20 transition-all"
                >
                  {isImage ? (
                    <div className="aspect-square bg-bg-card flex items-center justify-center overflow-hidden">
                      {thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={asset.originalName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Image size={32} className="text-text-muted" />
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square bg-bg-card flex items-center justify-center">
                      <Music size={32} className="text-text-muted" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-text-main truncate font-medium" title={asset.originalName}>
                      {asset.originalName}
                    </p>
                    <p className="text-xs text-text-muted capitalize">{asset.type}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 text-error hover:bg-error/20 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
