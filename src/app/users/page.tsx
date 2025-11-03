'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { UserDisplayName } from '@/types/person'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Edit2, Check, X, UserCog } from 'lucide-react'

interface UserWithDisplayName {
  id: string
  email: string
  display_name?: string
  display_name_id?: string
}

function UsersContent() {
  const [users, setUsers] = useState<UserWithDisplayName[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingDisplayName, setEditingDisplayName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // First, get all users with actions from person_action
      const { data: actionsData, error: actionsError } = await supabase
        .from('person_action')
        .select('user_id')

      if (actionsError) {
        console.error('Error fetching users from actions:', actionsError)
        toast.error('Failed to load users')
        return
      }

      // Get unique user IDs
      const uniqueUserIds = [...new Set(actionsData?.map((a) => a.user_id) || [])]

      // Fetch user emails and display names
      const { data: userEmailsData, error: userEmailsError } = await supabase.rpc(
        'get_users_with_display_names',
        { user_ids: uniqueUserIds }
      )

      if (userEmailsError) {
        // If the function doesn't exist, fall back to fetching display names only
        console.log('Falling back to manual fetching')
        const usersWithDisplayNames = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            // Get email using our function
            const { data: emailData } = await supabase.rpc('get_user_email', { user_uuid: userId })

            // Get display name if exists
            const { data: displayNameData } = await supabase
              .from('user_display_name')
              .select('*')
              .eq('user_id', userId)
              .single()

            return {
              id: userId,
              email: emailData || 'Unknown',
              display_name: displayNameData?.display_name,
              display_name_id: displayNameData?.id,
            }
          })
        )

        setUsers(usersWithDisplayNames)
      } else {
        setUsers(userEmailsData)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user: UserWithDisplayName) => {
    setEditingUserId(user.id)
    setEditingDisplayName(user.display_name || '')
  }

  const handleCancel = () => {
    setEditingUserId(null)
    setEditingDisplayName('')
  }

  const handleSave = async (userId: string, displayNameId?: string) => {
    if (!editingDisplayName.trim()) {
      toast.error('Display name cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      if (displayNameId) {
        // Update existing display name
        const { error } = await supabase
          .from('user_display_name')
          .update({ display_name: editingDisplayName })
          .eq('id', displayNameId)

        if (error) {
          console.error('Error updating display name:', error)
          toast.error('Failed to update display name')
          return
        }
      } else {
        // Insert new display name
        const { error } = await supabase.from('user_display_name').insert([
          {
            user_id: userId,
            display_name: editingDisplayName,
          },
        ])

        if (error) {
          console.error('Error creating display name:', error)
          toast.error('Failed to create display name')
          return
        }
      }

      toast.success('Display name saved successfully')
      setEditingUserId(null)
      setEditingDisplayName('')
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error saving display name:', error)
      toast.error('Failed to save display name')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex items-center gap-3">
              <UserCog className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                <p className="text-muted-foreground">Manage display names for users in the system</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>User Display Names</CardTitle>
                  <CardDescription>
                    Configure custom display names for users. These will appear in action logs instead of email addresses.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No users found</p>
                  ) : (
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between border rounded-lg p-4">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{user.email}</p>
                            {editingUserId === user.id ? (
                              <Input
                                value={editingDisplayName}
                                onChange={(e) => setEditingDisplayName(e.target.value)}
                                placeholder="Enter display name"
                                className="max-w-md"
                                autoFocus
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {user.display_name ? `Display name: ${user.display_name}` : 'No display name set'}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {editingUserId === user.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(user.id, user.display_name_id)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function UsersPage() {
  return (
    <AuthGuard>
      <UsersContent />
    </AuthGuard>
  )
}
