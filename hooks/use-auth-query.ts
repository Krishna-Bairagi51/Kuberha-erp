'use client'

/**
 * Auth Query Hooks
 * 
 * TanStack Query powered authentication hooks that provide:
 * - Instant auth state from cache (no loading flicker on navigation)
 * - Optimistic updates on login/logout
 * - Automatic cache invalidation
 * - Type-safe auth operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useEffect, useRef } from 'react'
import { queryKeys } from '@/lib/query'
import {
  getAuthState,
  type AuthState,
  type UserType,
} from '@/lib/services/auth.service'
import {
  setItem,
  STORAGE_KEYS,
} from '@/lib/services/storage.service'
import { notifyAuthStateChange } from '@/lib/api/auth-sync'
import { redirectToLogin } from '@/lib/services/auth-redirect'
import { sendOTP, verifyOTP, login, sendChangePassword } from '@/lib/api/endpoints/auth'
import type { AuthResponse } from '@/types/domains/auth'
import { setUserTypeCache } from './use-user-type'

// ============================================================================
// Types
// ============================================================================

interface UseAuthQueryOptions {
  /** Expected user type for this page/component */
  expectedUserType: UserType
  /** Whether to redirect to login if not authenticated (default: true) */
  redirectOnFail?: boolean
}

interface UseAuthQueryReturn {
  /** Whether the auth check is still in progress (only true on first load) */
  isLoading: boolean
  /** Whether the user is authenticated and has the correct user type */
  isAuthenticated: boolean
  /** The user type (seller or admin) */
  userType: UserType | null
  /** User identifier (email or name) */
  userIdentifier: string
  /** Full auth state */
  authState: AuthState | null
  /** Logout function */
  logout: () => void
  /** Re-check authentication (invalidates cache) */
  recheckAuth: () => void
}

interface LoginCredentials {
  type: 'password'
  email: string
  password: string
}

interface OTPVerifyCredentials {
  type: 'otp'
  mobile: string
  otp: string
}

type LoginInput = LoginCredentials | OTPVerifyCredentials

interface LoginResult {
  success: boolean
  data?: AuthResponse
  error?: string
}

// ============================================================================
// Auth State Query
// ============================================================================

/**
 * Primary auth hook using TanStack Query.
 * 
 * Key benefits over useState/useEffect:
 * - Cached: Auth state is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated
 */
export function useAuthQuery({
  expectedUserType,
  redirectOnFail = true,
}: UseAuthQueryOptions): UseAuthQueryReturn {
  const queryClient = useQueryClient()
  const router = useRouter()
  const hasRedirectedRef = useRef(false)

  // Fast synchronous check BEFORE query runs - redirects immediately if not authenticated
  // This prevents the page from rendering before redirect
  useEffect(() => {
    if (!redirectOnFail || hasRedirectedRef.current || typeof window === 'undefined') {
      return
    }

    // Synchronous check - no async overhead
    const quickAuthCheck = getAuthState(expectedUserType)
    
    if (!quickAuthCheck.isAuthenticated) {
      hasRedirectedRef.current = true
      // Redirect immediately without waiting for query
      redirectToLogin({
        router,
        queryClient,
        invalidateQueries: true,
      })
    }
  }, [expectedUserType, redirectOnFail, router, queryClient])

  // Query for auth state
  // staleTime: Infinity - auth state only changes via mutations, not time
  // This is a "local" query - it reads from localStorage, not network
  const { data: authState, isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.auth.state(), expectedUserType],
    queryFn: () => getAuthState(expectedUserType),
    // Auth state is always "fresh" - we invalidate manually on login/logout
    staleTime: Infinity,
    // Don't refetch on mount - auth state is stable
    refetchOnMount: false,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Keep in cache indefinitely while app is running
    gcTime: Infinity,
    // Enable query - always run
    enabled: true,
  })

  // Fallback redirect check (in case the useEffect didn't catch it)
  // Using useMemo to avoid creating new reference on every render
  const shouldRedirect = useMemo(() => {
    if (isLoading || hasRedirectedRef.current) return false
    return redirectOnFail && authState && !authState.isAuthenticated
  }, [isLoading, redirectOnFail, authState])

  // Perform redirect if needed (effect-free, just check and redirect)
  if (shouldRedirect && typeof window !== 'undefined') {
    hasRedirectedRef.current = true
    // Use centralized redirect utility
    redirectToLogin({
      router,
      queryClient,
      invalidateQueries: true,
    })
  }

  const logout = useCallback(() => {
    // Use centralized redirect utility
    redirectToLogin({
      router,
      queryClient,
      invalidateQueries: true,
    })
  }, [queryClient, router])

  const recheckAuth = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
  }, [queryClient])

  return {
    isLoading: isLoading || isFetching,
    isAuthenticated: authState?.isAuthenticated ?? false,
    userType: authState?.userType ?? null,
    userIdentifier: authState?.userIdentifier ?? 'Unknown',
    authState: authState ?? null,
    logout,
    recheckAuth,
  }
}

