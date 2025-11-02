'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PersonAction, ActionType } from '@/types/person'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trash2, Loader2, Clock, AlertCircle } from 'lucide-react'

interface ActionsListProps {
  personId: string
  refreshTrigger?: number
}

// Helper function to check if action is a "my action"
const isMyAction = (actionType: ActionType): boolean => {
  const myActionTypes: ActionType[] = [
    'linkedin_connection_request_sent',
    'linkedin_connection_request_retracted',
    'linkedin_message_sent',
    'email_sent',
  ]
  return myActionTypes.includes(actionType)
}

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  linkedin_connection_request_sent: 'Sent LinkedIn connection request',
  linkedin_connection_request_retracted: 'Retracted LinkedIn connection request',
  linkedin_connection_request_accepted: 'Accepted LinkedIn connection request',
  linkedin_message_sent: 'Sent LinkedIn message',
  linkedin_message_received: 'Received LinkedIn message',
  email_sent: 'Sent an email',
  email_received: 'Received an email',
}

const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  linkedin_connection_request_sent: 'bg-blue-100 text-blue-800',
  linkedin_connection_request_retracted: 'bg-blue-100 text-blue-800',
  linkedin_connection_request_accepted: 'bg-red-100 text-red-800',
  linkedin_message_sent: 'bg-blue-100 text-blue-800',
  linkedin_message_received: 'bg-red-100 text-red-800',
  email_sent: 'bg-blue-100 text-blue-800',
  email_received: 'bg-red-100 text-red-800',
}

export default function ActionsList({ personId, refreshTrigger = 0 }: ActionsListProps) {
  const [actions, setActions] = useState<PersonAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchActions()
  }, [personId, refreshTrigger])

  const fetchActions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('person_action')
        .select('*')
        .eq('person_id', personId)
        .order('occurred_at', { ascending: false })

      if (error) {
        console.error('Error fetching actions:', error)
        toast.error('Failed to load actions')
        return
      }

      setActions(data as PersonAction[])
    } catch (error) {
      console.error('Error fetching actions:', error)
      toast.error('Failed to load actions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (actionId: string) => {
    setDeletingId(actionId)
    try {
      const { error } = await supabase.from('person_action').delete().eq('id', actionId)

      if (error) {
        console.error('Error deleting action:', error)
        toast.error('Failed to delete action')
        return
      }

      setActions(actions.filter((a) => a.id !== actionId))
      toast.success('Action deleted successfully')
    } catch (error) {
      console.error('Error deleting action:', error)
      toast.error('Failed to delete action')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateRemainingDays = (reminderDate: string | null) => {
    if (!reminderDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const remindDate = new Date(reminderDate)
    remindDate.setHours(0, 0, 0, 0)

    const diffTime = remindDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const formatReminderDate = (dateString: string | null) => {
    if (!dateString) return null

    const date = new Date(dateString)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    return `${formattedDate} (${dayName})`
  }

  const getReminderDisplay = (remainingDays: number | null, reminderDate: string | null) => {
    if (remainingDays === null || !reminderDate) return null

    const formattedDate = formatReminderDate(reminderDate)

    if (remainingDays < 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>Follow-up reminder was due on {formattedDate}</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <Clock className="w-4 h-4" />
          <span>Follow-up reminder toggled on and should be completed on {formattedDate}</span>
        </div>
      )
    }
  }

  const getAdditionalDataDisplay = (actionType: ActionType, additionalData: any) => {
    switch (actionType) {
      case 'linkedin_connection_request_sent':
        return additionalData.message ? <p className="text-sm text-muted-foreground">Message: {additionalData.message}</p> : null
      case 'linkedin_connection_request_retracted':
        return null
      case 'linkedin_connection_request_accepted':
        return null
      case 'linkedin_message_sent':
        return <p className="text-sm text-muted-foreground">Message: {additionalData.message}</p>
      case 'linkedin_message_received':
        return <p className="text-sm text-muted-foreground">Message: {additionalData.message}</p>
      case 'email_sent':
      case 'email_received':
        return (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Subject: {additionalData.subject}</p>
            <p className="line-clamp-2">Body: {additionalData.body}</p>
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>History of actions for this person</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>History of actions for this person ({actions.length})</CardDescription>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No actions logged yet</p>
        ) : (
          <div className="space-y-4">
            {actions.map((action) => {
              const remainingDays = calculateRemainingDays(action.follow_up_reminder_date)
              return (
                <div key={action.id} className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={ACTION_TYPE_COLORS[action.action_type]}>
                        {ACTION_TYPE_LABELS[action.action_type]}
                      </Badge>
                      <time className="text-sm text-muted-foreground">{formatDate(action.occurred_at)}</time>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(action.id)}
                      disabled={deletingId === action.id}
                    >
                      {deletingId === action.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {getAdditionalDataDisplay(action.action_type, action.additional_data)}

                  {remainingDays !== null && isMyAction(action.action_type) && (
                    <div className="pt-2 border-t">
                      {getReminderDisplay(remainingDays, action.follow_up_reminder_date)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
