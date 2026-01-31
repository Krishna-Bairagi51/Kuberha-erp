'use client'

/**
 * Auth Sync Provider
 * Client component that initializes cross-tab authentication synchronization
 * 
 * This component should be placed in the root layout to ensure auth sync
 * is active across all pages.
 */

import { useEffect } from 'react'
import { initAuthSync } from '@/lib/api/auth-sync'

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize cross-tab auth synchronization
    initAuthSync()

    // Cleanup on unmount (though this shouldn't happen in root layout)
    return () => {
      // Note: We don't destroy here because we want sync to persist
      // across route changes. Only destroy if truly unmounting the app.
    }
  }, [])

  return <>{children}</>
}