'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { getFollowUpReminderStatus, FollowUpReminderStatus } from '@/lib/follow-up-reminder'

interface ActionStatusBannerProps {
  personId: string
  refreshTrigger?: number
}

export default function ActionStatusBanner({ personId, refreshTrigger = 0 }: ActionStatusBannerProps) {
  const [status, setStatus] = useState<FollowUpReminderStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true)
      const result = await getFollowUpReminderStatus(personId)
      setStatus(result)
      setLoading(false)
    }

    fetchStatus()
  }, [personId, refreshTrigger])

  if (loading || status === null) {
    return null
  }

  const getStatusConfig = (status: FollowUpReminderStatus) => {
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
