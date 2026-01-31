// Shared activity timeline component
import React from 'react'
import { Check, Clock } from 'lucide-react'

export interface TimelineActivity {
  date: string
  description?: string
  title?: string
  status: 'completed' | 'in-progress' | 'pending'
  highlight?: string
  createdBy?: string
  approvedBy?: string
}

interface ActivityTimelineProps {
  activities: TimelineActivity[]
  emptyMessage?: string
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  emptyMessage = "No data found"
}) => {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
        <div className="text-gray-400 mb-2">
          <Clock className="h-12 w-12" />
        </div>
        <p className="text-gray-500 font-urbanist text-sm body-3">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-green-500"></div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="relative flex items-start">
            <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white">
              {activity.status === 'completed' && (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              {activity.status === 'in-progress' && (
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              )}
              {activity.status === 'pending' && (
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              )}
            </div>
            
            <div className="ml-4 flex-1">
              <div className="text-sm text-gray-900 font-urbanist leading-5 body-3">
                {activity.description || activity.title}
                {activity.highlight && (
                  <span className="text-orange-600"> {activity.highlight}</span>
                )}
              </div>
              {(activity.createdBy || activity.approvedBy) && (
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  {activity.createdBy && activity.createdBy !== 'N/A' && (
                    <span className="text-xs text-gray-600 font-urbanist body-3">
                      {activity.createdBy}
                    </span>
                  )}
                  {activity.approvedBy && activity.approvedBy !== 'N/A' && (
                    <span className="text-xs text-green-600 font-urbanist body-3">
                      Approved by: {activity.approvedBy}
                    </span>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-500 font-urbanist mt-1 body-3">
                {activity.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

