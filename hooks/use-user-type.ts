'use client'

/**
 * Global UserType Hook using TanStack Query
 * 
 * This hook provides a centralized way to access the user type (seller/admin)
 * throughout the application using TanStack Query for global state management.
 * 
 * Benefits:
 * - Global state management via TanStack Query cache
 * - No direct localStorage access in components
 * - Automatic synchronization across components
 * - Type-safe with proper TypeScript types
 * - SSR-safe with proper window checks
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { userType, isLoading } = useUserType()
 *   
 *   if (isLoading) return <div>Loading...</div>
 *   if (!userType) return <div>Not authenticated</div>
 *   
 *   return <div>User type: {userType}</div>
 * }
 * ```
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserType, type UserType } from '@/lib/services/storage.service'
import { queryKeys } from '@/lib/query'

/**
 * Return type for useUserType hook
 */
export interface UseUserTypeReturn {
  /** The user type (seller or admin), null if not authenticated */
  userType: UserType | null
  /** Whether the query is loading */
  isLoading: boolean
  /** Whether the query is fetching in the background */
  isFetching: boolean
  /** Refetch the user type (useful after login/logout) */
  refetch: () => void
}

/**
 * Query function to get user type from storage
 * This is separate to allow for easy mocking in tests
 */
function fetchUserType(): UserType | null {
  return getUserType()
}

/**
 * Hook to get the current user type using TanStack Query
 * 
 * This hook caches the user type globally and synchronizes across all components.
 * The cache is automatically invalidated on login/logout through the auth system.
 * 
 * @returns {UseUserTypeReturn} Object containing userType and loading states
 */
export function useUserType(): UseUserTypeReturn {
  const queryClient = useQueryClient()

  const {
    data: userType,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: fetchUserType,
    // User type is stable - only changes on login/logout
    // We invalidate manually in those cases
    staleTime: Infinity,
    // Keep in cache forever while app is running
    gcTime: Infinity,
    // Don't refetch on mount - user type is stable
    refetchOnMount: false,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Always enabled - safe to run even on server (returns null)
    enabled: true,
    // Return null by default instead of undefined for better type safety
    placeholderData: null,
  })

  return {
    userType: userType ?? null,
    isLoading,
    isFetching,
    refetch: () => {
      refetch()
    },
  }
}

/**
 * Utility function to manually update the userType cache
 * Useful when userType changes (e.g., after login)
 * 
 * @param queryClient - TanStack Query client instance
 * @param userType - New user type to set in cache
 * 
 * @example
 * ```ts
 * const queryClient = useQueryClient()
 * setUserTypeCache(queryClient, 'admin')
 * ```
 */
export function setUserTypeCache(
  queryClient: any,
  userType: UserType | null
): void {
  queryClient.setQueryData(queryKeys.auth.user(), userType)
}

/**
 * Utility function to invalidate the userType cache
 * Useful when you want to force a refetch (e.g., after logout)
 * 
 * @param queryClient - TanStack Query client instance
 * 
 * @example
 * ```ts
 * const queryClient = useQueryClient()
 * invalidateUserTypeCache(queryClient)
 * ```
 */
export function invalidateUserTypeCache(queryClient: any): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() })
}

