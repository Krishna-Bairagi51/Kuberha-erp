'use client'

import { get, post } from '@/lib/api/client'
import { getAccessToken } from '@/lib/api/helpers/auth'
import type { 
  Notification, 
  NotificationApiResponse, 
  GetNotificationsResponse,
  UpdateNotificationRequest,
  UpdateNotificationResponse
} from '../types/notification.types'

/**
 * Notification Service
 * Handles all notification-related API calls
 */
class NotificationService {
  /**
   * Fetch notifications from the server
   * Uses access-token header and Cookie with session_id
   * @param page - Page number (1-indexed)
   * @param limit - Number of items per page
   * @param status - Filter by status: 'all', 'read', or 'unread'
   */
  async getNotifications(page: number = 1, limit: number = 10, status: 'all' | 'read' | 'unread' = 'all'): Promise<GetNotificationsResponse> {
    try {
      const accessToken = getAccessToken()

      if (!accessToken) {
        //console.warn('[Notification Service] ⚠️ No access token found')
        throw new Error('No access token found')
      }

      // Build query parameters
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      }
      
      // Add status parameter only if not 'all'
      if (status !== 'all') {
        params.status = status
      }

      // The client automatically adds access-token via includeAuth and Cookie via cookieSession
      // console.log('[Notification Service] 📡 API Call - GET /get_notification', { params })
      const response = await get<NotificationApiResponse>(
        '/get_notification',
        params,
        {
          includeAuth: true,
          cookieSession: true,
        }
      )
      // console.log('[Notification Service] ✅ API Response - GET /get_notification', { response })

      // Extract notifications from the API response structure
      const notifications = response?.message?.record || []
      const recordCount = response?.message?.record_count || 0
      
      // Map API fields to include legacy/computed fields for backward compatibility
      const mappedNotifications: Notification[] = notifications.map((notification) => ({
        ...notification,
        // Add backward-compatible fields
        description: notification.message,
        unread: !notification.is_read,
        createdAt: notification.create_date,
        updatedAt: notification.write_date,
      }))

      const unreadCount = mappedNotifications.filter((n) => n.is_read === false).length
      const totalPages = Math.ceil(recordCount / limit)

      return {
        notifications: mappedNotifications,
        count: mappedNotifications.length,
        unread_count: unreadCount,
        record_count: recordCount,
        total_pages: totalPages,
      }
    } catch (error) {
      console.error('[Notification Service] ❌ API Error - GET /get_notification', { error })
      throw error
    }
  }

  /**
   * Update a notification (mark as read)
   */
  async updateNotification(notification: UpdateNotificationRequest): Promise<UpdateNotificationResponse> {
    try {
      // console.log('[Notification Service] 📡 API Call - POST /update_notification', { notification })
      const response = await post<UpdateNotificationResponse>(
        '/update_notification',
        notification,
        {
          includeAuth: true,
          cookieSession: true,
        }
      )
      // console.log('[Notification Service] ✅ API Response - POST /update_notification', { response })

      return response
    } catch (error) {
      console.error('[Notification Service] ❌ API Error - POST /update_notification', { error })
      throw error
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Export default for backward compatibility
export default notificationService

