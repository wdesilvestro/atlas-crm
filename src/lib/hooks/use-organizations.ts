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

      setOrganizations(data || [])
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
