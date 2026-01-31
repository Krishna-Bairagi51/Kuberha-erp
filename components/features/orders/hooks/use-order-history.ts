"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOrderHistoryQuery, useNewOrdersQuery, useOrderSummaryQuery, useInvalidateOrdersQueries } from './use-orders-query'
import { useDebounce } from '@/hooks/use-debounce'
import type { Order, PaginationParams } from '../types/orders.types'
import type { OrderSummary } from '../types/orders.types'
import { formatDateTime } from '@/lib/api/helpers/misc'
import { useUnifiedTable, type PaginationState } from '@/hooks/table'
import { mapApiToTableData } from '@/lib/utils/table'

// Helper function to calculate total pages from total_record_count
function calculateTotalPages(totalRecordCount: number, limit: number): number {
  return Math.max(1, Math.ceil(totalRecordCount / limit))
}

// Helper function to generate page numbers with ellipsis
function generatePageNumbers(currentPage: number, totalPages: number): Array<number | string> {
  const pages: Array<number | string> = []
  const maxVisiblePages = 5

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, '...', totalPages)
    return pages
  }

  if (currentPage >= totalPages - 2) {
    pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    return pages
  }

  pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
  return pages
}

interface UseOrderHistoryOptions {
  userType: 'seller' | 'admin'
  /** Whether to enable the queries (default: true). Set to false when showing detail page. */
  enabled?: boolean
}

interface UseOrderHistoryReturn {
  // Data
  orders: Order[]
  summary: OrderSummary
  
  // Loading states - combined (for initial page load)
  isLoading: boolean
  isFetching: boolean
  error: string | null
  
  // Separate loading states for each table
  allOrdersLoading: boolean
  allOrdersFetching: boolean
  newOrdersLoading: boolean
  newOrdersFetching: boolean
  
  // Pagination for all orders (server-side)
  allOrdersPagination: PaginationState & {
    paginatedOrders: Order[]
    displayOrders: Order[]
    setCurrentPage: (page: number) => void
    setItemsPerPage: (items: number) => void
  }
  
  // Pagination for new orders (server-side filtered by status='new')
  newOrdersPagination: PaginationState & {
    paginatedOrders: Order[]
    displayOrders: Order[]
    setCurrentPage: (page: number) => void
    setItemsPerPage: (items: number) => void
  }
  
  // Search
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  vendorFilter: string
  setVendorFilter: (vendorId: string) => void
  newOrdersSearchTerm: string
  setNewOrdersSearchTerm: (term: string) => void
  
  // Actions
  refresh: () => Promise<void>
  
  // Utilities
  formatDate: (dateString: string) => string
  getProductNames: (order: Order) => string
  getSellerNames: (order: Order) => string
  
  // Server pagination data
  totalRecordCount: number
  newOrdersTotalRecordCount: number
}

/**
 * Custom hook for order history data management
 * 
 * Now powered by TanStack Query for:
 * - Automatic caching
 * - Background refetching
 * - Optimistic updates
 * - Reduced API calls
 * - Server-side pagination
 */
