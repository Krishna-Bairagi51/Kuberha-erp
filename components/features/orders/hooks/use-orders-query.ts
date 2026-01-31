'use client'

/**
 * Orders Query Hooks
 * 
 * TanStack Query powered orders hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Optimistic updates on mutations
 * - Automatic cache invalidation
 * - Type-safe order operations
 * - Reduced API calls through smart caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { ordersService } from '../services/orders.service'
import { shippingService } from '@/components/features/shipping/services/shipping.service'
import { qcService } from '@/components/features/qc/services/qc.service'
import type {
  Order,
  OrderHistoryResult,
  OrderSummary,
  UserType,
  PaginationParams,
  SellerNameItem,
} from '../types/orders.types'

// ============================================================================
// Order History Queries
// ============================================================================

/**
 * Hook for fetching seller order history.
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 * - Supports server-side pagination with page and limit params
 */
export function useSellerOrderHistoryQuery(pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.orders.history.seller(pagination?.page, pagination?.limit, pagination?.search, pagination?.status, pagination?.vendor_id),
    queryFn: async () => {
      const result = await ordersService.getSellerOrderHistory(pagination)
      if (result.status_code === 200 && Array.isArray(result.record)) {
        return {
          orders: result.record,
          totalCount: result.total_count || result.count || result.record.length,
          totalRecordCount: result.total_record_count,
        } as OrderHistoryResult
      }
      throw new Error('Invalid data format received from server')
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Ensure queries refetch when they become active after being invalidated
    refetchOnMount: true, // Refetch on mount if data is stale (after invalidation)
  })
}

/**
 * Hook for fetching admin order history.
 * Supports server-side pagination with page and limit params
 */
export function useAdminOrderHistoryQuery(pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.orders.history.admin(pagination?.page, pagination?.limit, pagination?.search, pagination?.status, pagination?.vendor_id),
    queryFn: async () => {
      const result = await ordersService.getAdminOrderHistory(pagination)
      if (result.status_code === 200 && Array.isArray(result.record)) {
        // Convert AdminSaleOrderItem[] to Order[] for compatibility
        const convertedOrders: Order[] = result.record.map((adminOrder) => ({
          ...adminOrder,
          activity_log: adminOrder.activity_log.map(log => ({
            type: log.type,
            note: log.note,
            qc_status: (log as any).qc_status,
            approved_by: log.approved_by,
            created_by: log.created_by,
            created_on: log.created_on,
            image: log.image
          }))
        }))
        
        return {
          orders: convertedOrders,
          totalCount: result.total_count || result.record.length,
          totalRecordCount: result.total_record_count,
        } as OrderHistoryResult
      }
      throw new Error('Invalid data format received from server')
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Ensure queries refetch when they become active after being invalidated
    refetchOnMount: true, // Refetch on mount if data is stale (after invalidation)
  })
}

/**
 * Hook for fetching order history by user type (seller or admin).
 * Supports server-side pagination with page and limit params
 */
export function useOrderHistoryQuery(userType: UserType, enabled: boolean = true, pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.orders.history.byUserType(userType, pagination?.page, pagination?.limit, pagination?.search, pagination?.status, pagination?.vendor_id),
    queryFn: () => ordersService.fetchOrderHistory(userType, pagination),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Ensure queries refetch when they become active after being invalidated
    refetchOnMount: true, // Refetch on mount if data is stale (after invalidation)
  })
}

/**
 * Hook for fetching NEW ORDERS ONLY (status=new) for seller.
 * This is a separate query resource from the main order history.
 * Hardcodes status='new' parameter in the API call.
 * 
 * Benefits:
 * - Independent caching from All Orders table
 * - No interference between New Orders and All Orders tables
 * - Server-side filtering by status
 */
