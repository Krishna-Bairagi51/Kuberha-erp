// Shared locations component for shipment details slider
import React from 'react'
import { Truck, MapPin } from 'lucide-react'
import type { ShipmentLocation } from '../utils/data-mappers'

interface ShipmentSliderLocationsProps {
  pickupLocation: ShipmentLocation
  destinationLocation: ShipmentLocation
}

export const ShipmentSliderLocations: React.FC<ShipmentSliderLocationsProps> = ({
  pickupLocation,
  destinationLocation
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
        <h3 className="label-1 font-semibold text-gray-900 font-urbanist">
          Pickup/Destination Locations
        </h3>
      </div>
      
      <div className="p-[16px]">
        {/* Pickup Location */}
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="body-2 text-gray-900 font-urbanist font-semibold">
              {pickupLocation.address}
            </div>
            <div className="body-3 text-gray-500 font-urbanist">
              {pickupLocation.label}
            </div>
          </div>
        </div>

        {/* Connecting Line */}
        <div className="ml-4 mb-2 mt-[-4px] h-5 w-0.5 bg-gray-300"></div>

        {/* Destination Location */}
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 ">
            <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="body-2 text-gray-900 font-urbanist font-semibold">
              {destinationLocation.address}
            </div>
            <div className="body-3 text-gray-500 font-urbanist">
              {destinationLocation.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

