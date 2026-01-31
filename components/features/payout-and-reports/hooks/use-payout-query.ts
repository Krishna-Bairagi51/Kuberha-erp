'use client'

/**
 * Payout and Reports Query Hooks
 * 
 * TanStack Query powered payout hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Automatic cache invalidation
 * - Type-safe payout operations
 * - Reduced API calls through smart caching
 * - Optimized for time-period based queries
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { TimePeriod } from '@/components/shared'
import { fetchSalesOverview, fetchOrderStatusBreakdown, fetchTopCustomers, fetchRevenueTrend, fetchWhatsSelling, fetchGSTSnapshot, fetchSettlementDashboard } from '../services/sales-overview.service'
import { fetchSalesDetails, exportSalesReportToExcel, PaginationParams as SalesPaginationParams } from '../services/sales-details.service'
import { fetchSupplierPayoutOverview, fetchCommissionDetails, PaginationParams as PayoutPaginationParams } from '../services/supplier-payout.service'
import { useUserType } from '@/hooks/use-user-type'
import type { KPICard, StatusBreakdown, TopCustomer, RevenueDataPoint, SellingItem, GSTSnapshot, UpcomingSettlement } from '../types/sales-overview.types'
import type { SalesRow } from '../types/sales-details.types'
import type { PayoutKPI, PayoutRow } from '../types/supplier-payout.types'

// Re-export queryKeys for convenience
export { queryKeys }

// ============================================================================
// Sales Overview Queries
// ============================================================================

/**
 * Hook for fetching sales overview KPI data.
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts with same time period
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 */
export function useSalesOverviewQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  enabled: boolean = true
) {
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: queryKeys.payout.salesOverview(
      timePeriod,
      startDate,
      endDate
    ),
    queryFn: async () => {
      const result = await fetchSalesOverview(timePeriod, customDates)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.cards
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - sales data changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching order status breakdown data.
 * 
 * Benefits:
 * - Cached per time period and date range
 * - Instant display when switching between periods
 * - No loading spinner on revisit
 */
export function useOrderStatusBreakdownQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  enabled: boolean = true
) {
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: queryKeys.payout.orderStatusBreakdown(
      timePeriod,
      startDate,
      endDate
    ),
    queryFn: async () => {
      const result = await fetchOrderStatusBreakdown(timePeriod, customDates)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching top customers data.
 * 
 * Benefits:
 * - Cached per time period and date range
 * - Instant display when switching between periods
 * - No loading spinner on revisit
 */
export function useTopCustomersQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  enabled: boolean = true
) {
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: queryKeys.payout.topCustomers(
      timePeriod,
      startDate,
      endDate
    ),
    queryFn: async () => {
      const result = await fetchTopCustomers(timePeriod, customDates)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching revenue trend data.
 * 
 * Benefits:
 * - Cached per filter type (week/month)
 * - Instant display when switching between periods
 * - No loading spinner on revisit
 */
export function useRevenueTrendQuery(
  filterType: "week" | "month",
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.payout.revenueTrend(filterType),
    queryFn: async () => {
      const result = await fetchRevenueTrend(filterType)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching what's selling data.
 * 
 * Benefits:
 * - Cached per filter type (by_product/by_categ)
 * - Instant display when switching between filters
 * - No loading spinner on revisit
 */
export function useWhatsSellingQuery(
  filter: "by_product" | "by_categ",
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.payout.whatsSelling(filter),
    queryFn: async () => {
      const result = await fetchWhatsSelling(filter)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching GST snapshot data.
 * 
 * Benefits:
 * - Cached per time period and date range
 * - Instant display when switching between periods
 * - No loading spinner on revisit
 * - Automatically adjusts title based on user type (admin vs seller)
 */
export function useGSTSnapshotQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  enabled: boolean = true
) {
  const { userType } = useUserType()
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: queryKeys.payout.gstSnapshot(
      timePeriod,
      startDate,
      endDate
    ),
    queryFn: async () => {
      const result = await fetchGSTSnapshot(timePeriod, customDates, userType)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching settlement dashboard data.
 * 
 * Benefits:
 * - Cached per time period and date range
 * - Instant display when switching between periods
 * - No loading spinner on revisit
 */
export function useSettlementDashboardQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  enabled: boolean = true
) {
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: queryKeys.payout.settlementDashboard(
      timePeriod,
      startDate,
      endDate
    ),
    queryFn: async () => {
      const result = await fetchSettlementDashboard(timePeriod, customDates)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// ============================================================================
// Sales Details Queries
// ============================================================================

/**
 * Hook for fetching sales details table data.
 * 
 * Benefits:
 * - Cached per time period and date range
 * - Instant display when switching between periods
 * - No loading spinner on revisit
 * - Supports server-side pagination with page and limit params
 */
export function useSalesDetailsQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  enabled: boolean = true,
  pagination?: SalesPaginationParams
) {
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: pagination?.page !== undefined && pagination?.limit !== undefined
      ? [...queryKeys.payout.salesDetails(timePeriod, startDate, endDate), pagination.page, pagination.limit]
      : queryKeys.payout.salesDetails(timePeriod, startDate, endDate),
    queryFn: async () => {
      const result = await fetchSalesDetails(timePeriod, customDates, pagination)
      if (result.error) {
        throw new Error(result.error)
      }
      return {
        data: result.data,
        totalRecordCount: result.totalRecordCount ?? result.data.length,
      }
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for exporting sales report to Excel.
 * Note: This is a GET request but we use useQuery for consistency and caching.
 */
export function useExportSalesReportQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  enabled: boolean = false // Only fetch when explicitly enabled
) {
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: [...queryKeys.payout.salesDetails(timePeriod, startDate, endDate), 'export'] as const,
    queryFn: async () => {
      const result = await exportSalesReportToExcel(timePeriod, customDates)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.url
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - export URLs can be cached longer
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// Supplier Payout Queries
// ============================================================================

/**
 * Hook for fetching supplier payout overview KPI data.
 * 
 * Benefits:
 * - Cached per time period and date range
 * - Instant display when switching between periods
 */
export function useSupplierPayoutOverviewQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  enabled: boolean = true
) {
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: queryKeys.payout.supplierPayoutOverview(
      timePeriod,
      startDate,
      endDate
    ),
    queryFn: async () => {
      const result = await fetchSupplierPayoutOverview(timePeriod, customDates)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.kpis
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching commission details table data.
 * 
 * Benefits:
 * - Cached per time period, date range, and vendor name
 * - Instant display when switching between filters
 * - Supports server-side pagination with page and limit params
 */
export function useCommissionDetailsQuery(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  vendorId?: number,
  enabled: boolean = true,
  pagination?: PayoutPaginationParams
) {
  const { startDate, endDate } = getDateRange(timePeriod, customDates)
  
  return useQuery({
    queryKey: pagination?.page !== undefined && pagination?.limit !== undefined
      ? [...queryKeys.payout.commissionDetails(timePeriod, startDate, endDate, vendorId), pagination.page, pagination.limit]
      : queryKeys.payout.commissionDetails(timePeriod, startDate, endDate, vendorId),
    queryFn: async () => {
      const result = await fetchCommissionDetails(timePeriod, customDates, vendorId, pagination)
      if (result.error) {
        throw new Error(result.error)
      }
      return {
        data: result.data,
        totalRecordCount: result.totalRecordCount ?? result.data.length,
      }
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

/**
 * Hook for invalidating payout queries.
 * Useful for manual cache invalidation after mutations or data updates.
 */
export function useInvalidatePayoutQueries() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payout.all })
    },
    invalidateSalesOverview: (timePeriod?: TimePeriod, customDates?: { startDate: string; endDate: string }) => {
      if (timePeriod) {
        const { startDate, endDate } = getDateRange(timePeriod, customDates)
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.payout.salesOverview(timePeriod, startDate, endDate) 
        })
      } else {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.payout.all, 'salesOverview'] })
      }
    },
    invalidateSalesDetails: (timePeriod?: TimePeriod, customDates?: { startDate: string; endDate: string }) => {
      if (timePeriod) {
        const { startDate, endDate } = getDateRange(timePeriod, customDates)
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.payout.salesDetails(timePeriod, startDate, endDate) 
        })
      } else {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.payout.all, 'salesDetails'] })
      }
    },
    invalidateSupplierPayoutOverview: (timePeriod?: TimePeriod, customDates?: { startDate: string; endDate: string }) => {
      if (timePeriod) {
        const { startDate, endDate } = getDateRange(timePeriod, customDates)
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.payout.supplierPayoutOverview(timePeriod, startDate, endDate) 
        })
      } else {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.payout.all, 'supplierPayoutOverview'] })
      }
    },
    invalidateCommissionDetails: (timePeriod?: TimePeriod, customDates?: { startDate: string; endDate: string }, vendorId?: number) => {
      if (timePeriod) {
        const { startDate, endDate } = getDateRange(timePeriod, customDates)
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.payout.commissionDetails(timePeriod, startDate, endDate, vendorId) 
        })
      } else {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.payout.all, 'commissionDetails'] })
      }
    },
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper function to calculate date range based on time period.
 * Reused from service layer for consistency.
 */
function getDateRange(
  period: TimePeriod,
  customDates?: { startDate: string; endDate: string }
): { startDate: string; endDate: string } {
  const today = new Date()
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  if (period === "custom" && customDates) {
    return customDates
  }

  const endDate = formatDate(today)
  let startDate: string

  switch (period) {
    case "today":
      startDate = endDate
      break
    case "week":
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      startDate = formatDate(weekAgo)
      break
    case "month":
      const monthAgo = new Date(today)
      monthAgo.setMonth(today.getMonth() - 1)
      startDate = formatDate(monthAgo)
      break
    default:
      startDate = endDate
  }

  return { startDate, endDate }
}

