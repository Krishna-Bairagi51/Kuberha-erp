'use client'

/**
 * Categories Management Query Hooks
 * 
 * TanStack Query powered category hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Automatic cache invalidation
 * - Type-safe category operations
 * - Reduced API calls through smart caching
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { categoriesManagementService, type UpdateCategoryRequest, type UpdateCategoryResponse } from '../services/categories-management.service'
import type { CategoryManagementResponse } from '../types/categories-management.types'

// Re-export queryKeys for convenience
export { queryKeys }

/**
 * React Query hook for fetching category management list
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 * - Automatic error handling and loading states
 */
export function useCategoryManagementQuery(enabled: boolean = true) {
  return useQuery<CategoryManagementResponse, Error>({
    queryKey: queryKeys.assetsManagement.categories.list(),
    queryFn: () => categoriesManagementService.getCategoryManagementList(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories are relatively stable
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false, // Don't refetch if data is still fresh
    refetchOnWindowFocus: false, // Prevent jarring refetches
    refetchOnReconnect: true, // Refetch when network reconnects
  })
}

/**
 * Hook to invalidate category management cache
 * Useful when you want to force a refetch (e.g., after adding/updating a category)
 */
export function useInvalidateCategoryManagement() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assetsManagement.categories.list() })
  }
}

/**
 * Hook for updating a category
 * 
 * Benefits:
 * - Automatic cache invalidation on success
 * - Error handling
 */
export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<UpdateCategoryResponse, Error, UpdateCategoryRequest>({
    mutationFn: (data: UpdateCategoryRequest) => 
      categoriesManagementService.updateCategory(data),
    onSuccess: () => {
      // Invalidate and refetch category list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assetsManagement.categories.list() 
      })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.assetsManagement.categories.list(),
        
      })
    },
  })
}

