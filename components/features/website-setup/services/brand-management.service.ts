// Brand Management Feature Service
// API calls for brand management

import { get, postForm } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import type { SupplierListResponse } from '@/components/features/supplier-details/types/supplier.types'
import type { SupplierListItemWithImage } from '../types/brand-management.types'

// ============================================================================
// Response Normalization Helpers
// ============================================================================

const isSupplierListResponse = (data: unknown): data is SupplierListResponse => {
  if (!data || typeof data !== 'object') return false
  const payload = data as SupplierListResponse
  return Array.isArray(payload.record) && typeof payload.message === 'string'
}

const normalizeSupplierListResponse = (data: unknown): SupplierListResponse & { record: SupplierListItemWithImage[] } => {
  if (isSupplierListResponse(data)) {
    // Cast record to include image_url field
    return {
      ...data,
      record: data.record as SupplierListItemWithImage[]
    }
  }

  if (data && typeof data === 'object' && 'message' in data) {
    const nested = (data as { message?: unknown }).message
    if (isSupplierListResponse(nested)) {
      return {
        ...nested,
        record: nested.record as SupplierListItemWithImage[]
      }
    }
  }

  throw new Error('Unexpected supplier list response format')
}

// ============================================================================
// Brand Management APIs
// ============================================================================

/**
 * Get list of approved sellers/suppliers
 * Fetches sellers with status=approved from get_seller_info endpoint
 * Returns response with image_url field included in record items
 */
export async function getApprovedSellerList(): Promise<SupplierListResponse & { record: SupplierListItemWithImage[] }> {
  try {
    ensureAuthSession()
    const rawResult = await get<unknown>(
      '/get_seller_info',
      { status: 'approved' },
      { cookieSession: true }
    )
    return normalizeSupplierListResponse(rawResult)
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Update Brand Image API
// ============================================================================

export interface UpdateBrandImageResponse {
  status_code?: number
  message?: string
  image_url?: string
  banner_url?: string
}

/**
 * Helper function to convert image URL to File
 */
async function urlToFile(url: string, filename: string = 'image.jpg'): Promise<File> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type || 'image/jpeg' })
}

/**
 * Update seller brand image and banner
 * POST /update_seller_brand_image
 * FormData: { image: File, cover_image: File, id: string, brand_name: string, description: string }
 * 
 * @param id - Seller/Brand ID
 * @param brandName - Brand name
 * @param description - Brand description
 * @param imageFile - Brand logo image file (optional)
 * @param imageUrl - Existing brand logo URL (used if imageFile is not provided)
 * @param coverImageFile - Banner/cover image file (optional)
 * @param coverImageUrl - Existing banner URL (used if coverImageFile is not provided)
 */
export async function updateSellerBrandImage(
  id: number | string,
  brandName: string,
  description: string,
  imageFile?: File | null,
  imageUrl?: string | null,
  coverImageFile?: File | null,
  coverImageUrl?: string | null
): Promise<UpdateBrandImageResponse> {
  try {
    ensureAuthSession()
    
    const formData = new FormData()
    
    // Add id as string
    formData.append('id', String(id))
    
    // Add brand_name
    formData.append('brand_name', brandName)
    
    // Add description
    formData.append('description', description)
    
    // Handle brand logo image (image)
    if (imageFile) {
      formData.append('image', imageFile)
    } else if (imageUrl) {
      // Fetch existing image and convert to File
      const fileToUse = await urlToFile(imageUrl, 'brand-logo.jpg')
      formData.append('image', fileToUse)
    }
    
    // Handle banner/cover image (cover_image)
    if (coverImageFile) {
      formData.append('cover_image', coverImageFile)
    } else if (coverImageUrl) {
      // Fetch existing banner and convert to File
      const fileToUse = await urlToFile(coverImageUrl, 'brand-banner.jpg')
      formData.append('cover_image', fileToUse)
    }
    
    // Use postForm for multipart/form-data
    const response = await postForm<UpdateBrandImageResponse>(
      '/update_seller_brand_image',
      formData,
      { cookieSession: true }
    )
    
    return response
  } catch (err) {
    wrapAndThrow(err)
  }
}

