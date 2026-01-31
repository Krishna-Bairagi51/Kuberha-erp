"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotificationWebSocket } from '../hooks/use-notification-websocket'
import { useNotificationsQuery, useInvalidateNotifications } from '../hooks/use-notification-query'
import { queryKeys } from '@/lib/query'
import { isAuthenticated } from '@/lib/api/helpers/auth'
import type { 
  Notification, 
  NotificationMessage, 
  NotificationContextType 
} from '../types/notification.types'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newNotification, setNewNotification] = useState<Notification | null>(null)
  const previousNotificationIdsRef = React.useRef<Set<number>>(new Set())
  const isInitialMountRef = React.useRef(true)
  const isAuthenticatedUser = isAuthenticated()
  const queryClient = useQueryClient()
  
  // Use React Query hook for notifications
  // For provider (used by slider), fetch with a reasonable limit
  // Full variant will use its own query with pagination
  const {
    data: notificationsData,
    isLoading,
    refetch: refetchNotifications,
  } = useNotificationsQuery(isAuthenticatedUser, 1, 10)

  // Extract notifications from query data
  const notifications = notificationsData?.notifications || []

  const openNotification = () => setIsOpen(true)
  const closeNotification = () => setIsOpen(false)
  const clearNewNotification = React.useCallback(() => {
    setNewNotification(null)
  }, [])

  // Invalidate and refetch notifications
  const invalidateNotifications = useInvalidateNotifications()
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticatedUser) {
      return
    }
    invalidateNotifications()
    await refetchNotifications()
  }, [isAuthenticatedUser, invalidateNotifications, refetchNotifications])

  // Detect new notifications and set them for toast display
  React.useEffect(() => {
    if (!notifications.length) {
      return
    }

    // Skip on initial mount to avoid showing toasts for existing notifications
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      previousNotificationIdsRef.current = new Set(notifications.map(n => n.id))
      return
    }

    // Get current notification IDs
    const currentNotificationIds = new Set(notifications.map(n => n.id))
    const previousIds = previousNotificationIdsRef.current

    // Find new notifications (not in previous set)
    const newNotifications = notifications.filter(
      notification => !previousIds.has(notification.id)
    )

    // If there are new notifications, show toast for the most recent one
    if (newNotifications.length > 0) {
      // Sort by date (most recent first) and get the top one
      const sortedNewNotifications = [...newNotifications].sort((a, b) => {
        const dateA = new Date(a.write_date || a.create_date).getTime()
        const dateB = new Date(b.write_date || b.create_date).getTime()
        return dateB - dateA
      })
      
      const newestNotification = sortedNewNotifications[0]
      setNewNotification(newestNotification)
      
      // Auto-clear after 5 seconds
      const timer = setTimeout(() => {
        setNewNotification(null)
      }, 5000)
      
      return () => clearTimeout(timer)
    }

    // Update previous notification IDs
    previousNotificationIdsRef.current = currentNotificationIds
  }, [notifications])

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: NotificationMessage) => {
    console.log('[Notification Provider] 🔔 Webhook/WebSocket Message Handler', { message })
    // Check if message is from odoo-backend with notification operation
    if (
      message.type === 'response' &&
      message.name === 'odoo-backend' &&
      message.text &&
      typeof message.text === 'object' &&
      message.text.operation_type === 'notification'
    ) {
      console.log('[Notification Provider] 🔔 Odoo-backend notification operation detected, refreshing notifications')
      // Invalidate and refetch notifications when this specific message is received
      refreshNotifications()
      return
    }
    
    // Handle different message types - optimistically update cache
    if (message.type === 'notification' || message.data) {
      const notificationData = message.data || message
      
      // Add new notification to the cache optimistically
      // Update all notification queries in cache
      if (notificationData.id || notificationData.title) {
        // Check if this is a new notification (not in previous set)
        const notificationId = notificationData.id
        if (notificationId && !previousNotificationIdsRef.current.has(notificationId)) {
          // Show toast immediately for WebSocket notifications
          setNewNotification(notificationData as Notification)
          
          // Auto-clear after 5 seconds
          setTimeout(() => {
            setNewNotification(null)
          }, 5000)
          
          // Add to previous IDs
          previousNotificationIdsRef.current.add(notificationId)
        }
        
        const queries = queryClient.getQueriesData({ queryKey: queryKeys.notifications.all })
        queries.forEach(([queryKey, oldData]: [any, any]) => {
          if (!oldData) return
          
          const existingNotifications = oldData.notifications || []
          // Check if notification already exists
          const exists = existingNotifications.some((n: Notification) => n.id === notificationData.id)
          if (exists) {
            return
          }
          
          queryClient.setQueryData(queryKey, {
            ...oldData,
            notifications: [notificationData as Notification, ...existingNotifications],
            count: (oldData.count || existingNotifications.length) + 1,
            unread_count: (oldData.unread_count || 0) + 1,
            record_count: oldData.record_count ? oldData.record_count + 1 : undefined,
          })
        })
      }
    }
  }, [refreshNotifications, queryClient])

  const handleWebSocketError = useCallback((error: Event) => {
    // Handle WebSocket error
  }, [])

  const handleWebSocketOpen = useCallback(() => {
    // Handle WebSocket open
  }, [])

  // Initialize WebSocket connection
  const { isConnected, connectionStatus } = useNotificationWebSocket({
    enabled: isAuthenticatedUser,
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
    onOpen: handleWebSocketOpen,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  })

  return (
    <NotificationContext.Provider
      value={{
        isOpen,
        openNotification,
        closeNotification,
        notifications,
        isConnected,
        connectionStatus,
        refreshNotifications,
        newNotification,
        clearNewNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

