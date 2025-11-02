'use client'

import { useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useTags } from '@/lib/hooks/use-tags'

export interface TagFilterModel {
  selectedTagIds: string[]
}

interface TagFilterParams {
  objectType: 'person' | 'organization'
}

interface TagFilterProps {
  model: TagFilterModel | null
  onModelChange: (model: TagFilterModel | null) => void
  api: any
  filterParams?: TagFilterParams
}

export default function TagFilter({
  model,
  onModelChange,
  api,
  filterParams,
}: TagFilterProps) {
  const objectType = filterParams?.objectType ?? 'person'
  const { tags: allTags, loading, error } = useTags(objectType)

  const selectedTagIds = model?.selectedTagIds || []

  const handleTagChange = useCallback(
    (tagId: string) => {
      const newSelectedIds = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]

      console.log('Tag changed:', tagId)
      console.log('New selected IDs:', newSelectedIds)

      if (newSelectedIds.length === 0) {
        console.log('Clearing filter')
        onModelChange(null)
      } else {
        console.log('Setting filter model with:', { selectedTagIds: newSelectedIds })
        onModelChange({ selectedTagIds: newSelectedIds })
      }

      // Tell ag-grid to re-apply the filter
      console.log('Calling api.onFilterChanged()')
      api?.onFilterChanged?.()
    },
    [selectedTagIds, onModelChange, api]
  )

  return (
    <div className="p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-3">Filter by Tags</h3>
        {loading ? (
          <p className="text-xs text-gray-500">Loading tags...</p>
        ) : error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : allTags.length === 0 ? (
          <p className="text-xs text-gray-500">No tags available</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allTags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={() => handleTagChange(tag.id)}
                />
                <Label
                  htmlFor={`tag-${tag.id}`}
                  className="text-sm cursor-pointer font-normal"
                >
                  {tag.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
