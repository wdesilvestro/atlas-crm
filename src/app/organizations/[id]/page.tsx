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
import { Organization } from '@/types/organization'
import { PersonOrganization } from '@/types/person'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Tag } from '@/lib/hooks/use-tags'

interface PersonOrganizationWithDetails extends PersonOrganization {
  person_first_name: string
  person_last_name: string
}

function OrganizationDetailContent() {
  const params = useParams()
  const id = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [persons, setPersons] = useState<PersonOrganizationWithDetails[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('organization')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (!data) {
          throw new Error('Organization not found')
        }

        setOrganization(data)

        // Fetch person links
        const { data: personLinks, error: linksError } = await supabase
          .from('person_organization')
          .select('*, person:person_id(first_name, last_name)')
          .eq('organization_id', id)

        if (linksError) {
          throw linksError
        }

        if (personLinks) {
          setPersons(
            personLinks.map((link: any) => ({
              ...link,
              person_first_name: link.person.first_name,
              person_last_name: link.person.last_name,
            }))
          )
        }

        // Fetch tags
        const { data: tagLinks, error: tagsError } = await supabase
          .from('organization_tag')
          .select('tag(*)')
          .eq('organization_id', id)

        if (tagsError) {
          throw tagsError
        }

        if (tagLinks) {
          const tagList = tagLinks.map((link: any) => link.tag).filter(Boolean)
          setTags(tagList)
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

  if (error || !organization) {
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
                {error || 'Organization not found'}
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
              <Link href="/organizations">
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Organizations
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">
                {organization.name}
              </h1>
              <p className="text-muted-foreground">
                Organization details and information
              </p>
            </div>

            <div className="max-w-2xl">
              <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Organization Name
                  </label>
                  <p className="mt-2 text-lg font-medium">{organization.name}</p>
                </div>

                {organization.website && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Website
                    </label>
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      {organization.website}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}

                {organization.linkedin_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      LinkedIn
                    </label>
                    <a
                      href={organization.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      View Company Profile
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
                        organization.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {organization.status}
                    </div>
                  </div>
                </div>

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
                      {new Date(organization.created_at).toLocaleDateString()} at{' '}
                      {new Date(organization.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </label>
                    <p className="mt-2 text-sm">
                      {new Date(organization.updated_at).toLocaleDateString()} at{' '}
                      {new Date(organization.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Persons Section */}
                {persons.length > 0 && (
                  <div className="pt-6 border-t">
                    <label className="text-sm font-medium text-muted-foreground">
                      Linked Persons
                    </label>
                    <div className="mt-4 space-y-2">
                      {persons.map((person) => (
                        <Link
                          key={person.person_id}
                          href={`/persons/${person.person_id}`}
                        >
                          <div className="rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">
                                  {person.person_first_name} {person.person_last_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {person.role}
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
                  <Link href={`/organizations/${id}/edit`}>
                    <Button>Edit Organization</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function OrganizationDetailPage() {
  return (
    <AuthGuard>
      <OrganizationDetailContent />
    </AuthGuard>
  )
}
