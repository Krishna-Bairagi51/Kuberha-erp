'use client'

/**
 * React Scan Provider
 * 
 * Configures React Scan for development environment to track
 * component rendering performance across the entire application.
 * Only active in development mode.
 */

import { useEffect } from 'react'
import { scan } from 'react-scan'

export function ReactScanProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      scan({
        enabled: true,
        showToolbar: true,
        trackUnnecessaryRenders: true,
        showFPS: true,
        showNotificationCount: true,
        animationSpeed: 'fast',
        log: false, 
      })
    }
  }, [])

  return <>{children}</>
}

