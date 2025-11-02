import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Person } from '@/types/person'

export function usePersons() {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPersons = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('person')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setPersons(data || [])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch persons'
      setError(errorMessage)
      console.error('Error fetching persons:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersons()
  }, [])

  return { persons, loading, error, refetch: fetchPersons }
}
