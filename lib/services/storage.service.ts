/**
 * Storage Service
 * Centralized localStorage abstraction with type safety
 */

// Storage keys as constants to avoid typos
export const STORAGE_KEYS = {
  IS_AUTHENTICATED: 'isAuthenticated',
  AUTH_DATA: 'authData',
  ACCESS_TOKEN: 'accessToken',
  SESSION_ID: 'sessionId',
  USER_TYPE: 'user_type',
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

// Type definitions for stored data
export interface AuthData {
  email?: string
  name?: string
  access_token?: string
  token?: string
  accessToken?: string
  seller_id?: string | number
  seller_status?: string
  [key: string]: unknown
}

export type UserType = 'seller' | 'admin'

/**
 * Get item from localStorage with optional parsing
 */
export function getItem<T = string>(key: StorageKey, parse = false): T | null {
  if (typeof window === 'undefined') return null
  
  try {
    const value = localStorage.getItem(key)
    if (!value) return null
    
    if (parse && value.startsWith('{')) {
      return JSON.parse(value) as T
    }
    
    return value as T
  } catch {
    return null
  }
}

/**
 * Set item in localStorage
 * If setting an auth-related key, notifies other tabs about the change
 */
export function setItem(key: StorageKey, value: string | object): void {
  if (typeof window === 'undefined') return
  
  try {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value
    localStorage.setItem(key, stringValue)
    
    // Notify other tabs if this is an auth-related key change
    const authKeys = [
      STORAGE_KEYS.IS_AUTHENTICATED,
      STORAGE_KEYS.AUTH_DATA,
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.USER_TYPE,
      STORAGE_KEYS.SESSION_ID,
    ]
    
    if (authKeys.includes(key)) {
      // Dynamically import to avoid circular dependencies and SSR issues
      import('@/lib/api/auth-sync')
        .then(({ notifyAuthStateChange }) => {
          // Small delay to ensure all auth keys are set before notifying
          setTimeout(() => {
            notifyAuthStateChange()
          }, 100)
        })
        .catch(() => {
          // Auth sync not available, continue silently
        })
    }
  } catch (err) {
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: StorageKey): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently fail
  }
}

/**
 * Clear all auth-related storage items
 * Also notifies other tabs about the auth state change
 * 
 * IMPORTANT: This clears ALL localStorage and sessionStorage to prevent
 * any user data from persisting between sessions. This is critical for:
 * - Security: No sensitive data leakage between users
 * - Privacy: User data is fully removed on logout
 * - Clean slate: Next login starts fresh without stale data
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return

  try {
    // Clear all localStorage - ensures no user data persists
    // This includes: auth tokens, user info (name, email, image, uid, company_id),
    // seller data, chatbot sessions, UI preferences, and any other cached data
    localStorage.clear()
    
    // Clear all sessionStorage - ensures no temporary data persists
    // This includes: shop-the-look data, scroll positions, form state, etc.
    sessionStorage.clear()
  } catch (error) {
    // Fallback: manually remove known keys if clear() fails (some browsers/modes)
    try {
      // Core auth keys
      removeItem(STORAGE_KEYS.IS_AUTHENTICATED)
      removeItem(STORAGE_KEYS.AUTH_DATA)
      removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      removeItem(STORAGE_KEYS.SESSION_ID)
      removeItem(STORAGE_KEYS.USER_TYPE)
      
      // Additional user data keys set during login
      const additionalKeys = [
        'name', 'email', 'image', 'company_id', 'uid',
        'seller_state', 'seller_data', 'userEmail',
        // Auth sync key
        '__auth_sync__',
        // Chatbot keys (pattern-based removal)
        'chatbot:lastRetailer',
      ]
      
      additionalKeys.forEach(key => {
        try { localStorage.removeItem(key) } catch { /* ignore */ }
      })
      
      // Remove any chatbot session keys (uid-based pattern)
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('chatbot:') || key.startsWith('chatbot_'))) {
          try { localStorage.removeItem(key) } catch { /* ignore */ }
        }
      }
      
      // Clear sessionStorage items individually
      sessionStorage.clear()
    } catch {
      // Last resort: silently fail - browser may be in a restricted mode
    }
  }
  
  // Notify other tabs about auth state change (logout)
  // Dynamically import to avoid circular dependencies and SSR issues
  import('@/lib/api/auth-sync')
    .then(({ notifyAuthStateChange }) => {
      notifyAuthStateChange()
    })
    .catch(() => {
      // Auth sync not available, continue silently
    })
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  const stored = getItem(STORAGE_KEYS.ACCESS_TOKEN) || getItem(STORAGE_KEYS.AUTH_DATA)
  
  if (!stored) return null
  
  // If it looks like JSON, try to parse it
  if (typeof stored === 'string' && stored.startsWith('{')) {
    try {
      const parsed = JSON.parse(stored) as AuthData
      return parsed?.access_token || parsed?.token || parsed?.accessToken || null
    } catch {
      return null
    }
  }
  
  return stored
}

/**
 * Get stored session ID
 */
export function getSessionId(): string | null {
  return getItem(STORAGE_KEYS.SESSION_ID)
}

/**
 * Get user type (seller or admin)
 */
export function getUserType(): UserType | null {
  const type = getItem(STORAGE_KEYS.USER_TYPE)
  if (type === 'seller' || type === 'admin') {
    return type
  }
  return null
}

/**
 * Get auth data
 */
export function getAuthData(): AuthData | null {
  return getItem<AuthData>(STORAGE_KEYS.AUTH_DATA, true)
}

/**
 * Check if user is authenticated (basic check)
 */
export function isStoredAuthenticated(): boolean {
  return getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true'
}

