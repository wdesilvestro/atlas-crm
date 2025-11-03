'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Person, PersonOrganization, PersonAction } from '@/types/person'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Tag } from '@/lib/hooks/use-tags'
import ActionLogForm from '@/components/ActionLogForm'
import ActionsList from '@/components/ActionsList'
import ActionStatusBanner from '@/components/ActionStatusBanner'
import { NotesViewer } from '@/components/NotesViewer'

interface PersonOrganizationWithDetails extends PersonOrganization {
  organization_name: string
}

function PersonDetailContent() {
  const params = useParams()
  const id = params.id as string

  const [person, setPerson] = useState<Person | null>(null)
  const [organizations, setOrganizations] = useState<
    PersonOrganizationWithDetails[]
  >([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionRefreshTrigger, setActionRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('person')
          .select('*, relationship_owner(*)')
          .eq('id', id)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (!data) {
          throw new Error('Person not found')
        }

        setPerson(data)

        // Fetch organization links
        const { data: orgLinks, error: linksError } = await supabase
          .from('person_organization')
          .select('*, organization:organization_id(name)')
          .eq('person_id', id)

        if (linksError) {
          throw linksError
        }

        if (orgLinks) {
          setOrganizations(
            orgLinks.map((link: any) => ({
              ...link,
              organization_name: link.organization.name,
            }))
          )
        }

        // Fetch tags
        const { data: tagLinks, error: tagsError } = await supabase
          .from('person_tag')
          .select('tag(*)')
          .eq('person_id', id)

        if (tagsError) {
          throw tagsError
        }

        if (tagLinks) {
          const tagList = tagLinks.map((link: any) => link.tag).filter(Boolean)
          setTags(tagList)
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
  }, [id])

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

  if (error || !person) {
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
                {error || 'Person not found'}
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
              <Link href="/persons">
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Persons
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">
                {person.first_name} {person.last_name}
              </h1>
              <p className="text-muted-foreground">
                Person details and information
              </p>
            </div>

            <ActionStatusBanner personId={id} refreshTrigger={actionRefreshTrigger} />

            <div className="space-y-6 max-w-4xl">
              <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      First Name
                    </label>
                    <p className="mt-2 text-lg font-medium">{person.first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Name
                    </label>
                    <p className="mt-2 text-lg font-medium">{person.last_name}</p>
                  </div>
                </div>

                {person.linkedin_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      LinkedIn
                    </label>
                    <a
                      href={person.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      View Profile
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-2">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                        person.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {person.status}
                    </div>
                  </div>
                </div>

                {person.relationship_owner && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Relationship Owner
                    </label>
                    <p className="mt-2 text-lg font-medium">{person.relationship_owner.name}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </label>
                  <div className="mt-2 rounded-md border bg-muted/40 p-4">
                    <NotesViewer value={person.notes} />
                  </div>
                </div>

                {person.formatted_address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Location
                    </label>
                    <div className="mt-2 space-y-1">
                      {person.street_address && (
                        <p className="text-sm">{person.street_address}</p>
                      )}
                      <p className="text-sm">
                        {[person.city, person.state_province]
                          .filter(Boolean)
                          .join(', ')}
                        {person.postal_code && ` ${person.postal_code}`}
                      </p>
                      {person.country && <p className="text-sm">{person.country}</p>}
                    </div>
                  </div>
                )}

                {tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tags
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {tag.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created
                    </label>
                    <p className="mt-2 text-sm">
                      {new Date(person.created_at).toLocaleDateString()} at{' '}
                      {new Date(person.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </label>
                    <p className="mt-2 text-sm">
                      {new Date(person.updated_at).toLocaleDateString()} at{' '}
                      {new Date(person.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Organizations Section */}
                {organizations.length > 0 && (
                  <div className="pt-6 border-t">
                    <label className="text-sm font-medium text-muted-foreground">
                      Organizations
                    </label>
                    <div className="mt-4 space-y-2">
                      {organizations.map((org) => (
                        <Link
                          key={org.organization_id}
                          href={`/organizations/${org.organization_id}`}
                        >
                          <div className="rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">
                                  {org.organization_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {org.role}
                                </p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6 border-t">
                  <Link href={`/persons/${id}/edit`}>
                    <Button>Edit Person</Button>
                  </Link>
                </div>
              </div>

              {/* Actions Section */}
              <ActionLogForm
                personId={id}
                onActionCreated={() => setActionRefreshTrigger((prev) => prev + 1)}
              />
              <ActionsList personId={id} refreshTrigger={actionRefreshTrigger} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function PersonDetailPage() {
  return (
    <AuthGuard>
      <PersonDetailContent />
    </AuthGuard>
  )
}
