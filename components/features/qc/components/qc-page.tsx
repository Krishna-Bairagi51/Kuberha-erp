"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AlertTriangle, XCircle, Info, Search, CircleChevronUp, CircleChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PageHeader from '@/components/shared/layout/page-header'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { DataTable } from '@/components/shared/table'
import { useUnifiedTable } from '@/hooks/table'
import { useDebounce } from '@/hooks/use-debounce'
import OrderSummarySlider from './order-summary-slider'
import { toast } from 'sonner'
import { useUserType } from '@/hooks/use-user-type'

// Import TanStack Query hooks
import { useQCInsights, useQCDashboardMetrics, useInvalidateQCInsights } from '../hooks/use-qc-insights'
import { 
  useTransformedQCData, 
  useInvalidateQCList, 
  useAdminPendingQCList, 
  useSellerPendingQCList,
  useSellerRejectedQCList,
  transformAdminOrderData,
  transformSellerQcData
} from '../hooks/use-qc-list'
import { useSectionFilters } from '../hooks/use-qc-filters'
import { useSellerNameListQuery } from '@/components/features/orders/hooks/use-orders-query'

import type { QCPageProps, UserType, TransformedQcItem, PaginationParams } from '../types/qc.types'
import type { Order } from '@/components/features/orders/types/orders.types'
import { ordersService } from '../../orders'

/**
 * QC Page Component
 * Handles both admin and seller views using TanStack Query
 * Consolidates all common logic and customizes based on userType
 */
