/**
 * Session/auth helpers for localStorage
 */

import { ApiError } from "../client"

export interface AuthData {
  company_id: number
  email: string
  name: string
  image: string
  access_token: string
  expires_in: string
  session_id: string
  uid: number
  user_type?: string
}

/**
 * Extract the most likely access token from various auth response shapes.
 * Accepts an auth object (the parsed response.data) and returns token string or undefined.
 *
 * Many backends differ in naming (access_token, token, accessToken). This helper normalizes that.
 */
export function getAccessTokenFromAuth(auth: Record<string, any> | undefined | null): string | undefined {
  if (!auth || typeof auth !== "object") return undefined
  return (
    auth.access_token ??
    auth.accessToken ??
    auth.token ??
    auth.accessTokenString ?? // fallback for weird naming
    undefined
  )
}

/**
 * Ensure accessToken and sessionId exist in localStorage and are not 'null'/'undefined'.
 * This preserves the legacy behavior which threw when token/session missing.
 * Throws Error with same messages as legacy code.
 */
export function ensureAuthSession(): void {
  if (typeof window === "undefined") {
    throw new ApiError("No valid access token found", 401, undefined)
  }

  const accessToken = (() => {
    try { return localStorage.getItem("accessToken") } catch { return null }
  })()

  const sessionId = (() => {
    try { return localStorage.getItem("sessionId") } catch { return null }
  })()

  if (!accessToken || accessToken === "null" || accessToken === "undefined") {
    throw new ApiError("No valid access token found", 401, undefined)
  }
  if (!sessionId || sessionId === "null" || sessionId === "undefined") {
    throw new ApiError("No valid session id found", 401, undefined)
  }
}

/**
 * Get parsed auth data from localStorage
 */
export function getAuthData(): AuthData | null {
  if (typeof window === "undefined") return null
  try {
    const authData = localStorage.getItem("authData")
    return authData ? JSON.parse(authData) : null
  } catch {
    return null
  }
}

/**
 * Get UID from localStorage as number
 */
export function getUid(): number | null {
  if (typeof window === "undefined") return null
  try {
    return parseInt(localStorage.getItem("uid") || "0")
  } catch {
    return null
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("accessToken")
  } catch {
    return null
  }
}

/**
 * Get session ID from localStorage
 */
export function getSessionId(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("sessionId")
  } catch {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  try {
    const authStatus = localStorage.getItem("isAuthenticated")
    const authData = localStorage.getItem("authData")
    return authStatus === "true" && !!authData
  } catch {
    return false
  }
}

/**
 * Get user type from localStorage
 */
export function getUserType(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("user_type")
  } catch {
    return null
  }
}

/**
 * Clear authentication data from localStorage
 * Note: This function does NOT notify other tabs.
 * Use clearAllLocalData() or the storage service's clearAuthStorage() for cross-tab sync.
 */
export function clearAuthData(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("authData")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("sessionId")
    localStorage.removeItem("uid")
    localStorage.removeItem("user_type")
  } catch {
    // ignore errors
  }
}

/**
 * Clear all localStorage data
 * Also notifies other tabs about the auth state change (logout)
 */
export function clearAllLocalData(): void {
  if (typeof window === "undefined") return
  try {
    // Clear all authentication related data
    clearAuthData()
    
    // Clear any other local storage data that might be present
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Notify other tabs about auth state change (logout)
    // Dynamically import to avoid circular dependencies and SSR issues
    import('../auth-sync')
      .then(({ notifyAuthStateChange }) => {
        notifyAuthStateChange()
      })
      .catch(() => {
        // Auth sync not available, continue silently
      })
  } catch {
    // ignore errors
  }
}

/**
 * Validate if current user type matches expected type
 */
export function validateUserType(expectedType: string): boolean {
  const userType = getUserType()
  return userType === expectedType
}

/** Read UID safely from localStorage. Legacy AI API expects this. */
export function getUserIdForAI(): string {
  if (typeof window === "undefined") return "0"
  try {
    const uid = localStorage.getItem("uid")
    return uid && uid !== "null" && uid !== "undefined" ? uid : "0"
  } catch {
    return "0"
  }
}
