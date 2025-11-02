'use client'

import { useCallback } from 'react'

export interface StatusFilterModel {
  selectedStatus: string | null
}

interface StatusFilterProps {
  model: StatusFilterModel | null
  onModelChange: (model: StatusFilterModel | null) => void
  api: any
}

const STATUS_OPTIONS = ['Active', 'Inactive']

function StatusFilterComponent({
  model,
  onModelChange,
  api,
}: StatusFilterProps) {
  const selectedStatus = model?.selectedStatus || null

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      if (value === 'all') {
        onModelChange(null)
      } else {
        onModelChange({ selectedStatus: value })
      }

      // Tell ag-grid to re-apply the filter
      api?.onFilterChanged?.()
    },
    [onModelChange, api]
  )

  return (
    <div className="p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-3">Filter by Status</h3>
        <select
          value={selectedStatus || 'all'}
          onChange={handleStatusChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Factory function to create filter component with proper binding
export function createStatusFilter() {
  return function BoundStatusFilter(props: StatusFilterProps) {
    return <StatusFilterComponent {...props} />
  }
}
