// Shared skeleton loader for shipment details slider
import React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface ShipmentSliderSkeletonProps {
  isOpen: boolean
  onClose: () => void
}

export const ShipmentSliderSkeleton: React.FC<ShipmentSliderSkeletonProps> = ({ 
  isOpen, 
  onClose 
}) => {
  return (
    <div className={cn(
      "fixed inset-0 z-40 transition-all duration-300 ease-in-out",
      isOpen ? "opacity-100 visible" : "opacity-0 invisible"
    )}>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-white transition-all duration-300 ease-in-out",
          isOpen ? "bg-opacity-50" : "bg-opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-[606px] bg-gray-50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out rounded-l-lg",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-[16px] h-[56px] bg-white border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-48" />
            </div>
          </div>

          {/* Skeleton Content */}
          <div className="flex-1 overflow-y-auto p-[16px] space-y-4 bg-gray-50">
            {/* Customer Info Skeleton */}
            <div>
              <div className="flex items-center justify-between pb-[8px]">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded-full mr-[8px]" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>

            {/* Items in the Shipment Skeleton */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="p-[8px] space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start space-x-[8px]">
                    <Skeleton className="w-[50px] h-[50px] rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Skeleton */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="grid grid-cols-5 border-b border-gray-200 bg-white">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="px-[8px] py-[8px] border-r border-gray-200 last:border-r-0">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 bg-white">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="px-[8px] py-[8px] border-r border-gray-200 last:border-r-0">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup/Destination Locations Skeleton */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="p-[16px] space-y-4">
                <div className="flex items-start space-x-2">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="ml-4 h-5 w-0.5 bg-gray-300"></div>
                <div className="flex items-start space-x-2">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

