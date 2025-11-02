'use client'

import { useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePersonTags, useOrganizationTags } from '@/lib/hooks/use-tags'

function TagsContent() {
  const personTags = usePersonTags()
  const organizationTags = useOrganizationTags()

  const [personInputValue, setPersonInputValue] = useState('')
  const [organizationInputValue, setOrganizationInputValue] = useState('')
  const [personCreateError, setPersonCreateError] = useState<string | null>(null)
  const [orgCreateError, setOrgCreateError] = useState<string | null>(null)

  const handleCreatePersonTag = async () => {
    if (!personInputValue.trim()) {
      setPersonCreateError('Tag name cannot be empty')
      return
    }

    const success = await personTags.createTag(personInputValue)
    if (success) {
      setPersonInputValue('')
      setPersonCreateError(null)
    } else {
      setPersonCreateError(personTags.error || 'Failed to create tag')
    }
  }

  const handleCreateOrganizationTag = async () => {
    if (!organizationInputValue.trim()) {
      setOrgCreateError('Tag name cannot be empty')
      return
    }

    const success = await organizationTags.createTag(organizationInputValue)
    if (success) {
      setOrganizationInputValue('')
      setOrgCreateError(null)
    } else {
      setOrgCreateError(organizationTags.error || 'Failed to create tag')
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
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Manage Tags</h1>
              <p className="text-muted-foreground">
                Create and manage tags for persons and organizations
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
              {/* Person Tags Section */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Person Tags</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create and manage tags for persons
                  </p>
                </div>

                {personCreateError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
                    {personCreateError}
                  </div>
                )}

                {personTags.error && !personCreateError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
                    {personTags.error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="person_tag_input">New Tag Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="person_tag_input"
                        placeholder="e.g., Client, Investor, Partner"
                        value={personInputValue}
                        onChange={(e) => {
                          setPersonInputValue(e.target.value)
                          setPersonCreateError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreatePersonTag()
                          }
                        }}
                      />
                      <Button
                        onClick={handleCreatePersonTag}
                        disabled={personTags.loading || !personInputValue.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {personTags.loading && (
                    <p className="text-sm text-muted-foreground">Loading tags...</p>
                  )}

                  {personTags.tags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Existing Tags ({personTags.tags.length})
                      </p>
                      <div className="space-y-2">
                        {personTags.tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                          >
                            <span className="text-sm font-medium">{tag.name}</span>
                            <button
                              onClick={() => personTags.deleteTag(tag.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Delete ${tag.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!personTags.loading && personTags.tags.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No person tags created yet
                    </p>
                  )}
                </div>
              </div>

              {/* Organization Tags Section */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Organization Tags</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create and manage tags for organizations
                  </p>
                </div>

                {orgCreateError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
                    {orgCreateError}
                  </div>
                )}

                {organizationTags.error && !orgCreateError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
                    {organizationTags.error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org_tag_input">New Tag Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="org_tag_input"
                        placeholder="e.g., Vendor, Supplier, Partner"
                        value={organizationInputValue}
                        onChange={(e) => {
                          setOrganizationInputValue(e.target.value)
                          setOrgCreateError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateOrganizationTag()
                          }
                        }}
                      />
                      <Button
                        onClick={handleCreateOrganizationTag}
                        disabled={organizationTags.loading || !organizationInputValue.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {organizationTags.loading && (
                    <p className="text-sm text-muted-foreground">Loading tags...</p>
                  )}

                  {organizationTags.tags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Existing Tags ({organizationTags.tags.length})
                      </p>
                      <div className="space-y-2">
                        {organizationTags.tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                          >
                            <span className="text-sm font-medium">{tag.name}</span>
                            <button
                              onClick={() => organizationTags.deleteTag(tag.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Delete ${tag.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!organizationTags.loading && organizationTags.tags.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No organization tags created yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function TagsPage() {
  return (
    <AuthGuard>
      <TagsContent />
    </AuthGuard>
  )
}
