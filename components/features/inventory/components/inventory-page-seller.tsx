"use client"
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'
import { IndianRupee, ShoppingCart, Search, Edit, Tag, Info, CircleChevronRight, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import PageHeader from '@/components/shared/layout/page-header'
import type { ProductListItem, PaginationParams } from '../types/inventory.types'

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
import { DataTable } from '@/components/shared/table'
import { formatIndianCurrency, formatIndianNumber, formatIndianNumberWithUnits } from '@/lib/api/helpers/number'
import { mapApiToTableData } from '@/lib/utils/table'
import { 
  useSellerProductsQuery, 
  useEcomCategoriesQuery,
  useDraftProductsQuery,
  useInvalidateInventoryQueries,
  useDeleteVendorProductMutation
} from '../hooks/use-inventory-query'
import { toast } from 'sonner'

interface MainInventoryPageProps {
  // Scroll persistence callback
  onSaveScroll?: () => void
}

export function MainInventoryPage({ onSaveScroll }: MainInventoryPageProps = {}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null)

  // Map API status values back to UI filter values
  const mapApiToStatus = useCallback((apiStatus: string): string => {
    if (apiStatus === 'unarchive') return 'listed'
    if (apiStatus === 'archive') return 'delisted'
    return apiStatus // 'draft', 'rejected', or ''
  }, [])

  // Read initial filter and pagination state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        searchTerm: '',
        status: '',
        page: 1,
        itemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const urlStatus = urlParams.get('status') || ''
    return {
      searchTerm: urlParams.get('search') || '',
      status: mapApiToStatus(urlStatus),
      page: parseInt(urlParams.get('page') || '1', 10),
      itemsPerPage: parseInt(urlParams.get('itemsPerPage') || '10', 10),
    }
  }, [mapApiToStatus])

  // Get initial values from URL
  const initialUrlParams = getUrlParams()

  // Server-side pagination state
  const [serverPage, setServerPage] = useState(initialUrlParams.page)
  const [serverLimit, setServerLimit] = useState(initialUrlParams.itemsPerPage)
  const [productSearchTerm, setProductSearchTerm] = useState(initialUrlParams.searchTerm)
  const [statusFilter, setStatusFilter] = useState(initialUrlParams.status)

  // Debounce search to avoid excessive API calls
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 500)

  // Map UI filter values to API status values
  const mapStatusToApi = useCallback((uiStatus: string): string => {
    if (uiStatus === 'listed') return 'unarchive'
    if (uiStatus === 'delisted') return 'archive'
    return uiStatus // 'draft', 'rejected', or ''
  }, [])

  // Create pagination params for API call with debounced search and status filter
  const paginationParams: PaginationParams = useMemo(() => {
    const params: PaginationParams = {
      page: serverPage,
      limit: serverLimit,
      search: debouncedProductSearchTerm || undefined,
    }
    if (statusFilter) {
      params.status = mapStatusToApi(statusFilter)
    }
    return params
  }, [serverPage, serverLimit, debouncedProductSearchTerm, statusFilter, mapStatusToApi])

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    searchTerm?: string
    status?: string
    currentPage?: number
    itemsPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    if (updates.searchTerm !== undefined) {
      if (updates.searchTerm) {
        url.searchParams.set('search', updates.searchTerm)
      } else {
        url.searchParams.delete('search')
      }
    }
    
    if (updates.status !== undefined) {
      if (updates.status) {
        url.searchParams.set('status', updates.status)
      } else {
        url.searchParams.delete('status')
      }
    }
    
    if (updates.currentPage !== undefined) {
      if (updates.currentPage > 1) {
        url.searchParams.set('page', String(updates.currentPage))
      } else {
        url.searchParams.delete('page')
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set('itemsPerPage', String(updates.itemsPerPage))
      } else {
        url.searchParams.delete('itemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])

  
  // TanStack Query hooks - data is cached and shared across components
  const { 
    data: productsResponse, 
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
    error: productsError 
  } = useSellerProductsQuery(paginationParams)
  
  const { 
    data: apiCategories, 
    isLoading: isLoadingCategories 
  } = useEcomCategoriesQuery()
  
  // Separate query for draft products count (independent of main table search/filters)
  const { 
    data: draftProductsResponse 
  } = useDraftProductsQuery()
  
  const { invalidateProducts } = useInvalidateInventoryQueries()
  const deleteProductMutation = useDeleteVendorProductMutation()
  
  // Extract data from query response using mapApiToTableData utility
  const inventoryData = useMemo(() => {
    if (!productsResponse) return []
    const result = mapApiToTableData<ProductListItem, ProductListItem>(
      productsResponse,
      {
        extractOptions: {
          dataKey: 'record',
          returnEmptyOnError: true,
        },
      }
    )
    return result.data
  }, [productsResponse])
  
  // Extract dashboard stats from API response
  const apiData = useMemo(() => {
    if (!productsResponse) {
      return {
        total_record: 0,
        total_stock_value: 0,
        total_stock_quantity: 0,
        low_stock_product: 0,
        total_category_count: 0,
        count: 0
      }
    }
    return {
      total_record: productsResponse.count || 0,
      total_stock_value: productsResponse.total_inventory_value || 0,
      total_stock_quantity: productsResponse.total_stock_quantity || 0,
      low_stock_product: productsResponse.low_stock || 0,
      total_category_count: productsResponse.total_category || 0,
      count: productsResponse.count || 0
    }
  }, [productsResponse])

  // Get total_record_count from API response for server-side pagination
  const totalRecordCount = productsResponse?.total_record_count ?? inventoryData.length

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
    updateUrlParams({ currentPage: page })
  }, [serverTotalPages, updateUrlParams])

  const handleServerLimitChange = useCallback((limit: number) => {
    setServerLimit(limit)
    setServerPage(1)
    updateUrlParams({ itemsPerPage: limit, currentPage: 1 })
  }, [updateUrlParams])

  // Reset page to 1 when search term changes (debounced)
  useEffect(() => {
    if (serverPage !== 1) {
      setServerPage(1)
      updateUrlParams({ currentPage: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProductSearchTerm])

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

  // Server-side pagination state object
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

  // No need for useEffect - TanStack Query handles fetching automatically
  // URL params are updated directly in filter handlers

  const handleViewAllInventoryValue = () => { 
  }

  // Extract draft products count from separate query (independent of main table filters)
  const draftItemsCount = useMemo(() => {
    if (!draftProductsResponse) return 0
    
    // Handle different response structures
    if (Array.isArray(draftProductsResponse.record)) {
      return draftProductsResponse.record.length
    }
    if (typeof draftProductsResponse.count === 'number') {
      return draftProductsResponse.count
    }
    if (typeof draftProductsResponse.total_record_count === 'number') {
      return draftProductsResponse.total_record_count
    }
    
    return 0
  }, [draftProductsResponse])

const handleAddInventory = () => {
    router.push('/seller-dashboard/inventory/add')
  }

  const handleEditInventory = (id: number) => {
    // Save scroll position before navigating to edit
    onSaveScroll?.()
    router.push(`/seller-dashboard/inventory/edit/${id}`)
  }

  const handleDeleteInventory = (id: number) => {
    // Find the product to get its name for the confirmation message
    const product = inventoryData.find((item) => item.id === id)
    const productName = product?.name || 'this product'
    
    // Set product to delete and show dialog
    setProductToDelete({ id, name: productName })
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return
    
    try {
      await deleteProductMutation.mutateAsync(productToDelete.id)
      toast.success('Product deleted successfully')
      setShowDeleteDialog(false)
      setProductToDelete(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product. Please try again.'
      toast.error(errorMessage)
      setShowDeleteDialog(false)
      setProductToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
    setProductToDelete(null)
  }

  // Define columns for the inventory DataTable (seller version - no supplier column)
  const inventoryColumns = useMemo(() => [
    {
      id: 'sku',
      header: 'SKU ID',
      cell: (item: ProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.id}</span>
      ),
    },
    {
      id: 'name',
      header: 'Product Name',
      cell: (item: ProductListItem) => (
        <div className="font-semibold text-neutral-800 body-3 font-urbanist">{item.name || '-'}</div>
      ),
    },
    {
      id: 'status',
      header: 'Product Status',
      cell: (item: ProductListItem) => {
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
      cell: (item: ProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.category || '-'}</span>
      ),
    },
    {
      id: 'stock',
      header: 'Stock',
      cell: (item: ProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianNumber(item.stock || 0)}
        </span>
      ),
    },
    {
      id: 'mrp',
      header: 'MRP ₹',
      cell: (item: ProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianCurrency(item.mrp || 0)}
        </span>
      ),
    },
    {
      id: 'stock_value',
      header: 'Stock Value ₹',
      cell: (item: ProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianCurrency(item.stock_value || 0)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (item: ProductListItem) => {
        const isDraft = item.status === 'draft'
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleEditInventory(item.id)}
              className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
              title="Edit product"
            >
              <Edit className="h-4 w-4" />
            </button>
            {isDraft && (
              <button 
                onClick={() => handleDeleteInventory(item.id)}
                className="text-gray-400 w-6 h-6 hover:text-red-600 border border-gray-200 rounded-md p-1 transition-colors"
                title="Delete draft product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      },
    },
  ], [handleEditInventory, handleDeleteInventory])

  const handleViewAllLowStockProducts = () => {
    router.push('/seller-dashboard/inventory/low-stock')
  }


  return (
    <div className="min-h-screen bg-gray-50">
    <PageHeader title="Inventory" />
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
                  <div className="text-2xl font-bold text-gray-900 font-spectral">{formatIndianNumberWithUnits(apiData.total_stock_value)}</div>
            {/* <div className="text-xs font-urbanist mt-1">
              <span className="font-bold text-green-600 bg-green-50 p-1 rounded">+12%</span>
              <span className="font-medium text-gray-500 ml-1 body-3">vs Last Month</span>
            </div> */}
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <IndianRupee className="h-5 w-5" color="#2563EB" />
          </div>
        </div>
        {/* <div className="mt-auto">
          <button 
            className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            onClick={handleViewAllInventoryValue}
          >
            <span>See Details</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div> */}
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
            <div className="text-2xl font-bold text-gray-900 font-spectral">{formatIndianNumber(apiData.total_stock_quantity)}</div>
          </div>
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
            <ShoppingCart className="h-5 w-5" color="#EA580C" />
          </div>
        </div>
        {/* <div className="mt-auto">
          <button 
            className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          >
            <span>See Details</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div> */}
      </CardContent>
    </Card>

    {/* Low Stock Products Card */}
    <Card className="bg-white border border-gray-200 border-l-0 rounded-none shadow-sm">
      <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
        <div className="mb-2 px-5">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-gray-800 body-3">Low Stock Products</h3>
            {/* <Info className="h-4 w-4 text-gray-400" /> */}
          </div>
        </div>
        <div className="flex items-center justify-between mb-4 px-5 mt-[13px]">
          <div>
            <div className="text-2xl font-bold text-gray-900 font-spectral">{apiData.low_stock_product}</div>
            {/* <div className="text-xs font-urbanist mt-1">
              <span className="font-bold text-red-600 bg-red-50 p-1 rounded">-15%</span>
              <span className="font-medium text-gray-500 ml-1 body-3">vs Last Month</span>
            </div> */}
          </div>
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <ShoppingCart className="h-5 w-5" color="#DC2626" />
          </div>
        </div>
        {/* <div className="mt-auto">
          <button 
            className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            onClick={handleViewAllLowStockProducts}
          >
            <span>See Details</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div> */}
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
            <div className="text-2xl font-bold text-gray-900 font-spectral">{apiData.total_category_count}</div>
            {/* <div className="text-xs font-urbanist mt-1">
              <span className="font-bold text-green-600 bg-green-50 p-1 rounded">+5%</span>
              <span className="font-medium text-gray-500 ml-1 body-3">vs Last Month</span>
            </div> */}
          </div>
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Tag className="h-5 w-5" color="#9333EA" />
          </div>
        </div>
        {/* <div className="mt-auto">
          <button 
            className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          >
            <span>See Details</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div> */}
      </CardContent>
    </Card>
  </div>
</div>

        {/* Draft banner row - consistent with admin inventory */}
        {draftItemsCount > 0 && (
          <div className="mx-6 mb-6">
            <div
              role="button"
              onClick={() => {
                router.push('/seller-dashboard/inventory/draft')
              }}
              className="w-full rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-between px-4 py-3 border border-[#FBE1B2] bg-[#FFEED0] rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-urbanist" style={{ color: '#BC7810' }}>
                    {`${draftItemsCount} item${draftItemsCount > 1 ? 's' : ''} are in pending in draft and needs approval to submit`}
                  </span>
                  <Info className="h-5 w-5" style={{ color: '#BC7810' }} />
                </div>
                <CircleChevronRight className="h-5 w-5 text-[#BC7810]" />
              </div>
            </div>
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
              <div className="flex items-center gap-2">
                {(isLoadingProducts || isFetchingProducts) && (
                  <div className="flex items-center text-secondary-900">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
                    <span className="text-body-4 font-urbanist">{isLoadingProducts ? 'Loading...' : 'Updating...'}</span>
                  </div>
                )}
                <button 
                  onClick={handleAddInventory}
                  className="flex items-center text-white bg-secondary-900 hover:bg-secondary-700 border border-gray-300 rounded-lg body-4 font-semibold font-urbanist h-[35px] px-[8px] py-[4px]"
                >
                  Add New Item
                </button>
              </div>
            </div>

            {/* Search Bar and Status Filter */}
            <div className="p-[8px] border-b border-gray-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value)
                      setServerPage(1)
                      updateUrlParams({ searchTerm: e.target.value, currentPage: 1 })
                    }}
                    className="w-full pl-10 pr-12 py-2 rounded-md bg-gray-50 focus:outline-none"
                  />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    ⌘/
                  </div>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { value: '', label: 'All' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'listed', label: 'Listed' },
                    { value: 'delisted', label: 'Delisted' },
                    { value: 'rejected', label: 'Rejected' }
                  ].map((tab) => (
                    <button
                      key={tab.value || 'all'}
                      onClick={() => {
                        setStatusFilter(tab.value)
                        setServerPage(1)
                        updateUrlParams({ status: tab.value, currentPage: 1 })
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
            </div>

            {/* Unified DataTable with Server-side Pagination */}
            <DataTable<ProductListItem>
              items={inventoryData}
              columns={inventoryColumns}
              getRowKey={(item) => String(item.id)}
              pagination={serverPagination}
              totalItems={totalRecordCount}
              isLoading={isLoadingProducts && !inventoryData.length}
              isFetching={isFetchingProducts && inventoryData.length > 0}
              error={productsError}
              onRetry={() => {
                // Retry logic if needed - TanStack Query handles refetch automatically
              }}
              searchTerm={productSearchTerm}
              onClearSearch={() => setProductSearchTerm('')}
              emptyTitle="No products found"
              emptyDescription={
                productSearchTerm 
                  ? `No results found for "${productSearchTerm}". Try adjusting your search terms or check for typos.`
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {productToDelete && (
                  <>
                    You are about to delete <strong>&quot;{productToDelete.name}&quot;</strong>. This action cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={deleteProductMutation.isPending}
              >
                {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}