export function useNewOrdersQuery(userType: UserType, enabled: boolean = true, pagination?: PaginationParams) {
  // Ensure page and limit have defaults for initial load
  const queryParams: PaginationParams = {
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 10,
    search: pagination?.search,
    status: 'new' // Hardcode status='new' - this makes it a completely separate API resource
  }
  
  return useQuery({
    queryKey: queryKeys.orders.history.byUserType(userType, queryParams.page, queryParams.limit, queryParams.search, 'new'),
    queryFn: () => ordersService.fetchOrderHistory(userType, queryParams),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Ensure queries refetch when they become active after being invalidated
    refetchOnMount: true, // Refetch on mount if data is stale (after invalidation)
  })
}

// ============================================================================
// Order Summary Queries
// ============================================================================

/**
 * Hook for fetching seller order summary.
 */
export function useSellerOrderSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.orders.summary.seller(),
    queryFn: async () => {
      const result = await ordersService.getSellerOrderSummary()
      if (result.status_code === 200 && result.record) {
        return result.record as OrderSummary
      }
      throw new Error('Failed to fetch order summary')
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for fetching admin order summary.
 */
export function useAdminOrderSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.orders.summary.admin(),
    queryFn: async () => {
      const result = await ordersService.getAdminOrderSummary()
      if (result.status_code === 200 && result.record) {
        return result.record as OrderSummary
      }
      throw new Error('Failed to fetch order summary')
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for fetching order summary by user type (seller or admin).
 */
export function useOrderSummaryQuery(userType: UserType, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.orders.summary.byUserType(userType),
    queryFn: () => ordersService.fetchOrderSummary(userType),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ============================================================================
// Seller Name List Queries
// ============================================================================

/**
 * Hook for fetching seller name list.
 * Returns array of seller objects with id and name.
 */
export function useSellerNameListQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.orders.sellerNameList(),
    queryFn: async () => {
      const result = await ordersService.getSellerNameList()
      if (result.status_code === 200 && Array.isArray(result.record)) {
        return result.record as SellerNameItem[]
      }
      throw new Error('Invalid data format received from server')
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - seller names don't change frequently
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// ============================================================================
// Order Detail Queries
// ============================================================================


/**
 * Hook for fetching order details by ID and user type.
 */
export function useOrderDetailQuery(orderId: number | null, userType: UserType, enabled: boolean = true) {
  return useQuery({
    queryKey: orderId ? queryKeys.orders.detail.byId(orderId, userType) : ['orders', 'detail', 'disabled'],
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return ordersService.fetchOrderDetails(orderId, userType)
    },
    enabled: enabled && orderId !== null && orderId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to manually invalidate order queries.
 * Useful for refresh buttons or after external changes.
 */
export function useInvalidateOrdersQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: (userType: UserType) => {
      // Targeted invalidation - do NOT use queryKeys.orders.all
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.history.byUserType(userType) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary.byUserType(userType) })
      // Do NOT invalidate individual order details - they stay cached
    },
    invalidateHistory: (userType?: UserType) => {
      if (userType) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.orders.history.byUserType(userType) 
        })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.history.all })
      }
    },
    invalidateNewOrders: (userType: UserType) => {
      // Invalidate only new orders query (status='new')
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.history.byUserType(userType, undefined, undefined, undefined, 'new') 
      })
    },
    invalidateSummary: (userType?: UserType) => {
      if (userType) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.orders.summary.byUserType(userType) 
        })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary.all })
      }
    },
    invalidateOrder: (orderId: number, userType: UserType) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.detail.byId(orderId, userType) 
      })
    },
  }
}

// ============================================================================
// Shipping Queries
// ============================================================================

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
      return await shippingService.getShipmentByOrderId(orderId, userType)
    },
    enabled: enabled && orderId !== null && orderId > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes - shipping data changes more frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

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
      }
      
      // Do NOT invalidate order details or history - shipment creation
      // doesn't change order status, only adds shipping data
    },
  })
}

// ============================================================================
// QC Mutations
// ============================================================================

/**
 * Hook for updating process status (manufacturing/packaging).
 * 
 * Benefits:
 * - Optimistic UI updates
 * - Targeted cache invalidation (no over-invalidation)
 */
