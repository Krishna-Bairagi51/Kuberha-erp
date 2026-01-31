'use client'

/**
 * Color Code Query Hooks
 * 
 * TanStack Query powered color code hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Automatic cache invalidation
 * - Type-safe color code operations
 * - Reduced API calls through smart caching
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { colorManagementService } from '../services/color-management.service'
import type { 
  ColorCodeDashboardResponse,
  CreateColorCodeRequest,
  ColorCodeRecord,
} from '../types/color-management.types'

// Re-export queryKeys for convenience
export { queryKeys }

/**
 * React Query hook for fetching color code dashboard data
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 * - Automatic error handling and loading states
 */
export function useColorCodeDashboardQuery(enabled: boolean = true) {
  return useQuery<ColorCodeDashboardResponse, Error>({
    queryKey: queryKeys.assetsManagement.colors.dashboard(),
    queryFn: () => colorManagementService.getColorCodeDashboard(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - color codes are relatively stable
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false, // Don't refetch if data is still fresh
    refetchOnWindowFocus: false, // Prevent jarring refetches
    refetchOnReconnect: true, // Refetch when network reconnects
  })
}

/**
 * Hook to invalidate color code dashboard cache
 * Useful when you want to force a refetch (e.g., after adding/updating a color)
 */
export function useInvalidateColorCodeDashboard() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assetsManagement.colors.dashboard() })
  }
}

/**
 * React Query mutation hook for creating a new color code
 * 
 * Benefits:
 * - Optimistic updates for instant UI feedback
 * - Automatic cache invalidation on success
 * - Error handling and rollback
 */
export function useCreateColorCodeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateColorCodeRequest) => 
      colorManagementService.createColorCode(data),
    onMutate: async (newColor) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.assetsManagement.colors.dashboard() 
      })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<ColorCodeDashboardResponse>(
        queryKeys.assetsManagement.colors.dashboard()
      )

      // Optimistically update the cache with the new color
      // Generate a temporary ID (will be replaced by server response)
      const tempId = Date.now() // Temporary ID for optimistic update
      const optimisticColor: ColorCodeRecord = {
        id: tempId,
        name: newColor.name,
        code: newColor.code,
      }

      if (previousData) {
        queryClient.setQueryData<ColorCodeDashboardResponse>(
          queryKeys.assetsManagement.colors.dashboard(),
          {
            ...previousData,
            record: [...previousData.record, optimisticColor],
            count: previousData.count + 1,
          }
        )
      }

      // Return context with the previous value for rollback
      return { previousData }
    },
    onError: (error: any, newColor, context) => {
      // Rollback to previous value on error
      if (context?.previousData) {
        queryClient.setQueryData<ColorCodeDashboardResponse>(
          queryKeys.assetsManagement.colors.dashboard(),
          context.previousData
        )
      }
      // Error toast will be handled by the component calling the mutation
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure we have the latest data from server
      // This ensures the temporary ID is replaced with the real one
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assetsManagement.colors.dashboard() 
      })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.assetsManagement.colors.dashboard(),
        
      })
    },
  })
}

