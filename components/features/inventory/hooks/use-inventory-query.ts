'use client'

/**
 * Inventory Query Hooks
 * 
 * TanStack Query powered inventory hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Optimistic updates on mutations
 * - Automatic cache invalidation
 * - Type-safe inventory operations
 * - Reduced API calls through smart caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'

// Re-export queryKeys for convenience
export { queryKeys }
import { inventoryService } from '../services/inventory.service'
import { leadTimeService } from '../services/lead-time.service'
import type {
  ProductListResponse,
  AdminProductListResponse,
  ProductDetailsResponse,
  InventoryFormData,
  InventoryItemRequest,
  InventoryItemResponse,
  UpdateProductStatusResponse,
  UserType,
  PaginationParams,
} from '../types/inventory.types'
import type { LeadTimeTemplateResponse, LeadTimeTemplateApi } from '../services/lead-time.service'

// ============================================================================
// Product List Queries
// ============================================================================

/**
 * Hook for fetching seller product list.
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 * - Supports server-side pagination with page and limit params
 */
export function useSellerProductsQuery(pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.inventory.products.seller(pagination?.page, pagination?.limit, pagination?.search, pagination?.status),
    queryFn: () => inventoryService.getSellerProducts(pagination),
    // 5 minutes staleTime: data stays fresh for navigation, but invalidateQueries will properly trigger refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for fetching admin product list.
 * Supports server-side pagination with page and limit params.
 */
export function useAdminProductsQuery(pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.inventory.products.admin(pagination?.page, pagination?.limit, pagination?.search, pagination?.status, pagination?.vendor_id),
    queryFn: () => inventoryService.getAdminProducts(pagination),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Ensure queries refetch when they become active after being invalidated
    // This is important for updates - when user navigates back from edit form,
    // the query should refetch if it was invalidated (marked as stale)
    refetchOnMount: true, // Refetch on mount if data is stale (after invalidation)
  })
}

/**
 * Hook for fetching products by user type (seller or admin).
 * Supports server-side pagination with page and limit params.
 */
export function useProductsQuery(userType: UserType, pagination?: PaginationParams) {
  return useQuery({
    queryKey: userType === 'admin' 
      ? queryKeys.inventory.products.admin(pagination?.page, pagination?.limit, pagination?.search)
      : queryKeys.inventory.products.seller(pagination?.page, pagination?.limit, pagination?.search),
    queryFn: () => inventoryService.getProducts(userType, pagination),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook for fetching vendor-specific products (admin only).
 * Supports server-side pagination with page and limit params.
 */
export function useVendorProductsQuery(vendorId: number, enabled: boolean = true, pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.inventory.products.vendor(vendorId, pagination?.page, pagination?.limit, pagination?.search, pagination?.status, pagination?.category),
    queryFn: () => inventoryService.getVendorProducts(vendorId, pagination),
    enabled: enabled && vendorId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook for fetching vendor-specific pending products (draft/pending status).
 * This is separate from the main vendor products query to ensure pending items
 * are always visible regardless of filters applied to the main table.
 * Supports server-side pagination with page, limit, and search params.
 */
export function useVendorPendingProductsQuery(vendorId: number, enabled: boolean = true, pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.inventory.products.vendorPending(vendorId, pagination?.page, pagination?.limit, pagination?.search),
    queryFn: () => inventoryService.getVendorPendingProducts(vendorId, pagination),
    enabled: enabled && vendorId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook for fetching draft products.
 * Supports server-side pagination with page, limit, and search params.
 */
export function useDraftProductsQuery(pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.inventory.products.draft(pagination?.page, pagination?.limit, pagination?.search),
    queryFn: () => inventoryService.getDraftProducts(pagination),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook for fetching admin draft products (pending approvals).
 * Uses /get_all_product_list with hardcoded status=draft.
 * Supports server-side pagination with page, limit, and search params.
 * 
 * Benefits:
 * - Server-side filtering by draft status
 * - Server-side search and pagination
 * - Instant data from cache on navigation (pages 1→2→3→4→5 then back 5→4→3→2→1)
 * - Only table body re-renders on data updates
 * - Minimal network requests through smart caching
 */
export function useAdminDraftProductsQuery(pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.inventory.products.adminDraft(pagination?.page, pagination?.limit, pagination?.search),
    queryFn: () => inventoryService.getAdminDraftProducts(pagination),
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for navigation
    gcTime: 30 * 60 * 1000, // 30 minutes - keep cached pages for longer
  })
}

// ============================================================================
// Product Details Queries
// ============================================================================

/**
 * Hook for fetching product details by ID.
 * 
 * Benefits:
 * - Individual product caching - each product cached separately
 * - Instant navigation when product was previously viewed
 */
export function useProductDetailsQuery(productId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: productId ? queryKeys.inventory.product.detail(productId) : ['inventory', 'product', 'detail', 'disabled'],
    queryFn: () => {
      if (!productId) throw new Error('Product ID is required')
      return inventoryService.getProductDetails(productId)
    },
    enabled: enabled && productId !== null && productId > 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000,
  })
}

// ============================================================================
// Form Data Queries
// ============================================================================

/**
 * Hook for fetching inventory form data (categories, UOM, taxes, etc.).
 * 
 * Benefits:
 * - Long cache time - this data rarely changes
 * - Shared across all forms - single source of truth
 * - Prevents redundant API calls
 */
export function useInventoryFormDataQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.formData(),
    queryFn: () => inventoryService.fetchInventoryFormData(),
    staleTime: 5 * 60 * 1000, // only refetch when explicitly invalidated
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook for fetching ecom categories.
 */
export function useEcomCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.categories.ecom(),
    queryFn: () => inventoryService.getEcomCategories(),
    staleTime: 5 * 60 * 1000, // only refetch when invalidated
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// ============================================================================
// Supplier/Vendor Queries
// ============================================================================

/**
 * Hook for fetching supplier list (admin only).
 * Supports server-side pagination with page and limit params.
 */
export function useSupplierListQuery(pagination?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.inventory.suppliers.list(pagination?.page, pagination?.limit, pagination?.search),
    queryFn: () => inventoryService.getSupplierList(pagination),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  })
}

