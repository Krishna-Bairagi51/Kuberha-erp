// QC (Quality Control) Feature Service
// Consolidated API calls for QC management

import { get, post, postForm } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'

import type {
  ApproveQCResponse,
  RejectQCResponse,
  UpdateProcessStatusRequest,
  UpdateProcessStatusWithImagesRequest,
  UpdateProcessStatusResponse,
  QCInsightsApiResponse,
  PaginationParams,
} from '../types/qc.types'

interface QCListResponse {
  status_code: number
  record: any[]
  total_count?: number
  total_record_count?: number
}

// ============================================================================
// Admin QC Actions
// ============================================================================

/**
 * Approve QC (admin only)
 */
export async function approveQC(qcId: number, qcType: string): Promise<ApproveQCResponse> {
  try {
    ensureAuthSession()
    const body = { id: qcId, type: qcType }
    const res = await post<ApproveQCResponse>('/admin_qc_approval', body, { cookieSession: true })
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Reject QC (admin only)
 */
export async function rejectQC(
  qcId: number,
  qcType: string,
  reason: string
): Promise<RejectQCResponse> {
  try {
    ensureAuthSession()
    const body = { id: qcId, type: qcType, note: reason }
    const res = await post<RejectQCResponse>('/admin_qc_rejection', body, { cookieSession: true })
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Seller QC Actions
// ============================================================================

/**
 * Update process status (seller - no images)
 */
export async function updateProcessStatus(
  data: UpdateProcessStatusRequest
): Promise<UpdateProcessStatusResponse> {
  try {
    ensureAuthSession()
    const res = await post<UpdateProcessStatusResponse>(
      '/update_process_status',
      data,
      { cookieSession: true, contentType: 'text' }
    )
    return res
  } catch (err) {
    
    if (err instanceof TypeError && (err as Error).message.includes('fetch')) {
      return { status_code: 500, message: 'Network error. Please check your internet connection.' }
    }
    if (err instanceof Error) {
      return { status_code: 500, message: err.message }
    }
    return { status_code: 500, message: 'Failed to update process status. Please try again.' }
  }
}

/**
 * Update process status with images (seller)
 * Uses FormData to send files instead of base64
 */
export async function updateProcessStatusWithImages(
  data: UpdateProcessStatusWithImagesRequest
): Promise<UpdateProcessStatusResponse> {
  try {
    ensureAuthSession()
    
    // Create FormData for multipart/form-data request
    const formData = new FormData()
    formData.append('order_line_id', data.order_line_id.toString())
    formData.append('type', data.type)
    
    // Append each image file
    data.images.forEach((file, index) => {
      formData.append(`images`, file)
    })
    
    // Append note if provided
    if (data.note) {
      formData.append('note', data.note)
    }
    
    const res = await postForm<UpdateProcessStatusResponse>(
      '/update_process_status',
      formData,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    
    if (err instanceof TypeError && (err as Error).message.includes('fetch')) {
      return { status_code: 500, message: 'Network error. Please check your internet connection.' }
    }
    if (err instanceof Error) {
      return { status_code: 500, message: err.message }
    }
    return { status_code: 500, message: 'Failed to update process status with images. Please try again.' }
  }
}

// ============================================================================
// QC Insights APIs
// ============================================================================

/**
 * Get QC insights and performance data
 */
export async function getQCInsightsAndPerformance(): Promise<{ success: boolean; data?: QCInsightsApiResponse; message?: string }> {
  try {
    ensureAuthSession()
    const res = await get<QCInsightsApiResponse>(
      '/get_manufacturing_packaging_qc_insights_and_performance',
      undefined,
      { cookieSession: true }
    )
    if (!res) return { success: false, message: 'Empty response from server' }
    if (res.status_code !== 200) return { success: false, message: 'Failed to fetch QC insights data' }
    if (!res.record) return { success: false, message: 'Invalid response structure from server' }
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Failed to fetch QC insights' }
  }
}

/**
 * Get QC list (all submissions)
 * Supports server-side pagination with page and limit params
 */
export async function getQCList(pagination?: PaginationParams): Promise<QCListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    if (pagination?.type) params.type = pagination.type // Add type parameter for filtering by mfg_qc or pkg_qc
    
    return await get<QCListResponse>(
      '/get_manufacturing_packaging_qc_list',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get pending QC list (seller dashboard)
 * Hardcoded status=pending filter for the "Pending MFG QC" table
 * Supports server-side pagination with page and limit params
 */
export async function getSellerPendingQCList(pagination?: PaginationParams): Promise<QCListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {
      status: 'pending' // Hardcoded to only get pending QC items
    }
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.type) params.type = pagination.type // Add type parameter for filtering by mfg_qc or pkg_qc
    
    return await get<QCListResponse>(
      '/get_manufacturing_packaging_qc_list',
      params,
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get rejected QC list (seller dashboard)
 * Hardcoded status=rejected filter for the "MFG QC Rejected" table
 * Supports server-side pagination with page and limit params
 */
export async function getSellerRejectedQCList(pagination?: PaginationParams): Promise<QCListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {
      status: 'rejected' // Hardcoded to only get rejected QC items
    }
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.type) params.type = pagination.type // Add type parameter for filtering by mfg_qc or pkg_qc
    
    return await get<QCListResponse>(
      '/get_manufacturing_packaging_qc_list',
      params,
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get QC status display color
 */
export function getQCStatusColor(status: string): { bg: string; text: string; border: string } {
  const statusLower = status?.toLowerCase() || ''
  
  if (statusLower === 'approved' || statusLower === 'passed') {
    return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }
  }
  if (statusLower === 'rejected' || statusLower === 'failed') {
    return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }
  }
  // pending
  return { bg: '#FFEED0', text: '#E59213', border: '#FBE1B2' }
}

/**
 * Format QC type for display
 */
export function formatQCType(type: string): string {
  const typeMap: Record<string, string> = {
    'mfg': 'Manufacturing QC',
    'pkg': 'Packaging QC',
    'manufacturing': 'Manufacturing QC',
    'packaging': 'Packaging QC',
  }
  return typeMap[type.toLowerCase()] || type
}

// ============================================================================
// Export all as qcService object
// ============================================================================

export const qcService = {
  approveQC,
  rejectQC,
  updateProcessStatus,
  updateProcessStatusWithImages,
  getQCInsightsAndPerformance,
  getQCList,
  getSellerPendingQCList,
  getSellerRejectedQCList,
  getQCStatusColor,
  formatQCType,
}