export function useOrderHistory({ userType, enabled = true }: UseOrderHistoryOptions): UseOrderHistoryReturn {
  // Read initial filter and pagination state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        orderSearch: '',
        orderPage: 1,
        orderItemsPerPage: 10,
        orderStatus: '',
        orderVendorId: '',
        newOrderSearch: '',
        newOrderPage: 1,
        newOrderItemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      orderSearch: urlParams.get('orderSearch') || '',
      orderPage: parseInt(urlParams.get('orderPage') || '1', 10),
      orderItemsPerPage: parseInt(urlParams.get('orderItemsPerPage') || '10', 10),
      orderStatus: urlParams.get('orderStatus') || '',
      orderVendorId: urlParams.get('orderVendorId') || '',
      newOrderSearch: urlParams.get('newOrderSearch') || '',
      newOrderPage: parseInt(urlParams.get('newOrderPage') || '1', 10),
      newOrderItemsPerPage: parseInt(urlParams.get('newOrderItemsPerPage') || '10', 10),
    }
  }, [])

  // Initialize state from URL parameters
  const initialUrlParams = getUrlParams()

  // Server-side pagination state for all orders
  const [serverPage, setServerPage] = useState(initialUrlParams.orderPage)
  const [serverLimit, setServerLimit] = useState(initialUrlParams.orderItemsPerPage)
  const [serverSearch, setServerSearch] = useState(initialUrlParams.orderSearch)
  const [serverStatus, setServerStatus] = useState(initialUrlParams.orderStatus)
  // Vendor ID filter (admin only)
  const [serverVendorId, setServerVendorId] = useState<string>(initialUrlParams.orderVendorId)

  // Server-side pagination state for new orders
  const [newOrdersServerPage, setNewOrdersServerPage] = useState(initialUrlParams.newOrderPage)
  const [newOrdersServerLimit, setNewOrdersServerLimit] = useState(initialUrlParams.newOrderItemsPerPage)
  const [newOrdersServerSearch, setNewOrdersServerSearch] = useState(initialUrlParams.newOrderSearch)

  // Debounce search to avoid excessive API calls
  const debouncedServerSearch = useDebounce(serverSearch, 500)
  const debouncedNewOrdersSearch = useDebounce(newOrdersServerSearch, 500)

  // Create pagination params for API call with debounced search
  const paginationParams: PaginationParams = useMemo(() => {
    const params: PaginationParams = {
      page: serverPage,
      limit: serverLimit,
      search: debouncedServerSearch || undefined,
      status: serverStatus || undefined,
    }
    // Only include vendor_id for admin users
    if (userType === 'admin' && serverVendorId) {
      const vendorIdNum = parseInt(serverVendorId, 10)
      if (!isNaN(vendorIdNum)) {
        params.vendor_id = vendorIdNum
      }
    }
    return params
  }, [serverPage, serverLimit, debouncedServerSearch, serverStatus, serverVendorId, userType])

  // Create pagination params for new orders API call with debounced search
  const newOrdersPaginationParams: PaginationParams = useMemo(() => ({
    page: newOrdersServerPage,
    limit: newOrdersServerLimit,
    search: debouncedNewOrdersSearch || undefined,
  }), [newOrdersServerPage, newOrdersServerLimit, debouncedNewOrdersSearch])

  // TanStack Query hooks - data is cached and shared across components
  // Only fetch when enabled (e.g., not when showing detail page)
  
  // Query for ALL ORDERS (without status filter)
  const { 
    data: ordersResult, 
    isLoading: isLoadingOrders,
    isFetching: isFetchingOrders,
    error: ordersError 
  } = useOrderHistoryQuery(userType, enabled, paginationParams)
  
  // Separate query for NEW ORDERS ONLY (status='new')
  const { 
    data: newOrdersResult, 
    isLoading: isLoadingNewOrders,
    isFetching: isFetchingNewOrders,
    error: newOrdersError 
  } = useNewOrdersQuery(userType, enabled, newOrdersPaginationParams)
  
  const { 
    data: summaryData, 
    isLoading: isLoadingSummary,
    isFetching: isFetchingSummary 
  } = useOrderSummaryQuery(userType, enabled)
  
  const { invalidateHistory, invalidateNewOrders, invalidateSummary } = useInvalidateOrdersQueries()

  // Initialize state from URL parameters
  const urlParams = getUrlParams()
  
  // Extract orders from query response (ALL ORDERS)
  // The query returns OrderHistoryResult with orders array, already sorted by date
  const orders = useMemo(() => {
    if (!ordersResult?.orders) return []
    // Sort by date (latest first)
    return [...ordersResult.orders].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA // Descending order (latest first)
    })
  }, [ordersResult])

  // Extract NEW ORDERS from separate query (server-filtered by status='new')
  const newOrders = useMemo(() => {
    if (!newOrdersResult?.orders) return []
    // Sort by date (latest first)
    return [...newOrdersResult.orders].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA // Descending order (latest first)
    })
  }, [newOrdersResult])

  // Get total_record_count from API response for server-side pagination
  const totalRecordCount = ordersResult?.totalRecordCount ?? orders.length
  const newOrdersTotalRecordCount = newOrdersResult?.totalRecordCount ?? newOrders.length

  // Server-side pagination calculations for all orders
  const serverTotalPages = useMemo(() => 
    calculateTotalPages(totalRecordCount, serverLimit), 
    [totalRecordCount, serverLimit]
  )

  const serverPageNumbers = useMemo(() => 
    generatePageNumbers(serverPage, serverTotalPages),
    [serverPage, serverTotalPages]
  )
  
  // Utility functions for search
  const getProductNames = useCallback((order: Order): string => {
    if (!order.order_line || order.order_line.length === 0) {
      return "No products"
    }
    return order.order_line.map(line => line.product_name).join(", ")
  }, [])

  const getSellerNames = useCallback((order: Order): string => {
    if (!order.order_line || order.order_line.length === 0) {
      return "-"
    }
    const sellerNames = order.order_line
      .map(line => line.seller_name)
      .filter((name): name is string => name !== undefined && name !== null && name !== "")
    const uniqueSellerNames = [...new Set(sellerNames)]
    return uniqueSellerNames.length > 0 ? uniqueSellerNames.join(", ") : "-"
  }, [])

  // Note: Search is now handled server-side via pagination params
  // Client-side filtering removed to use server-side search

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    orderSearch?: string
    orderPage?: number
    orderItemsPerPage?: number
    orderStatus?: string
    orderVendorId?: string
    newOrderSearch?: string
    newOrderPage?: number
    newOrderItemsPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    // Only update URL params if we're on the order-history page (file-based route or tab query)
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    const isOrderHistoryPage = pathname.includes('/order-history') || tab === 'order-history'
    if (!isOrderHistoryPage) return
    
    if (updates.orderSearch !== undefined) {
      if (updates.orderSearch) {
        url.searchParams.set('orderSearch', updates.orderSearch)
      } else {
        url.searchParams.delete('orderSearch')
      }
    }
    
    if (updates.orderPage !== undefined) {
      if (updates.orderPage > 1) {
        url.searchParams.set('orderPage', String(updates.orderPage))
      } else {
        url.searchParams.delete('orderPage')
      }
    }
    
    if (updates.orderItemsPerPage !== undefined) {
      if (updates.orderItemsPerPage !== 10) {
        url.searchParams.set('orderItemsPerPage', String(updates.orderItemsPerPage))
      } else {
        url.searchParams.delete('orderItemsPerPage')
      }
    }
    
    if (updates.orderStatus !== undefined) {
      if (updates.orderStatus) {
        url.searchParams.set('orderStatus', updates.orderStatus)
      } else {
        url.searchParams.delete('orderStatus')
      }
    }
    
    if (updates.orderVendorId !== undefined) {
      if (updates.orderVendorId) {
        url.searchParams.set('orderVendorId', updates.orderVendorId)
      } else {
        url.searchParams.delete('orderVendorId')
      }
    }
    
    if (updates.newOrderSearch !== undefined) {
      if (updates.newOrderSearch) {
        url.searchParams.set('newOrderSearch', updates.newOrderSearch)
      } else {
        url.searchParams.delete('newOrderSearch')
      }
    }
    
    if (updates.newOrderPage !== undefined) {
      if (updates.newOrderPage > 1) {
        url.searchParams.set('newOrderPage', String(updates.newOrderPage))
      } else {
        url.searchParams.delete('newOrderPage')
      }
    }
    
    if (updates.newOrderItemsPerPage !== undefined) {
      if (updates.newOrderItemsPerPage !== 10) {
        url.searchParams.set('newOrderItemsPerPage', String(updates.newOrderItemsPerPage))
      } else {
        url.searchParams.delete('newOrderItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Server-side pagination calculations for new orders
  const newOrdersTotalPages = useMemo(() => 
    calculateTotalPages(newOrdersTotalRecordCount, newOrdersServerLimit), 
    [newOrdersTotalRecordCount, newOrdersServerLimit]
  )

  const newOrdersPageNumbers = useMemo(() => 
    generatePageNumbers(newOrdersServerPage, newOrdersTotalPages),
    [newOrdersServerPage, newOrdersTotalPages]
  )

  // Server-side pagination handlers for new orders
  const handleNewOrdersPageChange = useCallback((page: number) => {
    if (page < 1 || page > newOrdersTotalPages) return
    setNewOrdersServerPage(page)
    updateUrlParams({ newOrderPage: page })
  }, [newOrdersTotalPages, updateUrlParams])

  const handleNewOrdersLimitChange = useCallback((limit: number) => {
    setNewOrdersServerLimit(limit)
    setNewOrdersServerPage(1)
    updateUrlParams({ newOrderItemsPerPage: limit, newOrderPage: 1 })
  }, [updateUrlParams])

  const handleNewOrdersPreviousPage = useCallback(() => {
    if (newOrdersServerPage > 1) {
      handleNewOrdersPageChange(newOrdersServerPage - 1)
    }
  }, [newOrdersServerPage, handleNewOrdersPageChange])

  const handleNewOrdersNextPage = useCallback(() => {
    if (newOrdersServerPage < newOrdersTotalPages) {
      handleNewOrdersPageChange(newOrdersServerPage + 1)
    }
  }, [newOrdersServerPage, newOrdersTotalPages, handleNewOrdersPageChange])

  // Pagination state object for new orders (server-side)
  const newOrdersPagination = useMemo(() => ({
    currentPage: newOrdersServerPage,
    itemsPerPage: newOrdersServerLimit,
    totalPages: newOrdersTotalPages,
    pageNumbers: newOrdersPageNumbers,
    setCurrentPage: handleNewOrdersPageChange,
    setItemsPerPage: handleNewOrdersLimitChange,
    handlePreviousPage: handleNewOrdersPreviousPage,
    handleNextPage: handleNewOrdersNextPage,
    goToFirstPage: () => handleNewOrdersPageChange(1),
    goToLastPage: () => handleNewOrdersPageChange(newOrdersTotalPages),
    canGoPrevious: newOrdersServerPage > 1,
    canGoNext: newOrdersServerPage < newOrdersTotalPages,
  }), [
    newOrdersServerPage, 
    newOrdersServerLimit, 
    newOrdersTotalPages, 
    newOrdersPageNumbers, 
    handleNewOrdersPageChange, 
    handleNewOrdersLimitChange, 
    handleNewOrdersPreviousPage, 
    handleNewOrdersNextPage
  ])

  // Server-side pagination handlers for all orders
  const handleServerPageChange = useCallback((page: number) => {
    if (page < 1 || page > serverTotalPages) return
    setServerPage(page)
    updateUrlParams({ orderPage: page })
  }, [serverTotalPages, updateUrlParams])

  // Status filter handler
  const handleStatusFilterChange = useCallback((status: string) => {
    setServerStatus(status)
    setServerPage(1) // Reset to first page when filter changes
    updateUrlParams({ orderStatus: status, orderPage: 1 })
  }, [updateUrlParams])

  // Vendor filter handler (admin only)
  const handleVendorFilterChange = useCallback((vendorId: string) => {
    setServerVendorId(vendorId)
    setServerPage(1) // Reset to first page when filter changes
    updateUrlParams({ orderVendorId: vendorId, orderPage: 1 })
  }, [updateUrlParams])

  const handleServerLimitChange = useCallback((limit: number) => {
    setServerLimit(limit)
    setServerPage(1)
    updateUrlParams({ orderItemsPerPage: limit, orderPage: 1 })
  }, [updateUrlParams])

  const handleServerPreviousPage = useCallback(() => {
    if (serverPage > 1) {
      handleServerPageChange(serverPage - 1)
    }
  }, [serverPage, handleServerPageChange])

  const handleServerNextPage = useCallback(() => {
    if (serverPage < serverTotalPages) {
      handleServerPageChange(serverPage + 1)
    }
  }, [serverPage, serverTotalPages, handleServerPageChange])

  // Server-side pagination state object for all orders
  const serverPagination = useMemo(() => ({
    currentPage: serverPage,
    itemsPerPage: serverLimit,
    totalPages: serverTotalPages,
    pageNumbers: serverPageNumbers,
    setCurrentPage: handleServerPageChange,
    setItemsPerPage: handleServerLimitChange,
    handlePreviousPage: handleServerPreviousPage,
    handleNextPage: handleServerNextPage,
    goToFirstPage: () => handleServerPageChange(1),
    goToLastPage: () => handleServerPageChange(serverTotalPages),
    canGoPrevious: serverPage > 1,
    canGoNext: serverPage < serverTotalPages,
  }), [
    serverPage, 
    serverLimit, 
    serverTotalPages, 
    serverPageNumbers, 
    handleServerPageChange, 
    handleServerLimitChange, 
    handleServerPreviousPage, 
    handleServerNextPage
  ])

  // Extract summary from query response
  const summary = useMemo(() => {
    if (!summaryData) {
      return {
        new_order: 0,
        mfg_qc_pending: 0,
        qc_rejected: 0,
        pickup_today: 0,
        ready_to_ship: 0,
      }
    }
    return summaryData
  }, [summaryData])

  // Error handling
  const error = ordersError ? (ordersError instanceof Error ? ordersError.message : 'Failed to fetch Order History') : null
  const newOrdersErrorMessage = newOrdersError ? (newOrdersError instanceof Error ? newOrdersError.message : 'Failed to fetch New Orders') : null

  // Utility function
  const formatDate = useCallback((dateString: string) => {
    return formatDateTime(dateString)
  }, [])

  // Refresh function - invalidates queries to trigger refetch
  const refresh = useCallback(async () => {
    invalidateHistory(userType)
    invalidateNewOrders(userType)
    invalidateSummary(userType)
    // Reset pagination on refresh
    setServerPage(1)
    setNewOrdersServerPage(1)
  }, [invalidateHistory, invalidateNewOrders, invalidateSummary, userType])

  // Restore state from URL when URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      // Only restore if we're on the order-history tab
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      if (tab === 'order-history') {
        const params = getUrlParams()
        // Restore all orders state (server-side pagination)
        if (serverPage !== params.orderPage) {
          setServerPage(params.orderPage)
        }
        if (serverLimit !== params.orderItemsPerPage) {
          setServerLimit(params.orderItemsPerPage)
        }
        if (serverSearch !== params.orderSearch) {
          setServerSearch(params.orderSearch)
        }
        if (serverStatus !== params.orderStatus) {
          setServerStatus(params.orderStatus)
        }
        if (serverVendorId !== params.orderVendorId) {
          setServerVendorId(params.orderVendorId)
        }
        // Restore new orders state
        if (newOrdersServerSearch !== params.newOrderSearch) {
          setNewOrdersServerSearch(params.newOrderSearch)
        }
        if (newOrdersServerPage !== params.newOrderPage) {
          setNewOrdersServerPage(params.newOrderPage)
        }
        if (newOrdersServerLimit !== params.newOrderItemsPerPage) {
          setNewOrdersServerLimit(params.newOrderItemsPerPage)
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getUrlParams, serverPage, serverLimit, serverSearch, serverStatus, serverVendorId, newOrdersServerSearch, newOrdersServerPage, newOrdersServerLimit])

  // Sync URL parameters when state changes
  useEffect(() => {
    updateUrlParams({
      orderSearch: serverSearch,
      orderPage: serverPage,
      orderItemsPerPage: serverLimit,
      orderStatus: serverStatus,
      orderVendorId: serverVendorId,
      newOrderSearch: newOrdersServerSearch,
      newOrderPage: newOrdersServerPage,
      newOrderItemsPerPage: newOrdersServerLimit,
    })
  }, [serverSearch, serverPage, serverLimit, serverStatus, serverVendorId, newOrdersServerSearch, newOrdersServerPage, newOrdersServerLimit, updateUrlParams])

  return {
    orders,
    summary,
    // Combined loading states (for initial page load check)
    isLoading: isLoadingOrders || isLoadingNewOrders || isLoadingSummary,
    isFetching: isFetchingOrders || isFetchingNewOrders || isFetchingSummary,
    error,
    // Separate loading states for each table (complete separation of concerns)
    allOrdersLoading: isLoadingOrders,
    allOrdersFetching: isFetchingOrders,
    newOrdersLoading: isLoadingNewOrders,
    newOrdersFetching: isFetchingNewOrders,
    // Server-side pagination for all orders
    allOrdersPagination: {
      ...serverPagination,
      paginatedOrders: orders, // Items from API are already paginated by server
      displayOrders: orders,
    } as PaginationState & { paginatedOrders: Order[]; displayOrders: Order[]; setCurrentPage: (page: number) => void; setItemsPerPage: (items: number) => void },
    // Server-side pagination for new orders (separate API call with status='new')
    newOrdersPagination: {
      ...newOrdersPagination,
      paginatedOrders: newOrders, // Items from API are already paginated and filtered by server
      displayOrders: newOrders,
    } as PaginationState & { paginatedOrders: Order[]; displayOrders: Order[]; setCurrentPage: (page: number) => void; setItemsPerPage: (items: number) => void },
    searchTerm: serverSearch,
    setSearchTerm: (term: string) => {
      setServerSearch(term)
      setServerPage(1) // Reset to first page when search changes
      updateUrlParams({ orderSearch: term, orderPage: 1 })
    },
    statusFilter: serverStatus,
    setStatusFilter: handleStatusFilterChange,
    vendorFilter: serverVendorId,
    setVendorFilter: handleVendorFilterChange,
    // New Orders uses server-side search (independent from All Orders)
    newOrdersSearchTerm: newOrdersServerSearch,
    setNewOrdersSearchTerm: (term: string) => {
      setNewOrdersServerSearch(term)
      setNewOrdersServerPage(1) // Reset to first page when search changes
      updateUrlParams({ newOrderSearch: term, newOrderPage: 1 })
    },
    refresh,
    formatDate,
    getProductNames,
    getSellerNames,
    // Additional server pagination data
    totalRecordCount,
    newOrdersTotalRecordCount,
  }
}

export default useOrderHistory

