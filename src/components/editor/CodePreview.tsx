import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'

export interface CodePreviewRef {
  setValue: (code: string) => void
  getValue: () => string
}

const CodePreview = forwardRef<CodePreviewRef, object>((_, ref) => {
  const cmRef = useRef<ReactCodeMirrorRef>(null)

  useImperativeHandle(ref, () => ({
    setValue: (code: string) => {
      const view = cmRef.current?.view
      if (!view) return
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } })
    },
    getValue: () => cmRef.current?.view?.state.doc.toString() ?? '',
  }))

  return (
    <CodeMirror
      ref={cmRef}
      value=""
      height="100%"
      theme={oneDark}
      extensions={[
        python(),
        EditorState.readOnly.of(true),
        EditorView.theme({
          '&': { backgroundColor: '#0A0A0F', fontSize: '13px' },
          '.cm-scroller': { fontFamily: '"JetBrains Mono", Consolas, monospace' },
        }),
      ]}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
      }}
    />
  )
})

CodePreview.displayName = 'CodePreview'
export default CodePreview
