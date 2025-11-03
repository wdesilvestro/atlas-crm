'use client'

import { useCallback } from 'react'

export interface FollowUpReminderFilterModel {
  selectedStatus: string | null
}

interface FollowUpReminderFilterProps {
  model: FollowUpReminderFilterModel | null
  onModelChange: (model: FollowUpReminderFilterModel | null) => void
  api: any
}

const FOLLOW_UP_REMINDER_OPTIONS = [
  { value: 'action_required', label: 'Action Required' },
  { value: 'awaiting_response', label: 'Awaiting Response' },
  { value: 'no_follow_up_needed', label: 'No Follow-up Needed' },
]

function FollowUpReminderFilterComponent({
  model,
  onModelChange,
  api,
}: FollowUpReminderFilterProps) {
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
        <h3 className="text-sm font-semibold mb-3">Filter by Follow-up Reminder</h3>
        <select
          value={selectedStatus || 'all'}
          onChange={handleStatusChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">All Statuses</option>
          {FOLLOW_UP_REMINDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Factory function to create filter component with proper binding
export function createFollowUpReminderFilter() {
  return function BoundFollowUpReminderFilter(props: FollowUpReminderFilterProps) {
    return <FollowUpReminderFilterComponent {...props} />
  }
}
