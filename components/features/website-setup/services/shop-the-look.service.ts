// Shop The Look Feature Service

import { get, post, postForm } from '@/lib/api/client'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import { wrapAndThrow } from '@/lib/api/error'
import type {
  GetLooksResponse,
  UpdateLookOrderResponse,
  UpdateLookSequenceResponse,
  DeleteLookResponse,
  RestoreLookResponse,
  Look,
  LookApiResponse,
} from '../types/shop-the-look.types'

// ============================================================================
// Dummy Data
// ============================================================================

const DUMMY_LOOKS: Look[] = [
  {
    id: 1,
    name: 'Modern Living Room Collection',
    image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    product_count: 5,
    max_products: 5,
    updated_at: '2024-01-20T00:00:00Z',
    created_at: '2024-01-15T00:00:00Z',
    order: 1,
    is_deleted: false,
    is_active: true,
  },
  {
    id: 2,
    name: 'Cozy Bedroom Retreat',
    image_url: 'https://images.unsplash.com/photo-1631889993954-53320d1e966e?w=800&h=600&fit=crop',
    product_count: 7,
    max_products: 5,
    updated_at: '2024-01-18T00:00:00Z',
    created_at: '2024-01-10T00:00:00Z',
    order: 2,
    is_deleted: false,
    is_active: true,
  },
  {
    id: 3,
    name: 'Minimalist Dining Space',
    image_url: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7c1?w=800&h=600&fit=crop',
    product_count: 4,
    max_products: 5,
    updated_at: '2024-01-12T00:00:00Z',
    created_at: '2024-01-05T00:00:00Z',
    order: 3,
    is_deleted: false,
    is_active: true,
  },
  {
    id: 4,
    name: 'Rustic Outdoor Patio',
    image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    product_count: 6,
    max_products: 5,
    updated_at: '2024-01-16T00:00:00Z',
    created_at: '2024-01-08T00:00:00Z',
    order: 4,
    is_deleted: false,
    is_active: true,
  },
  {
    id: 5,
    name: 'Industrial Home Office',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    product_count: 5,
    max_products: 5,
    updated_at: '2024-01-14T00:00:00Z',
    created_at: '2024-01-03T00:00:00Z',
    order: 5,
    is_deleted: false,
    is_active: true,
  },
  {
    id: 6,
    name: 'Scandinavian Nursery',
    image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67a0c?w=800&h=600&fit=crop',
    product_count: 9,
    max_products: 5,
    updated_at: '2024-01-11T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    order: 6,
    is_deleted: false,
    is_active: true,
  },
]

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ============================================================================
// Image Upload Types
// ============================================================================

export interface UploadProductImageResponse {
  message: {
    status_code: number
    message: string
    img_url: string
  }
  errors: string[]
  status_code: number
}

export interface DeleteProductImageResponse {
  message: string
  errors: string[]
  status_code: number
}

// ============================================================================
// Image Upload APIs
// ============================================================================

/**
 * Upload a single product image and get the URL
 * @param imageFile - The image file to upload
 * @returns Promise with the uploaded image URL
 */
