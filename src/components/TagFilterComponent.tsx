'use client'

import { useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useTags } from '@/lib/hooks/use-tags'

export interface TagFilterModel {
  selectedTagIds: string[]
}

interface TagFilterProps {
  model: TagFilterModel | null
  onModelChange: (model: TagFilterModel | null) => void
  api: any
}

function TagFilterComponent({
  model,
  onModelChange,
  api,
  objectType,
}: TagFilterProps & { objectType: 'person' | 'organization' }) {
  const { tags: allTags, loading, error } = useTags(objectType)

  const selectedTagIds = model?.selectedTagIds || []

  const handleTagChange = useCallback(
    (tagId: string) => {
      const newSelectedIds = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]

      if (newSelectedIds.length === 0) {
        onModelChange(null)
      } else {
        onModelChange({ selectedTagIds: newSelectedIds })
      }

      // Tell ag-grid to re-apply the filter
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

// Factory function to create filter component with objectType bound
export function createTagFilter(objectType: 'person' | 'organization') {
  return function BoundTagFilter(props: Omit<TagFilterProps, 'objectType'>) {
    return <TagFilterComponent {...props} objectType={objectType} />
  }
}
