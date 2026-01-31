"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell } from 'lucide-react'
import type { Notification } from '@/components/notification/types/notification.types'

interface PushNotificationToastProps {
  notification: Notification | null
  onClose: () => void
  onClick?: () => void
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return `${Math.floor(diffInSeconds / 604800)}w ago`
}

export function PushNotificationToast({ 
  notification, 
  onClose, 
  onClick 
}: PushNotificationToastProps) {
  if (!notification) return null

  const description = notification.description || notification.message || ''
  const timeAgo = formatTimeAgo(notification.write_date || notification.create_date)

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3
          }}
          className="fixed top-4 right-4 z-[9999] max-w-sm w-full"
          onClick={onClick}
        >
          <div
            className="relative rounded-lg shadow-2xl border border-gray-200 bg-white overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow duration-200"
            role="alert"
            aria-live="assertive"
          >
            {/* Content */}
            <div className="pl-4 pr-10 py-3">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5 text-gray-600">
                  <Bell className="h-5 w-5" />
                </div>
                
                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-0.5">
                    {notification.title}
                  </h4>
                  {description && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-snug">
                      {description}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {timeAgo}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

