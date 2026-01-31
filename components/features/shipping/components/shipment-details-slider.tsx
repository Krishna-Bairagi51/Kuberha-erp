"use client"

import React, { useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useUserType } from '@/hooks/use-user-type'
import type { UserType, ShipmentDetailsData } from '../types/shipping.types'
import { useShipmentDetails } from '../hooks/use-shipment-details'
import { ShipmentSliderSkeleton } from '../sections/shipment-slider-skeleton'
import { ShipmentSliderHeader } from '../sections/shipment-slider-header'
import { ShipmentSliderCustomerInfo } from '../sections/shipment-slider-customer-info'
import { ShipmentSliderItems } from '../sections/shipment-slider-items'
import { ShipmentSliderSummary } from '../sections/shipment-slider-summary'
import { ShipmentSliderLocations } from '../sections/shipment-slider-locations'

interface ShipmentDetailsSliderProps {
  isOpen: boolean
  onClose: () => void
  shipment: ShipmentDetailsData | null
  orderId?: string | number
  onViewFullPage?: () => void
  onSliderStateChange?: (isOpen: boolean) => void
  userType?: UserType
}

/**
 * Unified Shipment Details Slider
 * Handles both seller and admin views with a single component
 */
export function ShipmentDetailsSlider({
  isOpen,
  onClose,
  shipment,
  orderId,
  onViewFullPage,
  onSliderStateChange,
  userType: propUserType
}: ShipmentDetailsSliderProps) {
  const { userType: globalUserType } = useUserType()
  const userType = useMemo(() => {
    if (propUserType) return propUserType
    return (globalUserType as UserType) || 'seller'
  }, [propUserType, globalUserType])

  // Fetch shipment details if orderId is provided
  const {
    shipment: fetchedShipment,
    isLoading,
    error
  } = useShipmentDetails({
    orderId,
    isOpen,
    userType
  })

  // Notify parent component when slider state changes
  useEffect(() => {
    onSliderStateChange?.(isOpen)
  }, [isOpen, onSliderStateChange])

  // Handle close with state notification
  const handleClose = () => {
    onClose()
    onSliderStateChange?.(false)
  }

  // Use fetched shipment if available, otherwise fall back to prop shipment
  // But if we have orderId, only show fetched data (not prop data) to avoid glitch
  const displayShipment = orderId ? fetchedShipment : (fetchedShipment || shipment)

  // Show loading spinner if we're fetching data with orderId and don't have fetched data yet
  if (isLoading) {
    return <ShipmentSliderSkeleton isOpen={isOpen} onClose={handleClose} />
  }

  if (!displayShipment) return null

  // Show supplier info only for admin users
  const showSupplierInfo = userType === 'admin'

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
        onClick={handleClose}
      />

      {/* Sliding Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-[606px] bg-gray-50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out rounded-l-lg",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <ShipmentSliderHeader
            shipmentId={displayShipment.shipmentId}
            error={error}
            onViewFullPage={onViewFullPage}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-[16px] space-y-4 bg-gray-50">
            <ShipmentSliderCustomerInfo
              customerName={displayShipment.customerName}
              amountPaid={displayShipment.amountPaid}
            />

            <ShipmentSliderItems
              items={displayShipment.items}
              showSupplierInfo={showSupplierInfo}
            />

            <ShipmentSliderSummary summary={displayShipment.summary} />

            <ShipmentSliderLocations
              pickupLocation={displayShipment.pickupLocation}
              destinationLocation={displayShipment.destinationLocation}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShipmentDetailsSlider

