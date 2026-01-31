'use client'

/**
 * Supplier Details Query Hooks
 * 
 * TanStack Query powered supplier hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Optimistic updates on mutations
 * - Automatic cache invalidation
 * - Type-safe supplier operations
 * - Reduced API calls through smart caching
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { supplierService } from '../services/supplier.service'
import type {
  SupplierListResponse,
  SupplierDetailResponse,
  UpdateSupplierStateResponse,
  StatesResponse,
  SupplierListItem,
  SupplierDetail,
  PaginationParams,
} from '../types/supplier.types'
import type { CreateSellerRequest, CreateSellerResponse } from '../services/supplier.service'

// ============================================================================
// Supplier List Queries
// ============================================================================

/**
 * Hook for fetching the complete supplier list (admin only).
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 * - Supports server-side pagination with page and limit params
 */
export function useSupplierListQuery(
  options?: { enabled?: boolean },
  pagination?: PaginationParams
) {
  return useQuery({
    queryKey: queryKeys.supplier.list(pagination?.page, pagination?.limit, pagination?.search, pagination?.status),
    queryFn: async () => {
      const result = await supplierService.getSupplierList(pagination)
      if (result.status_code === 200 && Array.isArray(result.record)) {
        return result as SupplierListResponse
      }
      throw new Error(result.message || 'Failed to fetch supplier list')
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary calls
    // Keep previous page data visible while fetching new page
    // This provides smooth pagination transitions and prevents table from going empty
    placeholderData: keepPreviousData,
  })
}

// ============================================================================
// Supplier Detail Queries
// ============================================================================

/**
 * Hook for fetching supplier details by ID (admin only).
 * 
 * Benefits:
 * - Cached per supplier ID
 * - Instant display when switching between suppliers
 * - No loading spinner on revisit
 */
export function useSupplierDetailQuery(
  supplierId: string | number | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: supplierId 
      ? queryKeys.supplier.detail.byId(supplierId) 
      : ['supplier', 'detail', 'disabled'],
    queryFn: async () => {
      if (!supplierId) throw new Error('Supplier ID is required')
      const result = await supplierService.getSupplierById(String(supplierId))
      if (result.status_code === 200 && result.record?.length > 0) {
        return {
          ...result,
          supplier: result.record[0],
        } as SupplierDetailResponse & { supplier: SupplierDetail }
      }
      throw new Error(result.message || 'Failed to fetch supplier details')
    },
    enabled: (options?.enabled ?? true) && supplierId !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ============================================================================
// States Query
// ============================================================================

/**
 * Hook for fetching list of all states.
 * 
 * Benefits:
 * - Cached indefinitely - states rarely change
 * - Shared across all forms needing state selection
 */
export function useStatesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.supplier.states(),
    queryFn: async () => {
      const result = await supplierService.getStates()
      if (result.status_code === 200 && Array.isArray(result.record)) {
        return result as StatesResponse
      }
      throw new Error('Failed to fetch states')
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// ============================================================================
// Supplier Mutations
// ============================================================================

/**
 * Hook for updating supplier state (admin only).
 * 
 * Benefits:
 * - Optimistic updates for instant UI feedback
 * - Automatic invalidation of supplier list and detail queries
 * - Proper error handling and rollback
 */
export function useUpdateSupplierStateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      supplierId, 
      state 
    }: { 
      supplierId: string | number
      state: string 
    }) => {
      const result = await supplierService.updateSupplierState(supplierId, state)
      if (result.status_code !== 200) {
        throw new Error(result.message || 'Failed to update supplier state')
      }
      return result as UpdateSupplierStateResponse
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch supplier list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplier.list() 
      })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.supplier.list(),
        
      })
      
      // Invalidate and refetch specific supplier detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplier.detail.byId(variables.supplierId) 
      })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.supplier.detail.byId(variables.supplierId),
        
      })
    },
  })
}

/**
 * Hook for generating vendor agreement (admin only).
 * 
 * Benefits:
 * - Handles agreement generation
 * - Automatic invalidation of supplier detail to show new agreement URL
 */
export function useGenerateVendorAgreementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      vendorId, 
      commission 
    }: { 
      vendorId: string | number
      commission?: string | number 
    }) => {
      const result = await supplierService.generateVendorAgreement(vendorId, commission)
      if (result.status_code !== 200) {
        throw new Error(result.message || 'Failed to generate vendor agreement')
      }
      return result
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch supplier detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplier.detail.byId(variables.vendorId) 
      })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.supplier.detail.byId(variables.vendorId),
        
      })
      
      // Also invalidate and refetch list in case agreement URL is shown there
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplier.list() 
      })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.supplier.list(),
        
      })
    },
  })
}

/**
 * Hook for creating a new seller/supplier (admin only).
 * 
 * Benefits:
 * - Automatic invalidation of supplier list after creation
 * - Type-safe payload with CreateSellerRequest
 */
export function useCreateSellerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSellerRequest) => {
      const result = await supplierService.createSeller(data)
      if (result.status_code !== 200) {
        throw new Error(result.message || 'Failed to create seller')
      }
      return result as CreateSellerResponse
    },
    onSuccess: () => {
      // Invalidate and refetch supplier list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplier.list() 
      })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.supplier.list(),
        
      })
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to manually invalidate supplier queries.
 * Useful for refresh buttons or after external changes.
 */
export function useInvalidateSupplierQueries() {
  const queryClient = useQueryClient()

  return {
    /**
     * Invalidate all supplier queries
     */
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supplier.all })
    },
    
    /**
     * Invalidate supplier list only
     */
    invalidateList: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supplier.list() })
    },
    
    /**
     * Invalidate specific supplier detail
     */
    invalidateDetail: (supplierId: string | number) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplier.detail.byId(supplierId) 
      })
    },
    
    /**
     * Invalidate all supplier details
     */
    invalidateAllDetails: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplier.detail.all 
      })
    },
    
    /**
     * Invalidate states query
     */
    invalidateStates: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supplier.states() })
    },
  }
}

/**
 * Hook to get cached supplier data without triggering a fetch.
 * Useful for optimistic UI updates or checking cache state.
 */
export function useCachedSupplierData() {
  const queryClient = useQueryClient()

  return {
    /**
     * Get cached supplier list
     */
    getSupplierList: (): SupplierListResponse | undefined => {
      return queryClient.getQueryData(queryKeys.supplier.list())
    },
    
    /**
     * Get cached supplier detail
     */
    getSupplierDetail: (supplierId: string | number): SupplierDetailResponse | undefined => {
      return queryClient.getQueryData(queryKeys.supplier.detail.byId(supplierId))
    },
    
    /**
     * Get cached states
     */
    getStates: (): StatesResponse | undefined => {
      return queryClient.getQueryData(queryKeys.supplier.states())
    },
    
    /**
     * Set supplier list in cache (useful for optimistic updates)
     */
    setSupplierList: (data: SupplierListResponse) => {
      queryClient.setQueryData(queryKeys.supplier.list(), data)
    },
    
    /**
     * Set supplier detail in cache (useful for optimistic updates)
     */
    setSupplierDetail: (supplierId: string | number, data: SupplierDetailResponse) => {
      queryClient.setQueryData(queryKeys.supplier.detail.byId(supplierId), data)
    },
  }
}

/**
 * Hook for prefetching supplier data.
 * Useful for preloading data on hover or predictive navigation.
 */
export function usePrefetchSupplier() {
  const queryClient = useQueryClient()

  return {
    /**
     * Prefetch supplier detail
     */
    prefetchSupplierDetail: async (supplierId: string | number) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.supplier.detail.byId(supplierId),
        queryFn: async () => {
          const result = await supplierService.getSupplierById(String(supplierId))
          if (result.status_code === 200 && result.record?.length > 0) {
            return {
              ...result,
              supplier: result.record[0],
            } as SupplierDetailResponse & { supplier: SupplierDetail }
          }
          throw new Error(result.message || 'Failed to fetch supplier details')
        },
      })
    },
    
    /**
     * Prefetch supplier list
     */
    prefetchSupplierList: async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.supplier.list(),
        queryFn: async () => {
          const result = await supplierService.getSupplierList()
          if (result.status_code === 200 && Array.isArray(result.record)) {
            return result as SupplierListResponse
          }
          throw new Error(result.message || 'Failed to fetch supplier list')
        },
      })
    },
    
    /**
     * Prefetch states
     */
    prefetchStates: async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.supplier.states(),
        queryFn: async () => {
          const result = await supplierService.getStates()
          if (result.status_code === 200 && Array.isArray(result.record)) {
            return result as StatesResponse
          }
          throw new Error('Failed to fetch states')
        },
      })
    },
  }
}

