"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useUserType } from '@/hooks/use-user-type'
import { useDebounce } from '@/hooks/use-debounce'
import PageHeader from '@/components/shared/layout/page-header'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/table'
import { Search, ChevronLeft, ChevronRight, ChevronDown, CircleChevronDown, CircleChevronUp, AlertCircle } from 'lucide-react'
import { shippingService } from '../services/shipping.service'
import { useShipmentsQuery, useShipmentInsightsQuery, useInTransitShipmentsQuery, useOutForDeliveryShipmentsQuery } from '../hooks/use-shipping-query'
import type { ShipmentRecord, UserType } from '../types/shipping.types'
import ShipmentDetailsSlider from './shipment-details-slider'
import { cn } from '@/lib/utils'

interface ShippingPageProps {
  userType?: UserType
  onSliderStateChange?: (isOpen: boolean) => void
  // Legacy section props for seller dashboard (to be refactored separately)
  section?: string | null
  sectionId?: string | null
  onSectionChange?: (section: string | null, id?: string | number | null) => void
  // Navigation callback for file-based routing (admin dashboard)
  onViewOrderDetail?: (orderId: string | number) => void
}

type ShipmentStatus =
  | 'Ready to Ship'
  | 'Pickup Schedule'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Exceptions/RTO/NDR'

interface ShipmentRow {
  awb: string
  shipmentId: string
  courier: string
  supplierName: string
  supplierPhone: string
  items: string
  customerName: string
  customerPhone: string
  lastEvent: string
  amount: number
  status: ShipmentStatus | 'Shipped' | 'Reached at Destination Hub' | 'Out for Delivery' | string
  rawData?: ShipmentRecord
}

// Helper function to convert API record to ShipmentRow
const convertApiRecordToShipmentRow = (record: ShipmentRecord): ShipmentRow => {
  const itemsText = record.product_details.map(p => `${p.product_name} (${p.qty})`).join(', ')
  const totalAmount = record.product_details.reduce((sum, p) => sum + p.price_total, 0)

  let mappedStatus: ShipmentRow['status'] = 'N/A'
  if (record.status && record.status.trim() !== '') {
    const statusLower = record.status.toLowerCase()
    if (statusLower.includes('transit')) mappedStatus = 'In Transit'
    else if (statusLower.includes('delivered')) mappedStatus = 'Delivered'
    else if (statusLower.includes('out for delivery') || statusLower.includes('out_for_delivery')) mappedStatus = 'Out for Delivery'
    else if (statusLower.includes('exception') || statusLower.includes('rto') || statusLower.includes('ndr')) mappedStatus = 'Exceptions/RTO/NDR'
    else if (statusLower.includes('pickup')) mappedStatus = 'Pickup Schedule'
    else if (statusLower.includes('ready to ship') || statusLower.includes('ready_to_ship') || (statusLower.includes('ready') && statusLower.includes('ship'))) mappedStatus = 'Ready to Ship'
    else if (statusLower.includes('shipped')) mappedStatus = 'Shipped'
    else mappedStatus = record.status
  }

  return {
    awb: record.awb_number || record.tracking_id || 'N/A',
    shipmentId: record.shiprocket_order_id || record.tracking_id || 'N/A',
    courier: record.courier_name || record.transporter_name || 'N/A',
    supplierName: record.seller_name || 'N/A',
    supplierPhone: record.seller_mobile || 'N/A',
    items: itemsText || 'N/A',
    customerName: record.customer_name || 'N/A',
    customerPhone: 'N/A',
    lastEvent: record.last_event || 'N/A',
    amount: totalAmount,
    status: mappedStatus,
    rawData: record
  }
}

