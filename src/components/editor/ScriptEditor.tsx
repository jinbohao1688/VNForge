import React, { useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { EditorView, Decoration, ViewPlugin, lineNumbers } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { Save } from 'lucide-react'
import { useEditorStore } from '../../stores/useEditorStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { Button } from '../common/Button'
import { toast } from 'sonner'

export interface ScriptEditorRef {
  getValue: () => string
  setValue: (text: string) => void
  appendText: (text: string) => void
  getWordCount: () => number
}

interface ScriptEditorProps {
  onChange?: (value: string) => void
}

const vnforgeHighlight = ViewPlugin.fromClass(
  class {
    decorations: any
    constructor(view: EditorView) { this.decorations = this.build(view) }
    update(update: any) {
      if (update.docChanged || update.viewportChanged)
        this.decorations = this.build(update.view)
    }
    build(view: EditorView) {
      const builder = new RangeSetBuilder()
      for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to;) {
          const line = view.state.doc.lineAt(pos)
          const text = line.text

          if (/^\[背景[：:]/.test(text)) {
            builder.add(line.from, line.to, Decoration.mark({ class: 'cm-vn-background' }))
          } else if (/^\[章节[：:]/.test(text)) {
            builder.add(line.from, line.to, Decoration.mark({ class: 'cm-vn-chapter' }))
          } else if (/^（.+?）/.test(text)) {
            builder.add(line.from, line.to, Decoration.mark({ class: 'cm-vn-action' }))
          } else if (/^\[选项\]$/.test(text) || /^[A-Z]\.\s/.test(text)) {
            builder.add(line.from, line.to, Decoration.mark({ class: 'cm-vn-option' }))
          } else if (text.startsWith('#')) {
            builder.add(line.from, line.to, Decoration.mark({ class: 'cm-vn-comment' }))
          }

          pos = line.to + 1
        }
      }
      return builder.finish()
    }
  },
  { decorations: (v) => v.decorations }
)

const vnforgeTheme = EditorView.baseTheme({
  '.cm-vn-background': { color: '#60A5FA', fontWeight: '500' },
  '.cm-vn-chapter': { color: '#FBBF24', fontWeight: '700' },
  '.cm-vn-action': { color: '#A78BFA' },
  '.cm-vn-option': { color: '#FB923C' },
  '.cm-vn-comment': { color: '#5A5A78', fontStyle: 'italic' },
  '.cm-content': { fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace' },
})

const customTheme = EditorView.theme({
  '&': { backgroundColor: '#0A0A0F', height: '100%', fontSize: '14px' },
  '.cm-scroller': { fontFamily: 'inherit', overflow: 'auto' },
  '.cm-gutters': { backgroundColor: '#111118', borderRight: '1px solid #1A1A24' },
  '.cm-lineNumbers': { color: '#5A5A78' },
  '.cm-activeLine': { backgroundColor: '#1A1A24' },
  '.cm-selectionBackground': { backgroundColor: '#7C6EF840' },
})

export const ScriptEditor = forwardRef<ScriptEditorRef, ScriptEditorProps>(({ onChange }, ref) => {
  const {
    scriptContent,
    setScriptContent,
    scriptPath,
    dirty,
    setDirty,
  } = useEditorStore()
  const { currentProject } = useProjectStore()

  const cmRef = useRef<ReactCodeMirrorRef>(null)

  useImperativeHandle(ref, () => ({
    getValue: () => cmRef.current?.view?.state.doc.toString() ?? '',
    setValue: (text: string) => {
      const view = cmRef.current?.view
      if (!view) return
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
    },
    appendText: (text: string) => {
      const view = cmRef.current?.view
      if (!view) return
      const pos = view.state.doc.length
      view.dispatch({
        changes: { from: pos, insert: '\n' + text },
        selection: { anchor: pos + text.length + 1 },
      })
      view.focus()
    },
    getWordCount: () => {
      return cmRef.current?.view?.state.doc.toString().replace(/\s+/g, '').length ?? 0
    },
    onChange,
  }))

  useEffect(() => {
    if (!currentProject) return
    const loadScript = async () => {
      const result = await window.api.invoke('project:readScript', currentProject.id, 'script.rpy')
      if (result.success && result.data) {
        setScriptContent(result.data.content)
        setDirty(false)
      }
    }
    loadScript()
  }, [currentProject?.id])

  const handleSave = useCallback(async () => {
    if (!currentProject) return
    const result = await window.api.invoke('project:saveScript', currentProject.id, scriptPath, scriptContent)
    if (result.success) {
      setDirty(false)
      toast.success('保存成功')
    } else {
      toast.error(result.error || '保存失败')
    }
  }, [currentProject, scriptPath, scriptContent])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const handleChange = (value: string) => {
    setScriptContent(value)
    onChange?.(value)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-surface/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">{scriptPath}</span>
          {dirty && <span className="w-2 h-2 rounded-full bg-amber-400" title="未保存" />}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={handleSave} disabled={!dirty}>
            <Save size={14} />
            保存
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CodeMirror
          ref={cmRef}
          value={scriptContent}
          height="100%"
          theme={oneDark}
          extensions={[lineNumbers(), vnforgeHighlight, vnforgeTheme, customTheme]}
          placeholder={
            '# 在这里编写你的 Ren\'Py 脚本\n\n示例：\n[背景：学校走廊]\n白雪 "你好呀！"\n[选项]\nA. 答应她\nB. 沉默'
          }
          onChange={handleChange}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: true,
            highlightSelectionMatches: false,
            autocompletion: false,
          }}
        />
      </div>
    </div>
  )
})

ScriptEditor.displayName = 'ScriptEditor'
export default ScriptEditor
