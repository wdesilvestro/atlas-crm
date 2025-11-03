'use client'

import { useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, X, Plus, Pencil, Check } from 'lucide-react'
import Link from 'next/link'
import { useRelationshipOwners } from '@/lib/hooks/use-relationship-owners'

function RelationshipOwnersContent() {
  const { relationshipOwners, loading, error, createRelationshipOwner, updateRelationshipOwner, deleteRelationshipOwner } = useRelationshipOwners()

  const [inputValue, setInputValue] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleCreate = async () => {
    if (!inputValue.trim()) {
      setCreateError('Relationship owner name cannot be empty')
      return
    }

    const success = await createRelationshipOwner(inputValue)
    if (success) {
      setInputValue('')
      setCreateError(null)
    } else {
      setCreateError(error || 'Failed to create relationship owner')
    }
  }

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditValue(name)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) {
      setEditingId(null)
      return
    }

    const success = await updateRelationshipOwner(id, editValue)
    if (success) {
      setEditingId(null)
      setEditValue('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
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
              <h1 className="text-3xl font-bold tracking-tight">Manage Relationship Owners</h1>
              <p className="text-muted-foreground">
                Create and manage relationship owners for persons and organizations
              </p>
            </div>

            <div className="max-w-2xl">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Relationship Owners</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add people who own relationships with persons and organizations
                  </p>
                </div>

                {createError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
                    {createError}
                  </div>
                )}

                {error && !createError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="relationship_owner_input">New Relationship Owner Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="relationship_owner_input"
                        placeholder="e.g., John Doe, Jane Smith"
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value)
                          setCreateError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreate()
                          }
                        }}
                      />
                      <Button
                        onClick={handleCreate}
                        disabled={loading || !inputValue.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {loading && (
                    <p className="text-sm text-muted-foreground">Loading relationship owners...</p>
                  )}

                  {relationshipOwners.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Existing Relationship Owners ({relationshipOwners.length})
                      </p>
                      <div className="space-y-2">
                        {relationshipOwners.map((owner) => (
                          <div
                            key={owner.id}
                            className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                          >
                            {editingId === owner.id ? (
                              <>
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveEdit(owner.id)
                                    } else if (e.key === 'Escape') {
                                      handleCancelEdit()
                                    }
                                  }}
                                  className="mr-2"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleSaveEdit(owner.id)}
                                    className="text-muted-foreground hover:text-green-600 transition-colors p-1"
                                    aria-label="Save"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    aria-label="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-medium">{owner.name}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleStartEdit(owner.id, owner.name)}
                                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                                    aria-label={`Edit ${owner.name}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteRelationshipOwner(owner.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    aria-label={`Delete ${owner.name}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading && relationshipOwners.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No relationship owners created yet
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

export default function RelationshipOwnersPage() {
  return (
    <AuthGuard>
      <RelationshipOwnersContent />
    </AuthGuard>
  )
}
