'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { PersonAction, ActionType } from '@/types/person'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Calendar, Clock } from 'lucide-react'

interface ActionLogFormProps {
  personId: string
  onActionCreated: (action: PersonAction) => void
  onTodoCreated?: () => void
}

interface User {
  user_id: string
  email: string
  display_name: string | null
}

const MY_ACTIONS: { value: ActionType; label: string }[] = [
  { value: 'linkedin_connection_request_sent', label: 'Sent LinkedIn connection request' },
  { value: 'linkedin_connection_request_retracted', label: 'Retracted LinkedIn connection request' },
  { value: 'linkedin_message_sent', label: 'Sent LinkedIn message' },
  { value: 'email_sent', label: 'Sent an email' },
]

const THEIR_ACTIONS: { value: ActionType; label: string }[] = [
  { value: 'linkedin_connection_request_accepted', label: 'Accepted LinkedIn connection request' },
  { value: 'linkedin_message_received', label: 'Received LinkedIn message' },
  { value: 'email_received', label: 'Received an email' },
]

// Helper function to get current local datetime in format "YYYY-MM-DDTHH:mm"
const getLocalDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function ActionLogForm({ personId, onActionCreated, onTodoCreated }: ActionLogFormProps) {
  const { user } = useAuth()
  const [selectedActionType, setSelectedActionType] = useState<ActionType | ''>('')
  const [dateTime, setDateTime] = useState<string>(getLocalDateTime())

  // LinkedIn connection request fields
  const [linkedinMessage, setLinkedinMessage] = useState('')

  // LinkedIn message fields
  const [linkedinMessageContent, setLinkedinMessageContent] = useState('')

  // LinkedIn message received fields
  const [linkedinMessageReceived, setLinkedinMessageReceived] = useState('')

  // Email fields
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  // Follow-up reminder fields
  const [createFollowUp, setCreateFollowUp] = useState(false)
  const [followUpDays, setFollowUpDays] = useState<number>(7)
  const [followUpAssignedTo, setFollowUpAssignedTo] = useState<string>('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [personName, setPersonName] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch users and person name on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch all users via RPC
        const { data: usersData, error: usersError } = await supabase.rpc(
          'get_all_users_with_display_names'
        )

        if (usersError) {
          // RPC function not available, use fallback approach
          // Fallback: Try to get users from person table (users who own persons)
          const { data: personUsers, error: personError } = await supabase
            .from('person')
            .select('user_id')

          if (personError) {
            console.error('Error fetching person users:', personError)
            // Final fallback: just use current user
            if (user) {
              setAvailableUsers([{
                user_id: user.id,
                email: user.email || '',
                display_name: user.user_metadata?.display_name || null
              }])
            }
          } else if (personUsers) {
            // Get unique user IDs
            const uniqueUserIds = [...new Set(personUsers.map(p => p.user_id))]

            // Fetch display names for these users
            const { data: displayNames } = await supabase
              .from('user_display_name')
              .select('*')
              .in('user_id', uniqueUserIds)

            // Build user list with current user's info
            const userList = uniqueUserIds.map(userId => {
              const displayName = displayNames?.find(d => d.user_id === userId)
              if (userId === user?.id && user) {
                return {
                  user_id: userId,
                  email: user.email || '',
                  display_name: displayName?.display_name || user.user_metadata?.display_name || null
                }
              }
              return {
                user_id: userId,
                email: '', // We don't have access to other users' emails
                display_name: displayName?.display_name || userId.substring(0, 8)
              }
            })

            setAvailableUsers(userList)
          }
        } else if (usersData) {
          setAvailableUsers(usersData)
        }

        // Fetch person name for todo title
        const { data: personData, error: personError } = await supabase
          .from('person')
          .select('first_name, last_name')
          .eq('id', personId)
          .single()

        if (personError) {
          console.error('Error fetching person:', personError)
        } else if (personData) {
          setPersonName(`${personData.first_name} ${personData.last_name}`)
        }

        // Set default assigned user to current user
        if (user) {
          setFollowUpAssignedTo(user.id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [personId, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('You must be logged in to log an action')
      return
    }

    if (!selectedActionType) {
      toast.error('Please select an action type')
      return
    }

    // Validate required fields based on action type
    if (selectedActionType === 'linkedin_message_sent' && !linkedinMessageContent.trim()) {
      toast.error('Message is required for LinkedIn message sent')
      return
    }

    if (selectedActionType === 'linkedin_message_received' && !linkedinMessageReceived.trim()) {
      toast.error('Message is required for LinkedIn message received')
      return
    }

    if ((selectedActionType === 'email_sent' || selectedActionType === 'email_received') && !emailSubject.trim()) {
      toast.error('Email subject is required')
      return
    }

    if ((selectedActionType === 'email_sent' || selectedActionType === 'email_received') && !emailBody.trim()) {
      toast.error('Email body is required')
      return
    }

    setIsSubmitting(true)

    try {
      // Build additional_data based on action type
      let additionalData: Record<string, any> = {}

      switch (selectedActionType) {
        case 'linkedin_connection_request_sent':
          additionalData = { message: linkedinMessage || undefined }
          break
        case 'linkedin_connection_request_retracted':
          additionalData = {}
          break
        case 'linkedin_connection_request_accepted':
          additionalData = {}
          break
        case 'linkedin_message_sent':
          additionalData = { message: linkedinMessageContent }
          break
        case 'linkedin_message_received':
          additionalData = { message: linkedinMessageReceived }
          break
        case 'email_sent':
        case 'email_received':
          additionalData = { subject: emailSubject, body: emailBody }
          break
      }

      const occurredDate = new Date(dateTime)

      // Insert the action
      const { data, error } = await supabase
        .from('person_action')
        .insert([
          {
            person_id: personId,
            user_id: user.id,
            action_type: selectedActionType,
            occurred_at: occurredDate.toISOString(),
            additional_data: additionalData,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating action:', error)
        const errorMessage = error?.message || 'Failed to log action'
        toast.error(errorMessage)
        return
      }

      // Create follow-up todo if requested
      if (createFollowUp && data) {
        try {
          // Calculate due date: action occurred_at + followUpDays
          const actionDate = new Date(occurredDate)
          const dueDate = new Date(actionDate)
          dueDate.setDate(dueDate.getDate() + followUpDays)

          const { error: todoError } = await supabase.from('todos').insert([
            {
              user_id: user.id,
              object_type: 'person',
              object_id: personId,
              title: `Follow up with ${personName}`,
              description: null,
              assigned_to: followUpAssignedTo,
              due_date: dueDate.toISOString().split('T')[0], // Date only (YYYY-MM-DD)
              completed: false,
            },
          ])

          if (todoError) {
            console.error('Error creating follow-up todo:', todoError)
            toast.error('Action logged, but failed to create follow-up reminder')
          } else {
            toast.success('Action logged and follow-up reminder created')
            // Trigger todo list refresh
            if (onTodoCreated) {
              onTodoCreated()
            }
          }
        } catch (todoErr) {
          console.error('Error creating follow-up todo:', todoErr)
          toast.error('Action logged, but failed to create follow-up reminder')
        }
      } else {
        toast.success('Action logged successfully')
      }

      // Reset form
      setSelectedActionType('')
      setDateTime(getLocalDateTime())
      setLinkedinMessage('')
      setLinkedinMessageContent('')
      setLinkedinMessageReceived('')
      setEmailSubject('')
      setEmailBody('')
      setCreateFollowUp(false)
      setFollowUpDays(7)
      if (user) {
        setFollowUpAssignedTo(user.id)
      }

      if (data) {
        onActionCreated(data as PersonAction)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to log action')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Log an Action</CardTitle>
        <CardDescription>Record a new action for this person</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date/Time Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">When did this happen?</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Action Type Select */}
          <div className="space-y-2">
            <label htmlFor="action-type" className="text-sm font-medium">
              Action Type
            </label>
            <Select value={selectedActionType} onValueChange={(value) => setSelectedActionType(value as ActionType)}>
              <SelectTrigger id="action-type">
                <SelectValue placeholder="Select an action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>My Actions</SelectLabel>
                  {MY_ACTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Their Actions</SelectLabel>
                  {THEIR_ACTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Follow-up Reminder Section - Only for MY_ACTIONS */}
          {selectedActionType && MY_ACTIONS.some(a => a.value === selectedActionType) && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-follow-up"
                  checked={createFollowUp}
                  onCheckedChange={(checked) => setCreateFollowUp(checked === true)}
                />
                <label
                  htmlFor="create-follow-up"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Create follow-up reminder
                </label>
              </div>

              {createFollowUp && (
                <div className="ml-6 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="follow-up-days" className="text-sm font-medium">
                      Follow up in (days) *
                    </label>
                    <Input
                      id="follow-up-days"
                      type="number"
                      min="1"
                      value={followUpDays}
                      onChange={(e) => setFollowUpDays(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="Number of days"
                      required={createFollowUp}
                    />
                    <p className="text-xs text-muted-foreground">
                      Days are calculated from the action date above
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="follow-up-assigned-to" className="text-sm font-medium">
                      Assign to
                    </label>
                    <Select
                      value={followUpAssignedTo}
                      onValueChange={setFollowUpAssignedTo}
                    >
                      <SelectTrigger id="follow-up-assigned-to">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((u) => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.display_name || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Fields */}
          {selectedActionType === 'linkedin_connection_request_sent' && (
            <div className="space-y-2">
              <label htmlFor="linkedin-message" className="text-sm font-medium">
                Message (optional)
              </label>
              <Textarea
                id="linkedin-message"
                placeholder="What message did you include in the connection request?"
                value={linkedinMessage}
                onChange={(e) => setLinkedinMessage(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {selectedActionType === 'linkedin_message_sent' && (
            <div className="space-y-2">
              <label htmlFor="linkedin-message-content" className="text-sm font-medium">
                Message *
              </label>
              <Textarea
                id="linkedin-message-content"
                placeholder="What message did you send?"
                value={linkedinMessageContent}
                onChange={(e) => setLinkedinMessageContent(e.target.value)}
                rows={3}
                required
              />
            </div>
          )}

          {selectedActionType === 'linkedin_message_received' && (
            <div className="space-y-2">
              <label htmlFor="linkedin-message-received" className="text-sm font-medium">
                Message *
              </label>
              <Textarea
                id="linkedin-message-received"
                placeholder="What message did you receive?"
                value={linkedinMessageReceived}
                onChange={(e) => setLinkedinMessageReceived(e.target.value)}
                rows={3}
                required
              />
            </div>
          )}

          {(selectedActionType === 'email_sent' || selectedActionType === 'email_received') && (
            <>
              <div className="space-y-2">
                <label htmlFor="email-subject" className="text-sm font-medium">
                  Email Subject *
                </label>
                <Input
                  id="email-subject"
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email-body" className="text-sm font-medium">
                  Email Body *
                </label>
                <Textarea
                  id="email-body"
                  placeholder="Email body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Logging...' : 'Log Action'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