// ============================================================================
// Login Mutations
// ============================================================================

/**
 * Persists auth data to localStorage.
 * Centralized to avoid duplication and ensure consistency.
 */
function persistAuthData(authData: AuthResponse): void {
  // Core auth data
  setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true')
  setItem(STORAGE_KEYS.AUTH_DATA, authData)
  setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.access_token)
  setItem(STORAGE_KEYS.SESSION_ID, authData.session_id)
  
  // User type
  if (authData.user_type) {
    setItem(STORAGE_KEYS.USER_TYPE, authData.user_type)
  }

  // Additional user data (stored directly, not through service)
  if (typeof window !== 'undefined') {
    localStorage.setItem('name', authData.name || '')
    localStorage.setItem('email', (authData as any).email || '')
    localStorage.setItem('image', authData.image || '')
    localStorage.setItem('company_id', String(authData.company_id ?? ''))
    if (authData.uid != null) {
      localStorage.setItem('uid', String(authData.uid))
    }
    
    // Seller-specific data
    const extendedData = authData as any
    if (extendedData.seller_state) {
      localStorage.setItem('seller_state', extendedData.seller_state)
    } else {
      localStorage.removeItem('seller_state')
    }
    
    if (extendedData.seller_data) {
      try {
        localStorage.setItem('seller_data', JSON.stringify(extendedData.seller_data))
      } catch {
        localStorage.removeItem('seller_data')
      }
    } else {
      localStorage.removeItem('seller_data')
    }
  }
}

/**
 * Determines the redirect path based on user type and seller state.
 */
function getRedirectPath(authData: AuthResponse): string {
  const userType = authData.user_type
  const extendedData = authData as any
  const sellerState = extendedData.seller_state

  if (userType === 'admin') {
    return '/admin-dashboard'
  }

  if (userType === 'seller') {
    if (sellerState === 'approved') {
      return '/seller-dashboard'
    }
    // draft/pending/rejected -> partner-onboarding
    return '/partner-onboarding'
  }

  return '/'
}

/**
 * Hook for password-based login.
 * 
 * Returns a mutation that:
 * - Calls the login API
 * - Persists auth data on success
 * - Invalidates auth queries
 * - Navigates to the appropriate dashboard
 */
