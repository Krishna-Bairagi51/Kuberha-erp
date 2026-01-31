// Dashboard Feature Service
// ALL dashboard-related API calls consolidated here

import { get } from '@/lib/api/client'
import { wrapAndThrow } from '@/lib/api/error'
import { ensureAuthSession } from '@/lib/api/helpers/auth'
import type {
  SellerSummary,
  SellerInsights,
  SellerSummaryResponse,
  SellerInsightsResponse,
  TopCategoryRecord,
  TopCustomerRecord,
  OrderCountRecord,
} from '../types/dashboard.types'

interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

interface RecentOrderResponse {
  status_code: number
  record: any[]
  total_count?: number
  total_record_count?: number
}

interface GraphDataResponse {
  status_code: number
  sales_amount: number
  earning_amount: number
  data: Array<{ date: string; sale_amt: number; earn_amt: number }>
}

// ============================================================================
// Summary & Insights APIs
// ============================================================================

/**
 * Fetch seller/admin summary data
 */
export async function getSellerSummary(): Promise<SellerSummary> {
  try {
    ensureAuthSession()

    const response = await get<SellerSummaryResponse>(
      '/get_seller_summary',
      undefined,
      { cookieSession: true }
    )

    if (response.status_code !== 200) {
      throw new Error('Invalid summary response')
    }

    return {
      total_earning: Number(response.total_earning || 0),
      order_shipped: Number(response.order_shipped || 0),
      order_delivered: Number(response.order_delivered || 0),
      new_orders: Number(response.new_orders || 0),
      pickup_today: Number(response.pickup_today || 0),
    }
  } catch (err) {
    wrapAndThrow(err)
  }
}

/**
 * Fetch seller/admin insights data
 */
export async function getSellerInsights(): Promise<SellerInsights> {
  try {
    ensureAuthSession()

    const response = await get<SellerInsightsResponse>(
      '/get_seller_insights',
      undefined,
      { cookieSession: true }
    )

    if (response.status_code !== 200) {
      throw new Error('Invalid insights response')
    }

    return {
      pending_mfg_pkg_qc: Number(response.pending_mfg_pkg_qc || 0),
      rejected_mfg_pkg_qc: Number(response.rejected_mfg_pkg_qc || 0),
      timelines_at_risk: Number(response.timelines_at_risk || 0),
      ready_to_ship: Number(response.ready_to_ship || 0),
      pickup_today: Number(response.pickup_today || 0),
    }
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Admin Dashboard Analytics APIs
// ============================================================================

interface TopCategoriesResponse {
  status_code: number
  record: TopCategoryRecord[]
  count: number
}

interface OrderCountSummaryResponse {
  status_code: number
  record: OrderCountRecord[]
  count: number
}

interface TopCustomersResponse {
  status_code: number
  record: TopCustomerRecord[]
  count: number
}

/**
 * Get top categories (admin only)
 */
export async function getTopCategories(
  startDate?: string,
  endDate?: string
): Promise<TopCategoriesResponse> {
  try {
    ensureAuthSession()
    
    const params: Record<string, string> = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    
    const response = await get<TopCategoriesResponse>(
      '/get_top_categories',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    
    return response
  } catch (err) {
    return { status_code: 500, record: [], count: 0 }
  }
}

/**
 * Get order count summary (admin only)
 */
export async function getOrderCountSummary(
  startDate?: string,
  endDate?: string
): Promise<OrderCountSummaryResponse> {
  try {
    ensureAuthSession()
    
    const params: Record<string, string> = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    
    const response = await get<OrderCountSummaryResponse>(
      '/order_count_summary',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    
    return response
  } catch (err) {
    return { status_code: 500, record: [], count: 0 }
  }
}

/**
 * Get top customers (admin only)
 */
export async function getTopCustomers(
  startDate?: string,
  endDate?: string
): Promise<TopCustomersResponse> {
  try {
    ensureAuthSession()
    
    const params: Record<string, string> = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    
    const response = await get<TopCustomersResponse>(
      '/get_top_customers',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    
    return response
  } catch (err) {
    return { status_code: 500, record: [], count: 0 }
  }
}

/**
 * Get recent orders - supports server-side pagination
 */
export async function getRecentOrders(pagination?: PaginationParams): Promise<RecentOrderResponse> {
  try {
    ensureAuthSession()
    
    const params: Record<string, string | number> = {}
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search
    
    const res = await get<RecentOrderResponse>(
      '/get_seller_wise_recent_orders',
      Object.keys(params).length > 0 ? params : undefined,
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

export async function getGraphData(
  startDate: string,
  endDate: string
): Promise<GraphDataResponse> {
  try {
    ensureAuthSession()
    const res = await get<GraphDataResponse>(
      '/get_graph_data',
      { start_date: startDate, end_date: endDate },
      { cookieSession: true }
    )
    return res
  } catch (err) {
    wrapAndThrow(err)
  }
}

// ============================================================================
// Export all as dashboardService object
// ============================================================================

export const dashboardService = {
  getSellerSummary,
  getSellerInsights,
  getTopCategories,
  getOrderCountSummary,
  getTopCustomers,
  getRecentOrders,
  getGraphData,
}

