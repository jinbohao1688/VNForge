import React, { useState } from 'react'
import { User, Plus, Trash2, Palette } from 'lucide-react'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import type { Character } from '../../types'

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
]

export const CharacterManager: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: 'Alice', displayName: 'Alice', color: '#FF6B6B' },
    { id: '2', name: 'Bob', displayName: 'Bob', color: '#4ECDC4' },
  ])
  const [editingChar, setEditingChar] = useState<Character | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleAdd = () => {
    setEditingChar({ id: '', name: '', displayName: '', color: PRESET_COLORS[0] })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!editingChar?.name.trim()) return
    const existing = characters.find((c) => c.name === editingChar.name)
    if (existing) {
      setCharacters((prev) =>
        prev.map((c) => (c.name === existing.name ? editingChar : c))
      )
    } else {
      setCharacters((prev) => [...prev, editingChar])
    }
    setModalOpen(false)
    setEditingChar(null)
  }

  const handleDelete = (name: string) => {
    setCharacters((prev) => prev.filter((c) => c.name !== name))
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-main">角色列表</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus size={14} />
          添加角色
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {characters.map((char) => (
          <div
            key={char.name}
            className="group flex items-center gap-3 p-3 bg-bg-card rounded-xl hover:bg-bg-card/80 transition-colors"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: char.color }}
            >
              {char.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-main">{char.name}</p>
              <p className="text-xs text-text-muted font-mono">
                define {char.name.toLowerCase().replace(/\s+/g, '_')}
              </p>
            </div>
            <div
              className="w-6 h-6 rounded-full border-2 border-white/10"
              style={{ backgroundColor: char.color }}
              title={char.color}
            />
            <button
              onClick={() => handleDelete(char.name)}
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {characters.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <User size={32} className="text-text-muted mb-2" />
            <p className="text-sm text-text-sub">没有角色</p>
            <p className="text-xs text-text-muted mt-1">添加你的角色</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="添加角色" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-sub mb-1.5">
              角色名称
            </label>
            <input
              type="text"
              value={editingChar?.name || ''}
              onChange={(e) =>
                setEditingChar((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
              placeholder="例如：Alice"
              className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-sub mb-1.5">
              角色颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setEditingChar((prev) => (prev ? { ...prev, color } : null))
                  }
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    editingChar?.color === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!editingChar?.name.trim()}>
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}