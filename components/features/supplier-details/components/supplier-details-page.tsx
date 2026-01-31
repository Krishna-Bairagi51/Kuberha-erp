'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Search, Plus, Eye } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

import PageHeader from '@/components/shared/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSupplierListQuery } from '../hooks/use-supplier-query'
import type { SupplierListItem, PaginationParams } from '../types/supplier.types'
import { ViewSupplierForm } from './View-supplier-details/view-supplier-form'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { DataTable, type DataTableColumn } from '@/components/shared/table'
import { AddSupplierModal } from './add-supplier-modal'
import type { PaginationState } from '@/hooks/table'

interface MainAllSupplierDetailsProps {
  onSliderStateChange?: (isOpen: boolean) => void
  // Legacy section props (to be removed after full migration)
  section?: string | null
  sectionId?: string | null
  onSectionChange?: (section: string | null, id?: string | number | null) => void
  // Navigation callback for file-based routing
  onViewSupplierDetail?: (supplierId: string | number) => void
}

type SupplierStatus = 'Approved' | 'Rejected' | 'Pending' | 'Draft'

interface OverviewCardConfig {
  label: string
  value: number
  iconSrc: string
  iconAlt: string
}

interface SupplierRow {
  id: string
  supplierName: string
  contact: string
  docsStatus: string
  createdAt: string
  lastActivity: string
  status: SupplierStatus
}

// Status filter buttons: All, Draft, Pending, Approved, Rejected
// These map to API status values: draft, pending, approved, rejected
const statusTabs: { label: string; value: 'All' | 'Draft' | 'Pending' | 'Approved' | 'Rejected' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' }
]

const statusToneMap: Record<SupplierStatus, string> = {
  Approved: 'bg-green-50 text-green-600 border-none',
  Rejected: 'bg-rose-50 text-rose-600 border-none',
  Pending: 'bg-[#FFEED0] text-[#E59213] border-none',
  Draft: 'bg-orange-50 text-orange-600 border-none'
}

const overviewCards: OverviewCardConfig[] = [
  { label: 'Active Suppliers', value: 180, iconSrc: '/images/svg/tabler_clock-filled.svg', iconAlt: 'Active Suppliers' },
  { label: 'Pending Review', value: 10, iconSrc: '/images/svg/material-symbols_timelapse-rounded.svg', iconAlt: 'Pending Review' },
  { label: 'Draft Forms', value: 25, iconSrc: '/images/svg/material-symbols_timelapse-rounded.svg', iconAlt: 'Draft Forms' },
  { label: 'On Hold', value: 5, iconSrc: '/images/svg/material-symbols_delivery-truck-speed-rounded (1).svg', iconAlt: 'On Hold' }
]

const sanitizeValue = (value?: string | null, fallback = 'Not available') => {
  if (!value) return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

const formatSupplierStatus = (sellerState?: string | null): SupplierStatus => {
  // Use seller_state key to determine status
  // seller_state can be: "approved", "rejected", "pending", "draft"
  const normalized = (sellerState || '').trim().toLowerCase()

  switch (normalized) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'pending':
      return 'Pending'
    case 'draft':
      return 'Draft'
    default:
      // Fallback to 'Pending' if seller_state is not provided or has unexpected value
      return 'Pending'
  }
}

const mapSellerRecordToSupplierRow = (record: SupplierListItem): SupplierRow => {
  const createdValue = sanitizeValue(record.created_status, 'Not available')

  return {
    id: `${String(record.id)}`,
    supplierName: sanitizeValue(record.name, 'Unknown Supplier'),
    contact: sanitizeValue(record.phone || record.email, 'Not provided'),
    docsStatus: sanitizeValue(record.docs_status, 'Awaiting review'),
    createdAt: createdValue,
    lastActivity: sanitizeValue(record.seller_state || record.status, createdValue),
    status: formatSupplierStatus(record.seller_state)
  }
}