export function useLoginMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }): Promise<LoginResult> => {
      const result = await login(credentials.email, credentials.password)
      
      if ('success' in result && result.success && result.data) {
        // Check if user_type is customer - show error for invalid user
        if (result.data.user_type === 'customer') {
          return { success: false, error: 'Invalid user. Customer accounts are not allowed to access this portal.' }
        }
        return { success: true, data: result.data }
      }
      
      const errorMessage = 
        ('message' in result ? result.message : null) ?? 
        'Login failed. Please check your credentials.'
      
      return { success: false, error: errorMessage }
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Persist auth data synchronously
        persistAuthData(result.data)
        
        // Notify other tabs
        notifyAuthStateChange()
        
        // Optimistically update cache for instant state (faster than invalidation)
        const newAuthState = {
          isAuthenticated: true,
          userType: result.data.user_type as UserType,
          userIdentifier: result.data.name || (result.data as any).email || 'Unknown',
          authData: result.data as any,
        }
        
        // Update auth state query immediately (synchronous, no wait)
        queryClient.setQueryData(
          [...queryKeys.auth.state(), result.data.user_type as UserType],
          newAuthState
        )
        
        // Update userType cache for global access
        setUserTypeCache(queryClient, result.data.user_type as UserType)
        
        // Navigate immediately - cache is already updated, no waiting
        const redirectPath = getRedirectPath(result.data)
        router.replace(redirectPath)
      }
    },
  })
}

/**
 * Hook for OTP verification login.
 */
export function useOTPVerifyMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (credentials: { mobile: string; otp: string }): Promise<LoginResult> => {
      const result = await verifyOTP(credentials.mobile, credentials.otp)
      
      if ('success' in result && result.success && result.data) {
        // Check if user_type is customer - show error for invalid user
        if (result.data.user_type === 'customer') {
          return { success: false, error: 'Invalid user. Customer accounts are not allowed to access this portal.' }
        }
        return { success: true, data: result.data }
      }
      
      const errorMessage = 
        ('message' in result ? result.message : null) ?? 
        'OTP verification failed. Please try again.'
      
      return { success: false, error: errorMessage }
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Persist auth data synchronously
        persistAuthData(result.data)
        
        // Notify other tabs
        notifyAuthStateChange()
        
        // Optimistically update cache for instant state (faster than invalidation)
        const newAuthState = {
          isAuthenticated: true,
          userType: result.data.user_type as UserType,
          userIdentifier: result.data.name || (result.data as any).email || 'Unknown',
          authData: result.data as any,
        }
        
        // Update auth state query immediately (synchronous, no wait)
        queryClient.setQueryData(
          [...queryKeys.auth.state(), result.data.user_type as UserType],
          newAuthState
        )
        
        // Update userType cache for global access
        setUserTypeCache(queryClient, result.data.user_type as UserType)
        
        // Navigate immediately - cache is already updated, no waiting
        const redirectPath = getRedirectPath(result.data)
        router.replace(redirectPath)
      }
    },
  })
}

/**
 * Hook for sending OTP.
 */
export function useSendOTPMutation() {
  return useMutation({
    mutationFn: async (mobile: string) => {
      const result = await sendOTP(mobile)
      
      if ('success' in result && result.success) {
        return { success: true, message: result.message ?? 'OTP sent successfully' }
      }
      
      const errorMessage = 
        ('message' in result ? result.message : null) ?? 
        'Failed to send OTP. Please try again.'
      
      return { success: false, error: errorMessage }
    },
  })
}

/**
 * Hook for logout.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      // Return success - redirect utility will handle cleanup
      return { success: true }
    },
    onSuccess: () => {
      // Use centralized redirect utility
      // It handles: clearing storage, notifying tabs, invalidating queries, and redirecting
      redirectToLogin({
        router,
        queryClient,
        invalidateQueries: true,
      })
    },
  })
}

/**
 * Hook for sending password reset email.
 */
export function useSendChangePasswordMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await sendChangePassword(email)
      
      if ('success' in result && result.success) {
        return { success: true, message: result.message ?? 'Password reset email sent successfully' }
      }
      
      const errorMessage = 
        ('message' in result ? result.message : null) ?? 
        'Failed to send password reset email. Please try again.'
      
      // Preserve status_code if it exists (for 400 error handling)
      const statusCode = ('status_code' in result ? result.status_code : undefined)
      
      return { success: false, error: errorMessage, statusCode }
    },
  })
}

// ============================================================================
// Exports
// ============================================================================

export type {
  UseAuthQueryOptions,
  UseAuthQueryReturn,
  LoginCredentials,
  OTPVerifyCredentials,
  LoginInput,
  LoginResult,
}

