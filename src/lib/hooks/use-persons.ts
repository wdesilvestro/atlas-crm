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

      // Fetch tags for each person
      if (data && data.length > 0) {
        const personIds = data.map((p) => p.id)
        const { data: tagData, error: tagsError } = await supabase
          .from('person_tag')
          .select('person_id, tag(id, name, object_type, user_id, created_at, updated_at)')
          .in('person_id', personIds)

        if (tagsError) {
          throw tagsError
        }

        // Create a map of person_id to tags
        const tagsMap = new Map<string, any[]>()
        if (tagData) {
          tagData.forEach((item: any) => {
            if (!tagsMap.has(item.person_id)) {
              tagsMap.set(item.person_id, [])
            }
            tagsMap.get(item.person_id)?.push(item.tag)
          })
        }

        // Add tags to persons
        const personsWithTags = data.map((person) => ({
          ...person,
          tags: tagsMap.get(person.id) || [],
        }))

        setPersons(personsWithTags)
      } else {
        setPersons(data || [])
      }
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
