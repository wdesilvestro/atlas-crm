'use client'

import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type ToDoFilterType = 'all' | 'outstanding' | 'due_today' | 'due_this_week' | 'outstanding_for_me' | 'due_today_for_me'

export interface ToDoFilterModel {
  filterType: ToDoFilterType
}

interface ToDoFilterProps {
  model: ToDoFilterModel | null
  onModelChange: (model: ToDoFilterModel | null) => void
  api: any
}

function ToDoFilterComponent({
  model,
  onModelChange,
  api,
}: ToDoFilterProps) {
  const selectedFilterType = model?.filterType || 'all'

  const handleFilterChange = useCallback(
    (filterType: ToDoFilterType) => {
      if (filterType === 'all') {
        onModelChange(null)
      } else {
        onModelChange({ filterType })
      }

      // Tell ag-grid to re-apply the filter and refresh cells
      api?.onFilterChanged?.()
      // Force refresh of all cells to show updated counts
      api?.refreshCells?.({ force: true })
    },
    [onModelChange, api]
  )

  return (
    <div className="p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-3">Filter To-Do Items</h3>
        <RadioGroup
          value={selectedFilterType}
          onValueChange={(value) => handleFilterChange(value as ToDoFilterType)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="todo-all" />
            <Label htmlFor="todo-all" className="text-sm cursor-pointer font-normal">
              All To-Do Items
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="outstanding" id="todo-outstanding" />
            <Label htmlFor="todo-outstanding" className="text-sm cursor-pointer font-normal">
              Outstanding To-Do Items
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="due_today" id="todo-due-today" />
            <Label htmlFor="todo-due-today" className="text-sm cursor-pointer font-normal">
              To-Do Items Due Today
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="due_this_week" id="todo-due-this-week" />
            <Label htmlFor="todo-due-this-week" className="text-sm cursor-pointer font-normal">
              To-Do Items Due This Week
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="outstanding_for_me" id="todo-outstanding-for-me" />
            <Label htmlFor="todo-outstanding-for-me" className="text-sm cursor-pointer font-normal">
              Outstanding To-Do Items for Me
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="due_today_for_me" id="todo-due-today-for-me" />
            <Label htmlFor="todo-due-today-for-me" className="text-sm cursor-pointer font-normal">
              To-Do Items Due Today for Me
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}

// Factory function to create filter component
export function createToDoFilter() {
  return function BoundToDoFilter(props: Omit<ToDoFilterProps, 'objectType'>) {
    return <ToDoFilterComponent {...props} />
  }
}
