// Shared header component for shipment details slider
import React from 'react'

interface ShipmentSliderHeaderProps {
  shipmentId: string
  error?: string | null
  onViewFullPage?: () => void
}

export const ShipmentSliderHeader: React.FC<ShipmentSliderHeaderProps> = ({
  shipmentId,
  error,
  onViewFullPage
}) => {
  return (
    <div className="flex items-center justify-between p-[16px] h-[56px] bg-white border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <h2 className="label-1 font-semibold text-gray-900 font-urbanist">
          Shipment ID(#{shipmentId})
        </h2>
      </div>
      {error && (
        <div className="text-xs text-red-500 font-urbanist">{error}</div>
      )}
      <div className="flex items-center space-x-4">
        <button 
          onClick={onViewFullPage}
          className="text-gray-700 hover:text-gray-900 font-bold underline font-urbanist text-sm"
        >
          View Full Page
        </button>
      </div>
    </div>
  )
}

