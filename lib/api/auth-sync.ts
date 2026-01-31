/**
 * Cross-Tab Authentication Synchronization Service
 * 
 * Handles synchronization of authentication state across multiple browser tabs/windows.
 * When a user logs in or logs out in one tab, all other tabs are automatically notified
 * and reloaded to maintain consistent authentication state.
 * 
 * Industry Best Practices:
 * - Uses StorageEvent API for cross-tab communication (widely supported)
 * - Falls back to BroadcastChannel API for modern browsers
 * - Implements debouncing to prevent rapid-fire events
 * - Singleton pattern to ensure single instance
 * - SSR-safe (only runs in browser context)
 * - Type-safe with proper error handling
 * 
 * @example
 * ```ts
 * // Initialize in your app (client-side only)
 * import { initAuthSync } from '@/lib/api/auth-sync'
 * 
 * if (typeof window !== 'undefined') {
 *   initAuthSync()
 * }
 * ```
 */

import { STORAGE_KEYS, getUserType, getAccessToken, isStoredAuthenticated } from '@/lib/services/storage.service'

/**
 * Storage key used to track auth state changes across tabs
 * This key is updated whenever auth state changes, triggering storage events
 */
const AUTH_SYNC_KEY = '__auth_sync__'

/**
 * BroadcastChannel name for cross-tab communication (fallback)
 */
const AUTH_BROADCAST_CHANNEL = 'auth-sync-channel'

/**
 * Debounce delay to prevent rapid-fire events (ms)
 */
const DEBOUNCE_DELAY = 300

/**
 * Types for auth sync events
 */
type AuthSyncEvent = {
  type: 'AUTH_CHANGE' | 'LOGOUT' | 'LOGIN'
  timestamp: number
  userType?: string | null
  hasAuth?: boolean
}

type AuthState = {
  userType: string | null
  hasAuth: boolean
  timestamp: number
}

/**
 * Cross-Tab Auth Sync Manager
 * Singleton pattern to ensure only one instance exists
 */
class AuthSyncManager {
  private storageListener: ((e: StorageEvent) => void) | null = null
  private broadcastChannel: BroadcastChannel | null = null
  private lastKnownState: AuthState | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private isInitialized = false
  private isHandlingSync = false

  /**
   * Initialize the auth sync service
   * Sets up listeners for cross-tab communication
   */
  init(): void {
    if (this.isInitialized) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    this.isInitialized = true

    // Capture initial state
    this.lastKnownState = this.getCurrentAuthState()

    // Set up StorageEvent listener (primary method - works across all tabs)
    this.setupStorageListener()

    // Set up BroadcastChannel listener (fallback for modern browsers)
    this.setupBroadcastChannel()
  }

  /**
   * Get current authentication state
   */
  private getCurrentAuthState(): AuthState {
    return {
      userType: getUserType(),
      hasAuth: isStoredAuthenticated() && getAccessToken() !== null,
      timestamp: Date.now(),
    }
  }

  /**
   * Set up StorageEvent listener
   * This fires when localStorage is modified in other tabs
   */
  private setupStorageListener(): void {
    this.storageListener = (e: StorageEvent) => {
      // Only react to changes in auth-related keys or our sync marker
      const authKeys = [
        STORAGE_KEYS.IS_AUTHENTICATED,
        STORAGE_KEYS.AUTH_DATA,
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.USER_TYPE,
        STORAGE_KEYS.SESSION_ID,
        AUTH_SYNC_KEY,
      ]

      if (!e.key || !authKeys.includes(e.key)) {
        return
      }

      // Only react to localStorage events (not sessionStorage)
      // Note: Storage events only fire in OTHER tabs when localStorage changes,
      // never in the tab that made the change. This is exactly what we want for cross-tab sync.
      if (e.storageArea !== localStorage) {
        return
      }

      // Debounce to prevent rapid-fire events
      this.debouncedHandleAuthChange()
    }

    window.addEventListener('storage', this.storageListener)
  }

