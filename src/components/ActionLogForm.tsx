'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { PersonAction, ActionType } from '@/types/person'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Calendar, Clock } from 'lucide-react'

interface ActionLogFormProps {
  personId: string
  onActionCreated: (action: PersonAction) => void
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

export default function ActionLogForm({ personId, onActionCreated }: ActionLogFormProps) {
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

  const [isSubmitting, setIsSubmitting] = useState(false)

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

      toast.success('Action logged successfully')

      // Reset form
      setSelectedActionType('')
      setDateTime(getLocalDateTime())
      setLinkedinMessage('')
      setLinkedinMessageContent('')
      setLinkedinMessageReceived('')
      setEmailSubject('')
      setEmailBody('')

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
