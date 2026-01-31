/**
 * Hooks
 * Centralized hook exports
 */

export { useIsMobile } from './use-mobile'
export { useToast, toast } from './use-toast'

// TanStack Query powered auth hooks
export {
  useAuthQuery,
  useLoginMutation,
  useOTPVerifyMutation,
  useSendOTPMutation,
  useLogoutMutation,
  useSendChangePasswordMutation,
} from './use-auth-query'
export type {
  UseAuthQueryOptions,
  UseAuthQueryReturn,
  LoginCredentials,
  OTPVerifyCredentials,
  LoginInput,
  LoginResult,
} from './use-auth-query'

// User type hook (global state via TanStack Query)
export {
  useUserType,
  setUserTypeCache,
  invalidateUserTypeCache,
} from './use-user-type'
export type {
  UseUserTypeReturn,
} from './use-user-type'

// Table hooks (unified table management with pagination and filtering)
export {
  useUnifiedTable,
  type UseUnifiedTableOptions,
  type UseUnifiedTableReturn,
  type CustomFilterConfig,
  type CustomFilterState,
  type PaginationState,
  type UrlPersistenceConfig,
} from './table'

// Debounce hook for optimizing frequent updates (e.g., search inputs)
export { useDebounce } from './use-debounce'

