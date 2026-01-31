"use client"

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useShipmentsQuery, useShipmentInsightsQuery, useShipmentByOrderIdQuery, useInvalidateShippingQueries } from './use-shipping-query'
import { shippingService } from '../services/shipping.service'
import type {
  ShipmentRecord,
  ShipmentInsights,
  ShipmentTableRow,
  UserType,
  UseShippingOptions,
  UseShippingReturn,
} from '../types/shipping.types'

/**
 * Hook for managing shipping data with filtering, searching, and pagination.
 * Now uses TanStack Query for better caching and performance.
 * 
 * Benefits:
 * - Cached data - instant on revisit
 * - No duplicate API calls
 * - Automatic background refetch
 * - Optimistic updates
 */
export function useShipping(options: UseShippingOptions = {}): UseShippingReturn {
  const { userType = 'seller', autoFetch = true } = options
  
  // Fetch data using TanStack Query
  const { 
    data: shipments = [], 
    isLoading, 
    error: queryError,
    refetch: refetchShipments 
  } = useShipmentsQuery(userType, autoFetch)
  
  const { 
    data: insights = null, 
    isLoading: isLoadingInsights,
    refetch: refetchInsights
  } = useShipmentInsightsQuery(undefined, autoFetch)
  
  const { invalidateAll } = useInvalidateShippingQueries()
  
  // Local UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('All Shipments')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch shipments') : null

  // Fetch insights with time period
  const fetchInsights = useCallback(async (timePeriod?: string) => {
    // This will be handled by the query hook with the timePeriod parameter
    // For now, we'll just refetch the default insights
    await refetchInsights()
  }, [refetchInsights])

  // Get single shipment by order ID (legacy method)
  const getShipmentByOrderId = useCallback(async (orderId: number): Promise<ShipmentRecord | null> => {
    try {
      const response = await shippingService.getShipmentByOrderId(orderId, userType)
      if (response.success && response.data?.record && response.data.record.length > 0) {
        return response.data.record[0]
      }
      return null
    } catch {
      return null
    }
  }, [userType])

  // Refresh all data
  const refresh = useCallback(async () => {
    invalidateAll(userType)
    await Promise.all([refetchShipments(), refetchInsights()])
  }, [invalidateAll, userType, refetchShipments, refetchInsights])

  // Legacy fetch methods for backward compatibility
  const fetchShipments = useCallback(async () => {
    await refetchShipments()
  }, [refetchShipments])

  // Filtered shipments with sorting by date (latest first)
  const filteredShipments = useMemo(() => {
    if (!Array.isArray(shipments)) return []
    
    const filtered = shipments.filter((shipment) => {
      // Search filter
      const query = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        shipment.tracking_id?.toLowerCase().includes(query) ||
        shipment.awb_number?.toLowerCase().includes(query) ||
        shipment.customer_name?.toLowerCase().includes(query) ||
        shipment.courier_name?.toLowerCase().includes(query)
      
      // Tab filter
      let matchesTab = true
      if (activeTab !== 'All Shipments') {
        const status = shippingService.mapShipmentStatus(shipment.status || '')
        if (activeTab === 'In Transit') {
          matchesTab = status === 'In Transit'
        } else if (activeTab === 'Pickup Schedule') {
          matchesTab = status === 'Pickup Schedule' || status === 'Ready to Ship'
        } else if (activeTab === 'Exceptions') {
          matchesTab = status === 'Exceptions/RTO/NDR'
        }
      }
      
      return matchesSearch && matchesTab
    })
    
    // Sort by date (latest first) - use pickup_date if available, otherwise use tracking_log date
    return filtered.sort((a, b) => {
      // Try pickup_date first
      const dateA = a.pickup_date ? new Date(a.pickup_date).getTime() : 0
      const dateB = b.pickup_date ? new Date(b.pickup_date).getTime() : 0
      
      // If both have pickup_date, sort by it
      if (dateA > 0 && dateB > 0) {
        return dateB - dateA // Descending order (latest first)
      }
      
      // If only one has pickup_date, prioritize it
      if (dateA > 0) return -1
      if (dateB > 0) return 1
      
      // If neither has pickup_date, try tracking_log latest date
      const logDateA = a.tracking_log && a.tracking_log.length > 0 
        ? new Date(a.tracking_log[a.tracking_log.length - 1].date).getTime() 
        : 0
      const logDateB = b.tracking_log && b.tracking_log.length > 0 
        ? new Date(b.tracking_log[b.tracking_log.length - 1].date).getTime() 
        : 0
      
      if (logDateA > 0 && logDateB > 0) {
        return logDateB - logDateA // Descending order (latest first)
      }
      
      // If no dates available, maintain original order
      return 0
    })
  }, [shipments, searchTerm, activeTab])

  // Table data (formatted for display)
  const tableData = useMemo((): ShipmentTableRow[] => {
    return filteredShipments.map((record) => {
      const itemsText = record.product_details?.map(p => `${p.product_name} (${p.qty})`).join(', ') || 'N/A'
      const totalAmount = record.product_details?.reduce((sum, p) => sum + p.price_total, 0) || 0
      
      return {
        awb: record.awb_number || record.tracking_id || 'N/A',
        shipmentId: record.shiprocket_order_id || record.tracking_id || 'N/A',
        courier: record.courier_name || record.transporter_name || 'N/A',
        supplierName: record.seller_name || 'N/A',
        supplierPhone: record.seller_mobile || 'N/A',
        items: itemsText,
        customerName: record.customer_name || 'N/A',
        customerPhone: 'N/A',
        lastEvent: record.last_event || 'N/A',
        amount: totalAmount,
        status: shippingService.mapShipmentStatus(record.status || ''),
        rawData: record,
      }
    })
  }, [filteredShipments])

  // Pagination
  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(filteredShipments.length / itemsPerPage)),
    [filteredShipments.length, itemsPerPage]
  )

  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredShipments.slice(start, start + itemsPerPage)
  }, [filteredShipments, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeTab])

  return {
    shipments: shipments || [],
    insights,
    isLoading,
    isLoadingInsights,
    error,
    fetchShipments,
    fetchInsights,
    refresh,
    getShipmentByOrderId,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    filteredShipments,
    tableData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedShipments,
  }
}

export default useShipping

