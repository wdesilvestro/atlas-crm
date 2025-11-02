'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export interface Tag {
  id: string
  name: string
  object_type: 'person' | 'organization'
  user_id: string
  created_at: string
  updated_at: string
}

export function useTags(objectType: 'person' | 'organization') {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setTags([])
      setLoading(false)
      return
    }

    const fetchTags = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('tag')
          .select('*')
          .eq('object_type', objectType)
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (fetchError) throw fetchError
        setTags(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags')
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [user, objectType])

  const createTag = async (name: string): Promise<Tag | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    try {
      setError(null)

      const { data, error: createError } = await supabase
        .from('tag')
        .insert([
          {
            name: name.trim(),
            object_type: objectType,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      setTags((prevTags) => [...prevTags, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag'
      setError(errorMessage)
      return null
    }
  }

  const deleteTag = async (tagId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('tag')
        .delete()
        .eq('id', tagId)

      if (deleteError) throw deleteError

      setTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag'
      setError(errorMessage)
      return false
    }
  }

  return {
    tags,
    loading,
    error,
    createTag,
    deleteTag,
  }
}

export function usePersonTags() {
  return useTags('person')
}

export function useOrganizationTags() {
  return useTags('organization')
}

// Hook to get tags for a specific person
export function usePersonTagsForPerson(personId: string) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!personId) {
      setTags([])
      setLoading(false)
      return
    }

    const fetchTags = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('person_tag')
          .select('tag(*)')
          .eq('person_id', personId)

        if (fetchError) throw fetchError

        // Extract tag data from the nested response
        const tagList = data?.map((item: any) => item.tag).filter(Boolean) || []
        setTags(tagList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags')
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [personId])

  const addTagToPerson = async (tagId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: insertError } = await supabase
        .from('person_tag')
        .insert([{ person_id: personId, tag_id: tagId }])

      if (insertError) throw insertError

      // Refetch tags
      const { data, error: fetchError } = await supabase
        .from('person_tag')
        .select('tag(*)')
        .eq('person_id', personId)

      if (fetchError) throw fetchError

      const tagList = data?.map((item: any) => item.tag).filter(Boolean) || []
      setTags(tagList)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add tag'
      setError(errorMessage)
      return false
    }
  }

  const removeTagFromPerson = async (tagId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('person_tag')
        .delete()
        .eq('person_id', personId)
        .eq('tag_id', tagId)

      if (deleteError) throw deleteError

      setTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove tag'
      setError(errorMessage)
      return false
    }
  }

  return {
    tags,
    loading,
    error,
    addTagToPerson,
    removeTagFromPerson,
  }
}

// Hook to get tags for a specific organization
export function useOrganizationTagsForOrganization(organizationId: string) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setTags([])
      setLoading(false)
      return
    }

    const fetchTags = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('organization_tag')
          .select('tag(*)')
          .eq('organization_id', organizationId)

        if (fetchError) throw fetchError

        const tagList = data?.map((item: any) => item.tag).filter(Boolean) || []
        setTags(tagList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags')
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [organizationId])

  const addTagToOrganization = async (tagId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: insertError } = await supabase
        .from('organization_tag')
        .insert([{ organization_id: organizationId, tag_id: tagId }])

      if (insertError) throw insertError

      // Refetch tags
      const { data, error: fetchError } = await supabase
        .from('organization_tag')
        .select('tag(*)')
        .eq('organization_id', organizationId)

      if (fetchError) throw fetchError

      const tagList = data?.map((item: any) => item.tag).filter(Boolean) || []
      setTags(tagList)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add tag'
      setError(errorMessage)
      return false
    }
  }

  const removeTagFromOrganization = async (tagId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('organization_tag')
        .delete()
        .eq('organization_id', organizationId)
        .eq('tag_id', tagId)

      if (deleteError) throw deleteError

      setTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove tag'
      setError(errorMessage)
      return false
    }
  }

  return {
    tags,
    loading,
    error,
    addTagToOrganization,
    removeTagFromOrganization,
  }
}
