'use client'

/**
 * Dashboard Query Hooks
 * 
 * TanStack Query powered dashboard hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Automatic cache invalidation
 * - Type-safe dashboard operations
 * - Reduced API calls through smart caching
 * - Optimized for dashboard data freshness
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import {
  getSellerSummary,
  getSellerInsights,
  getRecentOrders,
  getGraphData,
  getTopCustomers,
  getTopCategories,
  getOrderCountSummary,
} from '../services/dashboard.service'
import type {
  SellerSummary,
  SellerInsights,
  ApiRecentOrder,
  GraphDataResponse,
  TopCustomerRecord,
  TopCategoryRecord,
  OrderCountRecord,
} from '../types/dashboard.types'

// Re-export queryKeys for convenience
export { queryKeys }

// ============================================================================
// Summary & Insights Queries
// ============================================================================

/**
 * Hook for fetching seller/admin summary data.
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated
 * - Fresh data: Dashboard summary updates frequently, so shorter stale time
 */
export function useSellerSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: async () => {
      const data = await getSellerSummary()
      return data
    },
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Refetch on reconnect to get latest data
  })
}

/**
 * Hook for fetching seller/admin insights data.
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated
 */
export function useSellerInsightsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.dashboard.insights(),
    queryFn: async () => {
      const data = await getSellerInsights()
      return data
    },
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Refetch on reconnect to get latest data
  })
}

// ============================================================================
// Recent Orders Query
// ============================================================================

interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

interface RecentOrdersResult {
  orders: ApiRecentOrder[]
  totalRecordCount: number
}

/**
 * Hook for fetching recent orders.
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Sorted: Orders are automatically sorted by date (latest first)
 * - Smart refetch: Only refetches when explicitly invalidated
 * - Supports server-side pagination with page and limit params
 */
export function useRecentOrdersQuery(
  options?: { enabled?: boolean },
  pagination?: PaginationParams
) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentOrders(pagination?.page, pagination?.limit, pagination?.search),
    queryFn: async (): Promise<RecentOrdersResult> => {
      const data = await getRecentOrders(pagination)
      if (data?.status_code !== 200) {
        throw new Error('Unexpected response status')
      }
      const ordersList = Array.isArray(data.record) ? data.record : []
      
      return {
        orders: ordersList as ApiRecentOrder[],
        totalRecordCount: data.total_record_count ?? data.total_count ?? ordersList.length,
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 1 * 60 * 1000, // 1 minute - recent orders change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// ============================================================================
// Graph Data Query
// ============================================================================

/**
 * Hook for fetching graph data (sales & purchase).
 * 
 * Benefits:
 * - Cached per date range: Different date ranges are cached separately
 * - Instant display when switching between date ranges
 * - No loading spinner on revisit of same date range
 */
export function useGraphDataQuery(
  startDate: string,
  endDate: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.dashboard.graphData(startDate, endDate),
    queryFn: async () => {
      const result = await getGraphData(startDate, endDate)
      if (!result || result.status_code !== 200 || !Array.isArray(result.data)) {
        throw new Error('Invalid graph response')
      }
      return result.data
    },
    enabled: (options?.enabled ?? true) && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes - graph data is relatively stable
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Graph data doesn't need to refetch on reconnect
  })
}

// ============================================================================
// Top Customers Query
// ============================================================================

/**
 * Hook for fetching top customers (admin only).
 * 
 * Benefits:
 * - Cached per date range: Different date ranges are cached separately
 * - Instant display when switching between date ranges
 * - No loading spinner on revisit of same date range
 */
export function useTopCustomersQuery(
  startDate?: string,
  endDate?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.dashboard.topCustomers(startDate, endDate),
    queryFn: async () => {
      const response = await getTopCustomers(startDate, endDate)
      if (response.status_code === 200) {
        return response.record || []
      }
      throw new Error('Failed to fetch customers')
    },
    enabled: (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

// ============================================================================
// Top Categories Query
// ============================================================================

/**
 * Hook for fetching top categories (admin only).
 * 
 * Benefits:
 * - Cached per date range: Different date ranges are cached separately
 * - Instant display when switching between date ranges
 * - No loading spinner on revisit of same date range
 */
export function useTopCategoriesQuery(
  startDate?: string,
  endDate?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.dashboard.topCategories(startDate, endDate),
    queryFn: async () => {
      const response = await getTopCategories(startDate, endDate)
      if (response.status_code === 200) {
        return response.record || []
      }
      throw new Error('Failed to fetch categories')
    },
    enabled: (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

// ============================================================================
// Order Count Summary Query
// ============================================================================

/**
 * Hook for fetching order count summary (admin only).
 * 
 * Benefits:
 * - Cached per date range: Different date ranges are cached separately
 * - Instant display when switching between date ranges
 * - No loading spinner on revisit of same date range
 */
export function useOrderCountSummaryQuery(
  startDate?: string,
  endDate?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.dashboard.orderCountSummary(startDate, endDate),
    queryFn: async () => {
      const response = await getOrderCountSummary(startDate, endDate)
      if (response.status_code === 200) {
        return response.record || []
      }
      throw new Error('Failed to fetch order statistics')
    },
    enabled: (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Combined hook for summary and insights (for backward compatibility).
 * 
 * This hook combines both summary and insights queries for convenience.
 */
export function useDashboardQuery(options?: { enabled?: boolean }) {
  const summaryQuery = useSellerSummaryQuery(options)
  const insightsQuery = useSellerInsightsQuery(options)

  return {
    summary: summaryQuery.data ?? null,
    summaryLoading: summaryQuery.isLoading,
    summaryError: summaryQuery.error ? (summaryQuery.error as Error).message : null,
    insights: insightsQuery.data ?? null,
    insightsLoading: insightsQuery.isLoading,
    insightsError: insightsQuery.error ? (insightsQuery.error as Error).message : null,
    hasError: !!summaryQuery.error || !!insightsQuery.error,
    errorMessage: summaryQuery.error 
      ? (summaryQuery.error as Error).message 
      : insightsQuery.error 
        ? (insightsQuery.error as Error).message 
        : null,
    refreshSummary: () => summaryQuery.refetch(),
    refreshInsights: () => insightsQuery.refetch(),
    refreshAll: async () => {
      await Promise.all([summaryQuery.refetch(), insightsQuery.refetch()])
    },
    formatINR: (value: number) => {
      const formatter = new Intl.NumberFormat('en-IN')
      return `₹${formatter.format(Math.round(value))}`
    },
  }
}