export async function uploadProductImage(imageFile: File): Promise<string> {
  try {
    ensureAuthSession()
    
    const formData = new FormData()
    formData.append('image', imageFile)
    
    const res = await postForm<UploadProductImageResponse>(
      '/upload_product_image',
      formData,
      { cookieSession: true }
    )
    
    if (res.status_code === 200 && res.message?.img_url) {
      return res.message.img_url
    }
    
    throw new Error(res.message?.message || 'Failed to upload image')
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Upload multiple product images and get URLs
 * @param imageFiles - Array of image files to upload
 * @returns Promise with array of uploaded image URLs
 */
export async function uploadProductImages(imageFiles: File[]): Promise<string[]> {
  if (imageFiles.length === 0) return []
  
  const uploadPromises = imageFiles.map(file => uploadProductImage(file))
  return Promise.all(uploadPromises)
}

/**
 * Delete a product image by URL
 * @param imgUrl - The image URL to delete
 * @returns Promise with the deletion response
 */
export async function deleteProductImage(imgUrl: string): Promise<DeleteProductImageResponse> {
  try {
    ensureAuthSession()
    
    const res = await post<DeleteProductImageResponse>(
      '/delete_product_image',
      { img_url: imgUrl },
      { cookieSession: true }
    )
    
    if (res.status_code === 200) {
      return res
    }
    
    throw new Error(res.message || 'Failed to delete image')
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Shop The Look APIs (Dummy Implementation)
// ============================================================================

/**
 * Create shop the look info
 */
export interface CreateShopTheLookRequest {
  id?: number | string // Optional: include when updating existing look
  name: string
  sequence: number
  main_img_url: string
  product_list: Array<{
    id: number
    x_coordinate: number
    y_coordinate: number
  }>
}

export interface CreateShopTheLookResponse {
  status_code: number
  message: string
  errors?: string[]
  record?: Look
}

export async function createShopTheLookInfo(
  data: CreateShopTheLookRequest
): Promise<CreateShopTheLookResponse> {
  try {
    ensureAuthSession()
    const response = await post<CreateShopTheLookResponse>(
      '/create_shop_the_look_info',
      data,
      { cookieSession: true }
    )
    return response
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get shop the look info from API
 */
export async function getShopTheLookInfo(): Promise<LookApiResponse> {
  try {
    ensureAuthSession()
    const response = await get<LookApiResponse>(
      '/get_shop_the_look_info',
      undefined,
      { cookieSession: true }
    )
    return response
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get all active looks
 * Maps API response to GetLooksResponse format
 */
export async function getActiveLooks(): Promise<GetLooksResponse> {
  try {
    const response = await getShopTheLookInfo()
    
    if (response.status_code === 200 && response.record) {
      // Map API response to Look format
      const looks: Look[] = response.record.map((look) => ({
        id: look.id,
        name: look.name,
        image_url: look.image_url,
        product_count: look.product_list?.length || 0,
        max_products: 5,
        updated_at: new Date().toISOString(), // API doesn't provide this, use current date
        order: look.sequence || 0,
        sequence: look.sequence,
        is_deleted: false,
        is_active: true,
        product_list: look.product_list,
      }))
      
      // Sort by sequence (order)
      looks.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      
      return {
        looks,
        count: looks.length,
        record_count: response.count || looks.length,
      }
    }
    
    return {
      looks: [],
      count: 0,
      record_count: 0,
    }
  } catch (err) {
    console.error('Failed to fetch looks:', err)
    // Return empty response on error
    return {
      looks: [],
      count: 0,
      record_count: 0,
    }
  }
}

/**
 * Get all deleted looks
 * Currently API doesn't support deleted looks, return empty
 */
export async function getDeletedLooks(): Promise<GetLooksResponse> {
  // API doesn't provide deleted looks, return empty
  return {
    looks: [],
    count: 0,
    record_count: 0,
  }
}

/**
 * Update look order
 * Updates the order (sequence) of looks for website display
 */
export async function updateShopTheLookSequence(
  lookId: number | string,
  sequence: number
): Promise<UpdateLookSequenceResponse> {
  try {
    ensureAuthSession()

    const id = typeof lookId === 'string' ? Number(lookId) : lookId

    const res = await post<UpdateLookSequenceResponse>(
      '/update_shop_the_look_sequence',
      { id, sequence },
      { cookieSession: true }
    )

    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function updateLookOrder(
  looksInNewOrder: Array<{ id: number | string; sequence: number }>
): Promise<UpdateLookOrderResponse> {
  try {
    // API updates one record at a time; run updates in parallel.
    const results = await Promise.all(
      looksInNewOrder.map(({ id, sequence }) => updateShopTheLookSequence(id, sequence))
    )

    const firstError = results.find(r => r.status_code !== 200)
    if (firstError) {
      return {
        status_code: firstError.status_code,
        message: firstError.message || '',
      }
    }

    return {
      status_code: 200,
      message: 'Look order updated successfully',
    }
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Delete a look (soft delete)
 * Moves look to deleted state (dummy implementation)
 */
export async function deleteLook(
  lookId: number | string
): Promise<DeleteLookResponse> {
  try {
    ensureAuthSession()

    // API expects numeric id
    const id = typeof lookId === 'string' ? Number(lookId) : lookId

    const res = await post<DeleteLookResponse>(
      '/delete_shop_the_look_record',
      { id },
      { cookieSession: true }
    )

    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Restore a deleted look
 * Moves look back to active state (dummy implementation)
 */
export async function restoreLook(
  lookId: number | string
): Promise<RestoreLookResponse> {
  await delay(200) // Simulate network delay
  
  const look = DUMMY_LOOKS.find(l => l.id === lookId)
  if (look) {
    look.is_deleted = false
    look.is_active = true
    look.updated_at = new Date().toISOString()
    // Set order to end of list
    const maxOrder = Math.max(...DUMMY_LOOKS.filter(l => !l.is_deleted).map(l => l.order || 0), 0)
    look.order = maxOrder + 1
  }
  
  return {
    status_code: 200,
    message: 'Look restored successfully',
  }
}

// ============================================================================
// Product Selection APIs
// ============================================================================

export interface ShopTheLookProduct {
  id: number
  name: string
  price: number
  image?: string
}

export interface GetShopTheLookProductsResponse {
  message: string
  errors: string[]
  count: number
  record: ShopTheLookProduct[]
  status_code: number
}

/**
 * Get products for shop the look selection
 * @returns Promise with products list
 */
export async function getShopTheLookProducts(): Promise<GetShopTheLookProductsResponse> {
  try {
    ensureAuthSession()
    const response = await get<GetShopTheLookProductsResponse>(
      '/get_product_shop_the_look',
      undefined,
      { cookieSession: true }
    )
    return response
  } catch (err) {
    wrapAndThrow(err)
  }
}
