/**
 * API helpers barrel file
 * 
 * This folder contains small, pure helper utilities used by API endpoint modules.
 * 
 * Prefer importing only what you need from the specific file to improve tree-shaking:
 *   import { getAuthData } from '@/lib/api/helpers/auth'
 * 
 * For backward compatibility, you can also import from the barrel:
 *   import { getAuthData } from '@/lib/api/helpers'
 */

// Auth helpers
export * from "./auth"

// Base64 helpers
export * from "./base64"

// Chat helpers
export * from "./chat"

// Onboarding helpers
export * from "./onboarding"

// Number formatting helpers
export * from "./number"

// Query builders
export * from "./queries"

// Retry helper
export * from "./retry"

// Miscellaneous utilities
export * from "./misc"

// Shared types
export * from "./types"