function MainAllSupplierDetails({ onSliderStateChange, section, sectionId, onSectionChange, onViewSupplierDetail }: MainAllSupplierDetailsProps) {
  // Helper function to validate and normalize status from URL
  const validateStatus = useCallback((status: string | null): 'All' | 'Draft' | 'Pending' | 'Approved' | 'Rejected' => {
    if (!status || status === 'All') return 'All'
    const validStatuses: ('All' | 'Draft' | 'Pending' | 'Approved' | 'Rejected')[] = ['All', 'Draft', 'Pending', 'Approved', 'Rejected']
    return validStatuses.includes(status as any) ? (status as 'Draft' | 'Pending' | 'Approved' | 'Rejected') : 'All'
  }, [])

  // Map UI status values to API status values
  const mapStatusToApi = useCallback((uiStatus: 'All' | 'Draft' | 'Pending' | 'Approved' | 'Rejected'): string | undefined => {
    switch (uiStatus) {
      case 'All':
        return undefined // No status filter - get all suppliers
      case 'Draft':
        return 'draft'
      case 'Pending':
        return 'pending'
      case 'Approved':
        return 'approved'
      case 'Rejected':
        return 'rejected'
      default:
        return undefined
    }
  }, [])

  // Read initial filter and pagination state from URL parameters
  const getUrlParams = useCallback((): {
    searchTerm: string
    status: 'All' | 'Draft' | 'Pending' | 'Approved' | 'Rejected'
    page: number
    itemsPerPage: number
  } => {
    if (typeof window === 'undefined') {
      return {
        searchTerm: '',
        status: 'All',
        page: 1,
        itemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      searchTerm: urlParams.get('supplierSearch') || '',
      status: validateStatus(urlParams.get('supplierStatus')),
      page: parseInt(urlParams.get('supplierPage') || '1', 10),
      itemsPerPage: parseInt(urlParams.get('supplierItemsPerPage') || '10', 10),
    }
  }, [validateStatus])

  // Initialize state from URL parameters
  const urlParams = getUrlParams()

  // Local UI state
  const [searchTerm, setSearchTerm] = useState(urlParams.searchTerm)
  const [activeStatus, setActiveStatus] = useState<'All' | 'Draft' | 'Pending' | 'Approved' | 'Rejected'>(urlParams.status)
  const [currentPage, setCurrentPage] = useState(urlParams.page)
  const [itemsPerPage, setItemsPerPage] = useState(urlParams.itemsPerPage)
  const [viewSupplierForm, setViewSupplierForm] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false)

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Server-side pagination params with debounced search and status filter
  const paginationParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
    status: mapStatusToApi(activeStatus),
  }), [currentPage, itemsPerPage, debouncedSearch, activeStatus, mapStatusToApi])

  // TanStack Query hooks with pagination
  const { data: supplierListData, isLoading, isFetching, error: queryError } = useSupplierListQuery(
    { enabled: true },
    paginationParams
  )

  // Map API data to UI format using cached data
  // Depend on the whole response object (not just record) to ensure re-render when data changes
  // This matches the inventory pattern and prevents issues with reference comparison
  const suppliers = useMemo(() => {
    if (!supplierListData?.record) return []
    return supplierListData.record.map(mapSellerRecordToSupplierRow)
  }, [supplierListData])

  // Loading states for the table:
  // - isInitialLoading: First mount with no data yet - shows full page spinner
  // - isPaginationLoading: During pagination/filtering - shows table skeleton
  // 
  // Key insight: When switching pages, if the new page isn't cached:
  // - TanStack Query's `isLoading` is true (new query key, never fetched)
  // - `supplierListData` is undefined, so `suppliers` is []
  // - We need to show skeleton for pagination transitions too
  //
  // We show skeleton when fetching AND (we had data before OR we're on a page > 1)
  // This ensures skeleton shows during pagination even when navigating to uncached pages
  const isInitialLoading = isLoading && !suppliers.length && currentPage === 1
  const isPaginationLoading = isFetching || (isLoading && currentPage > 1)

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    searchTerm?: string
    activeStatus?: 'All' | 'Draft' | 'Pending' | 'Approved' | 'Rejected'
    currentPage?: number
    itemsPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    // Only update URL params if we're on the all-supplier-details page (file-based route or tab query) and not in a section
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    const isSupplierDetailsPage = pathname.includes('/all-supplier-details') || tab === 'all-supplier-details'
    if (!isSupplierDetailsPage || section) return
    
    if (updates.searchTerm !== undefined) {
      if (updates.searchTerm) {
        url.searchParams.set('supplierSearch', updates.searchTerm)
      } else {
        url.searchParams.delete('supplierSearch')
      }
    }
    
    if (updates.activeStatus !== undefined) {
      if (updates.activeStatus && updates.activeStatus !== 'All') {
        url.searchParams.set('supplierStatus', updates.activeStatus)
      } else {
        url.searchParams.delete('supplierStatus')
      }
    }
    
    if (updates.currentPage !== undefined) {
      if (updates.currentPage > 1) {
        url.searchParams.set('supplierPage', String(updates.currentPage))
      } else {
        url.searchParams.delete('supplierPage')
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set('supplierItemsPerPage', String(updates.itemsPerPage))
      } else {
        url.searchParams.delete('supplierItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [section])

  // Get record_total_count from API response for server-side pagination (prioritize record_total_count)
  // Don't fallback to suppliers.length as that's the current page count, not total count
  const totalRecordCount = supplierListData?.record_total_count ?? supplierListData?.total_record_count ?? supplierListData?.count ?? 0

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch supplier details.') : null

  // Sync state with URL section params (only for legacy routing)
  // File-based routing uses separate route pages, so section logic is only for backward compatibility
  useEffect(() => {
    // Skip section logic if using file-based routing
    if (onViewSupplierDetail) {
      return
    }
    
    if (section === 'supplier-form' && sectionId) {
      setViewSupplierForm(true)
      setSelectedSupplierId(sectionId)
    } else if (!section) {
      setViewSupplierForm(false)
      setSelectedSupplierId(null)
    }
  }, [section, sectionId, onViewSupplierDetail])

  // Server-side filtering: data is already filtered by status and search on the server
  // No client-side filtering needed
  const paginatedData = suppliers

  // Server-side pagination: totalPages based on record_total_count from API
  const totalPages = Math.max(1, Math.ceil(totalRecordCount / itemsPerPage))

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo((): Array<number | string> => {
    const pages: Array<number | string> = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  const overviewCardsToRender = useMemo(() => {
    if (!suppliers.length) {
      return overviewCards
    }

    return overviewCards.map((card) =>
      card.label === 'Active Suppliers'
        ? { ...card, value: suppliers.length }
        : card
    )
  }, [suppliers.length])


  // NOTE: Removed the effect that auto-adjusted currentPage when totalPages changed.
  // This was causing a race condition during pagination:
  // 1. User clicks page 2, currentPage set to 2
  // 2. Query starts fetching, data is undefined during fetch
  // 3. totalRecordCount becomes 0, totalPages becomes 1
  // 4. Effect fires: currentPage (2) > totalPages (1), resets currentPage to 1
  // 5. Query key changes back to page 1, causing the bug
  // 
  // Instead, we handle this in the pagination handlers where we have proper context
  // and can avoid resetting during data transitions.

  // Restore state from URL when URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      // Only restore if we're on the all-supplier-details page (file-based route or tab query)
      const pathname = window.location.pathname
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      const isSupplierDetailsPage = pathname.includes('/all-supplier-details') || tab === 'all-supplier-details'
      if (isSupplierDetailsPage) {
        const params = getUrlParams()
        // Always set from URL - React will handle no-op if values are the same
        setSearchTerm(params.searchTerm)
        setActiveStatus(params.status)
        setCurrentPage(params.page)
        setItemsPerPage(params.itemsPerPage)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getUrlParams])

  // Sync URL parameters when state changes
  useEffect(() => {
    updateUrlParams({
      searchTerm,
      activeStatus,
      currentPage,
      itemsPerPage,
    })
  }, [searchTerm, activeStatus, currentPage, itemsPerPage, updateUrlParams])

  // Pagination handlers wrapped in useCallback for stability
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      updateUrlParams({ currentPage: page })
    }
  }, [totalPages, updateUrlParams])

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updateUrlParams({ currentPage: newPage })
    }
  }, [currentPage, updateUrlParams])

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updateUrlParams({ currentPage: newPage })
    }
  }, [currentPage, totalPages, updateUrlParams])

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    updateUrlParams({ itemsPerPage: newItemsPerPage, currentPage: 1 })
  }, [updateUrlParams])

  // Create pagination state object matching PaginationState interface
  const pagination: PaginationState = useMemo(() => ({
    currentPage,
    itemsPerPage,
    totalPages,
    pageNumbers,
    setCurrentPage: handlePageChange,
    setItemsPerPage: handleItemsPerPageChange,
    handlePreviousPage,
    handleNextPage,
    goToFirstPage: () => handlePageChange(1),
    goToLastPage: () => handlePageChange(totalPages),
    canGoPrevious: currentPage > 1,
    canGoNext: currentPage < totalPages,
  }), [currentPage, itemsPerPage, totalPages, pageNumbers, handlePageChange, handleItemsPerPageChange, handlePreviousPage, handleNextPage])

  const handleViewSupplierForm = useCallback((supplier: SupplierRow) => {
    if (onViewSupplierDetail) {
      // File-based routing: use navigation callback
      onViewSupplierDetail(supplier.id)
    } else {
      // Legacy section-based routing (for backward compatibility)
      setViewSupplierForm(true)
      setSelectedSupplierId(supplier.id)
      onSectionChange?.('supplier-form', supplier.id)
    }
  }, [onViewSupplierDetail, onSectionChange])

  const handleCloseSupplierForm = useCallback(() => {
    setViewSupplierForm(false)
    setSelectedSupplierId(null)
    onSectionChange?.(null)
  }, [onSectionChange])

  // Define table columns
  const columns: DataTableColumn<SupplierRow>[] = useMemo(() => [
    {
      id: 'supplierName',
      header: 'Supplier / Brand',
      cell: (supplier) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">
            {supplier.supplierName}
          </span>
          <span className="text-sm text-gray-500">{supplier.contact}</span>
        </div>
      ),
    },
    {
      id: 'docsStatus',
      header: 'Docs Status',
      cell: (supplier) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {supplier.docsStatus}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (supplier) => (
        <span className="text-gray-600">{supplier.createdAt}</span>
      ),
    },
    {
      id: 'lastActivity',
      header: 'Last Activity',
      cell: (supplier) => (
        <span className="text-gray-600">{supplier.lastActivity}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (supplier) => (
        <span
          className={cn(
            'inline-flex px-3 py-1 text-xs font-medium rounded-md border',
            statusToneMap[supplier.status]
          )}
        >
          {supplier.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'center' as const,
      cell: (supplier) => (
        <button
          className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
          title="View Supplier"
          onClick={(e) => {
            e.stopPropagation()
            handleViewSupplierForm(supplier)
          }}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ], [handleViewSupplierForm])

  // Show loading spinner only on initial load, not when fetching new pages or filtering
  if (isInitialLoading) {
    return <LoadingSpinner />
  }

  // Show supplier form if enabled (only for legacy routing - file-based routing uses separate route pages)
  if (viewSupplierForm && !onViewSupplierDetail) {
    return (
      <ViewSupplierForm supplierId={selectedSupplierId || ''} onClose={handleCloseSupplierForm} />
    )
  }

        return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="All Supplier Details" 
        action={
          <Button
            onClick={() => setIsAddSupplierModalOpen(true)}
            className="h-[30px] px-3 body-4 font-urbanist font-semibold bg-secondary-900 hover:bg-secondary-800 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Supplier
          </Button>
        }
      />

      <div className="px-4 md:px-6 py-6 space-y-6">
        {/* Overview cards */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-[8px] border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 label-1 font-urbanist">Overview</span>
                {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}  
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {overviewCardsToRender.map((card) => (
                <div key={card.label} className="py-4 px-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">{card.label}</span>
                    {/* <Info className="h-4 w-4 text-gray-400" /> */}  
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-gray-900 font-spectral">{card.value}</span>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                      <img src={card.iconSrc} alt={card.iconAlt} className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Table */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-[8px] border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 label-1 font-urbanist">All Suppliers</span>
                {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}    
              </div>
            </div>

            {/* Search + filters */}
            <div className="p-[8px] border-b border-gray-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(event) => {
                      const value = event.target.value
                      setSearchTerm(value)
                      setCurrentPage(1)
                      updateUrlParams({ searchTerm: value, currentPage: 1 })
                    }}
                    className="w-full pl-10 pr-12 py-2 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary-900 border border-transparent"
                  />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    ⌘/
                  </div>
                </div>

                {isPaginationLoading && (
                  <div className="flex items-center text-secondary-900">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
                    <span className="text-body-4 font-urbanist">Updating...</span>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setActiveStatus(tab.value)
                        setCurrentPage(1) // Reset to first page when filter changes
                        updateUrlParams({ activeStatus: tab.value, currentPage: 1 })
                      }}
                      className={cn(
                        'px-[8px] py-[4px] text-xs rounded-full border transition-colors',
                        activeStatus === tab.value
                          ? 'bg-secondary-900 text-white border-secondary-900'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-[20px] my-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-urbanist">
                {error}
              </div>
            )}

            <DataTable<SupplierRow>
              items={paginatedData}
              columns={columns}
              getRowKey={(supplier) => supplier.id}
              pagination={pagination}
              totalItems={totalRecordCount}
              isLoading={isInitialLoading}
              isFetching={isPaginationLoading}
              error={error}
              searchTerm={searchTerm}
              onClearSearch={() => {
                setSearchTerm('')
                setCurrentPage(1)
                updateUrlParams({ searchTerm: '', currentPage: 1 })
              }}
              emptyTitle="No suppliers found"
              emptyDescription={searchTerm
                ? `No results found for "${searchTerm}". Try adjusting your search terms or check for typos.`
                : 'No suppliers available at the moment.'}
              showPagination={totalRecordCount > 0}
              skeletonRows={itemsPerPage}
              tableClassName="w-full"
              headerClassName="bg-gray-50 border-b border-gray-200"
              bodyClassName="bg-white"
            />
          </CardContent>
        </Card>
      </div>

      <AddSupplierModal
        open={isAddSupplierModalOpen}
        onOpenChange={setIsAddSupplierModalOpen}
      />
    </div>
        )
}

export default MainAllSupplierDetails


