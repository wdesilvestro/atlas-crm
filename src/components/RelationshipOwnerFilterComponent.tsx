'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { RelationshipOwner } from '@/types/relationship-owner'

export interface RelationshipOwnerFilterModel {
  selectedOwnerId: string | null
}

interface RelationshipOwnerFilterProps {
  model: RelationshipOwnerFilterModel | null
  onModelChange: (model: RelationshipOwnerFilterModel | null) => void
  api: any
}

function RelationshipOwnerFilterComponent({
  model,
  onModelChange,
  api,
}: RelationshipOwnerFilterProps) {
  const { user } = useAuth()
  const [owners, setOwners] = useState<RelationshipOwner[]>([])
  const [loading, setLoading] = useState(true)
  const selectedOwnerId = model?.selectedOwnerId || null

  useEffect(() => {
    const fetchOwners = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('relationship_owner')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (error) throw error
        setOwners(data || [])
      } catch (err) {
        console.error('Error fetching relationship owners:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOwners()
  }, [user])

  const handleOwnerChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      if (value === 'all') {
        onModelChange(null)
      } else if (value === 'none') {
        onModelChange({ selectedOwnerId: 'none' })
      } else {
        onModelChange({ selectedOwnerId: value })
      }

      // Tell ag-grid to re-apply the filter
      api?.onFilterChanged?.()
    },
    [onModelChange, api]
  )

  return (
    <div className="p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-3">Filter by Relationship Owner</h3>
        <select
          value={selectedOwnerId || 'all'}
          onChange={handleOwnerChange}
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">All Owners</option>
          <option value="none">No Owner Assigned</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Factory function to create filter component with proper binding
export function createRelationshipOwnerFilter() {
  return function BoundRelationshipOwnerFilter(props: RelationshipOwnerFilterProps) {
    return <RelationshipOwnerFilterComponent {...props} />
  }
}
