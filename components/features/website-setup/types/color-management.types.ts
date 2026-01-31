// ============================================================================
// Color Management Types
// ============================================================================

/**
 * Color item for display in the UI
 */
export type ColorItem = {
  name: string
  key: string
  hex: string
}

// ============================================================================
// Color Code Dashboard API Types
// ============================================================================

export interface ColorCodeRecord {
  id: number
  name: string
  code: string
}

export interface ColorCodeDashboardResponse {
  message: string
  errors: any[]
  count: number
  record: ColorCodeRecord[]
  status_code: number
}

// ============================================================================
// Create Color Code API Types
// ============================================================================

export interface CreateColorCodeRequest {
  name: string
  code: string
}

export interface CreateColorCodeResponse {
  message: string
  errors: any[]
  status_code: number
}

export interface CreateColorCodeErrorResponse {
  message: {
    message: string
    status_code: number
  }
  errors: any[]
  status_code: number
}

