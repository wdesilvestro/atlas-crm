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
import { Organization } from '@/types/organization'
import { Person, PersonOrganization } from '@/types/person'
import { ArrowLeft, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { TagInput } from '@/components/TagInput'
import { Tag } from '@/lib/hooks/use-tags'
import { NotesEditor } from '@/components/NotesEditor'
import { RelationshipOwner } from '@/types/relationship-owner'

interface EditOrganizationForm {
  name: string
  website?: string
  linkedin_url?: string
  status: 'Active' | 'Inactive'
}

interface SelectedPerson extends PersonOrganization {
  person_first_name: string
  person_last_name: string
}

function EditOrganizationContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [persons, setPersons] = useState<Person[]>([])
  const [selectedPersons, setSelectedPersons] = useState<SelectedPerson[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [personError, setPersonError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [notes, setNotes] = useState<string>('')
  const [relationshipOwners, setRelationshipOwners] = useState<RelationshipOwner[]>([])
  const [selectedRelationshipOwnerId, setSelectedRelationshipOwnerId] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditOrganizationForm>({
    defaultValues: {
      name: '',
      website: '',
      linkedin_url: '',
      status: 'Active',
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: orgData, error: orgError } = await supabase
          .from('organization')
          .select('*')
          .eq('id', id)
          .single()

        if (orgError) {
          throw orgError
        }

        if (!orgData) {
          throw new Error('Organization not found')
        }

        setOrganization(orgData)
        reset({
          name: orgData.name,
          website: orgData.website || '',
          linkedin_url: orgData.linkedin_url || '',
          status: orgData.status,
        })
        setNotes(orgData.notes || '')
        setSelectedRelationshipOwnerId(orgData.relationship_owner_id || '')

        // Fetch organization's person links
        const { data: personLinks, error: linksError } = await supabase
          .from('person_organization')
          .select('*, person:person_id(first_name, last_name)')
          .eq('organization_id', id)

        if (linksError) {
          throw linksError
        }

        if (personLinks) {
          setSelectedPersons(
            personLinks.map((link: any) => ({
              ...link,
              person_first_name: link.person.first_name,
              person_last_name: link.person.last_name,
            }))
          )
        }

        // Fetch organization's tags
        const { data: tagLinks, error: tagsError } = await supabase
          .from('organization_tag')
          .select('tag(*)')
          .eq('organization_id', id)

        if (tagsError) {
          throw tagsError
        }

        if (tagLinks) {
          const tags = tagLinks.map((link: any) => link.tag).filter(Boolean)
          setSelectedTags(tags)
        }

        // Fetch all persons
        const { data: personsData, error: personsError } = await supabase
          .from('person')
          .select('*')
          .order('first_name', { ascending: true })

        if (personsError) throw personsError
        setPersons((personsData || []) as Person[])

        // Fetch relationship owners
        if (user) {
          const { data: ownersData, error: ownersError } = await supabase
            .from('relationship_owner')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true })

          if (ownersError) throw ownersError
          setRelationshipOwners((ownersData || []) as RelationshipOwner[])
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch organization'
        setError(errorMessage)
        console.error('Error fetching organization:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, reset])

  const handleAddPerson = () => {
    setPersonError(null)

    if (!selectedPersonId) {
      setPersonError('Please select a person')
      return
    }

    if (!selectedRole.trim()) {
      setPersonError('Role is required')
      return
    }

    // Check if already added
    if (selectedPersons.some((p) => p.person_id === selectedPersonId)) {
      setPersonError('This person is already added')
      return
    }

    const person = persons.find((p) => p.id === selectedPersonId)
    if (!person) return

    setSelectedPersons([
      ...selectedPersons,
      {
        id: crypto.randomUUID(),
        person_id: selectedPersonId,
        organization_id: id,
        role: selectedRole,
        person_first_name: person.first_name,
        person_last_name: person.last_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    setSelectedPersonId('')
    setSelectedRole('')
  }

  const handleRemovePerson = (personId: string) => {
    setSelectedPersons(
      selectedPersons.filter((p) => p.person_id !== personId)
    )
  }

  const onSubmit = async (data: EditOrganizationForm) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const { error: updateError } = await supabase
        .from('organization')
        .update({
          name: data.name,
          website: data.website || null,
          linkedin_url: data.linkedin_url || null,
          status: data.status,
          notes: notes || null,
          relationship_owner_id: selectedRelationshipOwnerId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()

      if (updateError) {
        const errorMsg =
          (updateError as any).message || JSON.stringify(updateError)
        throw new Error(`Failed to update organization: ${errorMsg}`)
      }

      // Delete all existing person links
      const { error: deleteError } = await supabase
        .from('person_organization')
        .delete()
        .eq('organization_id', id)

      if (deleteError) {
        const errorMsg =
          (deleteError as any).message || JSON.stringify(deleteError)
        throw new Error(`Failed to delete person links: ${errorMsg}`)
      }

      // Add the updated person links
      if (selectedPersons.length > 0) {
        const linksToInsert = selectedPersons.map((person) => ({
          person_id: person.person_id,
          organization_id: id,
          role: person.role,
        }))

        const { error: linkError } = await supabase
          .from('person_organization')
          .insert(linksToInsert)

        if (linkError) {
          const errorMsg =
            (linkError as any).message || JSON.stringify(linkError)
          throw new Error(`Failed to add person links: ${errorMsg}`)
        }
      }

      // Delete all existing tags
      const { error: deleteTagError } = await supabase
        .from('organization_tag')
        .delete()
        .eq('organization_id', id)

      if (deleteTagError) {
        const errorMsg =
          (deleteTagError as any).message || JSON.stringify(deleteTagError)
        throw new Error(`Failed to delete tags: ${errorMsg}`)
      }

      // Add the updated tags
      if (selectedTags.length > 0) {
        const tagsToInsert = selectedTags.map((tag) => ({
          organization_id: id,
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

      // Redirect to organization detail page
      router.push(`/organizations/${id}`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err)
      setSubmitError(errorMessage)
      console.error('Error updating organization:', err)
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
              <Link href="/organizations">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Organizations
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
              <Link href={`/organizations/${id}`}>
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Organization
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
              <p className="text-muted-foreground">
                Update information for {organization?.name}
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
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="Acme Corporation"
                      {...register('name', {
                        required: 'Organization name is required',
                      })}
                      disabled={submitting}
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
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn Profile URL (Optional)</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/company/acme"
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
                    <Label htmlFor="relationship_owner_id">Relationship Owner (Optional)</Label>
                    <select
                      id="relationship_owner_id"
                      value={selectedRelationshipOwnerId}
                      onChange={(e) => setSelectedRelationshipOwnerId(e.target.value)}
                      disabled={submitting}
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
                      placeholder="Update account history, partnership details, or follow-up notes."
                      className={submitting ? 'pointer-events-none opacity-60' : undefined}
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

                  {/* Persons Section */}
                  <div className="space-y-3 border-t pt-6">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Linked Persons
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Manage persons and their roles in this organization
                      </p>
                    </div>

                    {personError && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {personError}
                      </div>
                    )}

                    {/* Add Person Form */}
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                      <div className="space-y-2">
                        <Label htmlFor="person_select">Person</Label>
                        <select
                          id="person_select"
                          value={selectedPersonId}
                          onChange={(e) => setSelectedPersonId(e.target.value)}
                          disabled={submitting || persons.length === 0}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">
                            {persons.length === 0
                              ? 'No persons available'
                              : 'Select a person'}
                          </option>
                          {persons
                            .filter(
                              (person) =>
                                !selectedPersons.some(
                                  (s) => s.person_id === person.id
                                )
                            )
                            .map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.first_name} {person.last_name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="person_role_input">
                          Role / Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="person_role_input"
                          placeholder="e.g., Chief Executive Officer, Developer, Manager"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          disabled={submitting}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleAddPerson}
                        disabled={submitting || !selectedPersonId}
                        variant="outline"
                        className="w-full"
                      >
                        Add Person
                      </Button>
                    </div>

                    {/* Selected Persons List */}
                    {selectedPersons.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Linked Persons ({selectedPersons.length})
                        </p>
                        <div className="space-y-2">
                          {selectedPersons.map((person) => (
                            <div
                              key={person.person_id}
                              className="flex items-center justify-between rounded-lg border bg-card p-3"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {person.person_first_name} {person.person_last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {person.role}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemovePerson(person.person_id)
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
                    <Link href={`/organizations/${id}`}>
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

export default function EditOrganizationPage() {
  return (
    <AuthGuard>
      <EditOrganizationContent />
    </AuthGuard>
  )
}
