/**
 * Notification Feature Types
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: number
  title: string
  message: string
  res_model: string
  priority: string
  res_id: number
  is_read: boolean
  create_date: string
  write_date: string
  redirect_url: string
  // Legacy/computed fields for backward compatibility
  description?: string
  type?: NotificationType
  unread?: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export interface NotificationItem {
  id: string
  title: string
  description: string
  timeAgo: string
  dateTime: string
  type: NotificationType
  unread?: boolean
  originalNotification: Notification
}

export interface NotificationApiResponse {
  message: {
    status_code: number
    message: string
    record: Notification[]
    record_count: number
  }
  errors: any[]
  status_code: number
}

export interface GetNotificationsResponse {
  notifications: Notification[]
  count?: number
  record_count?: number
  total_pages?: number
  unread_count?: number
}

export interface UpdateNotificationRequest {
  id: number
  title: string
  message: string
  res_model: string
  res_id: number
  priority: string
  redirect_url: string
}

export interface UpdateNotificationResponse {
  message?: {
    status_code: number
    message: string
  }
  status_code: number
}

export interface NotificationMessage {
  type?: string
  data?: any
  message?: string
  name?: string
  text?: {
    operation_type?: string
    [key: string]: any
  }
  [key: string]: any
}

export interface NotificationContextType {
  isOpen: boolean
  openNotification: () => void
  closeNotification: () => void
  notifications: Notification[]
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  refreshNotifications: () => Promise<void>
  newNotification: Notification | null
  clearNewNotification: () => void
}

export interface UseNotificationWebSocketOptions {
  enabled?: boolean
  onMessage?: (message: NotificationMessage) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

