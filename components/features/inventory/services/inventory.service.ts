// Inventory Feature Service
// Consolidated API calls for inventory management

import { get, post, postForm } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import { getUserType } from '@/lib/services/auth.service'

import type {
  InventoryItemRequest,
  InventoryItemResponse,
  InventoryFormData,
  ProductListResponse,
  AdminProductListResponse,
  ProductDetailsResponse,
  UpdateProductStatusResponse,
  UserType,
  PaginationParams,
} from '../types/inventory.types'

import type { ExtractedProduct } from '@/types/domains/ai'

// Lightweight util to normalize arrays
const extractRecords = (response: any): any[] => {
  if (Array.isArray(response?.record)) return response.record
  if (Array.isArray(response?.result)) return response.result
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.ecomCategories)) return response.ecomCategories
  if (Array.isArray(response)) return response
  return []
}

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
export interface DeleteProductImageResponse {
  message: string
  errors: string[]
  status_code: number
}

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
// Product List APIs
// ============================================================================

/**
 * Get seller product list
 */
export async function getSellerProducts(pagination?: PaginationParams): Promise<ProductListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    
    const res = await get<ProductListResponse>(
      '/get_product_list',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get admin product list (all products)
 */
export async function getAdminProducts(pagination?: PaginationParams): Promise<AdminProductListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    if (pagination?.vendor_id) params.vendor_id = pagination.vendor_id
    
    const res = await get<AdminProductListResponse>(
      '/get_all_product_list',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get product list - unified for both seller and admin
 */
export async function getProducts(userType?: UserType, pagination?: PaginationParams): Promise<ProductListResponse | AdminProductListResponse> {
  const type = userType || getUserType() as UserType
  if (type === 'admin') {
    return getAdminProducts(pagination)
  }
  return getSellerProducts(pagination)
}

/**
 * Get vendor-specific product list (admin only)
 */
export async function getVendorProducts(vendorId: number, pagination?: PaginationParams): Promise<AdminProductListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = { vendor_id: vendorId }
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    if (pagination?.category) params.category = pagination.category
    
    const res = await get<AdminProductListResponse>(
      '/get_all_product_list',
      params,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Fetch vendor-specific pending products (draft and pending status).
 * This is separate from the main vendor products query to ensure pending items
 * are always visible regardless of filters applied to the main table.
 * 
 * Note: Currently fetches only 'draft' status. If 'pending' status also needs
 * to be included, we may need to make separate API calls and combine results.
 */
export async function getVendorPendingProducts(vendorId: number, pagination?: PaginationParams): Promise<AdminProductListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = { 
      vendor_id: vendorId,
      status: 'draft' // Fetch draft products (pending for approval)
    }
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    
    const res = await get<AdminProductListResponse>(
      '/get_all_product_list',
      params,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get supplier/seller list (admin only)
 */
export async function getSupplierList(pagination?: PaginationParams): Promise<AdminProductListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    
    const res = await get<AdminProductListResponse>(
      '/get_seller_list',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get admin draft products (pending approvals)
 * Uses /get_all_product_list with hardcoded status=draft
 * Specifically for pending approvals table
 */
export async function getAdminDraftProducts(pagination?: PaginationParams): Promise<AdminProductListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {
      status: 'draft' // Hardcoded to only get draft products
    }
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    
    const res = await get<AdminProductListResponse>(
      '/get_all_product_list',
      params,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function getDraftProducts(pagination?: PaginationParams): Promise<ProductListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = { status: 'draft' }
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    
    const res = await get<ProductListResponse>(
      '/get_product_list',
      params,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function getEcomCategories(): Promise<any[]> {
  try {
    ensureAuthSession()
    const res = await get<any>(
      '/get_ecom_category_list',
      undefined,
      { cookieSession: true }
    )
    return extractRecords(res)
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function exportProductRecord(vendorId?: string | number): Promise<any[]> {
  try {
    ensureAuthSession()
    const queryParams: Record<string, string | number> = {}
    // Only add vendor_id to query params if provided (i.e., when seller is logged in)
    if (vendorId !== undefined && vendorId !== null && vendorId !== '') {
      queryParams.vendor_id = vendorId
    }
    const res = await get<any>(
      '/export_product_record',
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
      { cookieSession: true }
    )
    return extractRecords(res?.record ?? res)
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function createBulkProductRecord(products: ExtractedProduct[]): Promise<any> {
  try {
    ensureAuthSession()
    const productsWithDraftStatus = products.map((product) => ({
      ...product,
      item_status: 'draft'
    }))
    const res = await post<any>(
      '/create_bulk_product_record',
      { product_list: productsWithDraftStatus },
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Product Details APIs
// ============================================================================

/**
 * Get product details by ID
 */
export async function getProductDetails(productId: number): Promise<ProductDetailsResponse> {
  try {
    ensureAuthSession()
    const res = await get<ProductDetailsResponse>(
      '/get_product_record',
      { id: productId },
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Product CRUD APIs
// ============================================================================

/**
 * Add new inventory item (seller)
 */
export async function addInventoryItem(data: InventoryItemRequest): Promise<InventoryItemResponse> {
  try {
    ensureAuthSession()
    const res = await post<InventoryItemResponse>(
      '/create_product_record',
      data,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    
    // Return error response for graceful handling
    if (err instanceof TypeError && (err as Error).message.includes('fetch')) {
      return {
        status_code: 500,
        message: 'Network error. Please check your internet connection.',
        record: data
      }
    }
    
    if (err instanceof Error) {
      return {
        status_code: 500,
        message: err.message,
        record: data
      }
    }
    
    return {
      status_code: 500,
      message: 'Failed to add product to inventory. Please try again.',
      record: data
    }
  }
}

/**
 * Update existing inventory item
 */
export async function updateInventoryItem(
  productId: number,
  data: InventoryItemRequest
): Promise<InventoryItemResponse> {
  try {
    ensureAuthSession()
    const res = await post<InventoryItemResponse>(
      `/update_product_record?id=${productId}`,
      data,
      { cookieSession: true, timeoutMs: 1800_000 } // 30 minutes timeout for product updates
    )
    return res
  } catch (err) {
    if (err instanceof TypeError && (err as Error).message.includes('fetch')) {
      return {
        status_code: 500,
        message: 'Network error. Please check your internet connection.',
        record: data
      }
    }
    
    if (err instanceof Error) {
      return {
        status_code: 500,
        message: err.message,
        record: data
      }
    }
    
    return {
      status_code: 500,
      message: 'Failed to update product. Please try again.',
      record: data
    }
  }
}

/**
 * Update product status (admin only - approve/reject)
 */
export async function updateProductStatus(
  productId: number,
  status: string,
  rejectReason: string = ''
): Promise<UpdateProductStatusResponse> {
  try {
    ensureAuthSession()
    const res = await get<UpdateProductStatusResponse>(
      '/change_product_status',
      { id: productId, state: status, rejection_notes: rejectReason },
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Delete vendor product request record (draft items only)
 */
export async function deleteVendorProductRequest(productId: number): Promise<any> {
  try {
    ensureAuthSession()
    const res = await post<any>(
      '/delete_vendor_product_request_record',
      { id: productId.toString() },
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Form Data APIs
// ============================================================================

/**
 * Fetch all form data needed for inventory forms
 */
export async function fetchInventoryFormData(): Promise<InventoryFormData> {
  try {
    ensureAuthSession()

    const [
      categories,
      uom,
      tax,
      variantOptions,
      packageType,
      collections,
      finish,
      boxType,
      usageType,
      productMaterial,
    ] = await Promise.all([
      get<any>('/get_category_list', undefined, { cookieSession: true }),
      get<any>('/get_uom_uom_list', undefined, { cookieSession: true }),
      get<any>('/get_tax_list', undefined, { cookieSession: true }),
      get<any>('/get_variant_options', undefined, { cookieSession: true }),
      get<any>('/get_shopify_package_type', undefined, { cookieSession: true }),
      get<any>('/get_ecom_category_list', undefined, { cookieSession: true }),
      get<any>('/get_product_finishing', undefined, { cookieSession: true }),
      get<any>('/get_shiprocket_box_dimension', undefined, { cookieSession: true }),
      get<any>('/get_shopify_usage_type', undefined, { cookieSession: true }),
      get<any>('/get_product_materials', undefined, { cookieSession: true }),
    ])

    const ecomCategories = extractRecords(categories)
    const boxTypeRecords = extractRecords(boxType)
    const boxTypesMapped = boxTypeRecords.map((item: any) => ({
      id: item.id,
      name: item.box_type || item.name,
      box_volumetric_weight: item.box_volumetric_weight ?? 0
    }))

    return {
      categories: extractRecords(categories),
      ecomCategories,
      uomList: extractRecords(uom),
      taxList: extractRecords(tax),
      variantOptions: extractRecords(variantOptions),
      packageTypes: extractRecords(packageType),
      collections: extractRecords(collections),
      finishes: extractRecords(finish),
      boxTypes: boxTypesMapped,
      usageTypes: extractRecords(usageType),
      productMaterials: extractRecords(productMaterial)
    }
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Export all as inventoryService object for convenient importing
// ============================================================================

export const inventoryService = {
  uploadProductImage,
  uploadProductImages,
  getSellerProducts,
  getAdminProducts,
  getAdminDraftProducts,
  getProducts,
  getVendorProducts,
  getVendorPendingProducts,
  getSupplierList,
  getDraftProducts,
  getEcomCategories,
  exportProductRecord,
  createBulkProductRecord,
  getProductDetails,
  addInventoryItem,
  updateInventoryItem,
  updateProductStatus,
  deleteVendorProductRequest,
  fetchInventoryFormData,
  deleteProductImage,
}