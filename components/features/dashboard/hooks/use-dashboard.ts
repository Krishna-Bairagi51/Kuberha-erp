"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  TimePeriod,
} from '../types/dashboard.types'

interface UseDashboardOptions {
  /** Polling interval in milliseconds (default: 15000) */
  pollingInterval?: number
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean
}

interface UseDashboardReturn {
  // Summary data
  summary: SellerSummary | null
  summaryLoading: boolean
  summaryError: string | null

  // Insights data
  insights: SellerInsights | null
  insightsLoading: boolean
  insightsError: string | null

  // Combined error state
  hasError: boolean
  errorMessage: string | null

  // Actions
  refreshSummary: () => Promise<void>
  refreshInsights: () => Promise<void>
  refreshAll: () => Promise<void>

  // Formatting utilities
  formatINR: (value: number) => string
}

/**
 * Custom hook for dashboard data management
 *
 * @example
 * ```tsx
 * const { summary, insights, hasError, refreshAll } = useDashboard()
 * ```
 */
export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const { pollingInterval = 15000, enablePolling = true } = options

  // Summary state
  const [summary, setSummary] = useState<SellerSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // Insights state
  const [insights, setInsights] = useState<SellerInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  // INR formatter
  const inrFormatter = useMemo(() => new Intl.NumberFormat('en-IN'), [])
  const formatINR = useCallback(
    (value: number) => `₹${inrFormatter.format(Math.round(value))}`,
    [inrFormatter]
  )

  // Fetch summary
  const refreshSummary = useCallback(async () => {
    try {
      setSummaryLoading(true)
      setSummaryError(null)
      const data = await getSellerSummary()
      setSummary(data)
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to fetch summary')
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  // Fetch insights
  const refreshInsights = useCallback(async () => {
    try {
      setInsightsLoading(true)
      setInsightsError(null)
      const data = await getSellerInsights()
      setInsights(data)
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Failed to fetch insights')
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshSummary(), refreshInsights()])
  }, [refreshSummary, refreshInsights])

  // Initial fetch
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Combined error state
  const hasError = Boolean(summaryError || insightsError)
  const errorMessage = summaryError || insightsError || null

  return {
    summary,
    summaryLoading,
    summaryError,
    insights,
    insightsLoading,
    insightsError,
    hasError,
    errorMessage,
    refreshSummary,
    refreshInsights,
    refreshAll,
    formatINR,
  }
}

export default useDashboard

// ============================================================================
// Recent Orders Hook
// ============================================================================

interface UseRecentOrdersReturn {
  orders: ApiRecentOrder[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for fetching recent orders
 */
export function useRecentOrders(): UseRecentOrdersReturn {
  const [orders, setOrders] = useState<ApiRecentOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRecentOrders()
      if (data?.status_code !== 200) throw new Error('Unexpected response status')
      const ordersList = Array.isArray(data.record) ? data.record : []
      // Sort orders by date (latest first)
      const sortedOrders = ordersList.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA // Descending order (latest first)
      })
      setOrders(sortedOrders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { orders, loading, error, refresh }
}

// ============================================================================
// Graph Data Hook
// ============================================================================

interface UseGraphDataOptions {
  startDate: string
  endDate: string
  enabled?: boolean
}

interface UseGraphDataReturn {
  data: GraphDataResponse['data']
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for fetching graph data
 */
export function useGraphData(
  options: UseGraphDataOptions
): UseGraphDataReturn {
  const { startDate, endDate, enabled = true } = options
  const [data, setData] = useState<GraphDataResponse['data']>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)
    try {
      const result = await getGraphData(startDate, endDate)

      if (!result || result.status_code !== 200 || !Array.isArray(result.data)) {
        throw new Error('Invalid graph response')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch graph data')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}

// ============================================================================
// Top Customers Hook
// ============================================================================

interface UseTopCustomersOptions {
  startDate?: string
  endDate?: string
  enabled?: boolean
}

interface UseTopCustomersReturn {
  customers: TopCustomerRecord[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for fetching top customers
 */
export function useTopCustomers(
  options: UseTopCustomersOptions = {}
): UseTopCustomersReturn {
  const { startDate, endDate, enabled = true } = options
  const [customers, setCustomers] = useState<TopCustomerRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)
    try {
      const response = await getTopCustomers(startDate, endDate)
      if (response.status_code === 200) {
        setCustomers(response.record || [])
      } else {
        setError('Failed to fetch customers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { customers, loading, error, refresh }
}

// ============================================================================
// Top Categories Hook
// ============================================================================

interface UseTopCategoriesOptions {
  startDate?: string
  endDate?: string
  enabled?: boolean
}

interface UseTopCategoriesReturn {
  categories: TopCategoryRecord[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for fetching top categories
 */
export function useTopCategories(
  options: UseTopCategoriesOptions = {}
): UseTopCategoriesReturn {
  const { startDate, endDate, enabled = true } = options
  const [categories, setCategories] = useState<TopCategoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)
    try {
      const response = await getTopCategories(startDate, endDate)
      if (response.status_code === 200) {
        setCategories(response.record || [])
      } else {
        setError('Failed to fetch categories')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { categories, loading, error, refresh }
}

// ============================================================================
// Order Count Summary Hook
// ============================================================================

interface UseOrderCountSummaryOptions {
  startDate?: string
  endDate?: string
  enabled?: boolean
}

interface UseOrderCountSummaryReturn {
  orderCounts: OrderCountRecord[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for fetching order count summary
 */
export function useOrderCountSummary(
  options: UseOrderCountSummaryOptions = {}
): UseOrderCountSummaryReturn {
  const { startDate, endDate, enabled = true } = options
  const [orderCounts, setOrderCounts] = useState<OrderCountRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)
    try {
      const response = await getOrderCountSummary(startDate, endDate)
      if (response.status_code === 200) {
        setOrderCounts(response.record || [])
      } else {
        setError('Failed to fetch order statistics')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch order statistics'
      )
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { orderCounts, loading, error, refresh }
}

