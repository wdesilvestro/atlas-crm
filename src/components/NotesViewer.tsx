'use client'

import { useMemo, type ReactNode } from 'react'
import { createEditor } from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'

import { editorTheme } from '@/components/editor/themes/editor-theme'

interface NotesViewerProps {
  value?: string | null
  className?: string
  emptyState?: ReactNode
}

export function NotesViewer({
  value,
  className,
  emptyState = (
    <p className="text-sm text-muted-foreground">No notes have been added yet.</p>
  ),
}: NotesViewerProps) {
  const html = useMemo(() => {
    if (!value) {
      return ''
    }

    try {
      const editor = createEditor({
        namespace: 'AtlasNotesViewer',
        theme: editorTheme,
        nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
      })

      const editorState = editor.parseEditorState(value)
      let output = ''

      editorState.read(() => {
        output = $generateHtmlFromNodes(editor, null)
      })

      return output
    } catch (error) {
      console.error('Failed to render notes content:', error)
      return ''
    }
  }, [value])

  if (!html) {
    return <div className={className}>{emptyState}</div>
  }

  return (
    <div
      className={className ?? 'space-y-2 text-sm leading-relaxed'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