export function useUpdateProcessStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { order_line_id: number; type: string; orderId: number; userType: UserType }) => 
      qcService.updateProcessStatus(data),
    onSuccess: (response, variables) => {
      // TARGETED invalidation - only affected order and lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.history.byUserType(variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.history.byUserType(variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.summary.byUserType(variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.summary.byUserType(variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      // Invalidate ALL QC queries - both list and insights
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.list() })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.qc.list()
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.insights() })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.qc.insights()
        // Removed 'type: active' to refetch all matching queries
      })
    },
  })
}

/**
 * Hook for updating process status with images (QC submission).
 * 
 * Benefits:
 * - Handles QC submissions with images
 * - Targeted cache invalidation (no over-invalidation)
 */
export function useUpdateProcessStatusWithImagesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      order_line_id: number
      type: string
      images: File[]
      note?: string
      orderId: number
      userType: UserType
    }) => qcService.updateProcessStatusWithImages(data),
    onSuccess: (response, variables) => {
      // TARGETED invalidation - only affected order and lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.history.byUserType(variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.history.byUserType(variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.summary.byUserType(variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.summary.byUserType(variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      // Invalidate ALL QC queries - both list and insights
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.list() })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.qc.list()
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.insights() })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.qc.insights()
        // Removed 'type: active' to refetch all matching queries
      })
    },
  })
}

/**
 * Hook for approving QC.
 * Admin action - invalidates order details, lists, and QC queries
 * Includes optimistic updates for instant UI feedback
 */
export function useApproveQCMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      qcId, 
      qcType, 
      userType, 
      orderId, 
      orderLineId 
    }: { 
      qcId: number
      qcType: string
      userType: UserType
      orderId: number
      orderLineId: number
    }) => qcService.approveQC(qcId, qcType),
    // Optimistic update - immediately update the UI
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType) 
      })

      // Snapshot the previous value
      const previousOrderData = queryClient.getQueryData<Order>(
        queryKeys.orders.detail.byId(variables.orderId, variables.userType)
      )

      // Optimistically update the order data
      if (previousOrderData) {
        const updatedOrder = { ...previousOrderData }
        
        // Find and update the order line
        if (updatedOrder.order_line) {
          updatedOrder.order_line = updatedOrder.order_line.map(line => {
            if (line.order_line_id === variables.orderLineId) {
              const updatedLine = { ...line }
              
              // Update the appropriate QC status
              if (variables.qcType === 'mfg_qc' || variables.qcType === 'mfg') {
                updatedLine.mfg_qc_status = 'approved'
                // Update QC data status if it exists
                if (updatedLine.mfg_qc_data && updatedLine.mfg_qc_data.length > 0) {
                  updatedLine.mfg_qc_data = updatedLine.mfg_qc_data.map(qc => ({
                    ...qc,
                    qc_status: 'approved'
                  }))
                }
              } else if (variables.qcType === 'pkg_qc' || variables.qcType === 'pkg' || variables.qcType === 'packaging') {
                updatedLine.packaging_qc_status = 'approved'
                // Update QC data status if it exists
                if (updatedLine.packaging_qc_data && updatedLine.packaging_qc_data.length > 0) {
                  updatedLine.packaging_qc_data = updatedLine.packaging_qc_data.map(qc => ({
                    ...qc,
                    qc_status: 'approved'
                  }))
                }
              }
              
              return updatedLine
            }
            return line
          })
        }

        // Update the cache with optimistic data
        queryClient.setQueryData<Order>(
          queryKeys.orders.detail.byId(variables.orderId, variables.userType),
          updatedOrder
        )
      }

      // Return context with previous data for rollback
      return { previousOrderData }
    },
    // If mutation fails, rollback to previous data
    onError: (err, variables, context) => {
      if (context?.previousOrderData) {
        queryClient.setQueryData<Order>(
          queryKeys.orders.detail.byId(variables.orderId, variables.userType),
          context.previousOrderData
        )
      }
    },
    // Always refetch after success or error to ensure consistency
    onSuccess: (response, variables) => {
      // Invalidate order detail to refetch fresh data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      // Invalidate order history lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.history.byUserType(variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.history.byUserType(variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.summary.byUserType(variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.summary.byUserType(variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      // Invalidate ALL QC queries - both list and insights
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.list() })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.qc.list()
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.insights() })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.qc.insights()
        // Removed 'type: active' to refetch all matching queries
      })
    },
  })
}

