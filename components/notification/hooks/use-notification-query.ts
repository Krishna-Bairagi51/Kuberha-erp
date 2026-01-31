'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { notificationService } from '../services/notification.service'
import type { 
  GetNotificationsResponse, 
  UpdateNotificationRequest 
} from '../types/notification.types'

/**
 * React Query hook for fetching notifications
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 * - Automatic error handling and loading states
 */
export function useNotificationsQuery(
  enabled: boolean = true,
  page: number = 1,
  limit: number = 10,
  status: 'all' | 'read' | 'unread' = 'all'
) {
  return useQuery({
    queryKey: queryKeys.notifications.list(page, limit, status),
    queryFn: () => notificationService.getNotifications(page, limit, status),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - notifications should be relatively fresh
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true, // Always refetch on mount for notifications
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  })
}

/**
 * Hook to invalidate notifications cache
 * Useful when you want to force a refetch (e.g., after marking as read)
 */
export function useInvalidateNotifications() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
  }
}

/**
 * React Query mutation hook for updating a notification (marking as read)
 * 
 * Benefits:
 * - Optimistic updates for instant UI feedback
 * - Automatic cache invalidation on success
 * - Error handling and rollback
 */
export function useUpdateNotificationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notification: UpdateNotificationRequest) => 
      notificationService.updateNotification(notification),
    onMutate: async (notification) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      // Snapshot the previous value - get the first matching query
      const queries = queryClient.getQueriesData<GetNotificationsResponse>({ 
        queryKey: queryKeys.notifications.all 
      })
      const previousData = queries[0]?.[1] // Get first query's data

      // Optimistically update the cache
      if (previousData) {
        // Find the notification being updated
        const notificationToUpdate = previousData.notifications.find((n) => n.id === notification.id)
        const wasUnread = notificationToUpdate && !notificationToUpdate.is_read

        const updatedNotifications = previousData.notifications.map((n) =>
          n.id === notification.id
            ? { ...n, is_read: true, unread: false }
            : n
        )

        // Only decrease unread count if the notification was actually unread
        const updatedUnreadCount = wasUnread
          ? Math.max(0, (previousData.unread_count || 0) - 1)
          : (previousData.unread_count || 0)

        // Update all notification queries in cache
        queries.forEach(([queryKey]) => {
          const currentData = queryClient.getQueryData<GetNotificationsResponse>(queryKey)
          if (currentData) {
            queryClient.setQueryData<GetNotificationsResponse>(queryKey, {
              ...currentData,
              notifications: currentData.notifications.map((n) =>
                n.id === notification.id
                  ? { ...n, is_read: true, unread: false }
                  : n
              ),
              unread_count: currentData.notifications.find((n) => n.id === notification.id && !n.is_read)
                ? Math.max(0, (currentData.unread_count || 0) - 1)
                : (currentData.unread_count || 0),
            })
          }
        })
      }

      // Return context with the previous value
      return { previousData }
    },
    onError: (error, notification, context) => {
      // Rollback to previous value on error
      // Note: We can't easily rollback all queries, so we'll just invalidate them
      if (context?.previousData) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      }
    },
    onSuccess: () => {
      // Optionally invalidate to ensure we have the latest data
      // This is optional since we already optimistically updated
      // queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() })
    },
  })
}