function formatCurrencyINR(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

/**
 * Unified Shipping Page
 * Handles both seller and admin views with a single component
 */
export function ShippingPage({ 
  userType: propUserType, 
  onSliderStateChange,
  section,
  sectionId,
  onSectionChange,
  onViewOrderDetail
}: ShippingPageProps) {
  const { userType: globalUserType } = useUserType()
  const userType = useMemo(() => {
    if (propUserType) return propUserType
    return (globalUserType as UserType) || 'seller'
  }, [propUserType, globalUserType])
  const isAdmin = userType === 'admin'

  // Read initial filter and pagination state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        activeTab: 'All Shipments' as 'All Shipments' | 'In Transit' | 'Pickup Schedule' | 'Delivered',
        search: '',
        page: 1,
        itemsPerPage: 10,
        transitPage: 1,
        transitPerPage: 10,
        notDeliveredPage: 1,
        notDeliveredPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const tabValue = urlParams.get('shippingTab') || 'All Shipments'
    const validTabs: ('All Shipments' | 'In Transit' | 'Pickup Schedule' | 'Delivered')[] = ['All Shipments', 'In Transit', 'Pickup Schedule', 'Delivered']
    const activeTab = validTabs.includes(tabValue as any) ? (tabValue as 'All Shipments' | 'In Transit' | 'Pickup Schedule' | 'Delivered') : 'All Shipments'
    
    return {
      activeTab,
      search: urlParams.get('shippingSearch') || '',
      page: parseInt(urlParams.get('shippingPage') || '1', 10),
      itemsPerPage: parseInt(urlParams.get('shippingItemsPerPage') || '10', 10),
      transitPage: parseInt(urlParams.get('transitPage') || '1', 10),
      transitPerPage: parseInt(urlParams.get('transitItemsPerPage') || '10', 10),
      notDeliveredPage: parseInt(urlParams.get('notDeliveredPage') || '1', 10),
      notDeliveredPerPage: parseInt(urlParams.get('notDeliveredItemsPerPage') || '10', 10),
    }
  }, [])

  // Initialize state from URL parameters
  const urlParams = getUrlParams()

  const [activeTab, setActiveTab] = useState<'All Shipments' | 'In Transit' | 'Pickup Schedule' | 'Delivered'>(urlParams.activeTab)
  const [search, setSearch] = useState(urlParams.search)
  const [currentPage, setCurrentPage] = useState(urlParams.page)
  const [itemsPerPage, setItemsPerPage] = useState(urlParams.itemsPerPage)
  const [isTransitOpen, setIsTransitOpen] = useState(false)
  const [isNotDeliveredOpen, setIsNotDeliveredOpen] = useState(false)
  const [transitPage, setTransitPage] = useState(urlParams.transitPage)
  const [transitPerPage, setTransitPerPage] = useState(urlParams.transitPerPage)
  const [notDeliveredPage, setNotDeliveredPage] = useState(urlParams.notDeliveredPage)
  const [notDeliveredPerPage, setNotDeliveredPerPage] = useState(urlParams.notDeliveredPerPage)

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    activeTab?: 'All Shipments' | 'In Transit' | 'Pickup Schedule' | 'Delivered'
    search?: string
    page?: number
    itemsPerPage?: number
    transitPage?: number
    transitPerPage?: number
    notDeliveredPage?: number
    notDeliveredPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    // Only update URL params if we're on the shipping-delivery page (file-based route or tab query)
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    const isShippingDeliveryPage = pathname.includes('/shipping-delivery') || tab === 'shipping-delivery'
    if (!isShippingDeliveryPage) return
    
    if (updates.activeTab !== undefined) {
      if (updates.activeTab && updates.activeTab !== 'All Shipments') {
        url.searchParams.set('shippingTab', updates.activeTab)
      } else {
        url.searchParams.delete('shippingTab')
      }
    }
    
    if (updates.search !== undefined) {
      if (updates.search) {
        url.searchParams.set('shippingSearch', updates.search)
      } else {
        url.searchParams.delete('shippingSearch')
      }
    }
    
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        url.searchParams.set('shippingPage', String(updates.page))
      } else {
        url.searchParams.delete('shippingPage')
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set('shippingItemsPerPage', String(updates.itemsPerPage))
      } else {
        url.searchParams.delete('shippingItemsPerPage')
      }
    }
    
    if (updates.transitPage !== undefined) {
      if (updates.transitPage > 1) {
        url.searchParams.set('transitPage', String(updates.transitPage))
      } else {
        url.searchParams.delete('transitPage')
      }
    }
    
    if (updates.transitPerPage !== undefined) {
      if (updates.transitPerPage !== 10) {
        url.searchParams.set('transitItemsPerPage', String(updates.transitPerPage))
      } else {
        url.searchParams.delete('transitItemsPerPage')
      }
    }
    
    if (updates.notDeliveredPage !== undefined) {
      if (updates.notDeliveredPage > 1) {
        url.searchParams.set('notDeliveredPage', String(updates.notDeliveredPage))
      } else {
        url.searchParams.delete('notDeliveredPage')
      }
    }
    
    if (updates.notDeliveredPerPage !== undefined) {
      if (updates.notDeliveredPerPage !== 10) {
        url.searchParams.set('notDeliveredItemsPerPage', String(updates.notDeliveredPerPage))
      } else {
        url.searchParams.delete('notDeliveredItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])
  const [isSliderOpen, setIsSliderOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRow | null>(null)

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 500)

  // Map filter tab to API status parameter
  // Use single status values: in_transit, pickup_scheduled, delivered
  const getStatusFromTab = useCallback((tab: 'All Shipments' | 'In Transit' | 'Pickup Schedule' | 'Delivered'): string | undefined => {
    switch (tab) {
      case 'All Shipments':
        return undefined // No status filter - get all shipments
      case 'In Transit':
        return 'in_transit'
      case 'Pickup Schedule':
        return 'pickup_scheduled'
      case 'Delivered':
        return 'delivered'
      default:
        return undefined
    }
  }, [])

  // Server-side pagination params with debounced search and status filter
  const paginationParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
    status: getStatusFromTab(activeTab),
  }), [currentPage, itemsPerPage, debouncedSearch, activeTab, getStatusFromTab])

  // Pagination params for In Transit dropdown table
  const inTransitPaginationParams = useMemo(() => ({
    page: transitPage,
    limit: transitPerPage,
  }), [transitPage, transitPerPage])

  // Pagination params for Out for Delivery dropdown table
  const outForDeliveryPaginationParams = useMemo(() => ({
    page: notDeliveredPage,
    limit: notDeliveredPerPage,
  }), [notDeliveredPage, notDeliveredPerPage])

  // Fetch data using TanStack Query with pagination, search, and status filter
  const { 
    data: shipmentsResponse, 
    isLoading: loading, 
    isFetching,
    error: shipmentsError 
  } = useShipmentsQuery(userType, true, paginationParams)

  // Fetch In Transit data separately with its own pagination
  const {
    data: inTransitResponse,
    isLoading: inTransitLoading,
    isFetching: inTransitFetching,
    error: inTransitError
  } = useInTransitShipmentsQuery(userType, isTransitOpen, inTransitPaginationParams)

  // Fetch Out for Delivery data separately with its own pagination
  const {
    data: outForDeliveryResponse,
    isLoading: outForDeliveryLoading,
    isFetching: outForDeliveryFetching,
    error: outForDeliveryError
  } = useOutForDeliveryShipmentsQuery(userType, isNotDeliveredOpen, outForDeliveryPaginationParams)
  
  const { 
    data: insightsQueryData, 
    isLoading: insightsLoading 
  } = useShipmentInsightsQuery(undefined, true)

  // Extract data from response
  const shipmentsData = shipmentsResponse?.shipments ?? []
  const totalRecordCount = shipmentsResponse?.totalRecordCount ?? 0

  // Convert query data to component format
  const shipments = useMemo(() => {
    return shipmentsData.map(convertApiRecordToShipmentRow)
  }, [shipmentsData])

  // Track if we've ever successfully loaded data (to distinguish initial load from refetches)
  const hasLoadedDataRef = useRef(false)
  
  // Update ref when we successfully get data
  useEffect(() => {
    if (shipments.length > 0 || (shipmentsResponse && !loading)) {
      hasLoadedDataRef.current = true
    }
  }, [shipments.length, shipmentsResponse, loading])

  // Decouple initial loading from filter-based loading
  // Initial loading: only on the very first load (no data has ever been loaded)
  // Filter loading: when data exists but we're fetching new filtered data (pagination, search, status filter)
  const isInitialLoading = loading && !hasLoadedDataRef.current
  const isFilterLoading = isFetching && hasLoadedDataRef.current

  const insightsData = useMemo(() => {
    if (!insightsQueryData) return null
    return {
      readyToShip: insightsQueryData.pickup_done,
      pickupsToday: insightsQueryData.pickup_scheduled,
      inTransit: insightsQueryData.in_transit,
      outForDelivery: insightsQueryData.out_for_delivery,
      delivered: insightsQueryData.delivered,
      exceptions: insightsQueryData.cancelled,
    }
  }, [insightsQueryData])

  const error = shipmentsError ? (shipmentsError instanceof Error ? shipmentsError.message : 'Failed to fetch shipment data') : null

  // Sync state with URL section params (only for seller dashboard)
  // Admin dashboard uses file-based routing, so section logic is only for seller
  useEffect(() => {
    // Skip section logic for admin - admin uses file-based routing
    if (isAdmin) {
      return
    }
    
    if (section === 'in-transit') {
      setIsTransitOpen(true)
    } else if (section === 'not-delivered') {
      setIsNotDeliveredOpen(true)
    }
  }, [section, isAdmin])

  const NoItemsView = ({ message }: { message?: string }) => (
    <div className="px-[20px] py-12 text-center">
      <div className="flex flex-col items-center justify-center space-y-3">
        <Search className="h-12 w-12 text-gray-300" />
        <div className="text-lg font-semibold text-gray-500 font-urbanist">No items found</div>
        <div className="text-sm text-gray-400 font-urbanist max-w-md">{message ?? 'No items available at the moment.'}</div>
      </div>
    </div>
  )

  const metrics = useMemo(() => {
    const readyToShip = insightsData?.readyToShip ?? 0
    const pickupsToday = insightsData?.pickupsToday ?? 0
    const inTransit = insightsData?.inTransit ?? 0
    const outForDelivery = insightsData?.outForDelivery ?? 0
    const delivered = insightsData?.delivered ?? 0
    const exceptions = insightsData?.exceptions ?? 0

    return [
      { label: 'Ready to Ship', value: readyToShip, icon: '/images/svg/tabler_clock-filled.svg' },
      { label: 'Pickup Schedule', value: pickupsToday, icon: '/images/svg/solar_delivery-bold.svg' },
      { label: 'In Transit', value: inTransit, icon: '/images/svg/solar_delivery-bold.svg' },
      { label: 'Out for Delivery', value: outForDelivery, icon: '/images/svg/solar_delivery-bold.svg' },
      { label: 'Delivered', value: delivered, icon: '/images/svg/solar_delivery-bold.svg' },
      { label: 'Exceptions/RTO/NDR', value: exceptions, icon: '/images/svg/material-symbols_cancel-rounded.svg' },
    ]
  }, [insightsData])

  // Server-side filtering: data is already filtered by status on the server
  // No client-side filtering needed
  const pageRows = shipments

  // Decoupled In Transit data with server-side pagination
  const inTransitShipmentsData = inTransitResponse?.shipments ?? []
  const inTransitTotalRecordCount = inTransitResponse?.totalRecordCount ?? 0
  const inTransitRows = useMemo(() => {
    return inTransitShipmentsData.map(convertApiRecordToShipmentRow)
  }, [inTransitShipmentsData])
  const transitTotal = Math.max(1, Math.ceil(inTransitTotalRecordCount / transitPerPage))
  const transitRows = inTransitRows // Already paginated by server

  // Decoupled Out for Delivery data with server-side pagination
  const outForDeliveryShipmentsData = outForDeliveryResponse?.shipments ?? []
  const outForDeliveryTotalRecordCount = outForDeliveryResponse?.totalRecordCount ?? 0
  const notDeliveredRows = useMemo(() => {
    return outForDeliveryShipmentsData.map(convertApiRecordToShipmentRow)
  }, [outForDeliveryShipmentsData])
  const notDeliveredTotal = Math.max(1, Math.ceil(outForDeliveryTotalRecordCount / notDeliveredPerPage))
  const notDeliveredPageRows = notDeliveredRows // Already paginated by server

  // Server-side pagination: totalPages based on total_record_count from API
  const totalPages = Math.max(1, Math.ceil(totalRecordCount / itemsPerPage))

  // Restore state from URL when URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      const isShippingDeliveryPage = pathname.includes('/shipping-delivery') || tab === 'shipping-delivery'
      if (isShippingDeliveryPage) {
        const params = getUrlParams()
        setActiveTab(params.activeTab)
        setSearch(params.search)
        setCurrentPage(params.page)
        setItemsPerPage(params.itemsPerPage)
        setTransitPage(params.transitPage)
        setTransitPerPage(params.transitPerPage)
        setNotDeliveredPage(params.notDeliveredPage)
        setNotDeliveredPerPage(params.notDeliveredPerPage)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getUrlParams])

  // Sync URL parameters when state changes
  useEffect(() => {
    updateUrlParams({
      activeTab,
      search,
      page: currentPage,
      itemsPerPage,
      transitPage,
      transitPerPage,
      notDeliveredPage,
      notDeliveredPerPage,
    })
  }, [activeTab, search, currentPage, itemsPerPage, transitPage, transitPerPage, notDeliveredPage, notDeliveredPerPage, updateUrlParams])

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  // Reset to page 1 if current page is invalid after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [shipments.length, itemsPerPage, totalPages, currentPage])

  // Show full page spinner only on initial load (when no data has ever been loaded)
  // For insights, only show spinner if we haven't loaded insights data yet and no shipments data has been loaded
  if (isInitialLoading || (insightsLoading && !insightsData && !hasLoadedDataRef.current)) {
    return <LoadingSpinner />
  }

  const getStatusBadge = (status: ShipmentRow['status']) => {
    const s = String(status).toLowerCase()
    if (s.includes('shipped')) return 'bg-[#FFF7E6] text-[#BC7810] border-[#FBE1B2]'
    if (s.includes('in transit')) return 'bg-[#E7F1FF] text-[#0B5ED7] border-[#BBD5FF]'
    if (s.includes('destination')) return 'bg-[#EAF7E8] text-[#1B8E2D] border-[#CDEFC8]'
    if (s.includes('out for delivery')) return 'bg-[#FFF7E6] text-[#BC7810] border-[#FBE1B2]'
    if (s.includes('exception') || s.includes('rto') || s.includes('ndr')) return 'bg-red-50 text-red-700 border-red-200'
    if (s.includes('delivered')) return 'bg-green-50 text-green-700 border-green-200'
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getPageNumbers = () => {
    const pages: Array<number | string> = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
    return pages
  }

  // Convert ShipmentRow to ShipmentData format for the slider
  const convertToShipmentData = (row: ShipmentRow) => {
    const rawData = row.rawData
    const items = rawData?.product_details.map((product, index) => ({
      id: `${rawData.shiprocket_order_id || row.shipmentId}-${product.product_id}-${index}`,
      name: product.product_name,
      image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      quantity: product.qty,
      unitPrice: product.unit_price,
      weight: "12 KG/unit",
      color: "White",
      subtotal: product.price_total
    })) || [
      {
        id: row.shipmentId,
        name: row.items,
        image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quantity: 1,
        unitPrice: row.amount,
        weight: "12 KG/unit",
        color: "White",
        subtotal: row.amount
      }
    ]

    const totalItems = rawData?.product_details.reduce((sum, p) => sum + p.qty, 0) || items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotalAmount = rawData?.product_details.reduce((sum, p) => sum + p.price_total, 0) || row.amount
    const taxAmount = Math.round(subtotalAmount * 0.01)

    return {
      shipmentId: row.shipmentId,
      customerName: rawData?.customer_name || row.customerName,
      phone: row.customerPhone,
      amountPaid: row.amount,
      items: items,
      summary: {
        awbNumber: row.awb,
        courier: row.courier,
        invoiceNumber: rawData?.invoice_no || `#${row.awb.slice(-5)}`,
        estimatedDays: rawData?.estimated_days || "15 Days",
        boxType: rawData?.box_type_name || "N/A",
        totalItems: totalItems,
        totalWeight: "12 Kg",
        subtotalAmount: subtotalAmount,
        taxAmount: taxAmount,
        totalAmount: subtotalAmount + taxAmount
      },
      pickupLocation: {
        address: rawData?.pickup_address || "N/A",
        label: "Pickup Location"
      },
      destinationLocation: {
        address: rawData?.delivery_address || "N/A",
        label: "Destination Locations"
      },
      trackingActivities: [
        {
          title: rawData?.last_event || "Order processed",
          date: rawData?.pickup_date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          status: 'in-progress' as const
        },
        {
          title: "Picked up from warehouse",
          date: rawData?.pickup_date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          status: 'completed' as const
        },
        {
          title: `Pickup initiated`,
          date: rawData?.pickup_date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          status: 'completed' as const
        }
      ]
    }
  }

  const handleViewDetails = (shipment: ShipmentRow) => {
    setSelectedShipment(shipment)
    setIsSliderOpen(true)
    onSliderStateChange?.(true)
  }

  const handleSliderClose = () => {
    setIsSliderOpen(false)
    setSelectedShipment(null)
    onSliderStateChange?.(false)
  }

  const handleViewFullPage = () => {
    if (selectedShipment?.rawData?.order_id) {
      const orderId = String(selectedShipment.rawData.order_id)
      setIsSliderOpen(false)
      onSliderStateChange?.(false)
      
      // Both admin and seller: Navigate to order detail page using file-based routing
      onViewOrderDetail?.(orderId)
    }
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Shipping & Delivery" />

      <div className="px-4 mt-[24px] space-y-4">
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-[8px] border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900 label-1 font-urbanist text-lg">Insights & Performance</h2>
              </div>
            </div>

            <div className="grid grid-cols-6 divide-x divide-gray-200">
              {metrics.map((m) => (
                <div key={m.label} className="py-4 px-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">{m.label}</div>
                  </div>
        <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 font-bold text-gray-900 font-spectral">{m.value}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <img src={m.icon} alt="icon" className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {(insightsData?.inTransit ?? 0) > 0 ? (
          <Card className="bg-[#FFEED0] shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border border-[#FBE1B2] rounded-t-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-urbanist" style={{ color: '#BC7810' }}>
                    {insightsData?.inTransit ?? 0} orders are in Transit
                  </span>
                </div>
                <button
                  onClick={() => {
                    const newState = !isTransitOpen
                    setIsTransitOpen(newState)
                    onSectionChange?.(newState ? 'in-transit' : null)
                  }}
                  className="p-1 hover:bg-[#FFEED0] rounded transition-colors"
                  style={{ color: '#BC7810' }}
                >
                  {isTransitOpen ? (
                    <CircleChevronUp className="h-5 w-5 text-[#BC7810]" />
                  ) : (
                    <CircleChevronDown className="h-5 w-5 text-[#BC7810]" />
                  )}
                </button>
              </div>
              {isTransitOpen && (
                <div className="bg-white">
                  <div className="overflow-x-auto">
                    {inTransitLoading ? (
                      <Table className="w-full">
                        <TableHeader className="bg-gray-50 border-b border-gray-200">
                          <TableRow>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">AWB</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Shipment ID</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Courier</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Customer</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Last Event</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Amount</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Status</TableHead>
                            <TableHead className="px-[20px] py-[6px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                          <TableSkeleton rows={transitPerPage} columns={8} />
                        </TableBody>
                      </Table>
                    ) : inTransitError ? (
                      <div className="px-[20px] py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertCircle className="h-12 w-12 text-red-400" />
                          <div className="text-lg font-semibold text-gray-500 font-urbanist">Error loading data</div>
                          <div className="text-sm text-gray-400 font-urbanist">{inTransitError instanceof Error ? inTransitError.message : 'Failed to fetch in transit shipments'}</div>
                        </div>
                      </div>
                    ) : transitRows.length > 0 ? (
                    <Table className="w-full">
                      <TableHeader className="bg-gray-50 border-b border-gray-200">
                        <TableRow>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">AWB</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Shipment ID</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Courier</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Customer</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Last Event</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Amount</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Status</TableHead>
                          <TableHead className="px-[20px] py-[6px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        {inTransitFetching && !inTransitLoading ? (
                          <TableSkeleton rows={transitPerPage} columns={8} />
                        ) : transitRows.length > 0 ? (
                          transitRows.map((r, idx) => (
                            <TableRow key={`transit-${r.awb}-${idx}`} className="hover:bg-gray-50 bg-white">
                              <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">{r.awb}</TableCell>
                              <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.shipmentId}</TableCell>
                              <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.courier}</TableCell>
                              <TableCell className="px-[20px] py-2 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-neutral-800 body-3 font-urbanist">{r.customerName}</span>
                                  <span className="text-xs text-gray-500 font-urbanist">{r.customerPhone}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.lastEvent}</TableCell>
                              <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">{formatCurrencyINR(r.amount)}</TableCell>
                              <TableCell className="px-[20px] py-2 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${getStatusBadge(r.status)}`}>{r.status}</span>
                              </TableCell>
                              <TableCell className="px-[20px] py-2 whitespace-nowrap">
                                <button
                                  onClick={() => handleViewDetails(r)}
                                  className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
                                  title="View Order Details"
                                >
                                  <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : null}
                      </TableBody>
                    </Table>
                  ) : (
                    <NoItemsView />
                  )}
                </div>
                <div className="px-5 py-[15px] border-t border-gray-200 flex items-center justify-between bg-white rounded-b-lg">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600 font-urbanist">Row Per Page</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 bg-white hover:bg-gray-50 min-w-[60px] font-urbanist">{transitPerPage}<ChevronDown className="h-4 w-4 text-gray-400" /></DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[60px] min-w-[60px]">
                        {[10,25,50,100].map((v) => (
                          <DropdownMenuItem key={v} onClick={() => { setTransitPerPage(v); setTransitPage(1) }} className={`${transitPerPage===v?'bg-secondary-900 text-white':''}`}>{v}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-gray-600 font-urbanist">Entries</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setTransitPage((p)=>Math.max(1,p-1))} disabled={transitPage===1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
                    <div className="flex items-center gap-1">
                      {(() => { const pages: Array<number|string> = [] as any; const total = transitTotal; const cur = transitPage; const max = 5; if(total<=max){ for(let i=1;i<=total;i++) pages.push(i)} else if(cur<=3){ pages.push(1,2,3,4,'...',total)} else if(cur>=total-2){ pages.push(1,'...',total-3,total-2,total-1,total)} else { pages.push(1,'...',cur-1,cur,cur+1,'...',total)}; return pages })().map((p,i)=> p==='...'?<span key={`tdots-${i}`} className="px-2 text-sm text-gray-500">...</span>:<button key={`tpg-${p}`} onClick={()=>setTransitPage(p as number)} className={`w-8 h-8 text-sm rounded-full border flex items-center justify-center ${transitPage===p?'text-white bg-secondary-900':'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white'}`}>{p}</button> )}
                    </div>
                    <button onClick={() => setTransitPage((p)=>Math.min(transitTotal,p+1))} disabled={transitPage===transitTotal} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        ) : null}

        {(insightsData?.outForDelivery ?? 0) > 0 ? (
          <Card className="bg-[#FFE5E5] shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border border-[#FFB8B8] rounded-t-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-urbanist" style={{ color: '#C81E1E' }}>
                    {insightsData?.outForDelivery ?? 0} orders are not delivered to the customer
                  </span>
                </div>
                <button
                  onClick={() => {
                    const newState = !isNotDeliveredOpen
                    setIsNotDeliveredOpen(newState)
                    onSectionChange?.(newState ? 'not-delivered' : null)
                  }}
                  className="p-1 hover:bg-[#FFE5E5] rounded transition-colors"
                  style={{ color: '#C81E1E' }}
                >
                  {isNotDeliveredOpen ? (
                    <CircleChevronUp className="h-5 w-5 text-[#C81E1E]" />
                  ) : (
                    <CircleChevronDown className="h-5 w-5 text-[#C81E1E]" />
                  )}
                </button>
              </div>
              {isNotDeliveredOpen && (
                <div className="bg-white">
                  <div className="overflow-x-auto">
                    {outForDeliveryLoading ? (
                      <Table className="w-full">
                        <TableHeader className="bg-gray-50 border-b border-gray-200">
                          <TableRow>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">AWB</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Shipment ID</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Courier</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Customer</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Last Event</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Amount</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Status</TableHead>
                            <TableHead className="px-[20px] py-[6px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                          <TableSkeleton rows={notDeliveredPerPage} columns={8} />
                        </TableBody>
                      </Table>
                    ) : outForDeliveryError ? (
                      <div className="px-[20px] py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertCircle className="h-12 w-12 text-red-400" />
                          <div className="text-lg font-semibold text-gray-500 font-urbanist">Error loading data</div>
                          <div className="text-sm text-gray-400 font-urbanist">{outForDeliveryError instanceof Error ? outForDeliveryError.message : 'Failed to fetch out for delivery shipments'}</div>
                        </div>
                      </div>
                    ) : notDeliveredPageRows.length > 0 ? (
                    <Table className="w-full">
                      <TableHeader className="bg-gray-50 border-b border-gray-200">
                        <TableRow>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">AWB</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Shipment ID</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Courier</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Customer</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Last Event</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Amount</TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Status</TableHead>
                          <TableHead className="px-[20px] py-[6px]" />
                        </TableRow>
                      </TableHeader>
                     <TableBody className="bg-white">
                      {outForDeliveryFetching && !outForDeliveryLoading ? (
                        <TableSkeleton rows={notDeliveredPerPage} columns={8} />
                      ) : notDeliveredPageRows.length > 0 ? (
                        notDeliveredPageRows.map((r, idx) => (
                          <TableRow key={`nd-${r.awb}-${idx}`} className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">{r.awb}</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.shipmentId}</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.courier}</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-neutral-800 body-3 font-urbanist">{r.customerName}</span>
                                <span className="text-xs text-gray-500 font-urbanist">{r.customerPhone}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.lastEvent}</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">{formatCurrencyINR(r.amount)}</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${getStatusBadge(r.status)}`}>{r.status}</span>
                            </TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap">
                              <button
                                onClick={() => handleViewDetails(r)}
                                className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
                                title="View Order Details"
                              >
                                <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : null}
                    </TableBody>
                    </Table>
                  ) : (
                    <NoItemsView />
                  )}
                </div>
                <div className="px-5 py-[15px] border-t border-gray-200 flex items-center justify-between bg-white rounded-b-lg">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600 font-urbanist">Row Per Page</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 bg-white hover:bg-gray-50 min-w-[60px] font-urbanist">{notDeliveredPerPage}<ChevronDown className="h-4 w-4 text-gray-400" /></DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[60px] min-w-[60px]">
                        {[10,25,50,100].map((v) => (
                          <DropdownMenuItem key={v} onClick={() => { setNotDeliveredPerPage(v); setNotDeliveredPage(1) }} className={`${notDeliveredPerPage===v?'bg-secondary-900 text-white':''}`}>{v}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-gray-600 font-urbanist">Entries</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setNotDeliveredPage((p)=>Math.max(1,p-1))} disabled={notDeliveredPage===1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
                    <div className="flex items-center gap-1">
                      {(() => { const pages: Array<number|string> = [] as any; const total = notDeliveredTotal; const cur = notDeliveredPage; const max = 5; if(total<=max){ for(let i=1;i<=total;i++) pages.push(i)} else if(cur<=3){ pages.push(1,2,3,4,'...',total)} else if(cur>=total-2){ pages.push(1,'...',total-3,total-2,total-1,total)} else { pages.push(1,'...',cur-1,cur,cur+1,'...',total)}; return pages })().map((p,i)=> p==='...'?<span key={`nddots-${i}`} className="px-2 text-sm text-gray-500">...</span>:<button key={`ndpg-${p}`} onClick={()=>setNotDeliveredPage(p as number)} className={`w-8 h-8 text-sm rounded-full border flex items-center justify-center ${notDeliveredPage===p?'text-white bg-secondary-900':'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white'}`}>{p}</button> )}
                    </div>
                    <button onClick={() => setNotDeliveredPage((p)=>Math.min(notDeliveredTotal,p+1))} disabled={notDeliveredPage===notDeliveredTotal} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        ) : null}

        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm p-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-[16px] border-b border-gray-100 p-[8px]">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900 label-1 font-urbanist">All Submissions</h2>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto">
                {['All Shipments', 'In Transit', 'Pickup Schedule', 'Delivered'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setActiveTab(t as any)
                      setCurrentPage(1) // Reset to first page when filter changes
                      updateUrlParams({ activeTab: t as any, page: 1 })
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      activeTab === t
                        ? 'bg-secondary-900 text-white border-secondary-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-[8px] border-b border-gray-200 flex items-center justify-between">
              <div className="relative w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1) // Reset to first page when search changes
                    updateUrlParams({ search: e.target.value, page: 1 })
                  }}
                  className="w-full pl-10 pr-12 py-2 rounded-md bg-gray-50 focus:outline-none"
                />
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">⌘/</div>
              </div>
              {isFilterLoading && (
                <div className="flex items-center text-secondary-900">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
                  <span className="text-body-4 font-urbanist">Updating...</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-gray-50 border-b border-gray-200">
                  <TableRow>
                    <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">AWB</TableHead>
                    <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Shipment ID</TableHead>
                    <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Courier</TableHead>
                    <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Items</TableHead>
                    <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Customer</TableHead>
                    <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Last Event</TableHead>
                    <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Amount</TableHead>
                    <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">Status</TableHead>
                    <TableHead className="px-[20px] py-[6px]" />
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {error ? (
                    <TableRow className="hover:bg-white">
                      <TableCell colSpan={10} className="px-[20px] py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertCircle className="h-12 w-12 text-red-400" />
                          <div className="text-lg font-semibold text-gray-500 font-urbanist">Error loading data</div>
                          <div className="text-sm text-gray-400 font-urbanist">{error}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isFilterLoading ? (
                    // Show skeleton loader when filtering/fetching (but data exists)
                    <TableSkeleton rows={itemsPerPage} columns={10} />
                  ) : pageRows.length > 0 ? (
                    pageRows.map((r, idx) => (
                      <TableRow key={`${r.awb}-${idx}`} className="hover:bg-gray-50 bg-white">
                        <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">{r.awb}</TableCell>
                        <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.shipmentId}</TableCell>
                        <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.courier}</TableCell>
                        <TableCell className="px-[20px] py-2 whitespace-nowrap max-w-xs">
                          <div className="truncate font-semibold text-neutral-800 body-3 font-urbanist">{r.items}</div>
                        </TableCell>
                        <TableCell className="px-[20px] py-2 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-800 body-3 font-urbanist">{r.customerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist">{r.lastEvent}</TableCell>
                        <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">{formatCurrencyINR(r.amount)}</TableCell>
                        <TableCell className="px-[20px] py-2 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${getStatusBadge(r.status)}`}>{r.status}</span>
                        </TableCell>
                        <TableCell className="px-[20px] py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetails(r)}
                            className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
                            title="View Order Details"
                          >
                            <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-white">
                      <TableCell colSpan={10} className="px-[20px] py-12 text-center">
                        <NoItemsView message={search ? `No results found for "${search}".` : undefined} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="px-5 py-[15px] border-t border-gray-200 flex items-center justify-between bg-white rounded-b-lg">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600 font-urbanist">Row Per Page</span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors duration-200 min-w-[60px] font-urbanist">
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
                              setItemsPerPage(value)
                              setCurrentPage(1)
                              updateUrlParams({ itemsPerPage: value, page: 1 })
                            }
                          }} 
                          disabled={isDisabled}
                          className={cn(
                            itemsPerPage === value ? 'bg-secondary-900 text-white' : '',
                            isDisabled && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {value}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-sm text-gray-600 font-urbanist">Entries</span>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => {
                  const newPage = Math.max(1, currentPage - 1)
                  setCurrentPage(newPage)
                  updateUrlParams({ page: newPage })
                }} disabled={currentPage === 1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p, i) => (
                    p === '...'
                      ? <span key={`dots-${i}`} className="px-2 text-sm text-gray-500">...</span>
                      : (
                        <button key={`p-${p}`} onClick={() => {
                          setCurrentPage(p as number)
                          updateUrlParams({ page: p as number })
                        }} className={`w-8 h-8 text-sm rounded-full border flex items-center justify-center ${currentPage === p ? 'text-white bg-secondary-900' : 'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white'}`}>{p}</button>
                      )
                  ))}
                </div>
                <button onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1)
                  setCurrentPage(newPage)
                  updateUrlParams({ page: newPage })
                }} disabled={currentPage === totalPages} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Overview Details Slider */}
        <ShipmentDetailsSlider
          isOpen={isSliderOpen}
          onClose={handleSliderClose}
          shipment={selectedShipment ? convertToShipmentData(selectedShipment) : null}
          orderId={selectedShipment?.rawData?.order_id}
      onSliderStateChange={onSliderStateChange}
          onViewFullPage={handleViewFullPage}
          userType={userType}
    />
    </div>
  )
}

export default ShippingPage
