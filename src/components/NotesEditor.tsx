'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { Bold, Italic, List, ListOrdered, Underline } from 'lucide-react'
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  EditorState,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  ParagraphNode,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'

import { editorTheme } from '@/components/editor/themes/editor-theme'
import { Button } from '@/components/ui/button'
import { ContentEditable } from '@/components/editor/editor-ui/content-editable'

type NotesEditorValue = string

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  ParagraphNode,
  TextNode,
]

interface NotesEditorProps {
  value?: NotesEditorValue
  onChange?: (value: NotesEditorValue) => void
  placeholder?: string
  className?: string
}

function ToolbarButton({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string
  icon: ComponentType<{ className?: string }>
  isActive: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={isActive ? 'default' : 'ghost'}
      size="icon"
      aria-pressed={isActive}
      className="h-8 w-8"
      onClick={onClick}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

function ToolbarPlugin({
  externalStateRef,
}: {
  externalStateRef: React.MutableRefObject<string>
}) {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [blockType, setBlockType] = useState<'paragraph' | 'bullet' | 'number'>(
    'paragraph'
  )

  const updateToolbar = useCallback(() => {
    const editorState = editor.getEditorState()
    editorState.read(() => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) {
        return
      }

      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))

      const anchorNode = selection.anchor.getNode()
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow()

      if ($isListNode(element)) {
        const listType = element.getListType()
        setBlockType(listType === 'number' ? 'number' : 'bullet')
        return
      }

      const elementType = element.getType()
      if (elementType === 'paragraph') {
        setBlockType('paragraph')
      } else {
        setBlockType('paragraph')
      }
    })
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateToolbar()
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor, updateToolbar])

  const formatBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
  }, [editor])

  const formatItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
  }, [editor])

  const formatUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
  }, [editor])

  const toggleBulletList = useCallback(() => {
    if (blockType === 'bullet') {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }
  }, [blockType, editor])

  const toggleNumberList = useCallback(() => {
    if (blockType === 'number') {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
  }, [blockType, editor])

  useEffect(() => {
    // Ensure toolbar stays in sync when external state changes (e.g., reset).
    const currentValue = externalStateRef.current
    if (!currentValue) {
      setIsBold(false)
      setIsItalic(false)
      setIsUnderline(false)
      setBlockType('paragraph')
    }
  }, [externalStateRef])

  return (
    <div className="flex items-center gap-1 rounded-t-md border-b bg-muted/60 p-1">
      <ToolbarButton
        label="Bold"
        icon={Bold}
        isActive={isBold}
        onClick={formatBold}
      />
      <ToolbarButton
        label="Italic"
        icon={Italic}
        isActive={isItalic}
        onClick={formatItalic}
      />
      <ToolbarButton
        label="Underline"
        icon={Underline}
        isActive={isUnderline}
        onClick={formatUnderline}
      />
      <div className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton
        label="Bulleted list"
        icon={List}
        isActive={blockType === 'bullet'}
        onClick={toggleBulletList}
      />
      <ToolbarButton
        label="Numbered list"
        icon={ListOrdered}
        isActive={blockType === 'number'}
        onClick={toggleNumberList}
      />
    </div>
  )
}

function ExternalStatePlugin({
  value,
  stateRef,
}: {
  value: string
  stateRef: React.MutableRefObject<string>
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (stateRef.current === value) {
      return
    }

    stateRef.current = value

    if (!value) {
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        root.append($createParagraphNode())
      })
      return
    }

    try {
      const nextState = editor.parseEditorState(value)
      editor.setEditorState(nextState)
    } catch (error) {
      console.error('Failed to parse editor value', error)
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        root.append($createParagraphNode())
      })
    }
  }, [editor, stateRef, value])

  return null
}

export function NotesEditor({
  value,
  onChange,
  placeholder = 'Add notes...',
  className,
}: NotesEditorProps) {
  const normalizedValue = value ?? ''
  const externalStateRef = useRef<string>(normalizedValue)

  useEffect(() => {
    externalStateRef.current = normalizedValue
  }, [normalizedValue])

  const initialConfig: InitialConfigType = useMemo(
    () => ({
      namespace: 'AtlasNotesEditor',
      theme: editorTheme,
      nodes: EDITOR_NODES,
      onError: (error: Error, editor: LexicalEditor) => {
        console.error('Lexical editor error:', error)
        editor.update(() => {
          const root = $getRoot()
          root.clear()
          root.append($createParagraphNode())
        })
      },
      editorState: normalizedValue || undefined,
    }),
    [normalizedValue]
  )

  const handleChange = useCallback(
    (editorState: EditorState) => {
      const serialized = JSON.stringify(editorState.toJSON())
      const isEmpty = editorState
        .read(() => $getRoot().getTextContent().trim())
        .length === 0

      const nextValue = isEmpty ? '' : serialized
      externalStateRef.current = nextValue
      onChange?.(nextValue)
    },
    [onChange]
  )

  return (
    <div className={className}>
      <LexicalComposer initialConfig={initialConfig}>
        <ExternalStatePlugin value={normalizedValue} stateRef={externalStateRef} />
        <div className="overflow-hidden rounded-md border bg-card shadow-sm">
          <ToolbarPlugin externalStateRef={externalStateRef} />
          <div className="min-h-[180px]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  placeholder={placeholder}
                  className="ContentEditable__root relative block min-h-[140px] max-h-[420px] overflow-auto px-4 py-3 text-sm focus:outline-none"
                  placeholderClassName="text-muted-foreground pointer-events-none absolute top-3 left-4 text-sm"
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <OnChangePlugin ignoreSelectionChange={true} onChange={handleChange} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  )
}
