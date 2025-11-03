'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { RelationshipOwner } from '@/types/relationship-owner'

export function useRelationshipOwners() {
  const { user } = useAuth()
  const [relationshipOwners, setRelationshipOwners] = useState<RelationshipOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setRelationshipOwners([])
      setLoading(false)
      return
    }

    const fetchRelationshipOwners = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('relationship_owner')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (fetchError) throw fetchError
        setRelationshipOwners(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch relationship owners')
      } finally {
        setLoading(false)
      }
    }

    fetchRelationshipOwners()
  }, [user])

  const createRelationshipOwner = async (name: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)

      const { data, error: createError } = await supabase
        .from('relationship_owner')
        .insert([
          {
            name: name.trim(),
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      setRelationshipOwners((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create relationship owner'
      setError(errorMessage)
      return false
    }
  }

  const updateRelationshipOwner = async (id: string, name: string): Promise<boolean> => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('relationship_owner')
        .update({ name: name.trim() })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      setRelationshipOwners((prev) =>
        prev.map((ro) => (ro.id === id ? data : ro)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update relationship owner'
      setError(errorMessage)
      return false
    }
  }

  const deleteRelationshipOwner = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('relationship_owner')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setRelationshipOwners((prev) => prev.filter((ro) => ro.id !== id))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete relationship owner'
      setError(errorMessage)
      return false
    }
  }

  return {
    relationshipOwners,
    loading,
    error,
    createRelationshipOwner,
    updateRelationshipOwner,
    deleteRelationshipOwner,
    refetch: () => {
      if (user) {
        supabase
          .from('relationship_owner')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })
          .then(({ data }) => {
            if (data) setRelationshipOwners(data)
          })
      }
    },
  }
}
