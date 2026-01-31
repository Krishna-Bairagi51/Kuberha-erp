"use client"

import { useShipmentDetailsQuery } from './use-shipping-query'
import type { UserType } from '../types/shipping.types'
import type { ShipmentDetailsData } from '../utils/data-mappers'

interface UseShipmentDetailsOptions {
  orderId?: string | number | null
  isOpen: boolean
  userType: UserType
}

interface UseShipmentDetailsReturn {
  shipment: ShipmentDetailsData | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook for fetching shipment details.
 * Now uses TanStack Query for better caching and performance.
 * 
 * @deprecated This is a wrapper for backward compatibility.
 * New code should use useShipmentDetailsQuery directly from use-shipping-query.ts
 */
export function useShipmentDetails({
  orderId,
  isOpen,
  userType
}: UseShipmentDetailsOptions): UseShipmentDetailsReturn {
  const numericOrderId = orderId ? Number(orderId) : null
  const { data, isLoading, error } = useShipmentDetailsQuery(
    numericOrderId,
    userType,
    isOpen && !!orderId
  )

  return {
    shipment: data || null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch shipment data') : null
  }
}

