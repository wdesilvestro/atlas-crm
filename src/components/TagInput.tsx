'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'
import { useTags, Tag } from '@/lib/hooks/use-tags'

interface TagInputProps {
  objectType: 'person' | 'organization'
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
}

export function TagInput({ objectType, selectedTags, onTagsChange }: TagInputProps) {
  const { tags, createTag, error } = useTags(objectType)
  const [inputValue, setInputValue] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const availableTagsNotSelected = tags.filter(
    (tag) => !selectedTags.some((selectedTag) => selectedTag.id === tag.id)
  )

  const handleAddTag = (tag: Tag) => {
    onTagsChange([...selectedTags, tag])
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagId))
  }

  const handleCreateTag = async () => {
    if (!inputValue.trim()) {
      setCreateError('Tag name cannot be empty')
      return
    }

    const newTag = await createTag(inputValue)
    if (newTag) {
      onTagsChange([...selectedTags, newTag])
      setInputValue('')
      setShowCreateForm(false)
      setCreateError(null)
    } else {
      setCreateError(error || 'Failed to create tag')
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
            >
              <span>{tag.name}</span>
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:text-blue-600"
                aria-label={`Remove ${tag.name} tag`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available tags dropdown */}
      {availableTagsNotSelected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTagsNotSelected.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleAddTag(tag)}
              className="border border-gray-300 hover:border-blue-500 px-3 py-1 rounded-full text-sm hover:bg-gray-50 transition-colors"
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Create new tag form */}
      {showCreateForm ? (
        <div className="flex gap-2">
          <Input
            placeholder="New tag name..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setCreateError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateTag()
              } else if (e.key === 'Escape') {
                setShowCreateForm(false)
                setInputValue('')
                setCreateError(null)
              }
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateTag} variant="default">
            Create
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowCreateForm(false)
              setInputValue('')
              setCreateError(null)
            }}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() => setShowCreateForm(true)}
          variant="outline"
          className="gap-2"
        >
          <Plus size={16} />
          New Tag
        </Button>
      )}

      {createError && (
        <p className="text-red-600 text-sm">{createError}</p>
      )}
    </div>
  )
}
