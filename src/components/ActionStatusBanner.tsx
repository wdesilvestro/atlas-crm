'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PersonAction, ActionType } from '@/types/person'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface ActionStatusBannerProps {
  personId: string
  refreshTrigger?: number
}

const isMyAction = (actionType: ActionType): boolean => {
  const myActionTypes: ActionType[] = [
    'linkedin_connection_request_sent',
    'linkedin_connection_request_retracted',
    'linkedin_message_sent',
    'email_sent',
  ]
  return myActionTypes.includes(actionType)
}

const isIgnorableTheirAction = (actionType: ActionType): boolean => {
  // LinkedIn connection request accepted doesn't count as them responding
  return actionType === 'linkedin_connection_request_accepted'
}

type ActionStatus = 'action_required' | 'awaiting_response' | 'no_follow_up_needed'

async function determineActionStatus(personId: string): Promise<ActionStatus> {
  try {
    const { data: actions, error } = await supabase
      .from('person_action')
      .select('*')
      .eq('person_id', personId)
      .order('occurred_at', { ascending: false })

    if (error || !actions || actions.length === 0) {
      return 'no_follow_up_needed'
    }

    // Find the most recent "my action"
    const myActionIndex = (actions as PersonAction[]).findIndex((action) =>
      isMyAction(action.action_type)
    )

    if (myActionIndex === -1) {
      // No actions by us, so no follow-up needed
      return 'no_follow_up_needed'
    }

    const mostRecentMyAction = (actions as PersonAction[])[myActionIndex]

    // Check if this action has a follow-up reminder set
    if (!mostRecentMyAction.follow_up_reminder_date) {
      return 'no_follow_up_needed'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reminderDate = new Date(mostRecentMyAction.follow_up_reminder_date)
    reminderDate.setHours(0, 0, 0, 0)

    // Check if there's been a non-ignorable action by them since our action
    const actionsSinceOurs = (actions as PersonAction[])
      .slice(0, myActionIndex)
      .filter((action) => !isMyAction(action.action_type))

    // Check if any of these actions are non-ignorable
    const hasNonIgnorableResponse = actionsSinceOurs.some(
      (action) => !isIgnorableTheirAction(action.action_type)
    )

    // If reminder date is in the future
    if (reminderDate > today) {
      // If they already responded, no need to follow up
      if (hasNonIgnorableResponse) {
        return 'no_follow_up_needed'
      }
      // If they haven't responded yet, we're awaiting response
      return 'awaiting_response'
    }

    // Reminder is due (today or past)
    if (hasNonIgnorableResponse) {
      // They did respond, so follow-up reminder has been solved
      return 'no_follow_up_needed'
    }

    // Reminder is due and no non-ignorable response from them
    return 'action_required'
  } catch (error) {
    console.error('Error determining action status:', error)
    return 'awaiting_response'
  }
}

export default function ActionStatusBanner({ personId, refreshTrigger = 0 }: ActionStatusBannerProps) {
  const [status, setStatus] = useState<ActionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true)
      const result = await determineActionStatus(personId)
      setStatus(result)
      setLoading(false)
    }

    fetchStatus()
  }, [personId, refreshTrigger])

  if (loading || status === null) {
    return null
  }

  const getStatusConfig = (status: ActionStatus) => {
    switch (status) {
      case 'action_required':
        return {
          border: 'border-orange-400',
          bg: 'bg-orange-50',
          text: 'text-orange-900',
          title: 'Action Required',
          subtitle: 'A follow-up reminder is due',
          icon: <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" />,
        }
      case 'awaiting_response':
        return {
          border: 'border-blue-400',
          bg: 'bg-blue-50',
          text: 'text-blue-900',
          title: 'Awaiting Response',
          subtitle: 'Waiting for response from this person',
          icon: <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600" />,
        }
      case 'no_follow_up_needed':
        return {
          border: 'border-gray-400',
          bg: 'bg-gray-50',
          text: 'text-gray-900',
          title: 'No Follow Up Needed',
          subtitle: 'No follow-up reminder set on latest action',
          icon: <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-gray-600" />,
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div className={`rounded-lg border-l-4 p-4 mb-6 flex items-center gap-3 ${config.border} ${config.bg} ${config.text}`}>
      {config.icon}
      <div>
        <p className="font-semibold text-sm">{config.title}</p>
        <p className="text-xs opacity-90">{config.subtitle}</p>
      </div>
    </div>
  )
}
