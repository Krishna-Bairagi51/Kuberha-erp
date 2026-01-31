// Color Management Feature Service
// ALL color-related API calls consolidated here

import { get, post } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import type { 
  ColorCodeDashboardResponse,
  CreateColorCodeRequest,
  CreateColorCodeResponse,
} from '../types/color-management.types'

// ============================================================================
// Color Code Dashboard APIs
// ============================================================================

/**
 * Get color code dashboard data
 */
export async function getColorCodeDashboard(): Promise<ColorCodeDashboardResponse> {
  try {
    ensureAuthSession()

    const response = await get<ColorCodeDashboardResponse>(
      '/get_color_code_dashboard',
      undefined,
      { includeAuth: true }
    )

    return response
  } catch (err) {
    wrapAndThrow(err)
    throw err // TypeScript needs this even though wrapAndThrow throws
  }
}

// ============================================================================
// Create Color Code APIs
// ============================================================================

/**
 * Create a new color code
 */
export async function createColorCode(data: CreateColorCodeRequest): Promise<CreateColorCodeResponse> {
  try {
    ensureAuthSession()

    const response = await post<CreateColorCodeResponse>(
      '/create_color_code',
      {
        name: data.name,
        code: data.code,
      },
      { includeAuth: true }
    )

    return response
  } catch (err) {
    wrapAndThrow(err)
    throw err // TypeScript needs this even though wrapAndThrow throws
  }
}

// ============================================================================
// Export all as colorManagementService object
// ============================================================================

export const colorManagementService = {
  getColorCodeDashboard,
  createColorCode,
}

