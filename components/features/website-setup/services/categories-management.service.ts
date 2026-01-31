// Categories Management Feature Service
// ALL category-related API calls consolidated here

import { get, post, postForm } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import type { CategoryManagementResponse } from '../types/categories-management.types'

// ============================================================================
// Category Management APIs
// ============================================================================

/**
 * Get category management list
 */
export async function getCategoryManagementList(): Promise<CategoryManagementResponse> {
  try {
    ensureAuthSession()

    const response = await get<CategoryManagementResponse>(
      '/get_category_management_list',
      undefined,
      { includeAuth: true }
    )

    return response
  } catch (err) {
    wrapAndThrow(err)
    throw err // TypeScript needs this even though wrapAndThrow throws
  }
}

/**
 * Update category
 * @param id - Category ID
 * @param image - Image file (FormData)
 */
export interface UpdateCategoryRequest {
  id: number
  image: File
}

export interface UpdateCategoryResponse {
  message: string
  status_code: number
  errors?: any[]
}

export async function updateCategory(data: UpdateCategoryRequest): Promise<UpdateCategoryResponse> {
  try {
    ensureAuthSession()

    // Create FormData for multipart/form-data request
    const formData = new FormData()
    formData.append('id', data.id.toString())
    formData.append('image', data.image)

    const response = await postForm<UpdateCategoryResponse>(
      '/update_category',
      formData,
      { includeAuth: true }
    )

    return response
  } catch (err) {
    wrapAndThrow(err)
    throw err // TypeScript needs this even though wrapAndThrow throws
  }
}

// ============================================================================
// Export all as categoriesManagementService object
// ============================================================================

export const categoriesManagementService = {
  getCategoryManagementList,
  updateCategory,
}

