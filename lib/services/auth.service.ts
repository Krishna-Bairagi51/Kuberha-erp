/**
 * Auth Service
 * Centralized authentication operations
 */

import {
  getAccessToken,
  getAuthData,
  getUserType,
  clearAuthStorage,
  isStoredAuthenticated,
  type UserType,
  type AuthData,
} from './storage.service'

export interface AuthState {
  isAuthenticated: boolean
  userType: UserType | null
  userIdentifier: string
  authData: AuthData | null
}

/**
 * Get and validate authentication state for a specific user type.
 * Returns the auth state directly, with isAuthenticated set to false if validation fails.
 */
export function getAuthState(expectedUserType: UserType): AuthState {
  const authStatus = isStoredAuthenticated()
  const authData = getAuthData()
  const accessToken = getAccessToken()
  const userType = getUserType()

  const isValidAuth =
    authStatus &&
    authData !== null &&
    accessToken !== null &&
    accessToken !== 'null' &&
    accessToken !== 'undefined' &&
    accessToken.length > 10 &&
    userType === expectedUserType

  const userIdentifier = authData?.email || authData?.name || 'Unknown'

  return {
    isAuthenticated: isValidAuth,
    userType: isValidAuth ? userType : null,
    userIdentifier,
    authData: isValidAuth ? authData : null,
  }
}

// Re-export storage utilities for convenience
export { getAccessToken, getUserType, getAuthData, clearAuthStorage }

// Re-export types for convenience
export type { UserType, AuthData }

