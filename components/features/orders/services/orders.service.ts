// Orders Feature Service
// ALL order-related API calls consolidated here

import { get, post } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import { getUserType } from '@/lib/services/auth.service'

import type {
  Order,
  OrderHistoryResponse,
  OrderSummaryResponse,
  OrderDetailResponse,
  AdminSaleOrderListResponse,
  AdminOrderSummaryResponse,
  OrderSummary,
  OrderHistoryResult,
  UserType,
  PaginationParams,
  SellerNameListResponse,
} from '../types/orders.types'

// ============================================================================
// Seller Order APIs
// ============================================================================

/**
 * Get seller order history
 * Supports server-side pagination with page and limit params
 */
export async function getSellerOrderHistory(pagination?: PaginationParams): Promise<OrderHistoryResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    
    const res = await get<OrderHistoryResponse>(
      '/get_seller_sale_order_list',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get seller order details by order ID
 */
export async function getSellerOrderDetails(orderId: number): Promise<OrderDetailResponse> {
  try {
    ensureAuthSession()
    const res = await get<OrderDetailResponse>(
      '/get_seller_sale_order_list',
      { order_id: orderId },
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get seller order summary
 */
export async function getSellerOrderSummary(): Promise<OrderSummaryResponse> {
  try {
    ensureAuthSession()
    const res = await get<OrderSummaryResponse>(
      '/get_order_summary',
      undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Admin Order APIs
// ============================================================================

/**
 * Get admin sale order list
 * Supports server-side pagination with page and limit params
 */
export async function getAdminOrderHistory(pagination?: PaginationParams): Promise<AdminSaleOrderListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    if (pagination?.vendor_id) params.vendor_id = pagination.vendor_id
    
    const res = await get<AdminSaleOrderListResponse>(
      '/get_admin_sale_order_list',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get seller name list
 * Returns array of seller objects with id and name
 */
export async function getSellerNameList(): Promise<SellerNameListResponse> {
  try {
    ensureAuthSession()
    const res = await get<SellerNameListResponse>(
      '/get_seller_name_list',
      undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get admin pending QC items (excludes 'new' status)
 * This is specifically for the "QC items are pending" table
 * Supports server-side pagination with page and limit params
 */
export async function getAdminPendingQCItems(pagination?: PaginationParams): Promise<AdminSaleOrderListResponse> {
  try {
    ensureAuthSession()
    const params: Record<string, string | number> = {
      excludestatus: 'new', // Hardcoded to exclude 'new' status
    }
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    if (pagination?.status) params.status = pagination.status
    
    const res = await get<AdminSaleOrderListResponse>(
      '/get_admin_sale_order_list',
      params,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get admin sale order details by order ID
 */
export async function getAdminOrderDetails(orderId: number): Promise<AdminSaleOrderListResponse> {
  try {
    ensureAuthSession()
    const res = await get<AdminSaleOrderListResponse>(
      '/get_admin_sale_order_list',
      { order_id: orderId },
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Get admin order summary
 */
export async function getAdminOrderSummary(): Promise<AdminOrderSummaryResponse> {
  try {
    ensureAuthSession()
    const res = await get<AdminOrderSummaryResponse>(
      '/get_order_summary',
      undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Unified APIs (auto-selects based on user type)
// ============================================================================

/**
 * Fetch order history - unified for both seller and admin
 * Supports server-side pagination with page and limit params
 */
export async function fetchOrderHistory(userType?: UserType, pagination?: PaginationParams): Promise<OrderHistoryResult> {
  const type = userType || getUserType() as UserType || 'seller'
  
  if (type === 'admin') {
    const result = await getAdminOrderHistory(pagination)
    
    if (result.status_code === 200 && Array.isArray(result.record)) {
      // Convert AdminSaleOrderItem[] to Order[] for compatibility
      const convertedOrders: Order[] = result.record.map((adminOrder) => ({
        ...adminOrder,
        activity_log: adminOrder.activity_log.map(log => ({
          type: log.type,
          note: log.note,
          qc_status: (log as any).qc_status,
          approved_by: log.approved_by,
          created_by: log.created_by,
          created_on: log.created_on,
          image: log.image
        }))
      }))
      
      return {
        orders: convertedOrders,
        totalCount: result.total_count || result.record.length,
        totalRecordCount: result.total_record_count,
      }
    }
    
    throw new Error('Invalid data format received from server')
  }

  // Seller flow
  const result = await getSellerOrderHistory(pagination)
  
  if (result.status_code === 200 && Array.isArray(result.record)) {
    return {
      orders: result.record,
      totalCount: result.total_count || result.count || result.record.length,
      totalRecordCount: result.total_record_count,
    }
  }
  
  throw new Error('Invalid data format received from server')
}

/**
 * Fetch order summary - unified for both seller and admin
 */
export async function fetchOrderSummary(userType?: UserType): Promise<OrderSummary> {
  const type = userType || getUserType() as UserType || 'seller'
  
  const res = type === 'admin' 
    ? await getAdminOrderSummary()
    : await getSellerOrderSummary()
  
  if (res.status_code === 200 && res.record) {
    return res.record as OrderSummary
  }
  
  throw new Error('Failed to fetch order summary')
}

/**
 * Fetch single order details - unified for both seller and admin
 */
export async function fetchOrderDetails(orderId: number, userType?: UserType): Promise<Order | null> {
  const type = userType || getUserType() as UserType || 'seller'
  
  const res = type === 'admin'
    ? await getAdminOrderDetails(orderId)
    : await getSellerOrderDetails(orderId)
  
  if (res.status_code === 200 && res.record) {
    const record = res.record
    return Array.isArray(record) ? record[0] : record
  }
  
  return null
}

// ============================================================================
// Export all as ordersService object
// ============================================================================

export const ordersService = {
  // Seller APIs
  getSellerOrderHistory,
  getSellerOrderDetails,
  getSellerOrderSummary,
  // Admin APIs
  getAdminOrderHistory,
  getAdminPendingQCItems,
  getAdminOrderDetails,
  getAdminOrderSummary,
  // Seller Name List API
  getSellerNameList,
  // Unified APIs
  fetchOrderHistory,
  fetchOrderSummary,
  fetchOrderDetails,
}
