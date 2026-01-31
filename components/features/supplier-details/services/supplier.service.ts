// Supplier Details Feature Service
// Admin-only API calls for supplier management

import { get, post, postForm } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'

import type {
  SupplierListResponse,
  SupplierDetailResponse,
  UpdateSupplierStateResponse,
  StatesResponse,
  PaginationParams,
} from '../types/supplier.types'

interface GenerateAgreementResponse {
  status_code: number
  agreement_url?: string
  message?: string
}

// ============================================================================
// Response Normalization Helpers
// ============================================================================

const isSupplierListResponse = (data: unknown): data is SupplierListResponse => {
  if (!data || typeof data !== 'object') return false
  const payload = data as SupplierListResponse
  return Array.isArray(payload.record) && typeof payload.message === 'string'
}

const normalizeSupplierListResponse = (data: unknown): SupplierListResponse => {
  if (isSupplierListResponse(data)) {
    return data
  }

  if (data && typeof data === 'object' && 'message' in data) {
    const nested = (data as { message?: unknown }).message
    if (isSupplierListResponse(nested)) {
      return nested
    }
  }

  throw new Error('Unexpected supplier list response format')
}

const isSupplierDetailResponse = (data: unknown): data is SupplierDetailResponse => {
  if (!data || typeof data !== 'object') return false
  const payload = data as SupplierDetailResponse
  return Array.isArray(payload.record) && typeof payload.message === 'string'
}

const normalizeSupplierDetailResponse = (data: unknown): SupplierDetailResponse => {
  if (isSupplierDetailResponse(data)) {
    return data
  }

  if (data && typeof data === 'object' && 'message' in data) {
    const nested = (data as { message?: unknown }).message
    if (isSupplierDetailResponse(nested)) {
      return nested
    }
  }

  throw new Error('Unexpected supplier detail response format')
}

// ============================================================================
// Supplier List APIs
// ============================================================================

/**
 * Get list of all suppliers (admin only)
 * Supports server-side pagination with page and limit params
 */
export async function getSupplierList(pagination?: PaginationParams): Promise<SupplierListResponse> {
  try {
    ensureAuthSession()
    
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    
    const rawResult = await get<unknown>(
      '/get_seller_info', 
      Object.keys(params).length > 0 ? params : undefined, 
      { cookieSession: true }
    )
    return normalizeSupplierListResponse(rawResult)
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get supplier details by seller ID (admin only)
 */
export async function getSupplierById(supplierId: string): Promise<SupplierDetailResponse> {
  try {
    ensureAuthSession()
    const rawResult = await get<unknown>('/get_seller_info', { id: supplierId }, { cookieSession: true })
    return normalizeSupplierDetailResponse(rawResult)
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Supplier State Management APIs
// ============================================================================

/**
 * Update supplier state (admin only)
 * Used to change seller_state (e.g., from 'rejected' to 'draft' for retry)
 */
export async function updateSupplierState(
  supplierId: string | number,
  state: string
): Promise<UpdateSupplierStateResponse> {
  try {
    ensureAuthSession()
    const res = await post<UpdateSupplierStateResponse>(
      '/update_seller_state',
      {
        seller_id: String(supplierId),
        seller_state: state,
      },
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Generate vendor agreement (admin only)
 */
export async function generateVendorAgreement(
  vendorId: string | number,
  commission?: string | number
): Promise<GenerateAgreementResponse> {
  try {
    ensureAuthSession()
    return await get<GenerateAgreementResponse>(
      '/generate_vendor_agreement',
      {
        vendor_id: vendorId,
        commission,
      },
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// States API
// ============================================================================

/**
 * Get list of all states
 */
export async function getStates(): Promise<StatesResponse> {
  try {
    ensureAuthSession()
    const rawResult = await get<StatesResponse>('/get_states', undefined, { cookieSession: true })
    return rawResult
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Create Seller API
// ============================================================================

export interface CreateSellerRequest {
  email: string
  name: string
  mobile: string
  address: string
  city: string
  zip: string
  state_id: number
  password: string
}

export interface CreateSellerResponse {
  status_code: number
  message?: string
  record?: any
}

/**
 * Create a new seller/supplier
 */
export async function createSeller(data: CreateSellerRequest): Promise<CreateSellerResponse> {
  try {
    ensureAuthSession()
    const res = await post<CreateSellerResponse>(
      '/create_seller',
      data,
      { 
        cookieSession: true,
        contentType: 'text' // API expects text/plain content type
      }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get supplier status display info
 */
export function getSupplierStatusInfo(status: string): {
  label: string
  color: string
  bgColor: string
  borderColor: string
} {
  const statusLower = status?.toLowerCase() || ''
  
  switch (statusLower) {
    case 'approved':
      return {
        label: 'Approved',
        color: '#065F46',
        bgColor: '#D1FAE5',
        borderColor: '#A7F3D0'
      }
    case 'rejected':
      return {
        label: 'Rejected',
        color: '#991B1B',
        bgColor: '#FEE2E2',
        borderColor: '#FECACA'
      }
    case 'suspended':
      return {
        label: 'Suspended',
        color: '#92400E',
        bgColor: '#FEF3C7',
        borderColor: '#FDE68A'
      }
    case 'pending':
    default:
      return {
        label: 'Pending',
        color: '#E59213',
        bgColor: '#FFEED0',
        borderColor: '#FBE1B2'
      }
  }
}

/**
 * Format organisation type for display
 */
export function formatOrganisationType(type: string): string {
  const typeMap: Record<string, string> = {
    'proprietorship': 'Proprietorship',
    'partnership': 'Partnership',
    'llp': 'LLP',
    'private_limited': 'Private Limited',
    'public_limited': 'Public Limited',
    'one_person_company': 'One Person Company',
    'other': 'Other'
  }
  return typeMap[type?.toLowerCase()] || type || '-'
}

// ============================================================================
// Export all as supplierService object
// ============================================================================

export const supplierService = {
  getSupplierList,
  getSupplierById,
  updateSupplierState,
  generateVendorAgreement,
  getStates,
  createSeller,
  getSupplierStatusInfo,
  formatOrganisationType,
}

