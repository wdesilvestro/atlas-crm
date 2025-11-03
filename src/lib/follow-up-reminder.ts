import { supabase } from '@/lib/supabase'
import { PersonAction, ActionType } from '@/types/person'

export type FollowUpReminderStatus = 'action_required' | 'awaiting_response' | 'no_follow_up_needed'

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

/**
 * Determines the follow-up reminder status for a person based on their latest action
 *
 * Returns:
 * - 'action_required': Follow-up reminder is due and person hasn't responded
 * - 'awaiting_response': Follow-up reminder is set for future and awaiting their response
 * - 'no_follow_up_needed': No follow-up reminder set or already resolved
 */
export async function getFollowUpReminderStatus(personId: string): Promise<FollowUpReminderStatus> {
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

    // Use UTC dates to avoid timezone issues
    const today = new Date()
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

    const reminderDate = new Date(mostRecentMyAction.follow_up_reminder_date)
    const reminderDateUTC = new Date(Date.UTC(reminderDate.getUTCFullYear(), reminderDate.getUTCMonth(), reminderDate.getUTCDate()))

    // Check if there's been a non-ignorable action by them since our action
    const actionsSinceOurs = (actions as PersonAction[])
      .slice(0, myActionIndex)
      .filter((action) => !isMyAction(action.action_type))

    // Check if any of these actions are non-ignorable
    const hasNonIgnorableResponse = actionsSinceOurs.some(
      (action) => !isIgnorableTheirAction(action.action_type)
    )

    // If reminder date is in the future
    if (reminderDateUTC > todayUTC) {
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
    console.error('Error determining follow-up reminder status:', error)
    return 'awaiting_response'
  }
}
