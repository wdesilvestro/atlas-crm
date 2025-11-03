'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Person, PersonOrganization } from '@/types/person'
import { Organization } from '@/types/organization'
import { ArrowLeft, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { LocationField } from '@/components/LocationField'
import { TagInput } from '@/components/TagInput'
import { Tag } from '@/lib/hooks/use-tags'
import { NotesEditor } from '@/components/NotesEditor'

interface EditPersonForm {
  first_name: string
  last_name: string
  linkedin_url?: string
  status: 'Active' | 'Inactive'
}

interface SelectedOrganization extends PersonOrganization {
  organization_name: string
}

function EditPersonContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string

  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditPersonForm>({
    defaultValues: {
      first_name: '',
      last_name: '',
      linkedin_url: '',
      status: 'Active',
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch person data
        const { data: personData, error: personError } = await supabase
          .from('person')
          .select('*')
          .eq('id', id)
          .single()

        if (personError) {
          throw personError
        }

        if (!personData) {
          throw new Error('Person not found')
        }

        setPerson(personData)
        reset({
          first_name: personData.first_name,
          last_name: personData.last_name,
          linkedin_url: personData.linkedin_url || '',
          status: personData.status,
        })
        setLocation({
          street_address: personData.street_address,
          city: personData.city,
          state_province: personData.state_province,
          postal_code: personData.postal_code,
          country: personData.country,
          formatted_address: personData.formatted_address,
          place_id: personData.place_id,
        })
        setNotes(personData.notes || '')

        // Fetch person's organization links
        const { data: orgLinks, error: linksError } = await supabase
          .from('person_organization')
          .select('*, organization:organization_id(name)')
          .eq('person_id', id)

        if (linksError) {
          throw linksError
        }

        if (orgLinks) {
          setSelectedOrganizations(
            orgLinks.map((link: any) => ({
              ...link,
              organization_name: link.organization.name,
            }))
          )
        }

        // Fetch person's tags
        const { data: tagLinks, error: tagsError } = await supabase
          .from('person_tag')
          .select('tag(*)')
          .eq('person_id', id)

        if (tagsError) {
          throw tagsError
        }

        if (tagLinks) {
          const tags = tagLinks.map((link: any) => link.tag).filter(Boolean)
          setSelectedTags(tags)
        }

        // Fetch organizations for the current user
        if (user) {
          const { data: orgsData, error: orgsError } = await supabase
            .from('organization')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true })

          if (orgsError) throw orgsError
          setOrganizations((orgsData || []) as Organization[])
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch person'
        setError(errorMessage)
        console.error('Error fetching person:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, reset, user])

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
    if (
      selectedOrganizations.some((o) => o.organization_id === selectedOrgId)
    ) {
      setOrgError('This organization is already added')
      return
    }

    const org = organizations.find((o) => o.id === selectedOrgId)
    if (!org) return

    setSelectedOrganizations([
      ...selectedOrganizations,
      {
        id: crypto.randomUUID(),
        person_id: id,
        organization_id: selectedOrgId,
        role: selectedRole,
        organization_name: org.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

  const onSubmit = async (data: EditPersonForm) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const { error: updateError } = await supabase
        .from('person')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          linkedin_url: data.linkedin_url || null,
          status: data.status,
          street_address: location.street_address,
          city: location.city,
          state_province: location.state_province,
          postal_code: location.postal_code,
          country: location.country,
          formatted_address: location.formatted_address,
          place_id: location.place_id,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()

      if (updateError) {
        const errorMsg =
          (updateError as any).message || JSON.stringify(updateError)
        throw new Error(`Failed to update person: ${errorMsg}`)
      }

      // Delete all existing organization links
      const { error: deleteError } = await supabase
        .from('person_organization')
        .delete()
        .eq('person_id', id)

      if (deleteError) {
        const errorMsg =
          (deleteError as any).message || JSON.stringify(deleteError)
        throw new Error(`Failed to delete organization links: ${errorMsg}`)
      }

      // Add the updated organization links
      if (selectedOrganizations.length > 0) {
        const linksToInsert = selectedOrganizations.map((org) => ({
          person_id: id,
          organization_id: org.organization_id,
          role: org.role,
        }))

        const { error: linkError } = await supabase
          .from('person_organization')
          .insert(linksToInsert)

        if (linkError) {
          const errorMsg =
            (linkError as any).message || JSON.stringify(linkError)
          throw new Error(`Failed to add organization links: ${errorMsg}`)
        }
      }

      // Delete all existing tags
      const { error: deleteTagError } = await supabase
        .from('person_tag')
        .delete()
        .eq('person_id', id)

      if (deleteTagError) {
        const errorMsg =
          (deleteTagError as any).message || JSON.stringify(deleteTagError)
        throw new Error(`Failed to delete tags: ${errorMsg}`)
      }

      // Add the updated tags
      if (selectedTags.length > 0) {
        const tagsToInsert = selectedTags.map((tag) => ({
          person_id: id,
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

      // Redirect to person detail page
      router.push(`/persons/${id}`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err)
      setSubmitError(errorMessage)
      console.error('Error updating person:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
              <Link href="/persons">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Persons
                </Button>
              </Link>
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div>
              <Link href={`/persons/${id}`}>
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Person
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Edit Person</h1>
              <p className="text-muted-foreground">
                Update information for {person?.first_name} {person?.last_name}
              </p>
            </div>

            <div className="max-w-2xl">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {submitError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                      {submitError}
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
                      disabled={submitting}
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
                      disabled={submitting}
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
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      {...register('status')}
                      disabled={submitting}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <NotesEditor
                      value={notes}
                      onChange={setNotes}
                      placeholder="Update background information, key talking points, or reminders."
                      className={submitting ? 'pointer-events-none opacity-60' : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <LocationField
                      value={location}
                      onChange={setLocation}
                      placeholder="Search for a city, state, or country"
                      disabled={submitting}
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
                        Linked Organizations
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Manage organization links and roles
                      </p>
                    </div>

                    {orgError && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {orgError}
                      </div>
                    )}

                    {/* Add Organization Form */}
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                      <div className="space-y-2">
                        <Label htmlFor="organization_select">Organization</Label>
                        <select
                          id="organization_select"
                          value={selectedOrgId}
                          onChange={(e) => setSelectedOrgId(e.target.value)}
                          disabled={submitting || organizations.length === 0}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">
                            {organizations.length === 0
                              ? 'No organizations available'
                              : 'Select an organization'}
                          </option>
                          {organizations
                            .filter(
                              (org) =>
                                !selectedOrganizations.some(
                                  (s) => s.organization_id === org.id
                                )
                            )
                            .map((org) => (
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
                          disabled={submitting}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleAddOrganization}
                        disabled={submitting || !selectedOrgId}
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
                          Linked Organizations ({selectedOrganizations.length})
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
                                  handleRemoveOrganization(
                                    org.organization_id
                                  )
                                }
                                disabled={submitting}
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
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Link href={`/persons/${id}`}>
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

export default function EditPersonPage() {
  return (
    <AuthGuard>
      <EditPersonContent />
    </AuthGuard>
  )
}