  /**
   * Set up BroadcastChannel listener (fallback)
   * More modern API, but less widely supported
   */
  private setupBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      return
    }

    try {
      this.broadcastChannel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL)

      this.broadcastChannel.onmessage = (event: MessageEvent<AuthSyncEvent>) => {
        if (event.data && event.data.type) {
          this.debouncedHandleAuthChange()
        }
      }
    } catch (error) {
    }
  }

  /**
   * Debounced handler for auth changes
   * Prevents multiple rapid reloads
   */
  private debouncedHandleAuthChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.handleAuthChange()
    }, DEBOUNCE_DELAY)
  }

  /**
   * Handle authentication state change detected from another tab
   */
  private handleAuthChange(): void {
    if (this.isHandlingSync) {
      return
    }

    this.isHandlingSync = true

    try {
      const currentState = this.getCurrentAuthState()

      // Check if auth state actually changed
      if (
        this.lastKnownState &&
        this.lastKnownState.userType === currentState.userType &&
        this.lastKnownState.hasAuth === currentState.hasAuth
      ) {
        // State hasn't changed, might be a false positive
        this.isHandlingSync = false
        return
      }

      // State has changed - reload the page to sync with new auth state
      this.lastKnownState = currentState

      // Show a brief notification if possible
      this.notifyAuthChange(currentState)

      // Reload the page to ensure all components pick up the new auth state
      // Using window.location.reload() ensures a clean state reset
      window.location.reload()
    } catch (error) {
      this.isHandlingSync = false
    }
  }

  /**
   * Notify user about auth change (optional, non-blocking)
   */
  private notifyAuthChange(state: AuthState): void {
    try {
      // Try to show a toast notification if available
      // This is non-blocking and won't prevent the reload
      if (typeof window !== 'undefined') {
        // Dynamically import to avoid SSR issues
        import('sonner')
          .then(({ toast }) => {
            if (state.hasAuth) {
              toast.info('Authentication updated in another tab. Refreshing...', {
                duration: 2000,
              })
            } else {
              toast.info('Logged out in another tab. Refreshing...', {
                duration: 2000,
              })
            }
          })
          .catch(() => {
            // Sonner not available, continue without notification
          })
      }
    } catch {
      // Ignore errors in notification
    }
  }

  /**
   * Update the sync marker to notify other tabs
   * Call this whenever auth state changes (login/logout)
   */
  notifyAuthStateChange(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const state = this.getCurrentAuthState()
      const syncData: AuthSyncEvent = {
        type: state.hasAuth ? 'LOGIN' : 'LOGOUT',
        timestamp: Date.now(),
        userType: state.userType,
        hasAuth: state.hasAuth,
      }

      // Update localStorage marker (triggers storage event in other tabs)
      localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify(syncData))

      // Also broadcast via BroadcastChannel if available
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(syncData)
        } catch (error) {
        }
      }

      // Update last known state
      this.lastKnownState = state
    } catch (error) {
    }
  }

  /**
   * Cleanup: Remove all listeners
   */
  destroy(): void {
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener)
      this.storageListener = null
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close()
      } catch {
        // Ignore errors
      }
      this.broadcastChannel = null
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    this.isInitialized = false
    this.isHandlingSync = false
  }
}

// Singleton instance
let authSyncManager: AuthSyncManager | null = null

/**
 * Initialize cross-tab authentication synchronization
 * Call this once in your app (client-side only)
 * 
 * @example
 * ```ts
 * // In your root layout or app component
 * 'use client'
 * import { useEffect } from 'react'
 * import { initAuthSync } from '@/lib/api/auth-sync'
 * 
 * export default function Layout({ children }) {
 *   useEffect(() => {
 *     initAuthSync()
 *   }, [])
 *   return <>{children}</>
 * }
 * ```
 */
export function initAuthSync(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!authSyncManager) {
    authSyncManager = new AuthSyncManager()
  }

  authSyncManager.init()
}

/**
 * Notify other tabs that authentication state has changed
 * Call this after login or logout operations
 * 
 * @example
 * ```ts
 * // After successful login
 * localStorage.setItem('accessToken', token)
 * notifyAuthStateChange()
 * 
 * // After logout
 * clearAuthStorage()
 * notifyAuthStateChange()
 * ```
 */
export function notifyAuthStateChange(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!authSyncManager) {
    // Initialize if not already done
    initAuthSync()
  }

  authSyncManager?.notifyAuthStateChange()
}

/**
 * Cleanup the auth sync service
 * Useful for testing or when unmounting
 */
export function destroyAuthSync(): void {
  if (authSyncManager) {
    authSyncManager.destroy()
    authSyncManager = null
  }
}

// Export for testing purposes
export { AuthSyncManager }
