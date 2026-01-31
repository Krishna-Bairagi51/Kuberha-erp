"use client"

import { useSupplierDetailsQuery } from './use-shipping-query'
import type { UserType } from '../types/shipping.types'

// Re-export types for backward compatibility
export type {
  OrderItem,
  ShippingProgressStage,
  OrderTimelineActivity,
  TrackingActivity,
  SupplierDetailsData
} from './use-supplier-details-types'

interface UseSupplierDetailsOptions {
  orderId?: string
  userType: UserType
}

interface UseSupplierDetailsReturn {
  data: SupplierDetailsData | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook for fetching supplier/shipment details.
 * Now uses TanStack Query for better caching and performance.
 * 
 * @deprecated This is a wrapper for backward compatibility.
 * New code should use useSupplierDetailsQuery directly from use-shipping-query.ts
 */
export function useSupplierDetails({
  orderId,
  userType
}: UseSupplierDetailsOptions): UseSupplierDetailsReturn {
  const numericOrderId = orderId ? Number(orderId) : null
  const { data, isLoading, error } = useSupplierDetailsQuery(
    numericOrderId,
    userType,
    !!orderId
  )

  return {
    data: data || null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch order data') : null
  }
}

