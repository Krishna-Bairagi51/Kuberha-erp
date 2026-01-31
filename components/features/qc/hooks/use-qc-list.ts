import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { queryKeys } from '@/lib/query'
import { qcService } from '../services/qc.service'
import { ordersService } from '@/components/features/orders/services/orders.service'
import type { UserType, PaginationParams } from '../types/qc.types'
import type { AdminSaleOrderItem } from '@/components/features/orders/types/orders.types'

/**
 * Query key factory for QC list
 * Uses centralized query keys for consistency
 */
export const qcListKeys = {
  all: () => queryKeys.qc.list(),
  seller: (page?: number, limit?: number, search?: string, status?: string, type?: string) => [...queryKeys.qc.list(page, limit, search), 'seller', status, type] as const,
  sellerPending: (page?: number, limit?: number, search?: string, type?: string) => [...queryKeys.qc.list(page, limit, search), 'seller-pending', type] as const,
  sellerRejected: (page?: number, limit?: number, search?: string, type?: string) => [...queryKeys.qc.list(page, limit, search), 'seller-rejected', type] as const,
  admin: (page?: number, limit?: number, search?: string, status?: string, vendor_id?: number) => [...queryKeys.qc.list(page, limit, search), 'admin', status, vendor_id] as const,
  adminPending: (page?: number, limit?: number, search?: string) => [...queryKeys.qc.list(page, limit, search), 'admin-pending'] as const,
  byUserType: (userType: UserType, page?: number, limit?: number, search?: string, status?: string) => 
    [...queryKeys.qc.list(page, limit, search), userType, status] as const,
}

/**
 * QC list item interface (from seller endpoint)
 */
export interface QcListItem {
  id: number
  name: string
  date: string
  customer_name: string
  customer_mobile: string
  amount: number
  type: 'mfg_qc' | 'pkg_qc'
  status: 'pending' | 'approved' | 'rejected'
}

/**
 * Transformed QC item for display
 */
export interface TransformedQcItem {
  id: string
  productName: string
  customerName: string
  customerPhone: string
  sellerName?: string
  date: string
  time: string
  amount: string
  status: string
  isMultiple: boolean
  originalData: QcListItem | AdminSaleOrderItem
}

/**
 * Hook to fetch QC list for sellers (all submissions) using TanStack Query
 * Supports server-side pagination with page and limit params
 */
export function useSellerQCList(pagination?: PaginationParams, options?: { enabled?: boolean }) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: qcListKeys.seller(pagination?.page, pagination?.limit, pagination?.search, pagination?.status, pagination?.type),
    queryFn: async () => {
      const result = await qcService.getQCList(pagination)
      
      if (!result || result.status_code !== 200) {
        throw new Error('Failed to fetch QC list')
      }
      
      return {
        record: result.record || [],
        total_record_count: result.total_record_count ?? result.total_count ?? result.record?.length ?? 0,
      }
    },
    enabled: options?.enabled !== false, // Only fetch if enabled (default: true)
    staleTime: 1000 * 60 * 1, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Respect staleTime - don't refetch if data is fresh
    refetchOnMount: true, // Always fetch on mount to ensure fresh data
  })

  return {
    qcList: data?.record ?? [],
    totalRecordCount: data?.total_record_count ?? 0,
    isLoading,
    isFetching,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}

/**
 * Hook to fetch pending QC list for sellers (seller dashboard)
 * Hardcoded status=pending filter for the "Pending MFG QC" table
 * Supports server-side pagination with page and limit params
 */
export function useSellerPendingQCList(pagination?: PaginationParams, options?: { enabled?: boolean }) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: qcListKeys.sellerPending(pagination?.page, pagination?.limit, pagination?.search, pagination?.type),
    queryFn: async () => {
      const result = await qcService.getSellerPendingQCList(pagination)
      
      if (!result || result.status_code !== 200) {
        throw new Error('Failed to fetch pending QC list')
      }
      
      return {
        record: result.record || [],
        total_record_count: result.total_record_count ?? result.total_count ?? result.record?.length ?? 0,
      }
    },
    enabled: options?.enabled !== false, // Only fetch if enabled (default: true)
    staleTime: 1000 * 60 * 1, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Respect staleTime - don't refetch if data is fresh
    refetchOnMount: true, // Always fetch on mount to ensure fresh data
  })

  return {
    qcList: data?.record ?? [],
    totalRecordCount: data?.total_record_count ?? 0,
    isLoading,
    isFetching,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}