// ============================================================================
// Lead Time Queries
// ============================================================================

/**
 * Hook for fetching lead time templates.
 */
export function useLeadTimeTemplatesQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.leadTime.templates(),
    queryFn: () => leadTimeService.getLeadTimeTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ============================================================================
// Product Mutations
// ============================================================================

/**
 * Hook for adding a new inventory item.
 * 
 * Benefits:
 * - Optimistic cache updates
 * - Automatic invalidation of product lists
 * - Explicit refetch to ensure UI updates immediately
 */
export function useAddInventoryItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InventoryItemRequest) => inventoryService.addInventoryItem(data),
    onSuccess: () => {
      // Invalidate all product list queries (this marks them as stale)
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products.all })
      
      // Force refetch of all matching queries (not just active ones)
      // This ensures the inventory table updates even if it wasn't mounted during the mutation
      queryClient.refetchQueries({ 
        queryKey: queryKeys.inventory.products.all
        // Removed 'type: active' to refetch all matching queries
      })
      
      // Also invalidate form data in case categories were added
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.formData() })
    },
  })
}

/**
 * Hook for updating an existing inventory item.
 * 
 * Benefits:
 * - Optimistic updates for instant UI feedback
 * - Selective cache updates
 */
export function useUpdateInventoryItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: InventoryItemRequest }) => {
      return inventoryService.updateInventoryItem(productId, data)
    },
    onSuccess: (response, variables) => {
      // Invalidate the specific product detail query
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.inventory.product.detail(variables.productId)
      })
      
      // Also update cache optimistically for immediate UI update
      queryClient.setQueryData(
        queryKeys.inventory.product.detail(variables.productId),
        response
      )
      
      // Invalidate all product list queries (this marks them as stale)
      // This will cause them to refetch when they become active again
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products.all })
      
      // Force refetch of all matching queries (not just active ones)
      // This ensures the inventory table updates even if it wasn't mounted during the mutation
      queryClient.refetchQueries({ 
        queryKey: queryKeys.inventory.products.all
        // Removed 'type: active' to refetch all matching queries, not just active ones
      })
      
      // Invalidate form data in case categories were modified
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.formData() })
    },
  })
}

/**
 * Hook for updating product status (approve/reject).
 */
