'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, X } from 'lucide-react'
import { Organization } from '@/types/organization'
import { LocationField } from '@/components/LocationField'
import { TagInput } from '@/components/TagInput'
import { Tag } from '@/lib/hooks/use-tags'
import { NotesEditor } from '@/components/NotesEditor'
import { RelationshipOwner } from '@/types/relationship-owner'
import PhotoUpload from '@/components/PhotoUpload'

interface CreatePersonForm {
  first_name: string
  last_name: string
  linkedin_url?: string
  status: 'Active' | 'Inactive'
}

interface SelectedOrganization {
  organization_id: string
  role: string
  organization_name: string
}

function CreatePersonContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [relationshipOwners, setRelationshipOwners] = useState<RelationshipOwner[]>([])
  const [selectedRelationshipOwnerId, setSelectedRelationshipOwnerId] = useState<string>('')
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    SelectedOrganization[]
  >([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [orgError, setOrgError] = useState<string | null>(null)
  const [location, setLocation] = useState<{
    street_address: string | null
    city: string | null
    state_province: string | null
    postal_code: string | null
    country: string | null
    formatted_address: string | null
    place_id: string | null
  }>({
    street_address: null,
    city: null,
    state_province: null,
    postal_code: null,
    country: null,
    formatted_address: null,
    place_id: null,
  })
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [notes, setNotes] = useState<string>('')
  const [photo, setPhoto] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePersonForm>({
    defaultValues: {
      first_name: '',
      last_name: '',
      linkedin_url: '',
      status: 'Active',
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return

        // Fetch organizations
        const { data: orgsData, error: orgsError } = await supabase
          .from('organization')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (orgsError) throw orgsError
        setOrganizations((orgsData || []) as Organization[])

        // Fetch relationship owners
        const { data: ownersData, error: ownersError } = await supabase
          .from('relationship_owner')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (ownersError) throw ownersError
        setRelationshipOwners((ownersData || []) as RelationshipOwner[])
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [user])

  const handleAddOrganization = () => {
    setOrgError(null)

    if (!selectedOrgId) {
      setOrgError('Please select an organization')
      return
    }

    if (!selectedRole.trim()) {
      setOrgError('Role is required')
      return
    }

    // Check if already added
    if (selectedOrganizations.some((o) => o.organization_id === selectedOrgId)) {
      setOrgError('This organization is already added')
      return
    }

    const org = organizations.find((o) => o.id === selectedOrgId)
    if (!org) return

    setSelectedOrganizations([
      ...selectedOrganizations,
      {
        organization_id: selectedOrgId,
        role: selectedRole,
        organization_name: org.name,
      },
    ])

    setSelectedOrgId('')
    setSelectedRole('')
  }

  const handleRemoveOrganization = (orgId: string) => {
    setSelectedOrganizations(
      selectedOrganizations.filter((o) => o.organization_id !== orgId)
    )
  }

  const onSubmit = async (data: CreatePersonForm) => {
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data: result, error: insertError } = await supabase
        .from('person')
        .insert([
          {
            first_name: data.first_name,
            last_name: data.last_name,
            linkedin_url: data.linkedin_url || null,
            photo: photo || null,
            user_id: user.id,
            status: data.status,
            street_address: location.street_address,
            city: location.city,
            state_province: location.state_province,
            postal_code: location.postal_code,
            country: location.country,
            formatted_address: location.formatted_address,
            place_id: location.place_id,
            notes: notes || null,
            relationship_owner_id: selectedRelationshipOwnerId || null,
          },
        ])
        .select()

      if (insertError) {
        const errorMsg =
          (insertError as any).message || JSON.stringify(insertError)
        throw new Error(`Failed to create person: ${errorMsg}`)
      }

      if (!result || result.length === 0) {
        throw new Error('No data returned from insert')
      }

      const personId = result[0].id

      // Add organization links if any
      if (selectedOrganizations.length > 0) {
        const linksToInsert = selectedOrganizations.map((org) => ({
          person_id: personId,
          organization_id: org.organization_id,
          role: org.role,
        }))

        const { error: linkError } = await supabase
          .from('person_organization')
          .insert(linksToInsert)

        if (linkError) {
          const errorMsg =
            (linkError as any).message || JSON.stringify(linkError)
          throw new Error(`Failed to link organization: ${errorMsg}`)
        }
      }

      // Add tags if any
      if (selectedTags.length > 0) {
        const tagsToInsert = selectedTags.map((tag) => ({
          person_id: personId,
          tag_id: tag.id,
        }))

        const { error: tagError } = await supabase
          .from('person_tag')
          .insert(tagsToInsert)

        if (tagError) {
          const errorMsg =
            (tagError as any).message || JSON.stringify(tagError)
          throw new Error(`Failed to add tags: ${errorMsg}`)
        }
      }

      // Redirect back to persons page
      router.push('/persons')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err)
      setError(errorMessage)
      console.error('Error creating person:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="mb-2">
              <Link href="/persons">
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Persons
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Create Person</h1>
              <p className="text-muted-foreground">
                Add a new person to your CRM.
              </p>
            </div>

            <div className="max-w-2xl">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      {...register('first_name', {
                        required: 'First name is required',
                      })}
                      disabled={loading}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-destructive">
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      {...register('last_name', {
                        required: 'Last name is required',
                      })}
                      disabled={loading}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-destructive">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL (Optional)</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/in/johndoe"
                      {...register('linkedin_url')}
                      disabled={loading}
                    />
                  </div>

                  <PhotoUpload
                    value={photo}
                    onChange={setPhoto}
                    variant="circular"
                    label="Profile Photo (Optional)"
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

                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <LocationField
                      value={location}
                      onChange={setLocation}
                      placeholder="Search for a city, state, or country"
                      disabled={loading}
                    />
                  </div>

                  {/* Tags Section */}
                  <div className="space-y-3 border-t pt-6">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Tags (Optional)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add tags to categorize this person
                      </p>
                    </div>
                    <TagInput
                      objectType="person"
                      selectedTags={selectedTags}
                      onTagsChange={setSelectedTags}
                    />
                  </div>

                  {/* Organizations Section */}
                  <div className="space-y-3 border-t pt-6">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Link to Organizations (Optional)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add this person to organizations with their role/title
                      </p>
                    </div>

                    {orgError && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {orgError}
                      </div>
                    )}

                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                      <div className="space-y-2">
                        <Label htmlFor="organization_select">Organization</Label>
                        <select
                          id="organization_select"
                          value={selectedOrgId}
                          onChange={(e) => setSelectedOrgId(e.target.value)}
                          disabled={loading || organizations.length === 0}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">
                            {organizations.length === 0
                              ? 'No organizations available'
                              : 'Select an organization'}
                          </option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role_input">
                          Role / Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="role_input"
                          placeholder="e.g., Chief Executive Officer, Developer, Manager"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleAddOrganization}
                        disabled={loading || !selectedOrgId}
                        variant="outline"
                        className="w-full"
                      >
                        Add Organization
                      </Button>
                    </div>

                    {/* Selected Organizations List */}
                    {selectedOrganizations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Selected Organizations ({selectedOrganizations.length})
                        </p>
                        <div className="space-y-2">
                          {selectedOrganizations.map((org) => (
                            <div
                              key={org.organization_id}
                              className="flex items-center justify-between rounded-lg border bg-card p-3"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {org.organization_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {org.role}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveOrganization(org.organization_id)
                                }
                                disabled={loading}
                                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Person'}
                    </Button>
                    <Link href="/persons">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function CreatePersonPage() {
  return (
    <AuthGuard>
      <CreatePersonContent />
    </AuthGuard>
  )
}
