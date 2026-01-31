"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Search, 
  Eye, 
  AlertTriangle, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Printer,
  FileText,
  ChevronDown
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { shippingService } from '@/components/features/shipping/services/shipping.service'
import type { ShipmentRecord } from '@/components/features/shipping/types/shipping.types'
import { ShipmentDetailsSlider } from '@/components/features/shipping/components/shipment-details-slider'
import { useUserType } from '@/hooks/use-user-type'
import { useDebounce } from '@/hooks/use-debounce'
import { useShipmentsQuery } from '@/components/features/shipping/hooks/use-shipping-query'
import { TableSkeleton } from '@/components/shared/table'
import type {
  PickupsScheduledTableProps,
  TableDataRow,
  ShipmentData,
} from '../types/dashboard.types'
import type { PaginationParams } from '@/components/features/shipping/types/shipping.types'

function PickupsScheduledTable({ onViewOrderDetails, onNavigateToShippingDelivery, onViewSupplierDetails, onLoadingChange }: PickupsScheduledTableProps) {
  // Get user type from global state
  const { userType } = useUserType()
  
  // Read initial state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        searchQuery: '',
        page: 1,
        itemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      searchQuery: urlParams.get('pickupSearch') || '',
      page: parseInt(urlParams.get('pickupPage') || '1', 10),
      itemsPerPage: parseInt(urlParams.get('pickupItemsPerPage') || '10', 10),
    }
  }, [])

  // Get initial values from URL
  const initialUrlParams = getUrlParams()
  
  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(initialUrlParams.page)
  const [itemsPerPage, setItemsPerPage] = useState(initialUrlParams.itemsPerPage)
  const [searchQuery, setSearchQuery] = useState(initialUrlParams.searchQuery)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  
  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    searchQuery?: string
    currentPage?: number
    itemsPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    if (updates.searchQuery !== undefined) {
      if (updates.searchQuery) {
        url.searchParams.set('pickupSearch', updates.searchQuery)
      } else {
        url.searchParams.delete('pickupSearch')
      }
    }
    
    if (updates.currentPage !== undefined) {
      if (updates.currentPage > 1) {
        url.searchParams.set('pickupPage', String(updates.currentPage))
      } else {
        url.searchParams.delete('pickupPage')
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set('pickupItemsPerPage', String(updates.itemsPerPage))
      } else {
        url.searchParams.delete('pickupItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  // Server-side pagination params with debounced search
  const paginationParams: PaginationParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
  }), [currentPage, itemsPerPage, debouncedSearch])
  
  // Use TanStack Query hook for fetching shipments with pagination and search
  const { data: shipmentsResponse, isLoading: loading, isFetching, error: queryError } = useShipmentsQuery(
    userType || 'seller',
    !!userType,
    paginationParams
  )

  // Extract shipments array and total count from response
  const apiRecords = shipmentsResponse?.shipments ?? []
  const totalRecordCount = shipmentsResponse?.totalRecordCount ?? apiRecords.length
  
  const [downloadingLabels, setDownloadingLabels] = useState(false)
  const [downloadingInvoices, setDownloadingInvoices] = useState(false)
  const [isSliderOpen, setIsSliderOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<ShipmentData | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<ShipmentRecord | null>(null)
  
  // Convert query error to string for display
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch data') : null

  // Track initial load and only notify parent on initial load (not on search/fetching)
  useEffect(() => {
    if (!loading && !hasInitiallyLoaded && apiRecords.length > 0) {
      setHasInitiallyLoaded(true)
    }
    // Only notify parent on initial load completion, not on subsequent fetches
    if (onLoadingChange && !hasInitiallyLoaded) {
      onLoadingChange(loading)
    }
  }, [loading, hasInitiallyLoaded, apiRecords.length, onLoadingChange])

  // Format status text to readable format
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pickup_scheduled': 'Pickup Scheduled',
      'pickup_done': 'Pickup Done',
      'in_transit': 'In Transit',
      'out_for_delivery': 'Out For Delivery',
      'delivered': 'Delivered'
    }

    // Check if status exists in map, otherwise convert snake_case to Title Case
    if (statusMap[status.toLowerCase()]) {
      return statusMap[status.toLowerCase()]
    }

    // Fallback: Convert snake_case to Title Case
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Map API records to table data format
  const tableData: TableDataRow[] = useMemo(() => {
    return apiRecords.map((record) => {
      // Get first product from product_details array
      const firstProduct = record.product_details && record.product_details.length > 0 
        ? record.product_details[0] 
        : null

      // Extract product name and subtitle from product name if it contains a delimiter
      const productName = firstProduct?.product_name || 'N/A'
      const productNameParts = productName.split(' - ')
      const mainProductName = productNameParts[0] || productName
      const productSubtitle = productNameParts.slice(1).join(' - ') || ''

      return {
        trackingId: record.tracking_id || record.awb_number || 'N/A',
        productName: mainProductName,
        productSubtitle: productSubtitle,
        customerName: record.customer_name || 'N/A',
        phone: record.seller_mobile || 'N/A',
        shipRocketId: record.shiprocket_order_id || 'N/A',
        trackingId2: record.awb_number || record.tracking_id || 'N/A',
        deliveryAddress: record.delivery_address || 'N/A',
        status: formatStatus(record.status || 'N/A')
      }
    })
  }, [apiRecords])

  // Notify parent when loading state changes
  useEffect(() => {
    onLoadingChange?.(loading)
  }, [loading, onLoadingChange])

  // Sort data by date (latest first) - server-side search is already applied
  const sortedTableData = useMemo(() => {
    // Sort by date (latest first) - match tableData rows with apiRecords by trackingId
    return [...tableData].sort((a, b) => {
      // Find corresponding API records
      const recordA = apiRecords.find(r => 
        (r.tracking_id || r.awb_number) === a.trackingId || 
        (r.tracking_id || r.awb_number) === a.trackingId2
      )
      const recordB = apiRecords.find(r => 
        (r.tracking_id || r.awb_number) === b.trackingId || 
        (r.tracking_id || r.awb_number) === b.trackingId2
      )
      
      // Try pickup_date first
      const dateA = recordA?.pickup_date ? new Date(recordA.pickup_date).getTime() : 0
      const dateB = recordB?.pickup_date ? new Date(recordB.pickup_date).getTime() : 0
      
      // If both have pickup_date, sort by it
      if (dateA > 0 && dateB > 0) {
        return dateB - dateA // Descending order (latest first)
      }
      
      // If only one has pickup_date, prioritize it
      if (dateA > 0) return -1
      if (dateB > 0) return 1
      
      // If neither has pickup_date, try tracking_log latest date
      const logDateA = recordA?.tracking_log && recordA.tracking_log.length > 0 
        ? new Date(recordA.tracking_log[recordA.tracking_log.length - 1].date).getTime() 
        : 0
      const logDateB = recordB?.tracking_log && recordB.tracking_log.length > 0 
        ? new Date(recordB.tracking_log[recordB.tracking_log.length - 1].date).getTime() 
        : 0
      
      if (logDateA > 0 && logDateB > 0) {
        return logDateB - logDateA // Descending order (latest first)
      }
      
      // If no dates available, maintain original order
      return 0
    })
  }, [tableData, apiRecords])

  // Server-side pagination: data is already paginated from API
  const totalPages = Math.max(1, Math.ceil(totalRecordCount / itemsPerPage))
  // Items are already paginated from server, no need to slice
  const paginatedData = sortedTableData

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrlParams({ currentPage: page })
  }

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const newLimit = Number(newItemsPerPage)
    setItemsPerPage(newLimit)
    setCurrentPage(1) // Reset to first page when changing items per page
    updateUrlParams({ itemsPerPage: newLimit, currentPage: 1 })
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updateUrlParams({ currentPage: newPage })
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updateUrlParams({ currentPage: newPage })
    }
  }

  // Search handler - resets page to 1 when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
    updateUrlParams({ searchQuery: e.target.value, currentPage: 1 })
  }

  // Download file helper function
  const downloadFile = (url: string, filename: string): void => {
    if (!url || url.trim() === '' || url === '#') {
      return
    }
    
    // For external URLs (like Shiprocket), open in new window
    // This avoids CORS issues and works with external services
    try {
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      
      // Try to set download attribute if it's a direct file URL
      if (url.includes('.pdf') || url.includes('download')) {
        link.download = filename
      }
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      // Fallback to window.open
      window.open(url, '_blank')
    }
  }

  // Handle print all labels
  const handlePrintAllLabels = async () => {
    if (apiRecords.length === 0) {
      ////alert('No labels available to download')
      return
    }

    setDownloadingLabels(true)
    try {
      const labelsWithUrls = apiRecords.filter(record => record.label_url && record.label_url.trim() !== '')
      
      if (labelsWithUrls.length === 0) {
        ////alert('No labels available to download')
        return
      }

      // Download all labels with delays to avoid popup blockers
      for (let i = 0; i < labelsWithUrls.length; i++) {
        const record = labelsWithUrls[i]
        const trackingId = record.tracking_id || record.awb_number || `label-${i + 1}`
        const filename = `label-${trackingId}.pdf`
        
        // Wait before each download to avoid popup blockers (except first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        try {
          downloadFile(record.label_url!, filename)
        } catch (error) {
        }
      }
    } catch (error) {
      ////alert('Failed to download some labels. Please try again.')
    } finally {
      setDownloadingLabels(false)
    }
  }

  // Handle print all invoices
  const handlePrintAllInvoices = async () => {
    if (apiRecords.length === 0) {
      ////alert('No invoices available to download')
      return
    }

    setDownloadingInvoices(true)
    try {
      const invoicesWithUrls = apiRecords.filter(record => record.invoice_url && record.invoice_url.trim() !== '')
      
      if (invoicesWithUrls.length === 0) {
        ////alert('No invoices available to download')
        return
      }

      // Download all invoices with delays to avoid popup blockers
      for (let i = 0; i < invoicesWithUrls.length; i++) {
        const record = invoicesWithUrls[i]
        const invoiceNo = record.invoice_no || record.tracking_id || record.awb_number || `invoice-${i + 1}`
        const filename = `invoice-${invoiceNo}.pdf`
        
        // Wait before each download to avoid popup blockers (except first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        try {
          downloadFile(record.invoice_url!, filename)
        } catch (error) {
        }
      }
    } catch (error) {
      ////alert('Failed to download some invoices. Please try again.')
    } finally {
      setDownloadingInvoices(false)
    }
  }

  // Convert API record to ShipmentData format
  const convertToShipmentData = (record: ShipmentRecord): ShipmentData => {
    const items = record.product_details?.map((product: { product_id: number; product_name: string; qty: number; unit_price: number; price_total: number }, index: number) => ({
      id: `${record.shiprocket_order_id || record.tracking_id || 'item'}-${product.product_id}-${index}`,
      name: product.product_name,
      image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      quantity: product.qty,
      unitPrice: product.unit_price,
      weight: "",
      color: "",
      subtotal: product.price_total
    })) || []

    const totalItems = record.product_details?.reduce((sum: number, p: { qty: number }) => sum + p.qty, 0) || items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)
    const subtotalAmount = record.product_details?.reduce((sum: number, p: { price_total: number }) => sum + p.price_total, 0) || 0
    const taxAmount = Math.round(subtotalAmount * 0.01)

    return {
      shipmentId: record.shiprocket_order_id || record.tracking_id || record.awb_number || 'N/A',
      customerName: record.customer_name || 'N/A',
      phone: 'N/A', // Customer phone not available in ShipmentRecord, will be shown correctly in details page
      supplierName: 'seller_name' in record ? record.seller_name : undefined,
      supplierPhone: 'seller_mobile' in record ? record.seller_mobile : undefined,
      amountPaid: subtotalAmount + taxAmount,
      items: items,
      summary: {
        awbNumber: record.awb_number || record.tracking_id || 'N/A',
        courier: record.courier_name || record.transporter_name || 'N/A',
        invoiceNumber: record.invoice_no || `#${(record.awb_number || record.tracking_id || '').slice(-5)}`,
        estimatedDays: record.estimated_days || "15 Days",
        boxType: record.box_type_name || "N/A",
        totalItems: totalItems,
        totalWeight: "12 Kg",
        subtotalAmount: subtotalAmount,
        taxAmount: taxAmount,
        totalAmount: subtotalAmount + taxAmount
      },
      pickupLocation: {
        address: record.pickup_address || "N/A",
        label: "Pickup Location"
      },
      destinationLocation: {
        address: record.delivery_address || "N/A",
        label: "Destination Locations"
      },
      trackingActivities: [
        {
          title: record.last_event || "Order processed",
          date: record.pickup_date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          status: 'in-progress' as const
        },
        {
          title: "Picked up from warehouse",
          date: record.pickup_date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          status: 'completed' as const
        },
        {
          title: `Pickup initiated`,
          date: record.pickup_date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          status: 'completed' as const
        }
      ]
    }
  }

  // Handle eye button click
  const handleViewDetails = (trackingId: string) => {
    // Find the record by tracking ID
    const record = apiRecords.find(
      r => (r.tracking_id || r.awb_number) === trackingId
    )
    
    if (record) {
      const shipmentData = convertToShipmentData(record)
      setSelectedShipment(shipmentData)
      setSelectedRecord(record) // Store the full record for order_id access
      setIsSliderOpen(true)
    }
  }

  // Handle slider close
  const handleSliderClose = () => {
    setIsSliderOpen(false)
    setSelectedShipment(null)
    setSelectedRecord(null)
  }

  // Handle view full page - notify parent to show supplier details page
  const handleViewFullPage = () => {
    if (selectedRecord) {
      // Handle both seller (required) and admin (optional) order_id
      // Type guard: check if order_id exists in the record
      const orderId = (selectedRecord as any).order_id
      
      if (orderId !== undefined && orderId !== null) {
        setIsSliderOpen(false)
        setSelectedShipment(null)
        setSelectedRecord(null)
        // Notify parent component to show supplier details page
        onViewSupplierDetails?.(String(orderId))
      } else {
        // Optionally show a toast or alert to the user
      }
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <TooltipProvider>
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardContent className="p-0">
        {/* Card Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Pickups Scheduled Today</h2>
            {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}
          </div>
          <button onClick={() => {
            if (onNavigateToShippingDelivery) {
              onNavigateToShippingDelivery()
            } else {
              window.location.href = "/seller-dashboard?tab=shipping-delivery"
            }
          }} className="label-2 font-urbanist px-4 font-bold underline text-gray-700 transition-colors duration-200 cursor-pointer p-0">
            View Details
          </button>
        </div>

        {/* Search and Action Buttons */}
        <div className="px-[8px] py-[15px] border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-12 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                ⌘/
              </div>
            </div>
            
            {/* <div className="flex items-center gap-4">
              <button 
                onClick={handlePrintAllLabels}
                disabled={downloadingLabels || loading || apiRecords.length === 0}
                className="flex items-center px-3 py-1.5 text-neutral-800 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 body-4 font-semibold font-urbanist disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingLabels ? 'Downloading...' : 'Print All Labels'}
              </button>
              
              <button 
                onClick={handlePrintAllInvoices}
                disabled={downloadingInvoices || loading || apiRecords.length === 0}
                className="flex items-center px-3 py-1.5 text-neutral-800 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 body-4 font-semibold font-urbanist disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingInvoices ? 'Downloading...' : 'Print Invoices'}
              </button>
            </div> */}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className={`bg-gray-50 border-b border-gray-200 ${paginatedData.length > 0 ? 'hover:bg-gray-50' : ''}`}>
              <TableRow>
                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>AWB Number</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help hover:text-gray-600" />
                      </TooltipTrigger>
                      <TooltipContent className="w-[140px]">
                        <p className="whitespace-normal text-xs">
                          A courier-generated tracking number used to track the shipment.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>Shipment ID</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help hover:text-gray-600 text-[10px]" />
                      </TooltipTrigger>
                      <TooltipContent className="w-[140px]">
                        <p className="whitespace-normal text-xs">
                          An internal reference number used by the seller or seller's system to manage the shipment.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                  Product Name
                </TableHead>
                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                  Customer Name
                </TableHead>
                {/* <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                  Tracking ID
                </TableHead> */}
                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                  Delivery Address
                </TableHead>
                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">

                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {error ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={7} className="px-[20px] py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <AlertTriangle className="h-12 w-12 text-red-300" />
                      <div className="text-lg font-semibold text-gray-500 font-urbanist">
                        Error loading data
                      </div>
                      <div className="text-sm text-gray-400 font-urbanist max-w-md">
                        {error}
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 font-urbanist focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Retry
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (loading && paginatedData.length === 0) || isFetching ? (
                // Show skeleton loader on initial load or when fetching (search, pagination, etc.)
                <TableSkeleton rows={itemsPerPage} columns={7} />
              ) : paginatedData.length === 0 ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={7} className="px-[20px] py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Search className="h-12 w-12 text-gray-300" />
                      <div className="text-lg font-semibold text-gray-500 font-urbanist">
                        No products found
                      </div>
                      <div className="text-sm text-gray-400 font-urbanist max-w-md">
                        {searchQuery 
                          ? `No results found for "${searchQuery}". Try adjusting your search terms or check for typos.`
                          : "No products available at the moment. Please check back later."
                        }
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            setCurrentPage(1)
                            updateUrlParams({ searchQuery: '', currentPage: 1 })
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 font-urbanist focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow key={index} className={`hover:bg-gray-50 bg-white`}>
                    <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
                      {row.trackingId}
                    </TableCell>
                    <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist text-neutral-800">
                      {row.shipRocketId}
                    </TableCell>
                    <TableCell className="px-[20px] py-2 whitespace-nowrap">
                      <div className="font-semibold text-neutral-800 body-3 font-urbanist">{row.productName}</div>
                      <div className="text-sm text-gray-500 body-3 font-urbanist">{row.productSubtitle}</div>
                    </TableCell>
                    <TableCell className="px-[20px] py-2 whitespace-nowrap">
                      <div className="font-semibold text-neutral-800 body-3 font-urbanist">
                        {row.customerName}
                      </div>

                      {userType === 'admin' && (
                        <div className="text-sm text-gray-500 body-3 font-urbanist">
                          {row.phone}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
                      {row.trackingId2} 
                    </TableCell> */}
                    <TableCell className="px-[20px] py-2 font-semibold text-neutral-800 body-3 font-urbanist max-w-[300px] whitespace-normal break-words">
                      {row.deliveryAddress}
                    </TableCell>
                    <TableCell className="px-[20px] py-2 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-medium bg-[#FFEED0] text-[#E59213] rounded-md border border-[#FBE1B2]">
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(row.trackingId)
                          }}
                          className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
                          title="View Details"
                        >
                          <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
                        </button>
                        {/* <button className="text-red-400 w-6 h-6 hover:text-red-600 border border-gray-200 rounded-md p-1">
                          <img src="/images/svg/mingcute_alert-line.svg" alt="Alert Triangle" className="h-4 w-4" />
                        </button> */}
                        {/* <button className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1">
                          <img src="/images/svg/nrk_more.svg" alt="More Vertical" className="h-4 w-4" />
                        </button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer with Pagination */}
        {totalRecordCount > 0 && (
          <div className="px-5 py-[15px] border-t border-gray-200 flex items-center justify-between rounded-br-[5px] rounded-bl-[5px]">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Row Per Page</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors duration-200 min-w-[60px]">
                  {itemsPerPage}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[60px] min-w-[60px]">
                  {[10, 25, 50, 100].map((value) => {
                    // Disable options that are greater than totalRecordCount (except the first option)
                    const isDisabled = totalRecordCount < value && value !== 10
                    return (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => {
                          if (!isDisabled) {
                            handleItemsPerPageChange(value.toString())
                          }
                        }}
                        disabled={isDisabled}
                        className={`${
                          isDisabled 
                            ? 'cursor-not-allowed opacity-50 text-gray-400' 
                            : 'cursor-pointer focus:bg-gray-100 focus:text-gray-900'
                        } ${
                          itemsPerPage === value && !isDisabled ? 'bg-secondary-900 text-white' : ''
                        }`}
                      >
                        {value}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="text-sm text-gray-600">Entries</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={index} className="px-2 text-sm text-gray-500">...</span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => handlePageChange(page as number)}
                      className={`w-8 h-8 text-sm rounded-full border flex items-center justify-center ${
                        currentPage === page
                          ? 'text-white bg-secondary-900'
                          : 'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
              
              <button 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
      {/* Unified slider component handles both admin and seller views */}
      <ShipmentDetailsSlider
        isOpen={isSliderOpen}
        onClose={handleSliderClose}
        shipment={selectedShipment}
        orderId={selectedRecord ? (selectedRecord as any).order_id : undefined}
        onViewFullPage={handleViewFullPage}
        userType={userType ?? undefined}
      />
    </TooltipProvider>
  )
}

export default PickupsScheduledTable