export function QCPage({ 
  onSliderStateChange,
  section,
  sectionId,
  onSectionChange,
  onViewOrderDetail
}: QCPageProps) {
  // Get user type from global hook
  const { userType: globalUserType } = useUserType()
  const userType = (globalUserType as UserType) || 'seller'
  const isAdmin = userType === 'admin'

  // Read initial dropdown states from URL parameters (both admin and seller)
  const getInitialDropdownStates = useCallback(() => {
    if (typeof window === 'undefined') {
      return { pendingOpen: false, rejectedOpen: false }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      pendingOpen: urlParams.get('pendingOpen') === 'true',
      rejectedOpen: urlParams.get('rejectedOpen') === 'true',
    }
  }, [])

  const initialDropdownStates = getInitialDropdownStates()

  // State for panels and navigation
  const [isPendingPanelOpen, setIsPendingPanelOpen] = useState(initialDropdownStates.pendingOpen)
  const [isRejectedPanelOpen, setIsRejectedPanelOpen] = useState(initialDropdownStates.rejectedOpen)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isSliderOpen, setIsSliderOpen] = useState(false)
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false)
  const [previousSection, setPreviousSection] = useState<string | null>(null)
  
  // Update URL parameters for dropdown states (both admin and seller)
  const updateDropdownUrlParams = useCallback((updates: {
    pendingOpen?: boolean
    rejectedOpen?: boolean
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    const pathname = window.location.pathname
    const isQualityControlPage = pathname.includes('/quality-control')
    if (!isQualityControlPage) return
    
    if (updates.pendingOpen !== undefined) {
      if (updates.pendingOpen) {
        url.searchParams.set('pendingOpen', 'true')
      } else {
        url.searchParams.delete('pendingOpen')
      }
    }
    
    // Only update rejectedOpen for seller (admin doesn't have rejected dropdown)
    if (!isAdmin && updates.rejectedOpen !== undefined) {
      if (updates.rejectedOpen) {
        url.searchParams.set('rejectedOpen', 'true')
      } else {
        url.searchParams.delete('rejectedOpen')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [isAdmin])

  // Section-specific filters and pagination
  const pendingFilters = useSectionFilters('pending')
  const rejectedFilters = useSectionFilters('rejected')
  
  // Debounce search for pending items to avoid excessive API calls
  const debouncedPendingSearch = useDebounce(pendingFilters.searchTerm, 500)
  
  // Debounce search for rejected items to avoid excessive API calls
  const debouncedRejectedSearch = useDebounce(rejectedFilters.searchTerm, 500)
  
  // Read initial All Submissions filter state from URL parameters
  const getAllSubmissionsUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        searchTerm: '',
        status: 'all',
        supplier: 'all',
        page: 1,
        itemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      searchTerm: urlParams.get('submissionsQcSearch') || '',
      status: urlParams.get('submissionsQcStatus') || 'all',
      supplier: urlParams.get('submissionsQcSupplier') || 'all',
      page: parseInt(urlParams.get('submissionsQcPage') || '1', 10),
      itemsPerPage: parseInt(urlParams.get('submissionsQcItemsPerPage') || '10', 10),
    }
  }, [])

  const allSubmissionsUrlParams = getAllSubmissionsUrlParams()
  const [selectedSubmissionsStatus, setSelectedSubmissionsStatus] = useState(allSubmissionsUrlParams.status)
  const [selectedSupplier, setSelectedSupplier] = useState(allSubmissionsUrlParams.supplier)
  const [submissionsSearchTerm, setSubmissionsSearchTerm] = useState(allSubmissionsUrlParams.searchTerm)
  
  // Server-side pagination state for All Submissions (only for seller QC list)
  const [submissionsCurrentPage, setSubmissionsCurrentPage] = useState(allSubmissionsUrlParams.page)
  const [submissionsItemsPerPage, setSubmissionsItemsPerPage] = useState(allSubmissionsUrlParams.itemsPerPage)
  
  // Debounce search to avoid excessive API calls
  const debouncedSubmissionsSearch = useDebounce(submissionsSearchTerm, 500)

  // Fetch seller name list for supplier dropdown (admin only) - this provides the complete list of suppliers
  // and never changes based on filtered data
  const { data: sellerNameList = [] } = useSellerNameListQuery(isAdmin)
  
  // Get supplier list from sellerNameList query (complete list, never filtered)
  // This ensures the dropdown always shows all suppliers regardless of current filter/pagination
  const supplierOptions = useMemo(() => {
    if (!isAdmin || sellerNameList.length === 0) return []
    return sellerNameList.map(item => item.name).sort((a, b) => a.localeCompare(b))
  }, [sellerNameList, isAdmin])

  // Determine vendor_id for API call (only for admin users)
  // Find the vendor_id from sellerNameList based on selected supplier name
  const vendorId = useMemo(() => {
    if (selectedSupplier !== 'all' && isAdmin && sellerNameList.length > 0) {
      const seller = sellerNameList.find(item => item.name === selectedSupplier)
      return seller?.id
    }
    return undefined
  }, [selectedSupplier, sellerNameList, isAdmin])
  
  // Map filter button values to API status values (admin only)
  const getStatusForAPI = useCallback((filterValue: string, isAdminUser: boolean): string | undefined => {
    // Only apply status mapping for admin dashboard
    if (!isAdminUser) return undefined
    if (!filterValue || filterValue === 'all') return undefined
    // Map UI filter values to API status values
    const statusMap: Record<string, string> = {
      'new': 'new',
      'in progress': 'in_progress',
      'done': 'done',
    }
    return statusMap[filterValue.toLowerCase()] || undefined
  }, [])

  // Map seller filter button values to API status and type parameters
  // Filter buttons: "All QC's", "Pending Manufacturing QC", "Pending PKG QC", "Rejected QC"
  const getSellerFilterParams = useCallback((filterValue: string): { status?: string; type?: string } => {
    if (!filterValue || filterValue === 'all' || filterValue === "All QC's") {
      return {} // No filters - regular API call
    }
    
    const normalized = filterValue.toLowerCase()
    
    // Map filter values to status and type
    if (normalized === 'pending mfg qc' || normalized === 'pending manufacturing qc') {
      return { status: 'pending', type: 'mfg_qc' }
    }
    if (normalized === 'pending pkg qc' || normalized === 'pending packaging qc') {
      return { status: 'pending', type: 'pkg_qc' }
    }
    if (normalized === 'rejected' || normalized === 'rejected qc') {
      return { status: 'rejected' } // No type filter for rejected
    }
    
    return {}
  }, [])

  // Create pagination params for API call with debounced search and status/type filter
  const submissionsPaginationParams: PaginationParams = useMemo(() => {
    if (isAdmin) {
      // Admin: Status filter and vendor_id filter
      const status = getStatusForAPI(selectedSubmissionsStatus, isAdmin)
      return {
        page: submissionsCurrentPage,
        limit: submissionsItemsPerPage,
        search: debouncedSubmissionsSearch || undefined,
        status: status,
        vendor_id: vendorId,
      }
    } else {
      // Seller: Both status and type filters
      const filterParams = getSellerFilterParams(selectedSubmissionsStatus)
      return {
        page: submissionsCurrentPage,
        limit: submissionsItemsPerPage,
        search: debouncedSubmissionsSearch || undefined,
        status: filterParams.status,
        type: filterParams.type,
      }
    }
  }, [submissionsCurrentPage, submissionsItemsPerPage, debouncedSubmissionsSearch, selectedSubmissionsStatus, vendorId, isAdmin, getStatusForAPI, getSellerFilterParams])
  
  // Get URL params for pending/rejected pagination
  const getUrlParams = useCallback((prefix: string) => {
    if (typeof window === 'undefined') {
      return { page: 1, itemsPerPage: 10 }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      page: parseInt(urlParams.get(`${prefix}QcPage`) || '1', 10),
      itemsPerPage: parseInt(urlParams.get(`${prefix}QcItemsPerPage`) || '10', 10),
    }
  }, [])

  // Server-side pagination state for Pending QC Items (seller only)
  const pendingUrlParams = getUrlParams('pending')
  const [pendingCurrentPage, setPendingCurrentPage] = useState(pendingUrlParams.page)
  const [pendingItemsPerPage, setPendingItemsPerPage] = useState(pendingUrlParams.itemsPerPage)

  // Server-side pagination state for Rejected QC Items (seller only)
  const rejectedUrlParams = getUrlParams('rejected')
  const [rejectedCurrentPage, setRejectedCurrentPage] = useState(rejectedUrlParams.page)
  const [rejectedItemsPerPage, setRejectedItemsPerPage] = useState(rejectedUrlParams.itemsPerPage)

  // Map UI dropdown values to API type values
  // The "Status" dropdown is actually for the type parameter (mfg_qc or pkg_qc)
  const mapTypeFilterToApi = useCallback((filterValue: string): string | undefined => {
    if (!filterValue || filterValue === 'All' || filterValue === 'all') return undefined
    // Map UI dropdown values to API type values
    const typeMap: Record<string, string> = {
      'Manufacturing QC': 'mfg_qc',
      'MFG QC': 'mfg_qc',
      'Packaging QC': 'pkg_qc',
      'PKG QC': 'pkg_qc',
    }
    return typeMap[filterValue] || undefined
  }, [])

  // Create pagination params for Pending QC Items table
  const pendingPaginationParams: PaginationParams = useMemo(() => {
    if (isAdmin) {
      // Admin: Fetch all pending items at once for client-side pagination
      return {
        page: 1,
        limit: 1000, // Large limit to fetch all
        search: debouncedPendingSearch || undefined,
      }
    }
    // Seller: Server-side pagination with type filter
    return {
      page: pendingCurrentPage,
      limit: pendingItemsPerPage,
      search: debouncedPendingSearch || undefined,
      type: mapTypeFilterToApi(pendingFilters.statusFilter), // Map dropdown value to API type
    }
  }, [isAdmin, pendingCurrentPage, pendingItemsPerPage, debouncedPendingSearch, pendingFilters.statusFilter, mapTypeFilterToApi])

  // Create pagination params for Rejected QC Items table (seller only)
  const rejectedPaginationParams: PaginationParams = useMemo(() => ({
    page: rejectedCurrentPage,
    limit: rejectedItemsPerPage,
    search: debouncedRejectedSearch || undefined,
    type: mapTypeFilterToApi(rejectedFilters.statusFilter), // Map dropdown value to API type
  }), [rejectedCurrentPage, rejectedItemsPerPage, debouncedRejectedSearch, rejectedFilters.statusFilter, mapTypeFilterToApi])

  // Fetch QC data using TanStack Query hooks
  const { metrics, isLoading: isInsightsLoading, error: insightsError } = useQCDashboardMetrics()
  
  // Fetch data for "All Submissions" table - business as usual
  const { data: transformedData, totalRecordCount, isLoading: isListLoading, isFetching: isListFetching } = useTransformedQCData(
    userType,
    submissionsPaginationParams
  )
  
  // Fetch data separately for "Pending QC Items" table (admin only) - excludes 'new' status
  const { 
    orderList: pendingQCOrders, 
    totalRecordCount: pendingTotalRecordCount,
    isLoading: isPendingLoading,
    isFetching: isPendingFetching 
  } = useAdminPendingQCList(
    pendingPaginationParams,
    { enabled: isAdmin }
  )
  
  // Fetch pending QC items for seller dashboard (separate query)
  const { 
    qcList: sellerPendingQCList, 
    totalRecordCount: sellerPendingTotalRecordCount,
    isLoading: isSellerPendingLoading,
    isFetching: isSellerPendingFetching 
  } = useSellerPendingQCList(
    pendingPaginationParams,
    { enabled: !isAdmin }
  )
  
  // Fetch rejected QC items for seller dashboard (separate query)
  const { 
    qcList: sellerRejectedQCList, 
    totalRecordCount: sellerRejectedTotalRecordCount,
    isLoading: isSellerRejectedLoading,
    isFetching: isSellerRejectedFetching 
  } = useSellerRejectedQCList(
    rejectedPaginationParams, // Use separate pagination params for rejected items
    { enabled: !isAdmin }
  )
  
  // Transform pending QC items data separately
  const transformedPendingData = useMemo(() => {
    if (isAdmin) {
      return transformAdminOrderData(pendingQCOrders)
    }
    // Seller: Use separate API data for pending QC items
    return transformSellerQcData(sellerPendingQCList)
  }, [isAdmin, pendingQCOrders, sellerPendingQCList])
  
  // Transform rejected QC items data separately
  const transformedRejectedData = useMemo(() => {
    if (isAdmin) {
      // Admin: Filter from all submissions (for now, keeping admin logic as is)
      return transformedData.filter(item => 
        item.status.toLowerCase().includes('rejected')
      )
    }
    // Seller: Use separate API data for rejected QC items
    return transformSellerQcData(sellerRejectedQCList)
  }, [isAdmin, transformedData, sellerRejectedQCList])

  // Independent loading states for pending table (decoupled from rejected)
  const pendingTableLoadingState = useMemo(() => {
    if (isAdmin) {
      return {
        isLoading: isPendingLoading,
        isFetching: isPendingFetching,
      }
    }
    // Seller: Use seller-specific loading states
    return {
      isLoading: isSellerPendingLoading,
      isFetching: isSellerPendingFetching,
    }
  }, [isAdmin, isPendingLoading, isPendingFetching, isSellerPendingLoading, isSellerPendingFetching])

  // Independent loading states for rejected table (decoupled from pending)
  const rejectedTableLoadingState = useMemo(() => {
    if (isAdmin) {
      // Admin: Rejected items are filtered from all submissions, so use all submissions loading state
      return {
        isLoading: isListLoading,
        isFetching: isListFetching,
      }
    }
    // Seller: Use seller-specific loading states for rejected items
    return {
      isLoading: isSellerRejectedLoading,
      isFetching: isSellerRejectedFetching,
    }
  }, [isAdmin, isListLoading, isListFetching, isSellerRejectedLoading, isSellerRejectedFetching])
  
  // Invalidation helpers
  const invalidateInsights = useInvalidateQCInsights()
  const invalidateList = useInvalidateQCList()

  // Update URL parameters for All Submissions section
  const updateAllSubmissionsUrlParams = useCallback((updates: {
    searchTerm?: string
    status?: string
    supplier?: string
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    // Only update URL params if we're on the quality-control page (file-based route or tab query)
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    const isQualityControlPage = pathname.includes('/quality-control') || tab === 'quality-control'
    if (!isQualityControlPage) return
    
    if (updates.searchTerm !== undefined) {
      if (updates.searchTerm) {
        url.searchParams.set('submissionsQcSearch', updates.searchTerm)
      } else {
        url.searchParams.delete('submissionsQcSearch')
      }
    }
    
    if (updates.status !== undefined) {
      if (updates.status && updates.status !== 'all') {
        url.searchParams.set('submissionsQcStatus', updates.status)
      } else {
        url.searchParams.delete('submissionsQcStatus')
      }
    }
    
    if (updates.supplier !== undefined) {
      if (updates.supplier && updates.supplier !== 'all') {
        url.searchParams.set('submissionsQcSupplier', updates.supplier)
      } else {
        url.searchParams.delete('submissionsQcSupplier')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Update URL parameters for All Submissions pagination
  const updateAllSubmissionsPaginationUrlParams = useCallback((updates: {
    page?: number
    itemsPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    // Only update URL params if we're on the quality-control page (file-based route or tab query)
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    const isQualityControlPage = pathname.includes('/quality-control') || tab === 'quality-control'
    if (!isQualityControlPage) return
    
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        url.searchParams.set('submissionsQcPage', String(updates.page))
      } else {
        url.searchParams.delete('submissionsQcPage')
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set('submissionsQcItemsPerPage', String(updates.itemsPerPage))
      } else {
        url.searchParams.delete('submissionsQcItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Restore All Submissions state from URL when URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      const isQualityControlPage = pathname.includes('/quality-control') || tab === 'quality-control'
      if (isQualityControlPage) {
        const params = getAllSubmissionsUrlParams()
        setSubmissionsSearchTerm(params.searchTerm)
        setSelectedSubmissionsStatus(params.status)
        setSelectedSupplier(params.supplier)
        setSubmissionsCurrentPage(params.page)
        setSubmissionsItemsPerPage(params.itemsPerPage)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getAllSubmissionsUrlParams])

  // Sync All Submissions URL parameters when state changes
  useEffect(() => {
    updateAllSubmissionsUrlParams({
      searchTerm: submissionsSearchTerm,
      status: selectedSubmissionsStatus,
      supplier: selectedSupplier,
    })
  }, [submissionsSearchTerm, selectedSubmissionsStatus, selectedSupplier, updateAllSubmissionsUrlParams])

  // Sync All Submissions pagination URL parameters when state changes
  useEffect(() => {
    updateAllSubmissionsPaginationUrlParams({
      page: submissionsCurrentPage,
      itemsPerPage: submissionsItemsPerPage,
    })
  }, [submissionsCurrentPage, submissionsItemsPerPage, updateAllSubmissionsPaginationUrlParams])

  // Sync dropdown states with URL parameters on mount (both admin and seller)
  // Also maintain backward compatibility with section param for other pages
  useEffect(() => {
    // Handle legacy section param for backward compatibility (seller only, if used by other pages)
    if (!isAdmin && section === 'pending') {
      setIsPendingPanelOpen(true)
      updateDropdownUrlParams({ pendingOpen: true })
    } else if (!isAdmin && section === 'rejected') {
      setIsRejectedPanelOpen(true)
      updateDropdownUrlParams({ rejectedOpen: true })
    } else {
      // Read dropdown states from URL on mount
      const urlParams = new URLSearchParams(window.location.search)
      const pendingOpen = urlParams.get('pendingOpen') === 'true'
      const rejectedOpen = urlParams.get('rejectedOpen') === 'true'
      
      if (pendingOpen !== isPendingPanelOpen) {
        setIsPendingPanelOpen(pendingOpen)
      }
      // Only restore rejected for seller (admin doesn't have rejected dropdown)
      if (!isAdmin && rejectedOpen !== isRejectedPanelOpen) {
        setIsRejectedPanelOpen(rejectedOpen)
      }
    }
  }, []) // Only run on mount

  // Handle browser back/forward navigation to restore dropdown states
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const pendingOpen = urlParams.get('pendingOpen') === 'true'
      setIsPendingPanelOpen(pendingOpen)
      // Only restore rejected for seller (admin doesn't have rejected dropdown)
      if (!isAdmin) {
        const rejectedOpen = urlParams.get('rejectedOpen') === 'true'
        setIsRejectedPanelOpen(rejectedOpen)
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isAdmin])

  // Sync dropdown states to URL when they change
  useEffect(() => {
    updateDropdownUrlParams({
      pendingOpen: isPendingPanelOpen,
      rejectedOpen: isRejectedPanelOpen,
    })
  }, [isPendingPanelOpen, isRejectedPanelOpen, updateDropdownUrlParams])

  // Update sidebar blur state when slider opens/closes
  useEffect(() => {
    onSliderStateChange?.(isSliderOpen)
    return () => {
      onSliderStateChange?.(false)
    }
  }, [isSliderOpen, onSliderStateChange])

  // Filtered data for different sections (now using decoupled queries)
  const pendingData = useMemo(() => {
    // Both admin and seller now use separate API data
    return transformedPendingData
  }, [transformedPendingData])

  const rejectedData = useMemo(() => {
    // Both admin and seller now use separate API data
    return transformedRejectedData
  }, [transformedRejectedData])

  // Update URL params for pagination
  const updateUrlParams = useCallback((prefix: string, updates: { page?: number; itemsPerPage?: number }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    const isQualityControlPage = pathname.includes('/quality-control') || tab === 'quality-control'
    if (!isQualityControlPage) return
    
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        url.searchParams.set(`${prefix}QcPage`, String(updates.page))
      } else {
        url.searchParams.delete(`${prefix}QcPage`)
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set(`${prefix}QcItemsPerPage`, String(updates.itemsPerPage))
      } else {
        url.searchParams.delete(`${prefix}QcItemsPerPage`)
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Pending table with unified table hook
  const pendingTable = useUnifiedTable<TransformedQcItem>({
    items: pendingData,
    // Admin: No client-side search filtering (server-side search via API)
    // Seller: No client-side search filtering (server-side search via API)
    searchKeys: undefined, // Server-side search for both admin and seller
    getValue: {
      id: (item: TransformedQcItem) => item.id.toString(),
      sellerName: (item: TransformedQcItem) => item.sellerName || '',
    } as any,
    initialSearchTerm: pendingFilters.searchTerm,
    initialPage: isAdmin ? pendingUrlParams.page : pendingCurrentPage,
    initialItemsPerPage: isAdmin ? pendingUrlParams.itemsPerPage : pendingItemsPerPage,
    customFilters: !isAdmin ? [{
      key: 'status',
      initialValue: pendingFilters.statusFilter || 'All',
      matchFn: (item: TransformedQcItem, filterValue: string) => {
        // Server-side filtering: all filtering is done on the server via type parameter
        // This matchFn is kept for table compatibility but always returns true
        return true
      },
      getOptions: () => ['All', 'Manufacturing QC', 'Packaging QC'],
    }] : [],
    urlPersistence: undefined, // We handle URL manually
  })

  // Sync pending filters with unified table - use refs to prevent infinite loops
  const prevPendingSearchRef = useRef(pendingFilters.searchTerm)
  const prevPendingStatusRef = useRef(pendingFilters.statusFilter)

  useEffect(() => {
    if (prevPendingSearchRef.current !== pendingFilters.searchTerm) {
      prevPendingSearchRef.current = pendingFilters.searchTerm
      if (pendingTable.searchTerm !== pendingFilters.searchTerm) {
        pendingTable.setSearchTerm(pendingFilters.searchTerm)
      }
    }
  }, [pendingFilters.searchTerm])

  useEffect(() => {
    if (!isAdmin && prevPendingStatusRef.current !== pendingFilters.statusFilter) {
      prevPendingStatusRef.current = pendingFilters.statusFilter
      const statusFilter = pendingTable.customFilters?.status
      if (statusFilter && statusFilter.value !== pendingFilters.statusFilter) {
        statusFilter.setValue(pendingFilters.statusFilter || 'All')
      }
      // Reset page to 1 when status filter changes
      setPendingCurrentPage(1)
      updateUrlParams('pending', { page: 1 })
    }
  }, [pendingFilters.statusFilter, isAdmin, updateUrlParams])

  // Reset pending page to 1 when search changes (seller only - server-side pagination)
  useEffect(() => {
    if (!isAdmin && debouncedPendingSearch !== undefined) {
      setPendingCurrentPage(1)
      updateUrlParams('pending', { page: 1 })
    }
  }, [debouncedPendingSearch, isAdmin, updateUrlParams])

  // Sync server-side pagination state with unified table pagination (seller only)
  useEffect(() => {
    if (!isAdmin && pendingTable.pagination.currentPage !== pendingCurrentPage) {
      setPendingCurrentPage(pendingTable.pagination.currentPage)
    }
  }, [pendingTable.pagination.currentPage, isAdmin])

  useEffect(() => {
    if (!isAdmin && pendingTable.pagination.itemsPerPage !== pendingItemsPerPage) {
      setPendingItemsPerPage(pendingTable.pagination.itemsPerPage)
    }
  }, [pendingTable.pagination.itemsPerPage, isAdmin])

  // Update pending URL params and sync state
  useEffect(() => {
    if (isAdmin) {
      // Admin: Use unified table pagination (client-side)
      updateUrlParams('pending', {
        page: pendingTable.pagination.currentPage,
        itemsPerPage: pendingTable.pagination.itemsPerPage,
      })
    } else {
      // Seller: Use server-side pagination state
      updateUrlParams('pending', {
        page: pendingCurrentPage,
        itemsPerPage: pendingItemsPerPage,
      })
    }
  }, [isAdmin, pendingTable.pagination.currentPage, pendingTable.pagination.itemsPerPage, pendingCurrentPage, pendingItemsPerPage, updateUrlParams])

  // Rejected table with unified table hook
  const rejectedTable = useUnifiedTable<TransformedQcItem>({
    items: rejectedData,
    // Server-side search for seller
    searchKeys: undefined, // Server-side search
    getValue: {
      id: (item: TransformedQcItem) => item.id.toString(),
      sellerName: (item: TransformedQcItem) => item.sellerName || '',
    } as any,
    initialSearchTerm: rejectedFilters.searchTerm,
    initialPage: rejectedCurrentPage,
    initialItemsPerPage: rejectedItemsPerPage,
    customFilters: !isAdmin ? [{
      key: 'status',
      initialValue: rejectedFilters.statusFilter || 'All',
      matchFn: (item: TransformedQcItem, filterValue: string) => {
        // Server-side filtering: all filtering is done on the server via type parameter
        // This matchFn is kept for table compatibility but always returns true
        return true
      },
      getOptions: () => ['All', 'Manufacturing QC', 'Packaging QC'],
    }] : [],
    urlPersistence: undefined, // We handle URL manually
  })

  // Sync rejected filters with unified table - use refs to prevent infinite loops
  const prevRejectedSearchRef = useRef(rejectedFilters.searchTerm)
  const prevRejectedStatusRef = useRef(rejectedFilters.statusFilter)

  useEffect(() => {
    if (prevRejectedSearchRef.current !== rejectedFilters.searchTerm) {
      prevRejectedSearchRef.current = rejectedFilters.searchTerm
      if (rejectedTable.searchTerm !== rejectedFilters.searchTerm) {
        rejectedTable.setSearchTerm(rejectedFilters.searchTerm)
      }
    }
  }, [rejectedFilters.searchTerm])

  useEffect(() => {
    if (!isAdmin && prevRejectedStatusRef.current !== rejectedFilters.statusFilter) {
      prevRejectedStatusRef.current = rejectedFilters.statusFilter
      const statusFilter = rejectedTable.customFilters?.status
      if (statusFilter && statusFilter.value !== rejectedFilters.statusFilter) {
        statusFilter.setValue(rejectedFilters.statusFilter || 'All')
      }
      // Reset page to 1 when status filter changes
      setRejectedCurrentPage(1)
      updateUrlParams('rejected', { page: 1 })
    }
  }, [rejectedFilters.statusFilter, isAdmin, updateUrlParams])

  // Reset rejected page to 1 when search changes (seller only - server-side pagination)
  useEffect(() => {
    if (!isAdmin && debouncedRejectedSearch !== undefined) {
      setRejectedCurrentPage(1)
      updateUrlParams('rejected', { page: 1 })
    }
  }, [debouncedRejectedSearch, isAdmin, updateUrlParams])

  // Sync server-side pagination state with unified table pagination (seller only)
  useEffect(() => {
    if (!isAdmin && rejectedTable.pagination.currentPage !== rejectedCurrentPage) {
      setRejectedCurrentPage(rejectedTable.pagination.currentPage)
    }
  }, [rejectedTable.pagination.currentPage, isAdmin])

  useEffect(() => {
    if (!isAdmin && rejectedTable.pagination.itemsPerPage !== rejectedItemsPerPage) {
      setRejectedItemsPerPage(rejectedTable.pagination.itemsPerPage)
    }
  }, [rejectedTable.pagination.itemsPerPage, isAdmin])

  // Update rejected URL params and sync state
  useEffect(() => {
    // Seller: Use server-side pagination state
    updateUrlParams('rejected', {
      page: rejectedCurrentPage,
      itemsPerPage: rejectedItemsPerPage,
    })
  }, [rejectedCurrentPage, rejectedItemsPerPage, updateUrlParams])

  // All filtering (search, status, vendor_id) is now handled server-side via API
  // No client-side filtering needed
  const filteredSubmissionsData = transformedData

  // Sort submissions by date (latest first)
  const sortedSubmissionsItems = useMemo(() => {
    return [...filteredSubmissionsData].sort((a, b) => {
      const dateA = new Date((a.originalData as any).date).getTime()
      const dateB = new Date((b.originalData as any).date).getTime()
      return dateB - dateA
    })
  }, [filteredSubmissionsData])

  // Both seller and admin use server-side pagination (data already paginated from API)
  const sortedSubmissionsPaginated = useMemo(() => {
    // Server-side pagination: data is already paginated
    return sortedSubmissionsItems
  }, [sortedSubmissionsItems])

  // Calculate total pages (server-side for both)
  const submissionsTotalPages = useMemo(() => {
    // Server-side: use total_record_count from API
    return Math.max(1, Math.ceil(totalRecordCount / submissionsItemsPerPage))
  }, [totalRecordCount, submissionsItemsPerPage])

  // Reset to page 1 when filters change (this triggers new API call for both seller and admin)
  useEffect(() => {
    setSubmissionsCurrentPage(1)
  }, [submissionsSearchTerm, selectedSubmissionsStatus, selectedSupplier])

  // Update submissions URL params (handled by updateAllSubmissionsPaginationUrlParams)

  // Order detail handlers
  const handleViewOrderDetail = async (item: TransformedQcItem) => {
    const orderId = (item.originalData as any)?.id
    
    if (!orderId) {
      toast.error("Error: Order ID not found")
      return
    }
    
    if (isAdmin) {
      // Admin: Open slider first (no URL update for slider)
      const orderForSlider = item.originalData
      setSelectedOrder(orderForSlider)
      setIsSliderOpen(true)
      // Note: We don't update URL for slider view, only for full page view
    } else {
      // Seller: Navigate directly to detail page (no slider for seller)
      onViewOrderDetail?.(Number(orderId))
    }
  }

  const handleViewFullPage = (orderId?: number | string) => {
    setIsSliderOpen(false)
    const finalOrderId = orderId || selectedOrder?.id
    
    if (finalOrderId) {
      // Both admin and seller: Navigate to order detail page using file-based routing
      onViewOrderDetail?.(Number(finalOrderId))
      onSliderStateChange?.(false)
    }
  }

  const handleCloseSlider = () => {
    setIsSliderOpen(false)
    setSelectedOrder(null)
  }


  const handleRefresh = async () => {
    invalidateInsights()
    invalidateList(userType)
    
    // Refresh order details if we have a selected order
    if (selectedOrder) {
      try {
        const response = await ordersService.getSellerOrderDetails(selectedOrder.id)
        if (response.status_code === 200 && response.record) {
          const orderData = Array.isArray(response.record) ? response.record[0] : response.record
          if (orderData) {
            setSelectedOrder(orderData)
          }
        }
      } catch (error) {
        // Silent error - data will be stale but we tried
      }
    }
  }

  // Get status badge colors
  const getStatusBadgeColors = (status: string) => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('rejected')) {
      return 'bg-red-50 text-red-800 border-red-200'
    } else if (lowerStatus.includes('approved')) {
      return 'bg-green-50 text-green-800 border-green-200'
    } else if (lowerStatus.includes('pending')) {
      return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }
    // else if (lowerStatus.includes('new')){
    //   return 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]'
    // }
    // else if (lowerStatus.includes('done')){
    //   return 'bg-green-50 text-green-800 border-green-100'
    // }
    return 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]'
  }


  const hasError = insightsError

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Quality Control" />
      
      {/* Loading State - Only show for order details loading (slider) */}
      {isLoadingOrderDetails && (
        <LoadingSpinner />
      )}
      
      {/* Error State */}
      {hasError && !isInsightsLoading && (
        <div className="px-4 py-6">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800 font-urbanist">Error Loading Data</h3>
                  <p className="text-red-700 font-urbanist text-sm mt-1">{hasError}</p>
                  <button 
                    onClick={() => {
                      invalidateInsights()
                      invalidateList(userType)
                    }} 
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-urbanist"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Main Content - Show immediately, table will handle its own loading states */}
      {!hasError && (
        <>
          {/* Insights & Performance Section */}
          <div className="px-4 pb-6 mt-[24px]">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-0">
                {/* Card Header */}
                <div className="flex items-center justify-between p-[8px] border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <h2 className="font-semibold text-gray-900 label-1 font-urbanist text-lg">Insights & Performance</h2>
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                {isInsightsLoading ? (
                  <div className="grid grid-cols-5 divide-x divide-gray-200">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="py-4 px-2">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="h-6 w-12 bg-neutral-200 rounded animate-pulse" />
                          <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-5 divide-x divide-gray-200">
                    {/* Pending MFG QC */}
                    <div className="py-4 px-2">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">Pending MFG QC</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 font-bold text-gray-900 font-spectral">{metrics.pending_mfg_qc}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center">
                          <img src="/images/svg/tabler_clock-filled.svg" alt="Clock" className="h-5 w-5"/>
                        </div>
                      </div>
                    </div>

                    {/* Pending PKG QC */}
                  <div className="py-4 px-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">Pending PKG QC</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 font-bold text-gray-900 font-spectral">{metrics.pending_pkg_qc}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        <img src="/images/svg/tabler_clock-filled.svg" alt="Clock" className="h-5 w-5"/>
                      </div>
                    </div>
                  </div>

                  {/* PKG QC Rejected */}
                  <div className="py-4 px-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">PKG QC Rejected</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 font-bold text-red-500 font-spectral">{metrics.pkg_qc_rejected}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        <img src="/images/svg/material-symbols_cancel-rounded.svg" alt="Cancel" className="h-5 w-5"/>
                      </div>
                    </div>
                  </div>

                  {/* MFG QC Rejected */}
                  <div className="py-4 px-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">MFG QC Rejected</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 font-bold text-gray-900 font-spectral">{metrics.mfg_qc_rejected}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        <img src="/images/svg/material-symbols_cancel-rounded.svg" alt="Cancel" className="h-5 w-5"/>
                      </div>
                    </div>
                  </div>

                  {/* Ready to Ship */}
                  <div className="py-4 px-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">Ready to Ship</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 font-bold text-gray-900 font-spectral">{metrics.ready_to_ship}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        <img src="/images/svg/solar_delivery-bold.svg" alt="Delivery" className="h-5 w-5"/>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending QC Items Panel */}
          <div className="px-4 pb-6">
            <Card className="bg-[#FFEED0] shadow-sm">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border border-[#FBE1B2] rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold font-urbanist" style={{ color: '#BC7810' }}>
                      {pendingTable.filteredCount} QC {pendingTable.filteredCount === 1 ? 'item is' : 'items are'} pending{!isAdmin && ' that are pending QC'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newState = !isPendingPanelOpen
                      setIsPendingPanelOpen(newState)
                      // Update URL param directly (no longer using section param for dropdowns)
                      updateDropdownUrlParams({ pendingOpen: newState })
                    }}
                    className="p-1 hover:bg-[#FFEED0] rounded transition-colors"
                    style={{ color: '#BC7810' }}
                  >
                    {isPendingPanelOpen ? (
                      <CircleChevronUp className="h-5 w-5 text-[#BC7810]" />
                    ) : (
                      <CircleChevronDown className="h-5 w-5 text-[#BC7810]" />
                    )}
                  </button>
                </div>

                {/* Collapsible Table */}
                {isPendingPanelOpen && (
                  <PendingQCTable
                    table={pendingTable}
                    searchTerm={pendingFilters.searchTerm}
                    setSearchTerm={pendingFilters.setSearchTerm}
                    statusFilter={pendingFilters.statusFilter}
                    setStatusFilter={pendingFilters.setStatusFilter}
                    onViewDetail={handleViewOrderDetail}
                    isLoadingDetails={isLoadingOrderDetails}
                    getStatusBadgeColors={getStatusBadgeColors}
                    isAdmin={isAdmin}
                    isLoading={pendingTableLoadingState.isLoading}
                    isFetching={pendingTableLoadingState.isFetching}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rejected QC Items Panel (Seller only) */}
          {!isAdmin && (
            <div className="px-4 pb-6">
              <Card className="bg-[#FFE5E5] shadow-sm">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border border-[#FFB8B8] rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5" style={{ color: '#C81E1E' }} />
                      <span className="font-semibold font-urbanist" style={{ color: '#C81E1E' }}>
                        {rejectedData.length > 0 
                          ? `${rejectedData.length} QC's are rejected - Please check the photos and submit again`
                          : 'No rejected QC items'
                        }
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const newState = !isRejectedPanelOpen
                        setIsRejectedPanelOpen(newState)
                        // Update URL param directly (no longer using section param for dropdowns)
                        updateDropdownUrlParams({ rejectedOpen: newState })
                      }}
                      className="p-1 hover:bg-[#FFE5E5] rounded transition-colors"
                      style={{ color: '#C81E1E' }}
                    >
                      {isRejectedPanelOpen ? (
                        <CircleChevronUp className="h-5 w-5 text-[#C81E1E]" />
                      ) : (
                        <CircleChevronDown className="h-5 w-5 text-[#C81E1E]" />
                      )}
                    </button>
                  </div>

                  {/* Collapsible Table */}
                  {isRejectedPanelOpen && (
                    <PendingQCTable
                      table={rejectedTable}
                      searchTerm={rejectedFilters.searchTerm}
                      setSearchTerm={rejectedFilters.setSearchTerm}
                      statusFilter={rejectedFilters.statusFilter}
                      setStatusFilter={rejectedFilters.setStatusFilter}
                      onViewDetail={handleViewOrderDetail}
                      isLoadingDetails={isLoadingOrderDetails}
                      getStatusBadgeColors={getStatusBadgeColors}
                      isAdmin={isAdmin}
                      isLoading={rejectedTableLoadingState.isLoading}
                      isFetching={rejectedTableLoadingState.isFetching}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* All Submissions Section */}
          <AllSubmissionsSection
            sortedPaginatedItems={sortedSubmissionsPaginated}
            searchTerm={submissionsSearchTerm}
            setSearchTerm={(term) => {
              setSubmissionsSearchTerm(term)
              setSubmissionsCurrentPage(1) // Reset to first page when search changes
              updateAllSubmissionsUrlParams({ searchTerm: term })
              updateAllSubmissionsPaginationUrlParams({ page: 1 })
            }}
            statusFilter={selectedSubmissionsStatus}
            setStatusFilter={(status) => {
              setSelectedSubmissionsStatus(status)
              setSubmissionsCurrentPage(1) // Reset to first page when filter changes
              updateAllSubmissionsUrlParams({ status })
              updateAllSubmissionsPaginationUrlParams({ page: 1 })
            }}
            supplierFilter={selectedSupplier}
            setSupplierFilter={(supplier) => {
              setSelectedSupplier(supplier)
              setSubmissionsCurrentPage(1) // Reset to first page when filter changes
              updateAllSubmissionsUrlParams({ supplier })
              updateAllSubmissionsPaginationUrlParams({ page: 1 })
            }}
            supplierOptions={supplierOptions}
            onViewDetail={handleViewOrderDetail}
            isLoadingDetails={isLoadingOrderDetails}
            isLoading={isListLoading}
            isFetching={isListFetching}
            getStatusBadgeColors={getStatusBadgeColors}
            isAdmin={isAdmin}
            currentPage={submissionsCurrentPage}
            itemsPerPage={submissionsItemsPerPage}
            totalPages={submissionsTotalPages}
            totalItems={totalRecordCount}
            onPageChange={(page) => {
              setSubmissionsCurrentPage(page)
              updateAllSubmissionsPaginationUrlParams({ page })
            }}
            onItemsPerPageChange={(items) => {
              setSubmissionsItemsPerPage(items)
              setSubmissionsCurrentPage(1)
              updateAllSubmissionsPaginationUrlParams({ itemsPerPage: items, page: 1 })
            }}
            userType={userType}
          />
        </>
      )}
      
      {/* Order Summary Slider (Admin only) */}
      {isAdmin && (
        <OrderSummarySlider
          isOpen={isSliderOpen}
          onClose={handleCloseSlider}
          order={selectedOrder}
          onSliderStateChange={setIsSliderOpen}
          onViewFullPage={handleViewFullPage}
        />
      )}
    </div>
  )
}

// Sub-components
interface PendingQCTableProps {
  table: ReturnType<typeof useUnifiedTable<TransformedQcItem>>
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  onViewDetail: (item: TransformedQcItem) => void
  isLoadingDetails: boolean
  getStatusBadgeColors: (status: string) => string
  isAdmin: boolean
  // Independent loading states for skeleton loader
  isLoading?: boolean
  isFetching?: boolean
}

function PendingQCTable({
  table,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onViewDetail,
  isLoadingDetails,
  getStatusBadgeColors,
  isAdmin,
  isLoading = false,
  isFetching = false,
}: PendingQCTableProps) {
  // Column definitions
  const columns = useMemo(() => [
    {
      id: 'orderId',
      header: 'Order ID',
      cell: (item: TransformedQcItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {item.id}
        </span>
      ),
    },
    {
      id: 'productName',
      header: 'Product Name',
      cell: (item: TransformedQcItem) => (
        <div className="truncate max-w-xs font-semibold text-neutral-800 body-3 font-urbanist">
          {item.productName}
        </div>
      ),
    },
    {
      id: 'customerName',
      header: 'Customer Name',
      cell: (item: TransformedQcItem) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">
            {item.customerName}
          </span>
          <span className="text-xs text-gray-500 font-urbanist">
            {item.customerPhone}
          </span>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: (item: TransformedQcItem) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">
            {item.date}
          </span>
          <span className="text-xs text-gray-500 font-urbanist">
            {item.time}
          </span>
        </div>
      ),
    },
    ...(isAdmin ? [{
      id: 'sellerName',
      header: 'Supplier Name',
      cell: (item: TransformedQcItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {item.sellerName || 'N/A'}
        </span>
      ),
    }] : []),
    {
      id: 'amount',
      header: 'Amount',
      cell: (item: TransformedQcItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {item.amount}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: TransformedQcItem) => (
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${getStatusBadgeColors(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (item: TransformedQcItem) => (
        <button 
          onClick={() => onViewDetail(item)}
          disabled={isLoadingDetails}
          className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="View Order Details"
        >
          <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
        </button>
      ),
    },
  ], [isAdmin, getStatusBadgeColors, onViewDetail, isLoadingDetails])

  return (
    <div className="bg-white slide-down animation-slide-down">
      {/* Search and Filter Section */}
      <div className="px-[8px] py-[15px] border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              ⌘/
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] body-4 font-urbanist h-8 text-sm border-gray-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Manufacturing QC">Manufacturing QC</SelectItem>
                  <SelectItem value="Packaging QC">Packaging QC</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <DataTable<TransformedQcItem>
        items={table.paginatedItems}
        columns={columns}
        getRowKey={(item, index) => `${item.id}-${index}`}
        pagination={table.pagination}
        totalItems={table.filteredCount}
        isLoading={isLoading && table.paginatedItems.length === 0}
        isFetching={isFetching && table.paginatedItems.length > 0}
        searchTerm={searchTerm}
        onClearSearch={() => setSearchTerm('')}
        emptyTitle="No items found"
        emptyDescription={searchTerm ? `No results found for "${searchTerm}". Try adjusting your search terms or check for typos.` : "No items available at the moment."}
        withCard={false}
        className=""
        tableClassName="w-full"
        headerClassName="bg-gray-50 border-b border-gray-200"
        bodyClassName="bg-white"
        showPagination={table.filteredCount > 0}
      />
    </div>
  )
}

interface AllSubmissionsSectionProps {
  sortedPaginatedItems: TransformedQcItem[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  supplierFilter: string
  setSupplierFilter: (filter: string) => void
  supplierOptions: string[]
  onViewDetail: (item: TransformedQcItem) => void
  isLoadingDetails: boolean
  isLoading: boolean
  isFetching: boolean
  getStatusBadgeColors: (status: string) => string
  isAdmin: boolean
  // Server-side pagination props
  currentPage: number
  itemsPerPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  userType: UserType
}

function AllSubmissionsSection({
  sortedPaginatedItems,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  supplierFilter,
  setSupplierFilter,
  supplierOptions,
  onViewDetail,
  isLoadingDetails,
  isLoading,
  isFetching,
  getStatusBadgeColors,
  isAdmin,
  currentPage,
  itemsPerPage,
  totalPages,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  userType,
}: AllSubmissionsSectionProps) {
  // Status tabs - different for admin and seller
  const statusTabs = isAdmin
    ? [
        { value: 'all', label: 'All' },
        { value: 'new', label: 'New' },
        { value: 'in progress', label: 'In Progress' },
        { value: 'done', label: 'Done' }
      ]
    : [
        { value: 'all', label: "All QC's" },
        { value: 'pending mfg qc', label: 'Pending Manufacturing QC' },
        { value: 'pending pkg qc', label: 'Pending PKG QC' },
        { value: 'rejected', label: 'Rejected QC' }
      ]

  // Column definitions
  const columns = useMemo(() => [
    {
      id: 'orderId',
      header: 'Order ID',
      cell: (item: TransformedQcItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {item.id}
        </span>
      ),
    },
    {
      id: 'productName',
      header: 'Product Name',
      cell: (item: TransformedQcItem) => (
        <div className="truncate max-w-xs font-semibold text-neutral-800 body-3 font-urbanist">
          {item.productName}
        </div>
      ),
    },
    {
      id: 'customerName',
      header: 'Customer Name',
      cell: (item: TransformedQcItem) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">
            {item.customerName}
          </span>
          <span className="text-xs text-gray-500 font-urbanist">
            {item.customerPhone}
          </span>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: (item: TransformedQcItem) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">
            {item.date}
          </span>
          <span className="text-xs text-gray-500 font-urbanist">
            {item.time}
          </span>
        </div>
      ),
    },
    ...(isAdmin ? [{
      id: 'sellerName',
      header: 'Supplier Name',
      cell: (item: TransformedQcItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {item.sellerName || 'N/A'}
        </span>
      ),
    }] : []),
    {
      id: 'amount',
      header: 'Amount',
      cell: (item: TransformedQcItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {item.amount}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: TransformedQcItem) => (
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${getStatusBadgeColors(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (item: TransformedQcItem) => (
        <button 
          onClick={() => onViewDetail(item)}
          disabled={isLoadingDetails}
          className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="View Order Details"
        >
          <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
        </button>
      ),
    },
  ], [isAdmin, getStatusBadgeColors, onViewDetail, isLoadingDetails])

  return (
    <div className="px-4 pb-6 mt-[16px]">
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm p-0">
        <CardContent className="p-0">
          {/* Header with title and filter button */}
          <div className="flex items-center justify-between p-[16px] border-b border-gray-100 p-[8px]">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-900 label-1 font-urbanist">All Submissions</h2>
              <Info className="h-[14px] w-[14px] text-gray-400" />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value)
                    onPageChange(1)
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    statusFilter === tab.value
                      ? 'bg-secondary-900 text-white border-secondary-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-[8px] border-b border-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 rounded-md bg-gray-50 focus:outline-none"
                />
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  ⌘/
                </div>
              </div>
              {isAdmin && (
                <div className="w-full sm:w-[240px]">
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-full bg-gray-50">
                      <SelectValue placeholder="Filter by supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {supplierOptions.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DataTable<TransformedQcItem>
            items={sortedPaginatedItems}
            columns={columns}
            getRowKey={(item, index) => `${item.id}-${index}`}
            pagination={{
              currentPage,
              itemsPerPage,
              totalPages,
              pageNumbers: Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                if (totalPages <= 5) return i + 1
                if (currentPage <= 3) return i + 1
                if (currentPage >= totalPages - 2) return totalPages - 4 + i
                return currentPage - 2 + i
              }),
              setCurrentPage: onPageChange,
              setItemsPerPage: onItemsPerPageChange,
              handlePreviousPage: () => onPageChange(Math.max(1, currentPage - 1)),
              handleNextPage: () => onPageChange(Math.min(currentPage + 1, totalPages)),
              goToFirstPage: () => onPageChange(1),
              goToLastPage: () => onPageChange(totalPages),
              canGoPrevious: currentPage > 1,
              canGoNext: currentPage < totalPages,
            }}
            totalItems={totalItems}
            isLoading={isLoading && sortedPaginatedItems.length === 0}
            isFetching={isFetching && sortedPaginatedItems.length > 0}
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
            emptyTitle="No items found"
            emptyDescription={searchTerm ? `No results found for "${searchTerm}". Try adjusting your search terms or check for typos.` : "No items available at the moment."}
            withCard={false}
            className=""
            tableClassName="w-full"
            headerClassName="bg-gray-50 border-b border-gray-200"
            bodyClassName="bg-white"
            showPagination={totalItems > 0}
          />
        </CardContent>
      </Card>
    </div>
  )
}


export default QCPage
