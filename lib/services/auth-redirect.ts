/**
 * Centralized Auth Redirect Utility
 * 
 * Industrial-standard centralized redirect handler for authentication failures.
 * All redirects to login should go through this utility to ensure:
 * - Consistent behavior across the app
 * - Proper cleanup (storage, cache, notifications)
 * - Prevention of duplicate redirects
 * - User-friendly error messages
 */

import { clearAuthStorage } from './storage.service'
import { notifyAuthStateChange } from '@/lib/api/auth-sync'

/**
 * Options for redirect behavior
 */
interface RedirectToLoginOptions {
  /** Whether to clear auth storage (default: true) */
  clearStorage?: boolean
  /** Whether to notify other tabs (default: true) */
  notifyTabs?: boolean
  /** Whether to invalidate queries (requires queryClient) */
  invalidateQueries?: boolean
  /** QueryClient instance for cache invalidation */
  queryClient?: any
  /** Custom error message to show */
  message?: string
  /** Whether to use full page reload (default: false, uses Next.js router) */
  fullReload?: boolean
  /** Next.js router instance (for client-side redirects) */
  router?: any
}

/**
 * Singleton to prevent multiple simultaneous redirects
 */
class AuthRedirectHandler {
  private isRedirecting = false
  private redirectTimeout: NodeJS.Timeout | null = null

  /**
   * Redirect to login page with proper cleanup
   * 
   * This is the single source of truth for all auth redirects.
   * Use this instead of manually calling router.replace('/login') or window.location.href.
   */
  async redirectToLogin(options: RedirectToLoginOptions = {}): Promise<void> {
    // Prevent multiple simultaneous redirects
    if (this.isRedirecting) {
      return
    }

    // Only handle in browser context
    if (typeof window === 'undefined') {
      return
    }

    // Check if we're already on the login page to prevent redirect loops
    const currentPath = window.location.pathname
    const isAlreadyOnLoginPage = currentPath === '/login' || currentPath.startsWith('/login/')

    // If already on login page, just do cleanup without redirecting
    if (isAlreadyOnLoginPage) {
      const {
        clearStorage = true,
        notifyTabs = true,
        invalidateQueries = false,
        queryClient,
        message,
      } = options

      // Still clear storage and notify tabs, but skip redirect
      if (clearStorage) {
        clearAuthStorage()
      }

      if (notifyTabs) {
        notifyAuthStateChange()
      }

      // Clear all queries if requested (on logout, we want to clear everything)
      if (invalidateQueries && queryClient) {
        // Clear the entire query cache to prevent data leakage between sessions
        queryClient.clear()
      }

      // Optionally show message, but only if not already on login (to avoid spam)
      // We skip the message on login page to prevent annoying toasts during login attempts
      
      return
    }

    this.isRedirecting = true

    const {
      clearStorage = true,
      notifyTabs = true,
      invalidateQueries = false,
      queryClient,
      message,
      fullReload = false,
      router,
    } = options

    try {
      // Clear queries BEFORE redirect (synchronous) to prevent data leakage
      // This ensures cache is cleared even if redirect happens immediately
      if (invalidateQueries && queryClient) {
        // Clear the entire query cache to prevent data leakage between sessions
        queryClient.clear()
      }

      // Clear auth storage if requested (before redirect)
      if (clearStorage) {
        clearAuthStorage()
      }

      // PERFORM REDIRECT (synchronous) - this is the critical path
      if (fullReload) {
        // Full page reload - clears all state (queries already cleared above)
        window.location.href = '/login'
      } else if (router) {
        // Next.js router - fastest, no page reload
        router.replace('/login')
      } else {
        // Fallback to full reload if no router provided
        window.location.href = '/login'
      }

      // Cleanup operations (non-blocking, happens after redirect is initiated)
      // Use setTimeout to ensure redirect happens first
      setTimeout(() => {
        // Notify other tabs if requested
        if (notifyTabs) {
          notifyAuthStateChange()
        }

        // Show user-friendly message if provided
        if (message) {
          import('sonner').then(({ toast }) => {
            toast.error(message, {
              duration: 4000,
            })
          }).catch(() => {
            // Sonner not available, continue anyway
          })
        }
      }, 0)
    } catch (error) {
      // Fallback: still try to redirect even if cleanup fails
      console.error('Error during auth redirect:', error)
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } finally {
      // Reset redirecting flag after a delay
      this.redirectTimeout = setTimeout(() => {
        this.isRedirecting = false
      }, 1000)
    }
  }

  /**
   * Reset the handler state (useful for testing)
   */
  reset(): void {
    this.isRedirecting = false
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
      this.redirectTimeout = null
    }
  }
}

// Singleton instance
const authRedirectHandler = new AuthRedirectHandler()

/**
 * Redirect to login page with proper cleanup
 * 
 * @example
 * ```ts
 * // In a component with router
 * import { redirectToLogin } from '@/lib/services/auth-redirect'
 * 
 * redirectToLogin({
 *   router,
 *   queryClient,
 *   message: 'Your session has expired'
 * })
 * ```
 * 
 * @example
 * // In API client (no router, full reload)
 * redirectToLogin({
 *   fullReload: true,
 *   message: 'Unauthorized. Please log in again.'
 * })
 */
export async function redirectToLogin(
  options: RedirectToLoginOptions = {}
): Promise<void> {
  return authRedirectHandler.redirectToLogin(options)
}

/**
 * Reset the redirect handler (useful for testing)
 */
export function resetAuthRedirect(): void {
  authRedirectHandler.reset()
}

