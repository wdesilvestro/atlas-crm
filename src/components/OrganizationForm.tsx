'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { TagInput } from '@/components/TagInput'
import { Tag } from '@/lib/hooks/use-tags'
import { NotesEditor } from '@/components/NotesEditor'
import { RelationshipOwner } from '@/types/relationship-owner'
import PhotoUpload from '@/components/PhotoUpload'

interface OrganizationFormData {
  name: string
  website?: string
  linkedin_url?: string
  status: 'Active' | 'Inactive' | 'Needs Qualification'
}

interface OrganizationFormProps {
  onSuccess?: (organizationId: string, organizationName: string) => void
  onCancel?: () => void
  submitButtonText?: string
  showCancelButton?: boolean
}

export function OrganizationForm({
  onSuccess,
  onCancel,
  submitButtonText = 'Create Organization',
  showCancelButton = true,
}: OrganizationFormProps) {
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [notes, setNotes] = useState<string>('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [relationshipOwners, setRelationshipOwners] = useState<RelationshipOwner[]>([])
  const [selectedRelationshipOwnerId, setSelectedRelationshipOwnerId] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OrganizationFormData>({
    defaultValues: {
      name: '',
      website: '',
      linkedin_url: '',
      status: 'Active',
    },
  })

  useEffect(() => {
    const fetchRelationshipOwners = async () => {
      try {
        if (!user) return

        const { data, error: fetchError } = await supabase
          .from('relationship_owner')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (fetchError) throw fetchError
        setRelationshipOwners((data || []) as RelationshipOwner[])
      } catch (err) {
        console.error('Error fetching relationship owners:', err)
      }
    }

    fetchRelationshipOwners()
  }, [user])

  const onSubmit = async (data: OrganizationFormData) => {
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data: result, error: insertError } = await supabase
        .from('organization')
        .insert([
          {
            name: data.name,
            website: data.website || null,
            linkedin_url: data.linkedin_url || null,
            photo: photo || null,
            user_id: user.id,
            status: data.status,
            notes: notes || null,
            relationship_owner_id: selectedRelationshipOwnerId || null,
          },
        ])
        .select()

      if (insertError) {
        throw insertError
      }

      if (!result) {
        throw new Error('No data returned from insert')
      }

      const organizationId = result[0].id
      const organizationName = result[0].name

      // Add tags if any
      if (selectedTags.length > 0) {
        const tagsToInsert = selectedTags.map((tag) => ({
          organization_id: organizationId,
          tag_id: tag.id,
        }))

        const { error: tagError } = await supabase
          .from('organization_tag')
          .insert(tagsToInsert)

        if (tagError) {
          const errorMsg =
            (tagError as any).message || JSON.stringify(tagError)
          throw new Error(`Failed to add tags: ${errorMsg}`)
        }
      }

      // Reset form
      reset()
      setSelectedTags([])
      setNotes('')
      setPhoto(null)
      setSelectedRelationshipOwnerId('')

      // Call success callback
      if (onSuccess) {
        onSuccess(organizationId, organizationName)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create organization'
      setError(errorMessage)
      console.error('Error creating organization:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          placeholder="Acme Corporation"
          {...register('name', {
            required: 'Organization name is required',
          })}
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website (Optional)</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://acme.com"
          {...register('website')}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin_url">LinkedIn Profile URL (Optional)</Label>
        <Input
          id="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/company/acme"
          {...register('linkedin_url')}
          disabled={loading}
        />
      </div>

      <PhotoUpload
        value={photo}
        onChange={setPhoto}
        variant="horizontal"
        label="Logo/Banner (Optional)"
      />

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          {...register('status')}
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Needs Qualification">Needs Qualification</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationship_owner_id">Relationship Owner (Optional)</Label>
        <select
          id="relationship_owner_id"
          value={selectedRelationshipOwnerId}
          onChange={(e) => setSelectedRelationshipOwnerId(e.target.value)}
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">None</option>
          {relationshipOwners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <NotesEditor
          value={notes}
          onChange={setNotes}
          placeholder=""
          className={loading ? 'pointer-events-none opacity-60' : undefined}
        />
      </div>

      {/* Tags Section */}
      <div className="space-y-3 border-t pt-6">
        <div>
          <h3 className="text-sm font-semibold">
            Tags (Optional)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add tags to categorize this organization
          </p>
        </div>
        <TagInput
          objectType="organization"
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : submitButtonText}
        </Button>
        {showCancelButton && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