export function useUpdateProductStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, status, rejectReason }: { productId: number; status: string; rejectReason?: string }) =>
      inventoryService.updateProductStatus(productId, status, rejectReason),
    onSuccess: (response, variables) => {
      // Invalidate the specific product
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.inventory.product.detail(variables.productId) 
      })
      
      // Invalidate all product list queries (this marks them as stale)
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products.all })
      
      // Force refetch of all matching queries (not just active ones)
      // This ensures the inventory table updates even if it wasn't mounted during the mutation
      queryClient.refetchQueries({ 
        queryKey: queryKeys.inventory.products.all
        // Removed 'type: active' to refetch all matching queries, not just active ones
      })
    },
  })
}

/**
 * Hook for deleting a vendor product request record (draft items only).
 * 
 * Benefits:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Proper cache invalidation
 */
export function useDeleteVendorProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: number) => inventoryService.deleteVendorProductRequest(productId),
    // Optimistic update: remove product from cache immediately
    onMutate: async (productId) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory.products.all })
      
      // Snapshot the previous value
      const previousSellerProducts = queryClient.getQueryData(queryKeys.inventory.products.seller())
      const previousAdminProducts = queryClient.getQueryData(queryKeys.inventory.products.admin())
      const previousDraftProducts = queryClient.getQueryData(queryKeys.inventory.products.draft())
      
      // Optimistically update seller products
      queryClient.setQueryData(queryKeys.inventory.products.seller(), (old: any) => {
        if (!old?.record) return old
        return {
          ...old,
          record: old.record.filter((item: any) => item.id !== productId),
          count: (old.count || 0) - 1,
        }
      })
      
      // Optimistically update admin products
      queryClient.setQueryData(queryKeys.inventory.products.admin(), (old: any) => {
        if (!old?.record) return old
        return {
          ...old,
          record: old.record.filter((item: any) => item.id !== productId),
          count: (old.count || 0) - 1,
        }
      })
      
      // Optimistically update draft products
      queryClient.setQueryData(queryKeys.inventory.products.draft(), (old: any) => {
        if (!old?.record) return old
        return {
          ...old,
          record: old.record.filter((item: any) => item.id !== productId),
          count: (old.count || 0) - 1,
        }
      })
      
      // Return context with snapshot for rollback
      return { previousSellerProducts, previousAdminProducts, previousDraftProducts }
    },
    // On error, rollback to previous state
    onError: (err, productId, context) => {
      if (context?.previousSellerProducts) {
        queryClient.setQueryData(queryKeys.inventory.products.seller(), context.previousSellerProducts)
      }
      if (context?.previousAdminProducts) {
        queryClient.setQueryData(queryKeys.inventory.products.admin(), context.previousAdminProducts)
      }
      if (context?.previousDraftProducts) {
        queryClient.setQueryData(queryKeys.inventory.products.draft(), context.previousDraftProducts)
      }
    },
    // Always invalidate and refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products.all })
      // Force refetch of all matching queries (not just active ones)
      queryClient.refetchQueries({ 
        queryKey: queryKeys.inventory.products.all
        // Removed 'type: active' to refetch all matching queries
      })
    },
  })
}

// ============================================================================
// Lead Time Mutations
// ============================================================================

/**
 * Hook for creating a lead time template.
 */
export function useCreateLeadTimeTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      name: string
      manufacture_lead_time: Array<{
        start_qty: number
        end_qty: number
        lead_time: number
        lead_time_unit: string
      }>
    }) => leadTimeService.createLeadTimeTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.leadTime.templates() })
    },
  })
}

/**
 * Hook for deleting a lead time template.
 */
export function useDeleteLeadTimeTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => leadTimeService.deleteLeadTimeTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.leadTime.templates() })
    },
  })
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Hook for creating bulk product records.
 */
export function useCreateBulkProductRecordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (products: any[]) => inventoryService.createBulkProductRecord(products),
    onSuccess: () => {
      // Invalidate all product list queries (this marks them as stale)
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products.all })
      
      // Force refetch of all matching queries (not just active ones)
      // This ensures the inventory table updates even if it wasn't mounted during the mutation
      queryClient.refetchQueries({ 
        queryKey: queryKeys.inventory.products.all
        // Removed 'type: active' to refetch all matching queries
      })
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to manually invalidate inventory queries.
 * Useful for refresh buttons or after external changes.
 */
export function useInvalidateInventoryQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all })
    },
    invalidateProducts: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products.all })
    },
    invalidateProduct: (productId: number) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.inventory.product.detail(productId) 
      })
    },
    invalidateFormData: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.formData() })
    },
    invalidateSuppliers: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.suppliers.all })
    },
  }
}