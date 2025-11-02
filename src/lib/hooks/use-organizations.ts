import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Organization } from '@/types/organization'

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganizations = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('organization')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      // Fetch tags for each organization
      if (data && data.length > 0) {
        const organizationIds = data.map((o) => o.id)
        const { data: tagData, error: tagsError } = await supabase
          .from('organization_tag')
          .select('organization_id, tag(id, name, object_type, user_id, created_at, updated_at)')
          .in('organization_id', organizationIds)

        if (tagsError) {
          throw tagsError
        }

        // Create a map of organization_id to tags
        const tagsMap = new Map<string, any[]>()
        if (tagData) {
          tagData.forEach((item: any) => {
            if (!tagsMap.has(item.organization_id)) {
              tagsMap.set(item.organization_id, [])
            }
            tagsMap.get(item.organization_id)?.push(item.tag)
          })
        }

        // Add tags to organizations
        const organizationsWithTags = data.map((org) => ({
          ...org,
          tags: tagsMap.get(org.id) || [],
        }))

        setOrganizations(organizationsWithTags)
      } else {
        setOrganizations(data || [])
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch organizations'
      setError(errorMessage)
      console.error('Error fetching organizations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  return { organizations, loading, error, refetch: fetchOrganizations }
}