/**
 * Hook for rejecting QC.
 * Admin action - invalidates order details, lists, and QC queries
 * Includes optimistic updates for instant UI feedback
 */
export function useRejectQCMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      qcId, 
      qcType, 
      rejectionReason,
      userType,
      orderId,
      orderLineId
    }: { 
      qcId: number
      qcType: string
      rejectionReason: string
      userType: UserType
      orderId: number
      orderLineId: number
    }) => qcService.rejectQC(qcId, qcType, rejectionReason),
    // Optimistic update - immediately update the UI
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType) 
      })

      // Snapshot the previous value
      const previousOrderData = queryClient.getQueryData<Order>(
        queryKeys.orders.detail.byId(variables.orderId, variables.userType)
      )

      // Optimistically update the order data
      if (previousOrderData) {
        const updatedOrder = { ...previousOrderData }
        
        // Find and update the order line
        if (updatedOrder.order_line) {
          updatedOrder.order_line = updatedOrder.order_line.map(line => {
            if (line.order_line_id === variables.orderLineId) {
              const updatedLine = { ...line }
              
              // Update the appropriate QC status
              if (variables.qcType === 'mfg_qc' || variables.qcType === 'mfg') {
                updatedLine.mfg_qc_status = 'rejected'
                // Update QC data status if it exists
                if (updatedLine.mfg_qc_data && updatedLine.mfg_qc_data.length > 0) {
                  updatedLine.mfg_qc_data = updatedLine.mfg_qc_data.map(qc => ({
                    ...qc,
                    qc_status: 'rejected'
                  }))
                }
              } else if (variables.qcType === 'pkg_qc' || variables.qcType === 'pkg' || variables.qcType === 'packaging') {
                updatedLine.packaging_qc_status = 'rejected'
                // Update QC data status if it exists
                if (updatedLine.packaging_qc_data && updatedLine.packaging_qc_data.length > 0) {
                  updatedLine.packaging_qc_data = updatedLine.packaging_qc_data.map(qc => ({
                    ...qc,
                    qc_status: 'rejected'
                  }))
                }
              }
              
              return updatedLine
            }
            return line
          })
        }

        // Update the cache with optimistic data
        queryClient.setQueryData<Order>(
          queryKeys.orders.detail.byId(variables.orderId, variables.userType),
          updatedOrder
        )
      }

      // Return context with previous data for rollback
      return { previousOrderData }
    },
    // If mutation fails, rollback to previous data
    onError: (err, variables, context) => {
      if (context?.previousOrderData) {
        queryClient.setQueryData<Order>(
          queryKeys.orders.detail.byId(variables.orderId, variables.userType),
          context.previousOrderData
        )
      }
    },
    // Always refetch after success or error to ensure consistency
    onSuccess: (response, variables) => {
      // Invalidate order detail to refetch fresh data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.detail.byId(variables.orderId, variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      // Invalidate order history lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.history.byUserType(variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.history.byUserType(variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.summary.byUserType(variables.userType) 
      })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.orders.summary.byUserType(variables.userType)
        // Removed 'type: active' to refetch all matching queries
      })
      
      // Invalidate ALL QC queries - both list and insights
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.list() })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.qc.list()
        // Removed 'type: active' to refetch all matching queries
      })
      
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.insights() })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.qc.insights()
        // Removed 'type: active' to refetch all matching queries
      })
    },
  })
}
