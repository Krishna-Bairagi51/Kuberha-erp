// Shared shipping progress bar component
import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShippingProgressStage } from '../utils/status-helpers'

interface ShippingProgressBarProps {
  stages: ShippingProgressStage[]
  currentStatus: string
  lastEvent?: string
  isCancelled: boolean
}

export const ShippingProgressBar: React.FC<ShippingProgressBarProps> = ({
  stages,
  currentStatus,
  lastEvent,
  isCancelled
}) => {
  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div className="flex items-center justify-end">
        <span 
          className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist"
          style={
            currentStatus === 'Cancelled'
              ? { backgroundColor: '#FEE2E2', borderColor: '#FECACA', color: '#DC2626' }
              : currentStatus === 'In Transit'
              ? { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }
              : currentStatus === 'Delivery in Progress'
              ? { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', color: '#059669' }
              : { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', color: '#6B7280' }
          }
        >
          {currentStatus}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {stages.map((stage, index) => {
          const isCancelledStage = isCancelled && stage.label === 'Cancelled'
          return (
            <React.Fragment key={stage.step}>
              <div className="flex flex-col items-center flex-1">
                <div className={cn(
                  "w-full h-[62px] rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium font-urbanist",
                  isCancelledStage ? "border-red-500 bg-red-50" :
                  stage.status === 'completed' ? "border-green-500 bg-green-50" : 
                  stage.status === 'in-progress' ? "border-yellow-500 bg-yellow-50" : 
                  "border-gray-300 bg-gray-50"
                )}>
                  <div className={cn("text-xs text-center", isCancelledStage && "text-red-600 font-semibold")}>
                    {stage.label}
                  </div>
                  <div className="mt-1">
                    {isCancelledStage && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {!isCancelledStage && stage.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {!isCancelledStage && stage.status === 'in-progress' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    {!isCancelledStage && stage.status === 'pending' && <span className="text-xs font-semibold text-gray-400">{stage.step}</span>}
                  </div>
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className={cn(
                  "h-0.5 w-4",
                  isCancelledStage ? "bg-red-500" :
                  stage.status === 'completed' ? "bg-green-500" : "bg-gray-300"
                )} />
              )}
            </React.Fragment>
          )
        })}
      </div>
      
      {/* Last Event Text Below Progress Bar */}
      {lastEvent && (
        <div className="flex items-center justify-start pt-2">
          <p className="text-sm text-gray-700 font-urbanist body-3">{lastEvent}</p>
        </div>
      )}
    </div>
  )
}

