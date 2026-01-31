'use client'

/**
 * Shipping Query Hooks
 * 
 * TanStack Query powered shipping hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Optimistic updates on mutations
 * - Automatic cache invalidation
 * - Type-safe shipping operations
 * - Reduced API calls through smart caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { shippingService } from '../services/shipping.service'
import { ordersService } from '@/components/features/orders/services/orders.service'
import type {
  ShipmentRecord,
  ShipmentInsights,
  UserType,
  ShipmentDetailsData,
  PaginationParams,
} from '../types/shipping.types'
import type { Order, AdminSaleOrderItem } from '@/components/features/orders/types/orders.types'
import { mapAdminOrderToShipmentDetails, mapSellerOrderToShipmentDetails } from '../utils/data-mappers'

// ============================================================================
// Shipment List Queries
// ============================================================================

/**
 * Hook for fetching shipment list by user type.
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 * - Supports server-side pagination with page and limit params
 */
export function useShipmentsQuery(
  userType: UserType = 'seller', 
  enabled: boolean = true,
  pagination?: PaginationParams
) {
  return useQuery({
    queryKey: queryKeys.shipping.list.byUserType(userType, pagination?.page, pagination?.limit, pagination?.search, pagination?.status),
    queryFn: async () => {
      const response = await shippingService.getShipments(userType, pagination)
      if (response.status_code === 200 && Array.isArray(response.record)) {
        return {
          shipments: response.record as ShipmentRecord[],
          totalRecordCount: response.total_record_count ?? response.total_count ?? response.record.length,
        }
      }
      throw new Error('Failed to fetch shipments')
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - shipping data changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Ensure queries refetch when they become active after being invalidated
    refetchOnMount: true, // Refetch on mount if data is stale (after invalidation)
  })
}

/**
 * Hook for fetching In Transit shipments with server-side filtering.
 * Decoupled from main shipments query with its own pagination state.
 * 
 * Benefits:
 * - Independent loading and pagination state
 * - Server-side filtering with hardcoded status=in_transit
 * - Cached separately from main shipments table
 */
export function useInTransitShipmentsQuery(
  userType: UserType = 'seller',
  enabled: boolean = true,
  pagination?: Pick<PaginationParams, 'page' | 'limit'>
) {
  return useQuery({
    queryKey: [...queryKeys.shipping.list.byUserType(userType, pagination?.page, pagination?.limit, undefined, 'in_transit'), 'in-transit-dropdown'],
    queryFn: async () => {
      const response = await shippingService.getShipments(userType, {
        ...pagination,
        status: 'in_transit', // Hardcoded status filter
      })
      if (response.status_code === 200 && Array.isArray(response.record)) {
        return {
          shipments: response.record as ShipmentRecord[],
          totalRecordCount: response.total_record_count ?? response.total_count ?? response.record.length,
        }
      }
      throw new Error('Failed to fetch in transit shipments')
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
  })
}

/**
 * Hook for fetching Out for Delivery shipments with server-side filtering.
 * Decoupled from main shipments query with its own pagination state.
 * 
 * Benefits:
 * - Independent loading and pagination state
 * - Server-side filtering with hardcoded status=out_for_delivery
 * - Cached separately from main shipments table
 */
export function useOutForDeliveryShipmentsQuery(
  userType: UserType = 'seller',
  enabled: boolean = true,
  pagination?: Pick<PaginationParams, 'page' | 'limit'>
) {
  return useQuery({
    queryKey: [...queryKeys.shipping.list.byUserType(userType, pagination?.page, pagination?.limit, undefined, 'out_for_delivery'), 'out-for-delivery-dropdown'],
    queryFn: async () => {
      const response = await shippingService.getShipments(userType, {
        ...pagination,
        status: 'out_for_delivery', // Hardcoded status filter
      })
      if (response.status_code === 200 && Array.isArray(response.record)) {
        return {
          shipments: response.record as ShipmentRecord[],
          totalRecordCount: response.total_record_count ?? response.total_count ?? response.record.length,
        }
      }
      throw new Error('Failed to fetch out for delivery shipments')
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
  })
}

/**
 * Hook for fetching shipment by order ID.
 * 
 * Benefits:
 * - Cached shipment data per order
 * - Instant display on revisit
 */
export function useShipmentByOrderIdQuery(
  orderId: number | null, 
  userType: UserType = 'seller',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: orderId ? queryKeys.shipping.byOrderId(orderId, userType) : ['shipping', 'disabled'],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required')
      const response = userType === 'admin'
        ? await shippingService.getAdminShipmentByOrderId(orderId)
        : await shippingService.getShipmentByOrderId(orderId, userType)
      
      if (response.success && response.data?.record && response.data.record.length > 0) {
        return response.data.record[0] as ShipmentRecord
      }
      return null
    },
    enabled: enabled && orderId !== null && orderId > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============================================================================
// Shipment Insights Queries
// ============================================================================

/**
 * Hook for fetching shipment insights and performance metrics.
 * 
 * Benefits:
 * - Cached insights data
 * - Fast dashboard loads
 */
export function useShipmentInsightsQuery(
  timePeriod?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...queryKeys.shipping.insights(), timePeriod],
    queryFn: async () => {
      const response = await shippingService.getShipmentInsightsAndPerformance(timePeriod)
      if (response.success && response.data) {
        return {
          pickup_scheduled: response.data.pickup_scheduled || 0,
          pickup_done: response.data.pickup_done || 0,
          in_transit: response.data.in_transit || 0,
          out_for_delivery: response.data.out_for_delivery || 0,
          delivered: response.data.delivered || 0,
          cancelled: response.data.cancelled || 0,
        } as ShipmentInsights
      }
      // Return default values if API fails
      return {
        pickup_scheduled: 0,
        pickup_done: 0,
        in_transit: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0,
      } as ShipmentInsights
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

// ============================================================================
// Box Dimensions & Shipping Items Queries
// ============================================================================

/**
 * Hook for fetching box dimensions for shipping.
 * 
 * Benefits:
 * - Cached dimensions - rarely change
 * - Shared across all shipping forms
 */
export function useBoxDimensionsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.shipping.boxDimensions(),
    queryFn: () => shippingService.getBoxDimensions(),
    enabled,
    staleTime: 5 * 60 * 1000, // box dimensions rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook for fetching items for shipping by order ID.
 * 
 * Benefits:
 * - Cached per order
 * - Fast form pre-fill
 */
export function useShippingItemsQuery(
  orderId: number | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: orderId ? queryKeys.shipping.items(orderId) : ['shipping', 'items', 'disabled'],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required')
      return await shippingService.getItemsForShipping(orderId)
    },
    enabled: enabled && orderId !== null && orderId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ============================================================================
// Shipment Details Query (Slider & Full Page)
// ============================================================================

/**
 * Hook for fetching complete shipment details including order and shipping data.
 * Used in shipment detail slider and full page view.
 * 
 * Benefits:
 * - Combines order and shipping data in one query
 * - Cached per order
 * - Fast detail page loads
 */
export function useShipmentDetailsQuery(
  orderId: number | null,
  userType: UserType = 'seller',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: orderId 
      ? [...queryKeys.orders.detail.byId(orderId, userType), 'shipment-details']
      : ['shipment', 'details', 'disabled'],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required')

      // Fetch order and shipping data in parallel
      const [orderResponse, shipRocketResponse] = await Promise.all([
        userType === 'admin'
          ? ordersService.getAdminOrderDetails(orderId)
          : ordersService.getSellerOrderDetails(orderId),
        userType === 'admin'
          ? shippingService.getAdminShipmentByOrderId(orderId)
          : shippingService.getShipmentByOrderId(orderId, userType)
      ])

      if (orderResponse.status_code !== 200 || !orderResponse.record) {
        throw new Error('Failed to fetch order details')
      }

      const order = (Array.isArray(orderResponse.record)
        ? orderResponse.record[0]
        : orderResponse.record) as Order | AdminSaleOrderItem

      let shipData: ShipmentRecord | null = null
      if (shipRocketResponse.success && shipRocketResponse.data?.record && shipRocketResponse.data.record.length > 0) {
        shipData = shipRocketResponse.data.record[0]
      }

      // Map to ShipmentDetailsData
      if (userType === 'admin') {
        return mapAdminOrderToShipmentDetails(order as AdminSaleOrderItem, shipData)
      } else {
        return mapSellerOrderToShipmentDetails(order as Order, shipData)
      }
    },
    enabled: enabled && orderId !== null && orderId > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============================================================================
// Supplier Details Query (Full Page View)
// ============================================================================

/**
 * Hook for fetching complete supplier details including order, shipping, and timeline data.
 * Used in the full supplier details page.
 */
export function useSupplierDetailsQuery(
  orderId: number | null,
  userType: UserType = 'seller',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: orderId 
      ? [...queryKeys.orders.detail.byId(orderId, userType), 'supplier-details']
      : ['supplier', 'details', 'disabled'],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required')

      // Fetch order and shipping data in parallel
      const [orderResponse, shipRocketResponse] = await Promise.all([
        userType === 'admin'
          ? ordersService.getAdminOrderDetails(orderId)
          : ordersService.getSellerOrderDetails(orderId),
        userType === 'admin'
          ? shippingService.getAdminShipmentByOrderId(orderId)
          : shippingService.getShipmentByOrderId(orderId, userType)
      ])

      if (orderResponse.status_code !== 200 || !orderResponse.record) {
        throw new Error('Failed to fetch order details')
      }

      const order = (Array.isArray(orderResponse.record)
        ? orderResponse.record[0]
        : orderResponse.record) as Order | AdminSaleOrderItem

      // Import the helper types and functions from use-supplier-details
      const { mapOrderToSupplierDetails } = await import('./use-supplier-details-helpers')
      
      let shipData: ShipmentRecord | null = null
      if (shipRocketResponse.success && shipRocketResponse.data?.record && shipRocketResponse.data.record.length > 0) {
        shipData = shipRocketResponse.data.record[0]
      }

      return mapOrderToSupplierDetails(order, shipData, userType)
    },
    enabled: enabled && orderId !== null && orderId > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============================================================================
// Shipping Mutations
// ============================================================================

/**
 * Hook for creating a Shiprocket order.
 * 
 * Benefits:
 * - Optimistic updates
 * - Automatic invalidation of shipment queries
 */
export function useCreateShiprocketOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: any) => shippingService.createShiprocketOrder(payload),
    onSuccess: (response, variables) => {
      // Extract order_id from payload to invalidate the correct queries
      const orderId = variables.order_id
      
      if (orderId) {
        // Invalidate shipping for this specific order
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.shipping.byOrderId(orderId) 
        })
        // Force refetch of all matching queries (not just active ones)
        queryClient.refetchQueries({ 
          queryKey: queryKeys.shipping.byOrderId(orderId)
          // Removed 'type: active' to refetch all matching queries
        })
        
        // Invalidate shipping lists
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.shipping.list.all 
        })
        // Force refetch of all matching queries (not just active ones)
        queryClient.refetchQueries({ 
          queryKey: queryKeys.shipping.list.all
          // Removed 'type: active' to refetch all matching queries
        })
        
        // Invalidate insights
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.shipping.insights() 
        })
        // Force refetch of all matching queries (not just active ones)
        queryClient.refetchQueries({ 
          queryKey: queryKeys.shipping.insights()
          // Removed 'type: active' to refetch all matching queries
        })
      }
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to manually invalidate shipping queries.
 * Useful for refresh buttons or after external changes.
 */
export function useInvalidateShippingQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: (userType?: UserType) => {
      if (userType) {
        queryClient.invalidateQueries({ queryKey: queryKeys.shipping.list.byUserType(userType) })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.shipping.list.all })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.insights() })
    },
    invalidateList: (userType?: UserType) => {
      if (userType) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.shipping.list.byUserType(userType) 
        })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.shipping.list.all })
      }
    },
    invalidateInsights: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.shipping.insights() 
      })
    },
    invalidateShipment: (orderId: number, userType?: UserType) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.shipping.byOrderId(orderId, userType) 
      })
    },
  }
}

