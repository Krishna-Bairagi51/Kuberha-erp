"use client"
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import PageHeader from '@/components/shared/layout/page-header'
import { Info, IndianRupee, ShoppingCart, Tag, Search, ArrowRight, ChevronDown, CircleChevronUp, CircleChevronDown, Edit } from 'lucide-react'
import type { AdminProductListItem, PaginationParams } from '../types/inventory.types'
import { useVendorProductsQuery, useVendorPendingProductsQuery, useInvalidateInventoryQueries, useEcomCategoriesQuery } from '../hooks/use-inventory-query'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { DataTable } from '@/components/shared/table'
import FiltersBar from './shared/filters-bar'
import { formatIndianCurrency, formatIndianNumber, formatIndianNumberWithUnits } from '@/lib/api/helpers/number'
import { mapApiToTableData } from '@/lib/utils/table'
import { MemoizedInventoryTableRow } from './shared/memoized-table-row'
import { useDebounce } from '@/hooks/use-debounce'

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

interface SellerInfoTableProps {
  onClose: () => void
  selectedSellerId: number
  onEditProduct?: (productId: number) => void
}

const SellerInfoTable = ({ onClose, selectedSellerId, onEditProduct }: SellerInfoTableProps) => {
  const [isPendingPanelOpen, setIsPendingPanelOpen] = useState(false)
  
  // Track whether we've ever successfully loaded data
  // This helps differentiate between initial load and subsequent filter/pagination refetches
  const hasLoadedDataRef = useRef(false)

  // Read initial filter and pagination state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        sellerSearch: '',
        sellerCategory: 'All',
        sellerStatus: 'All',
        sellerPage: 1,
        sellerItemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      sellerSearch: urlParams.get('sellerSearch') || '',
      sellerCategory: urlParams.get('sellerCategory') || 'All',
      sellerStatus: urlParams.get('sellerStatus') || 'All',
      sellerPage: parseInt(urlParams.get('sellerPage') || '1', 10),
      sellerItemsPerPage: parseInt(urlParams.get('sellerItemsPerPage') || '10', 10),
    }
  }, [])

  // Get initial values from URL
  const initialUrlParams = getUrlParams()

  // Server-side pagination state
  const [serverPage, setServerPage] = useState(initialUrlParams.sellerPage)
  const [serverLimit, setServerLimit] = useState(initialUrlParams.sellerItemsPerPage)
  const [searchTerm, setSearchTerm] = useState(initialUrlParams.sellerSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialUrlParams.sellerCategory)
  const [selectedStatus, setSelectedStatus] = useState(initialUrlParams.sellerStatus)

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Create pagination params for the API call with debounced search, status, and category
  const paginationParams: PaginationParams = useMemo(() => {
    const params: PaginationParams = {
      page: serverPage,
      limit: serverLimit,
      search: debouncedSearch || undefined,
    }
    
    // Add status filter if not 'All'
    if (selectedStatus && selectedStatus !== 'All') {
      // Map UI status values to API status values
      const statusMap: Record<string, string> = {
        'Listed': 'unarchive',
        'Delisted': 'archive',
        'Draft': 'draft',
        'Pending': 'pending',
        'Rejected': 'rejected',
      }
      params.status = statusMap[selectedStatus] || selectedStatus.toLowerCase()
    }
    
    // Add category filter if not 'All'
    if (selectedCategory && selectedCategory !== 'All') {
      params.category = selectedCategory
    }
    
    return params
  }, [serverPage, serverLimit, debouncedSearch, selectedStatus, selectedCategory])

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    sellerSearch?: string
    sellerCategory?: string
    sellerStatus?: string
    sellerPage?: number
    sellerItemsPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    if (updates.sellerSearch !== undefined) {
      if (updates.sellerSearch) {
        url.searchParams.set('sellerSearch', updates.sellerSearch)
      } else {
        url.searchParams.delete('sellerSearch')
      }
    }
    
    if (updates.sellerCategory !== undefined) {
      if (updates.sellerCategory && updates.sellerCategory !== 'All') {
        url.searchParams.set('sellerCategory', updates.sellerCategory)
      } else {
        url.searchParams.delete('sellerCategory')
      }
    }
    
    if (updates.sellerStatus !== undefined) {
      if (updates.sellerStatus && updates.sellerStatus !== 'All') {
        url.searchParams.set('sellerStatus', updates.sellerStatus)
      } else {
        url.searchParams.delete('sellerStatus')
      }
    }
    
    if (updates.sellerPage !== undefined) {
      if (updates.sellerPage > 1) {
        url.searchParams.set('sellerPage', String(updates.sellerPage))
      } else {
        url.searchParams.delete('sellerPage')
      }
    }
    
    if (updates.sellerItemsPerPage !== undefined) {
      if (updates.sellerItemsPerPage !== 10) {
        url.searchParams.set('sellerItemsPerPage', String(updates.sellerItemsPerPage))
      } else {
        url.searchParams.delete('sellerItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])
  
  // Use TanStack Query for vendor products with server-side pagination
  const { 
    data: vendorResponse, 
    isLoading, 
    isFetching,
    error: vendorError 
  } = useVendorProductsQuery(selectedSellerId, selectedSellerId > 0, paginationParams)
  
  // Separate query for pending products - independent of main table filters
  // This ensures pending items are always visible regardless of filters applied to main table
  const { 
    data: pendingResponse, 
    isLoading: isLoadingPending,
    error: pendingError 
  } = useVendorPendingProductsQuery(selectedSellerId, selectedSellerId > 0, {
    // Fetch all pending items (no pagination limit for count, or use a reasonable limit)
    limit: 1000, // Fetch up to 1000 pending items for the dropdown
  })
  
  const { invalidateProducts } = useInvalidateInventoryQueries()
  
  // Extract data from query response using mapApiToTableData utility
  const vendorData = useMemo(() => {
    if (!vendorResponse) return []
    const result = mapApiToTableData<AdminProductListItem, AdminProductListItem>(
      vendorResponse,
      {
        extractOptions: {
          dataKey: 'record',
          returnEmptyOnError: true,
        },
      }
    )
    return result.data
  }, [vendorResponse])

  // Update ref when we successfully get data
  useEffect(() => {
    if (vendorData.length > 0 || (vendorResponse && !isLoading)) {
      hasLoadedDataRef.current = true
    }
  }, [vendorData.length, vendorResponse, isLoading])

  // Decouple initial loading from filter-based loading
  // Initial loading: only on the very first load (no data has ever been loaded)
  // Filter loading: when data exists but we're fetching new filtered data (pagination, search, status filter, category filter)
  const isInitialLoading = isLoading && !hasLoadedDataRef.current
  const isFilterLoading = isFetching && hasLoadedDataRef.current
  
  // Extract stats from API response
  const stats = useMemo(() => {
    if (!vendorResponse) {
      return {
        total_inventory_value: 0,
        total_stock_quantity: 0,
        low_stock: 0,
        total_category: 0
      }
    }
    return {
      total_inventory_value: vendorResponse.total_inventory_value || 0,
      total_stock_quantity: vendorResponse.total_stock_quantity || 0,
      low_stock: vendorResponse.low_stock || 0,
      total_category: vendorResponse.total_category || 0
    }
  }, [vendorResponse])

  // Get total_record_count from API response for server-side pagination
  const totalRecordCount = vendorResponse?.total_record_count ?? vendorData.length

  // Server-side pagination calculations
  const serverTotalPages = useMemo(() => 
    calculateTotalPages(totalRecordCount, serverLimit), 
    [totalRecordCount, serverLimit]
  )

  const serverPageNumbers = useMemo(() => 
    generatePageNumbers(serverPage, serverTotalPages),
    [serverPage, serverTotalPages]
  )

  // Server-side pagination handlers
  const handleServerPageChange = useCallback((page: number) => {
    if (page < 1 || page > serverTotalPages) return
    setServerPage(page)
    updateUrlParams({ sellerPage: page })
  }, [serverTotalPages, updateUrlParams])

  const handleServerLimitChange = useCallback((limit: number) => {
    setServerLimit(limit)
    setServerPage(1) // Reset to first page when limit changes
    updateUrlParams({ sellerItemsPerPage: limit, sellerPage: 1 })
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

  // Server-side pagination state object (compatible with PaginationState interface)
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

  // Fetch all categories for dropdown (from ecom categories API)
  const { data: ecomCategories = [] } = useEcomCategoriesQuery()
  
  // Get unique categories from ecom categories API response
  const categoryOptions = useMemo(() => {
    if (!ecomCategories || ecomCategories.length === 0) return []
    // Extract category names from the API response
    // The structure may vary, so we handle different possible formats
    const categories = new Set<string>()
    ecomCategories.forEach((cat: any) => {
      const categoryName = cat.name || cat.category_name || cat.categoryName || cat
      if (categoryName) categories.add(String(categoryName))
    })
    return Array.from(categories).sort()
  }, [ecomCategories])

  // Status options are fixed (UI values)
  const statusOptions = useMemo(() => {
    return ['All', 'Listed', 'Delisted', 'Draft', 'Pending', 'Rejected']
  }, [])

  // All filtering (search, status, category) is now handled server-side via API
  // No client-side filtering needed
  const filteredVendorData = vendorData

  // Restore state from URL when URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = getUrlParams()
      setServerPage(params.sellerPage)
      setServerLimit(params.sellerItemsPerPage)
      setSearchTerm(params.sellerSearch)
      setSelectedCategory(params.sellerCategory)
      setSelectedStatus(params.sellerStatus)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getUrlParams])

  // Sync URL parameters when state changes
  useEffect(() => {
    updateUrlParams({
      sellerSearch: searchTerm,
      sellerCategory: selectedCategory,
      sellerStatus: selectedStatus,
      sellerPage: serverPage,
      sellerItemsPerPage: serverLimit,
    })
  }, [searchTerm, selectedCategory, selectedStatus, serverPage, serverLimit, updateUrlParams])

  // Reset to first page when search, category, or status changes
  useEffect(() => {
    setServerPage(1)
    updateUrlParams({ sellerPage: 1 })
  }, [searchTerm, selectedCategory, selectedStatus, updateUrlParams])

  // Extract pending items from separate query - independent of main table filters
  const pendingItems = useMemo(() => {
    if (!pendingResponse) return []
    const result = mapApiToTableData<AdminProductListItem, AdminProductListItem>(
      pendingResponse,
      {
        extractOptions: {
          dataKey: 'record',
          returnEmptyOnError: true,
        },
      }
    )
    // Filter to include both draft and pending status items
    return result.data.filter(item => item.status === 'draft' || item.status === 'pending')
  }, [pendingResponse])

  const pendingItemsCount = useMemo(() => pendingItems.length, [pendingItems.length])


  const handleEditInventory = (id: number) => {
    onEditProduct?.(id)
  }

  // Define columns for the seller info DataTable (no supplier column)
  const sellerColumns = useMemo(() => [
    {
      id: 'sku',
      header: 'SKU ID',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.id}</span>
      ),
    },
    {
      id: 'name',
      header: 'Product Name',
      cell: (item: AdminProductListItem) => (
        <div className="font-semibold text-neutral-800 body-3 font-urbanist">{item.name || '-'}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: AdminProductListItem) => {
        const statusDisplay = item.status === 'draft' 
          ? { text: 'Draft', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
          : item.status === 'unarchive'
          ? { text: 'Listed', color: 'bg-green-50 text-green-600 border-green-200' }
          : item.status === 'archive'
          ? { text: 'Delisted', color: 'bg-red-50 text-red-600 border-red-200' }
          : item.status === 'rejected'
          ? { text: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200' }
          : { text: 'Draft', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
        return (
          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        )
      },
    },
    {
      id: 'category',
      header: 'Category',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.category || '-'}</span>
      ),
    },
    {
      id: 'stock',
      header: 'Stock',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianNumber(item.stock || 0)}
        </span>
      ),
    },
    {
      id: 'mrp',
      header: 'MRP',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianCurrency(item.mrp || 0)}
        </span>
      ),
    },
    {
      id: 'stock_value',
      header: 'Stock Value',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianCurrency(item.stock_value || 0)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (item: AdminProductListItem) => {
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleEditInventory(item.id)}
              className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
              title="Edit product"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ], [handleEditInventory])

  // Only show loading spinner on initial load, not on refetch
  if (isInitialLoading) {
    return (
      <div className="space-y-6 bg-gray-50 min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }
  // Get seller name from vendor response
  const sellerName = vendorResponse?.record?.[0]?.vendor_name || `Seller ${selectedSellerId}`

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Inventory" subTitle={sellerName} onTitleClick={onClose} />
      
      {/* Dashboard Cards */}
      <div className="py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {/* Total Inventory Value Card */}
          <Card className="bg-white border border-gray-200 rounded-l-lg rounded-r-none shadow-sm">
            <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
              <div className="mb-2 px-5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-800 body-3">Total Inventory Value</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 px-5 mt-[13px]">
                <div>
                  <div className="text-2xl font-bold text-gray-900 font-spectral">{formatIndianNumberWithUnits(stats.total_inventory_value)}</div>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" color="#2563EB" />
                </div>
              </div>
              <div className="mt-auto">
                {/* <button 
                  className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <span>See Details</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button> */}
              </div>
            </CardContent>
          </Card>

          {/* Total Stock Quantity Card */}
          <Card className="bg-white border border-gray-200 border-l-0 rounded-none shadow-sm">
            <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
              <div className="mb-2 px-5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-800 body-3">Total Stock Quantity</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 px-5 mt-[13px]">
                <div>
                  <div className="text-2xl font-bold text-gray-900 font-spectral">{formatIndianNumber(stats.total_stock_quantity)}</div>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" color="#EA580C" />
                </div>
              </div>
              <div className="mt-auto">
                  {/* <button 
                    className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  >
                    <span>See Details</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button> */}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Products Card */}
          <Card className="bg-white border border-gray-200 border-l-0 rounded-none shadow-sm">
            <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
              <div className="mb-2 px-5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-800 body-3">Low Stock/Out of stock</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 px-5 mt-[13px]">
                <div>
                  <div className="text-2xl font-bold text-gray-900 font-spectral">{stats.low_stock}</div>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" color="#DC2626" />
                </div>
              </div>
              <div className="mt-auto">
                {/* <button 
                  className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <span>See Details</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button> */}
              </div>
            </CardContent>
          </Card>

          {/* Total Categories Card */}
          <Card className="bg-white border border-gray-200 border-l-0 rounded-l-none rounded-r-lg shadow-sm">
            <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
              <div className="mb-2 px-5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-800 body-3">Total Categories</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 px-5 mt-[13px]">
                <div>
                  <div className="text-2xl font-bold text-gray-900 font-spectral">{stats.total_category}</div>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Tag className="h-5 w-5" color="#9333EA" />
                </div>
              </div>
              <div className="mt-auto">
                {/* <button 
                  className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <span>See Details</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Products Panel */}
      {pendingItemsCount > 0 && (
        <div className="mx-6 mb-6">
          <Card className="bg-[#FFEED0] shadow-sm">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border border-[#FBE1B2] rounded-t-lg">
                <div className="flex items-center gap-2">
                  {/* <Info className="h-5 w-5" style={{ color: '#BC7810' }} /> */}
                  <span className="font-semibold font-urbanist" style={{ color: '#BC7810' }}>
                    {`${pendingItemsCount} item${pendingItemsCount > 1 ? 's' : ''} are pending for approval`}
                  </span>
                </div>
                <button
                  onClick={() => setIsPendingPanelOpen(!isPendingPanelOpen)}
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
                <div className="bg-white slide-down animation-slide-down">
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader className="bg-gray-50 border-b border-gray-200">
                        <TableRow>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                            SKU ID
                          </TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                            Product Name
                          </TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                            Status
                          </TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                            Category
                          </TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                            Stock
                          </TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                            MRP
                          </TableHead>
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                            Stock Value
                          </TableHead>
                          {/* <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                            Shopify Status
                          </TableHead> */}
                          <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap">
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        {pendingItems.map((item) => (
                          <MemoizedInventoryTableRow
                            key={item.id}
                            item={item}
                            onEdit={handleEditInventory}
                            showSupplier={false}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

        {/* Inventory Table Section */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mx-6 mb-6">
          <CardContent className="p-0">
            {/* Card Header */}
            <div className="flex items-center justify-between px-2 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900 label-1 font-urbanist font-size-[16px]">All Inventory Items</h2>
                {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}  
              </div>
            </div>

            {/* Search and Filter Dropdowns */}
            <div className="px-[8px] py-[15px] border-b border-gray-200">
              <FiltersBar
                searchTerm={searchTerm}
                onSearchTermChange={(term) => {
                  setSearchTerm(term)
                  setServerPage(1) // Reset to first page when search changes
                  updateUrlParams({ sellerSearch: term, sellerPage: 1 })
                }}
                categories={categoryOptions}
                selectedCategory={selectedCategory}
                onCategoryChange={(category) => {
                  setSelectedCategory(category)
                  setServerPage(1) // Reset to first page when category changes
                  updateUrlParams({ sellerCategory: category, sellerPage: 1 })
                }}
                statuses={statusOptions}
                selectedStatus={selectedStatus}
                onStatusChange={(status) => {
                  setSelectedStatus(status)
                  setServerPage(1) // Reset to first page when status changes
                  updateUrlParams({ sellerStatus: status, sellerPage: 1 })
                }}
                searchPlaceholder="Search products or IDs"
              />
            </div>

            {/* Unified DataTable with Server-side Pagination */}
            <DataTable<AdminProductListItem>
              items={filteredVendorData}
              columns={sellerColumns}
              getRowKey={(item) => String(item.id)}
              pagination={serverPagination}
              totalItems={totalRecordCount}
              // Decoupled loading states:
              // - Initial load: full-page LoadingSpinner (handled above via isInitialLoading)
              // - Subsequent refetches (filters, page, limit, status): table skeleton via isFilterLoading
              isLoading={false}
              isFetching={isFilterLoading}
              error={vendorError}
              searchTerm={searchTerm}
              onClearSearch={() => {
                setSearchTerm('')
                setServerPage(1)
                updateUrlParams({ sellerSearch: '', sellerPage: 1 })
              }}
              emptyTitle="No products found"
              emptyDescription={
                searchTerm 
                  ? `No results found for "${searchTerm}". Try adjusting your search terms or check for typos.`
                  : "No products available at the moment. Please check back later."
              }
              withCard={false}
              className=""
              tableClassName="w-full"
              headerClassName="bg-gray-50 border-b border-gray-200"
              bodyClassName="bg-white"
              showPagination={totalRecordCount > 0}
            />
          </CardContent>
        </Card>
      </div>
    
  )
}

export default SellerInfoTable