/**
 * Hook to fetch rejected QC list for sellers (seller dashboard)
 * Hardcoded status=rejected filter for the "MFG QC Rejected" table
 * Supports server-side pagination with page and limit params
 */
export function useSellerRejectedQCList(pagination?: PaginationParams, options?: { enabled?: boolean }) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: qcListKeys.sellerRejected(pagination?.page, pagination?.limit, pagination?.search, pagination?.type),
    queryFn: async () => {
      const result = await qcService.getSellerRejectedQCList(pagination)
      
      if (!result || result.status_code !== 200) {
        throw new Error('Failed to fetch rejected QC list')
      }
      
      return {
        record: result.record || [],
        total_record_count: result.total_record_count ?? result.total_count ?? result.record?.length ?? 0,
      }
    },
    enabled: options?.enabled !== false, // Only fetch if enabled (default: true)
    staleTime: 1000 * 60 * 1, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Respect staleTime - don't refetch if data is fresh
    refetchOnMount: true, // Always fetch on mount to ensure fresh data
  })

  return {
    qcList: data?.record ?? [],
    totalRecordCount: data?.total_record_count ?? 0,
    isLoading,
    isFetching,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}

/**
 * Hook to fetch admin order history (for QC admin view)
 * Supports server-side pagination with page and limit params
 */
export function useAdminQCList(pagination?: PaginationParams, options?: { enabled?: boolean }) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: qcListKeys.admin(pagination?.page, pagination?.limit, pagination?.search, pagination?.status, pagination?.vendor_id),
    queryFn: async () => {
      const result = await ordersService.getAdminOrderHistory(pagination)
      
      if (!result || result.status_code !== 200) {
        throw new Error('Failed to fetch admin order list')
      }
      
      // Sort by date (latest first)
      const sorted = [...result.record].sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
      
      return {
        record: sorted,
        total_record_count: result.total_record_count ?? result.total_count ?? result.record?.length ?? 0,
      }
    },
    enabled: options?.enabled !== false, // Only fetch if enabled (default: true)
    staleTime: 1000 * 60 * 1, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Respect staleTime - don't refetch if data is fresh
    refetchOnMount: true, // Always fetch on mount to ensure fresh data
  })

  return {
    orderList: data?.record ?? [],
    totalRecordCount: data?.total_record_count ?? 0,
    isLoading,
    isFetching,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}

/**
 * Hook to fetch admin pending QC items (excludes 'new' status)
 * This is specifically for the "QC items are pending" table
 * Supports server-side pagination with page and limit params
 */
export function useAdminPendingQCList(pagination?: PaginationParams, options?: { enabled?: boolean }) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: qcListKeys.adminPending(pagination?.page, pagination?.limit, pagination?.search),
    queryFn: async () => {
      const result = await ordersService.getAdminPendingQCItems(pagination)
      
      if (!result || result.status_code !== 200) {
        throw new Error('Failed to fetch admin pending QC items')
      }
      
      // Sort by date (latest first)
      const sorted = [...result.record].sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
      
      return {
        record: sorted,
        total_record_count: result.total_record_count ?? result.total_count ?? result.record?.length ?? 0,
      }
    },
    enabled: options?.enabled !== false, // Only fetch if enabled (default: true)
    staleTime: 1000 * 60 * 1, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Respect staleTime - don't refetch if data is fresh
    refetchOnMount: true, // Always fetch on mount to ensure fresh data
  })

  return {
    orderList: data?.record ?? [],
    totalRecordCount: data?.total_record_count ?? 0,
    isLoading,
    isFetching,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}

/**
 * Unified hook that switches between seller and admin QC list
 * Supports server-side pagination with page and limit params
 */
export function useQCList(userType: UserType, pagination?: PaginationParams) {
  const sellerQuery = useSellerQCList(pagination)
  const adminQuery = useAdminQCList(pagination)

  return userType === 'admin' ? adminQuery : sellerQuery
}

/**
 * Transform seller QC data to display format
 */
