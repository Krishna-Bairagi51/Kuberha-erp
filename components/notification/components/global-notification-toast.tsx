"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../providers'
import { PushNotificationToast } from '@/components/shared/ui'
import { useUpdateNotificationMutation } from '../hooks/use-notification-query'
import type { Notification } from '../types/notification.types'

export function GlobalNotificationToast() {
  const { newNotification, clearNewNotification } = useNotification()
  const router = useRouter()
  const updateNotificationMutation = useUpdateNotificationMutation()

  const handleNotificationClick = React.useCallback(async (notification: Notification) => {
    // Clear the toast first
    clearNewNotification()

    // Only update if notification is unread
    if (!notification.is_read) {
      try {
        const updateRequest = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          res_model: notification.res_model,
          res_id: notification.res_id,
          priority: notification.priority,
          redirect_url: notification.redirect_url || '',
        }

        await updateNotificationMutation.mutateAsync(updateRequest)
      } catch (error) {
        // Don't navigate if update fails
        return
      }
    }

    // Navigate to redirect_url if provided
    if (notification.redirect_url) {
      router.push(notification.redirect_url)
    }
  }, [clearNewNotification, updateNotificationMutation, router])

  if (!newNotification) {
    return null
  }

  return (
    <PushNotificationToast
      notification={newNotification}
      onClose={clearNewNotification}
      onClick={() => handleNotificationClick(newNotification)}
    />
  )
}

