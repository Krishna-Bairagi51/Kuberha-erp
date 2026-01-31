// Shipping Feature Service
// Consolidated API calls for shipping management

import { get, post } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import { getUserType } from '@/lib/services/auth.service'

import type {
  ShipmentListResponse,
  ShipmentInsightsAndPerformanceResponse,
  ShipmentInsightsApiResponse,
  UserType,
  PaginationParams,
} from '../types/shipping.types'
import type {
  BoxDimensionResponse,
  ShippingItemsResponse,
} from '../../orders/types/orders.types'

interface CreateShiprocketOrderPayload {
  box_type: string | number
  order_id: string | number
  weight_kg: number
  declared_value: number
  length: number
  breadth: number
  height: number
  line_items: any[]
  line_ids: any[]
}

interface CreateShiprocketOrderResponse {
  status_code: number
  [key: string]: any
}

// ============================================================================
// Shipment List APIs
// ============================================================================

/**
 * Get shipment list - unified for both seller and admin
 * Supports server-side pagination with page and limit params
 */
export async function getShipments(userType?: UserType, pagination?: PaginationParams): Promise<ShipmentListResponse> {
  try {
    ensureAuthSession()
    
    const type = userType || getUserType() as UserType
    const endpoint = type === 'admin' 
      ? '/get_admin_shiprocket_sale_order_data'
      : '/get_seller_shiprocket_sale_order_data'
    
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    
    const res = await get<ShipmentListResponse>(
      endpoint, 
      Object.keys(params).length > 0 ? params : undefined, 
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get shipment by order ID - unified for both seller and admin
 */
export async function getShipmentByOrderId(
  orderId: number,
  userType?: UserType
): Promise<{ success: boolean; data?: ShipmentListResponse; message?: string }> {
  try {
    ensureAuthSession()
    
    const type = userType || getUserType() as UserType
    const endpoint = '/get_shiprocket_sale_order_data'
    
    const res = await get<ShipmentListResponse>(
      endpoint,
      { order_id: orderId },
      { cookieSession: true }
    )
    
    if (!res) return { success: false, message: 'Empty response from server' }
    if (res.status_code !== 200) return { success: false, message: 'Failed to fetch shipping data' }
    if (!res.record) return { success: false, message: 'Invalid response structure from server' }
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Failed to fetch shipping data' }
  }
}

/**
 * Get admin shipment by order ID - uses admin-specific endpoint
 * Used specifically in Shipping & Delivery / Shipment Details admin page
 */
export async function getAdminShipmentByOrderId(
  orderId: number
): Promise<{ success: boolean; data?: ShipmentListResponse; message?: string }> {
  try {
    ensureAuthSession()
    
    const endpoint = '/get_admin_shiprocket_sale_order_data'
    
    const res = await get<ShipmentListResponse>(
      endpoint,
      { order_id: orderId },
      { cookieSession: true }
    )
    
    if (!res) return { success: false, message: 'Empty response from server' }
    if (res.status_code !== 200) return { success: false, message: 'Failed to fetch shipping data' }
    if (!res.record) return { success: false, message: 'Invalid response structure from server' }
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Failed to fetch shipping data' }
  }
}

// ============================================================================
// Shipment Insights APIs
// ============================================================================

/**
 * Get shipment insights and performance metrics
 */
export async function getShipmentInsightsAndPerformance(
  timePeriod?: string
): Promise<{ success: boolean; data?: ShipmentInsightsApiResponse; message?: string }> {
  try {
    ensureAuthSession()
    
    const params: Record<string, string> = {}
    if (timePeriod) {
      params.time_period = timePeriod
    }
    
    const res = await get<ShipmentInsightsApiResponse>(
      '/get_shipment_insights_and_performance',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    
    if (!res) return { success: false, message: 'Empty response from server' }
    if (res.status_code !== 200) return { success: false, message: 'Failed to fetch insights data' }
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Failed to fetch insights data' }
  }
}

export async function getBoxDimensions(): Promise<BoxDimensionResponse> {
  try {
    ensureAuthSession()
    return await get<BoxDimensionResponse>(
      '/get_shiprocket_box_dimension',
      undefined,
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function getItemsForShipping(orderId: string | number): Promise<ShippingItemsResponse> {
  try {
    ensureAuthSession()
    return await get<ShippingItemsResponse>(
      '/get_items_for_shipping',
      { order_id: orderId },
      { cookieSession: true }
    )
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function createShiprocketOrder(
  payload: CreateShiprocketOrderPayload
): Promise<CreateShiprocketOrderResponse> {
  try {
    ensureAuthSession()
    return await post<CreateShiprocketOrderResponse>(
      '/create_shiprocket_order',
      payload,
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
 * Map API status to display status
 */
export function mapShipmentStatus(status: string): string {
  const statusLower = status?.toLowerCase() || ''
  
  if (statusLower.includes('transit')) return 'In Transit'
  if (statusLower.includes('delivered')) return 'Delivered'
  if (statusLower.includes('out for delivery') || statusLower.includes('out_for_delivery')) return 'Out for Delivery'
  if (statusLower.includes('exception') || statusLower.includes('rto') || statusLower.includes('ndr')) return 'Exceptions/RTO/NDR'
  if (statusLower.includes('pickup')) return 'Pickup Schedule'
  if (statusLower.includes('shipped')) return 'Shipped'
  if (statusLower.includes('ready')) return 'Ready to Ship'
  
  return status || 'N/A'
}

/**
 * Format status for display
 */
export function formatShipmentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pickup_scheduled': 'Pickup Scheduled',
    'pickup_done': 'Pickup Done',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out For Delivery',
    'delivered': 'Delivered'
  }

  if (statusMap[status.toLowerCase()]) {
    return statusMap[status.toLowerCase()]
  }

  // Fallback: Convert snake_case to Title Case
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// ============================================================================
// Export all as shippingService object
// ============================================================================

export const shippingService = {
  getShipments,
  getShipmentByOrderId,
  getAdminShipmentByOrderId,
  getShipmentInsightsAndPerformance,
  getBoxDimensions,
  getItemsForShipping,
  createShiprocketOrder,
  mapShipmentStatus,
  formatShipmentStatus,
}