export function transformSellerQcData(data: QcListItem[]): TransformedQcItem[] {
  // Group by order name to check for multiple items
  const groupedByOrder = data.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = []
    }
    acc[item.name].push(item)
    return acc
  }, {} as Record<string, QcListItem[]>)

  return data.map(item => {
    // Format status: combine type and status
    const statusCapitalized = item.status.charAt(0).toUpperCase() + item.status.slice(1)
    const typeCapitalized = item.type.toUpperCase().replace('_', ' ')
    const displayStatus = `${statusCapitalized} ${typeCapitalized}`

    // Format date
    const orderDate = new Date(item.date)
    const formattedDate = orderDate.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
    const formattedTime = orderDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })

    // Format amount
    const formattedAmount = `₹${item.amount.toLocaleString('en-IN')}`

    // Check if order has multiple items
    const isMultiple = groupedByOrder[item.name].length > 1

    return {
      id: item.id.toString(),
      productName: item.name,
      customerName: item.customer_name,
      customerPhone: item.customer_mobile || '',
      date: formattedDate,
      time: formattedTime,
      amount: formattedAmount,
      status: displayStatus,
      isMultiple,
      originalData: item
    }
  })
}

/**
 * Transform admin order data to display format
 */
export function transformAdminOrderData(orders: AdminSaleOrderItem[]): TransformedQcItem[] {
  return orders.map(order => {
    // Get all product names from order lines
    const productNames = order.order_line.map(line => line.product_name).join(', ')

    // Get unique seller names from order lines
    const sellerNames = order.order_line.reduce((names, line) => {
      const sellerName = typeof line.seller_name === 'string' ? line.seller_name.trim() : null
      if (sellerName && !names.includes(sellerName)) {
        names.push(sellerName)
      }
      return names
    }, [] as string[])
    const sellerDisplayName = sellerNames.join(', ')
    
    // Determine if multiple items
    const isMultiple = order.order_line.length > 1
    
    // Format date
    const orderDate = new Date(order.date)
    const formattedDate = orderDate.toLocaleDateString('en-GB')
    const formattedTime = orderDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
    
    // Format amount
    const formattedAmount = `₹${order.total_amount.toLocaleString('en-IN')}`
    
    // Use the actual status from the API response
    const status = order.status

    return {
      id: order.name,
      productName: productNames,
      customerName: order.customer_name,
      customerPhone: order.customer_mobile,
      sellerName: sellerDisplayName,
      date: formattedDate,
      time: formattedTime,
      amount: formattedAmount,
      status: status,
      isMultiple: isMultiple,
      originalData: order
    }
  })
}

/**
 * Hook to get transformed QC data based on user type
 * Only fetches the query needed for the current user type
 * Supports server-side pagination for both seller and admin QC list
 */
export function useTransformedQCData(userType: UserType, pagination?: PaginationParams) {
  const { qcList: sellerList, totalRecordCount: sellerTotalCount, isLoading: sellerLoading, isFetching: sellerFetching } = useSellerQCList(
    pagination,
    { enabled: userType === 'seller' }
  )
  const { orderList: adminList, totalRecordCount: adminTotalCount, isLoading: adminLoading, isFetching: adminFetching } = useAdminQCList(
    pagination,
    { enabled: userType === 'admin' }
  )

  const transformedData = useMemo(() => {
    if (userType === 'admin') {
      return transformAdminOrderData(adminList)
    }
    return transformSellerQcData(sellerList)
  }, [userType, sellerList, adminList])

  const isLoading = userType === 'admin' ? adminLoading : sellerLoading
  const isFetching = userType === 'admin' ? adminFetching : sellerFetching

  return {
    data: transformedData,
    totalRecordCount: userType === 'admin' ? adminTotalCount : sellerTotalCount,
    isLoading,
    isFetching,
  }
}

/**
 * Utility to invalidate QC list cache
 */
export function useInvalidateQCList() {
  const queryClient = useQueryClient()

  return (userType?: UserType) => {
    if (userType) {
      queryClient.invalidateQueries({ queryKey: qcListKeys.byUserType(userType) })
    } else {
      queryClient.invalidateQueries({ queryKey: qcListKeys.all() })
    }
  }
}

