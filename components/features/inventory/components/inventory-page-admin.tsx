"use client"
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { ArrowRight, IndianRupee, ShoppingCart, Search, Tag, AlertCircle, Edit, Trash2, CircleArrowLeft, CircleArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import type { AdminProductListItem, PaginationParams } from '../types/inventory.types'

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
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { useUnifiedTable } from '@/hooks/table'
import { DataTable } from '@/components/shared/table'
import { formatIndianCurrency, formatIndianNumber, formatIndianNumberWithUnits } from '@/lib/api/helpers/number'
import { mapApiToTableData } from '@/lib/utils/table'
import { 
  useAdminProductsQuery, 
  useEcomCategoriesQuery,
  useSupplierListQuery,
  useAdminDraftProductsQuery,
  useInvalidateInventoryQueries,
  useDeleteVendorProductMutation
} from '../hooks/use-inventory-query'
import { useSellerNameListQuery } from '@/components/features/orders/hooks/use-orders-query'
import { toast } from 'sonner'

interface MainInventoryPageProps {
  onSliderStateChange?: (isOpen: boolean) => void
  // Navigation callbacks for file-based routing
  onAddItem?: () => void
  onEditProduct?: (productId: number) => void
  onViewPendingApprovals?: () => void
  onViewSellerInfo?: (sellerId: number) => void
  onViewLowStock?: () => void
  // Scroll persistence callback
  onSaveScroll?: () => void
}

export function MainInventoryPage({ 
  onSliderStateChange,
  onAddItem,
  onEditProduct,
  onViewPendingApprovals,
  onViewSellerInfo,
  onViewLowStock,
  onSaveScroll
}: MainInventoryPageProps = {}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null)
  // Track if we've ever successfully loaded data to prevent full page spinner on filter changes
  const hasLoadedDataRef = React.useRef(false)
  
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
        vendorFilter: '',
        page: 1,
        itemsPerPage: 10,
        supplierSearch: '',
        supplierPage: 1,
        supplierItemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const urlStatus = urlParams.get('status') || ''
    return {
      searchTerm: urlParams.get('search') || '',
      status: mapApiToStatus(urlStatus),
      vendorFilter: urlParams.get('vendorFilter') || '',
      page: parseInt(urlParams.get('page') || '1', 10),
      itemsPerPage: parseInt(urlParams.get('itemsPerPage') || '10', 10),
      supplierSearch: urlParams.get('supplierSearch') || '',
      supplierPage: parseInt(urlParams.get('supplierPage') || '1', 10),
      supplierItemsPerPage: parseInt(urlParams.get('supplierItemsPerPage') || '10', 10),
    }
  }, [mapApiToStatus])

  // Get initial values from URL
  const initialUrlParams = getUrlParams()
  
  // Server-side pagination state for products
  const [serverPage, setServerPage] = useState(initialUrlParams.page)
  const [serverLimit, setServerLimit] = useState(initialUrlParams.itemsPerPage)
  const [productSearchTerm, setProductSearchTerm] = useState(initialUrlParams.searchTerm)
  const [statusFilter, setStatusFilter] = useState(initialUrlParams.status)
  const [vendorFilter, setVendorFilter] = useState(initialUrlParams.vendorFilter)
  
  // Server-side pagination state for suppliers
  const [serverSupplierPage, setServerSupplierPage] = useState(initialUrlParams.supplierPage)
  const [serverSupplierLimit, setServerSupplierLimit] = useState(initialUrlParams.supplierItemsPerPage)
  const [supplierSearchTerm, setSupplierSearchTerm] = useState(initialUrlParams.supplierSearch)

  // Debounce search to avoid excessive API calls
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 500)
  const debouncedSupplierSearch = useDebounce(supplierSearchTerm, 500)

  // Map UI filter values to API status values
  const mapStatusToApi = useCallback((uiStatus: string): string => {
    if (uiStatus === 'listed') return 'unarchive'
    if (uiStatus === 'delisted') return 'archive'
    return uiStatus // 'draft', 'rejected', or ''
  }, [])

  // Create pagination params for API calls with debounced search, status, and vendor filter
  const productPaginationParams: PaginationParams = useMemo(() => {
    const params: PaginationParams = {
      page: serverPage,
      limit: serverLimit,
      search: debouncedProductSearchTerm || undefined,
    }
    if (statusFilter) {
      params.status = mapStatusToApi(statusFilter)
    }
    if (vendorFilter) params.vendor_id = parseInt(vendorFilter, 10)
    return params
  }, [serverPage, serverLimit, debouncedProductSearchTerm, statusFilter, vendorFilter, mapStatusToApi])

  const supplierPaginationParams: PaginationParams = useMemo(() => ({
    page: serverSupplierPage,
    limit: serverSupplierLimit,
    search: debouncedSupplierSearch || undefined,
  }), [serverSupplierPage, serverSupplierLimit, debouncedSupplierSearch])

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    searchTerm?: string
    status?: string
    vendorFilter?: string
    currentPage?: number
    itemsPerPage?: number
    supplierSearch?: string
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
    
    if (updates.vendorFilter !== undefined) {
      if (updates.vendorFilter) {
        url.searchParams.set('vendorFilter', updates.vendorFilter)
      } else {
        url.searchParams.delete('vendorFilter')
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
    
    if (updates.supplierSearch !== undefined) {
      if (updates.supplierSearch) {
        url.searchParams.set('supplierSearch', updates.supplierSearch)
      } else {
        url.searchParams.delete('supplierSearch')
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
  } = useAdminProductsQuery(productPaginationParams)
  
  const { 
    data: apiCategories, 
    isLoading: isLoadingCategories 
  } = useEcomCategoriesQuery()
  
  const { 
    data: suppliersResponse, 
    isLoading: isLoadingSuppliers,
    isFetching: isFetchingSuppliers,
    error: suppliersError 
  } = useSupplierListQuery(supplierPaginationParams)

  // Fetch seller name list for vendor dropdown (admin only)
  const { data: sellerNameList = [], isLoading: isLoadingSellerNames } = useSellerNameListQuery(true)

  // Fetch draft products for pending approvals banner
  // Use a large limit to get enough data to accurately count unique suppliers
  const { 
    data: draftProductsResponse 
  } = useAdminDraftProductsQuery({ limit: 1000 })
  
  const { invalidateProducts, invalidateSuppliers } = useInvalidateInventoryQueries()
  const deleteProductMutation = useDeleteVendorProductMutation()
  
  // Extract data from query responses using mapApiToTableData utility
  const inventoryData = useMemo(() => {
    if (!productsResponse) return []
    // Mark that we've successfully loaded data (even if empty array)
    hasLoadedDataRef.current = true
    const result = mapApiToTableData<AdminProductListItem, AdminProductListItem>(
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
  
  const supplierData = useMemo(() => {
    if (!suppliersResponse) return []
    const result = mapApiToTableData<AdminProductListItem, AdminProductListItem>(
      suppliersResponse,
      {
        extractOptions: {
          dataKey: 'record',
          returnEmptyOnError: true,
        },
      }
    )
    return result.data
  }, [suppliersResponse])
  
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

  // Get total_record_count from API responses for server-side pagination
  const productTotalRecordCount = productsResponse?.total_record_count ?? inventoryData.length
  const supplierTotalRecordCount = suppliersResponse?.total_record_count ?? supplierData.length

  // Server-side pagination calculations for products
  const serverProductTotalPages = useMemo(() => 
    calculateTotalPages(productTotalRecordCount, serverLimit), 
    [productTotalRecordCount, serverLimit]
  )

  const serverProductPageNumbers = useMemo(() => 
    generatePageNumbers(serverPage, serverProductTotalPages),
    [serverPage, serverProductTotalPages]
  )

  // Server-side pagination calculations for suppliers
  const serverSupplierTotalPages = useMemo(() => 
    calculateTotalPages(supplierTotalRecordCount, serverSupplierLimit), 
    [supplierTotalRecordCount, serverSupplierLimit]
  )

  const serverSupplierPageNumbers = useMemo(() => 
    generatePageNumbers(serverSupplierPage, serverSupplierTotalPages),
    [serverSupplierPage, serverSupplierTotalPages]
  )

  // Server-side pagination handlers for products
  const handleServerPageChange = useCallback((page: number) => {
    if (page < 1 || page > serverProductTotalPages) return
    setServerPage(page)
    updateUrlParams({ currentPage: page })
  }, [serverProductTotalPages, updateUrlParams])

  const handleServerLimitChange = useCallback((limit: number) => {
    setServerLimit(limit)
    setServerPage(1)
    updateUrlParams({ itemsPerPage: limit, currentPage: 1 })
  }, [updateUrlParams])

  const handleServerPreviousPage = useCallback(() => {
    if (serverPage > 1) {
      handleServerPageChange(serverPage - 1)
    }
  }, [serverPage, handleServerPageChange])

  const handleServerNextPage = useCallback(() => {
    if (serverPage < serverProductTotalPages) {
      handleServerPageChange(serverPage + 1)
    }
  }, [serverPage, serverProductTotalPages, handleServerPageChange])

  // Server-side pagination state object for products
  const serverProductPagination = useMemo(() => ({
    currentPage: serverPage,
    itemsPerPage: serverLimit,
    totalPages: serverProductTotalPages,
    pageNumbers: serverProductPageNumbers,
    setCurrentPage: handleServerPageChange,
    setItemsPerPage: handleServerLimitChange,
    handlePreviousPage: handleServerPreviousPage,
    handleNextPage: handleServerNextPage,
    goToFirstPage: () => handleServerPageChange(1),
    goToLastPage: () => handleServerPageChange(serverProductTotalPages),
    canGoPrevious: serverPage > 1,
    canGoNext: serverPage < serverProductTotalPages,
  }), [
    serverPage, 
    serverLimit, 
    serverProductTotalPages, 
    serverProductPageNumbers, 
    handleServerPageChange, 
    handleServerLimitChange, 
    handleServerPreviousPage, 
    handleServerNextPage
  ])

  // Server-side pagination handlers for suppliers
  const handleServerSupplierPageChange = useCallback((page: number) => {
    if (page < 1 || page > serverSupplierTotalPages) return
    setServerSupplierPage(page)
    // Update URL params for supplier pagination
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (page > 1) {
        url.searchParams.set('supplierPage', String(page))
      } else {
        url.searchParams.delete('supplierPage')
      }
      window.history.replaceState({}, '', url.toString())
    }
  }, [serverSupplierTotalPages])

  const handleServerSupplierLimitChange = useCallback((limit: number) => {
    setServerSupplierLimit(limit)
    setServerSupplierPage(1)
    // Update URL params for supplier pagination
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (limit !== 10) {
        url.searchParams.set('supplierItemsPerPage', String(limit))
      } else {
        url.searchParams.delete('supplierItemsPerPage')
      }
      url.searchParams.delete('supplierPage')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const handleServerSupplierPreviousPage = useCallback(() => {
    if (serverSupplierPage > 1) {
      handleServerSupplierPageChange(serverSupplierPage - 1)
    }
  }, [serverSupplierPage, handleServerSupplierPageChange])

  const handleServerSupplierNextPage = useCallback(() => {
    if (serverSupplierPage < serverSupplierTotalPages) {
      handleServerSupplierPageChange(serverSupplierPage + 1)
    }
  }, [serverSupplierPage, serverSupplierTotalPages, handleServerSupplierPageChange])

  // Server-side pagination state object for suppliers
  const serverSupplierPagination = useMemo(() => ({
    currentPage: serverSupplierPage,
    itemsPerPage: serverSupplierLimit,
    totalPages: serverSupplierTotalPages,
    pageNumbers: serverSupplierPageNumbers,
    setCurrentPage: handleServerSupplierPageChange,
    setItemsPerPage: handleServerSupplierLimitChange,
    handlePreviousPage: handleServerSupplierPreviousPage,
    handleNextPage: handleServerSupplierNextPage,
    goToFirstPage: () => handleServerSupplierPageChange(1),
    goToLastPage: () => handleServerSupplierPageChange(serverSupplierTotalPages),
    canGoPrevious: serverSupplierPage > 1,
    canGoNext: serverSupplierPage < serverSupplierTotalPages,
  }), [
    serverSupplierPage, 
    serverSupplierLimit, 
    serverSupplierTotalPages, 
    serverSupplierPageNumbers, 
    handleServerSupplierPageChange, 
    handleServerSupplierLimitChange, 
    handleServerSupplierPreviousPage, 
    handleServerSupplierNextPage
  ])


  // No need for useEffect - TanStack Query handles fetching automatically
  // URL params are updated directly in filter handlers

  const handleViewAllInventoryValue = () => { 
  }


  // Memoize filtered supplier data to avoid recalculating on every render
  const filteredSupplierData = useMemo(() => {
    if (!supplierData || supplierData.length === 0) return []
    if (!supplierSearchTerm) return supplierData
    
    const searchLower = supplierSearchTerm.toLowerCase()
    return supplierData.filter((item) => {
      return (
        item.name?.toLowerCase().includes(searchLower) ||
        (item.vendor_id && item.vendor_id.toString().toLowerCase().includes(searchLower)) ||
        (item.vendor_name && item.vendor_name.toLowerCase().includes(searchLower)) ||
        (item.vendor_phone && item.vendor_phone.includes(supplierSearchTerm)) ||
        (item.vendor_address && item.vendor_address.toLowerCase().includes(searchLower))
      )
    })
  }, [supplierData, supplierSearchTerm])

  const handleAddInventory = () => {
    onAddItem?.()
  }

  const handleViewPendingApprovals = () => {
    onViewPendingApprovals?.()
  }

  const handleEditInventory = (id: number) => {
    // Save scroll position before navigating to edit
    onSaveScroll?.()
    onEditProduct?.(id)
  }

  const handleDeleteInventory = (id: number) => {
    // Find the product to get its name for the confirmation message
    // Search in inventoryData first, then draftProductsData as fallback
    const product = inventoryData.find((item) => item.id === id) || draftProductsData.find((item) => item.id === id)
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

  const handleViewAllLowStockProducts = () => {
    onViewLowStock?.()
  }

  const handleShowSellerInfo = (id: number) => {
    onViewSellerInfo?.(id)
  }

  // Reset to first page when search, status, or vendor filter changes
  // Use refs to track previous values to avoid unnecessary resets
  const prevFiltersRef = React.useRef({ searchTerm: productSearchTerm, status: statusFilter, vendorFilter: vendorFilter })
  React.useEffect(() => {
    const prev = prevFiltersRef.current
    // Only reset if filters actually changed (not on initial render)
    if (
      prev.searchTerm !== productSearchTerm ||
      prev.status !== statusFilter ||
      prev.vendorFilter !== vendorFilter
    ) {
      setServerPage(1)
      prevFiltersRef.current = { searchTerm: productSearchTerm, status: statusFilter, vendorFilter: vendorFilter }
    }
  }, [productSearchTerm, statusFilter, vendorFilter])
  
 
  // Extract draft products data for banner
  const draftProductsData = useMemo(() => {
    if (!draftProductsResponse) return []
    const result = mapApiToTableData<AdminProductListItem, AdminProductListItem>(
      draftProductsResponse,
      {
        extractOptions: {
          dataKey: 'record',
          returnEmptyOnError: true,
        },
      }
    )
    return result.data
  }, [draftProductsResponse])

  // Get total count of draft items from API
  const draftItemsCount = useMemo(() => {
    return draftProductsResponse?.total_record_count ?? 0
  }, [draftProductsResponse])

  // Get unique suppliers count from draft products data
  // Cross-reference with supplier list to ensure we only count suppliers that exist
  const uniqueDraftSuppliers = useMemo(() => {
    if (!draftProductsData || draftProductsData.length === 0) return 0
    
    // Extract unique vendor_ids from draft products
    const draftVendorIds = new Set(
      draftProductsData
        .map(item => item.vendor_id)
        .filter(id => id != null)
    )
    
    // If supplier data is available, validate that vendors exist in supplier list
    if (supplierData && supplierData.length > 0) {
      const validSupplierIds = new Set(
        supplierData.map(supplier => supplier.vendor_id).filter(id => id != null)
      )
      // Count only vendors that exist in both draft products and supplier list
      return Array.from(draftVendorIds).filter(id => validSupplierIds.has(id)).length
    }
    
    // Fallback: return count of unique vendor_ids from draft products
    return draftVendorIds.size
  }, [draftProductsData, supplierData])

  // Define columns for the suppliers DataTable
  const supplierColumns = useMemo(() => [
    {
      id: 'vendor_id',
      header: 'Supplier ID',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {item.vendor_id || '-'}
        </span>
      ),
    },
    {
      id: 'vendor_info',
      header: 'Supplier Info',
      cell: (item: AdminProductListItem) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">
            {item.vendor_name || '-'}
          </span>
          <span className="text-xs text-gray-500 font-urbanist">
            {item.vendor_phone || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'total_sales',
      header: 'Total Sales',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianCurrency(item.total_sales || 0)}
        </span>
      ),
    },
    {
      id: 'stock',
      header: 'Total Stocks',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianNumber(item.stock || 0)}
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
      id: 'vendor_address',
      header: 'Supplier Address',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist max-w-xs truncate">
          {item.vendor_address?.length > 10 ? item.vendor_address.slice(0, 50) + '...' : item.vendor_address || '-'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: AdminProductListItem) => {
        const statusDisplay = item.status === 'draft'
          ? { text: 'Draft', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
          : item.status === 'approve'
          ? { text: 'Approved', color: 'bg-green-50 text-green-600 border-green-200' }
          : item.status === 'pending'
          ? { text: 'Pending', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
          : item.status === 'rejected'
          ? { text: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200' }
          : { text: 'Pending', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
        return (
          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: (item: AdminProductListItem) => {
        const vendorId = typeof item.vendor_id === 'string' ? parseInt(item.vendor_id) : item.vendor_id
        return (
          <button 
            onClick={() => vendorId && handleShowSellerInfo(vendorId)}
            className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
          >
            <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
          </button>
        )
      },
    },
  ], [handleShowSellerInfo])

  // Define columns for the inventory DataTable
  const inventoryColumns = useMemo(() => [
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
      header: 'Product Status',
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
      id: 'supplier',
      header: 'Supplier Name',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.vendor_name || '-'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (item: AdminProductListItem) => {
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

  // Sync supplier search to URL
  useEffect(() => {
    updateUrlParams({ supplierSearch: supplierSearchTerm })
  }, [supplierSearchTerm, updateUrlParams])

// Only show loading spinner on true initial load (never loaded data before)
// When filters change, only table body will show skeleton loader
if (isLoadingProducts && !hasLoadedDataRef.current) {
  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <LoadingSpinner />
    </div>
  )
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
            {/* <div className="text-xs font-urbanist mt-1">
              <span className="font-bold text-green-600 bg-green-50 p-1 rounded">+8%</span>
              <span className="font-medium text-gray-500 ml-1 body-3">vs Last Month</span>
            </div> */}
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

  {/* Pending Approvals Banner */}
  {draftItemsCount > 0 && (
    <div className="mx-6 mb-6">
      <Card className="bg-[#FFEED0] shadow-sm transition-shadow cursor-pointer" onClick={handleViewPendingApprovals}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border border-[#FBE1B2] rounded-lg">
            <div className="flex items-center gap-2">
              {/* <Info className="h-5 w-5" style={{ color: '#BC7810' }} /> */}   
              <span className="font-semibold font-urbanist" style={{ color: '#BC7810' }}>
                {`${draftItemsCount} item${draftItemsCount > 1 ? 's' : ''} from ${uniqueDraftSuppliers} supplier${uniqueDraftSuppliers > 1 ? 's' : ''} are pending for approval`}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleViewPendingApprovals()
              }}
              className="p-1 rounded transition-colors"
              style={{ color: '#BC7810' }}
            >
              <CircleArrowRight className="h-5 w-5 text-[#BC7810]" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )}

        {/* All Suppliers List Table Section */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mx-6 mb-6">
          <CardContent className="p-0">
            {/* Card Header */}
            <div className="flex items-center justify-between px-2 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900 label-1 font-urbanist font-size-[16px]">All Suppliers List</h2>
                {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}
              </div>
              {/* <button className="text-sm font-semibold hover:text-gray-700 font-urbanist underline">
                View Details
              </button> */}
            </div>

            {/* Search Bar */}
            <div className="px-[8px] py-[15px] border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="relative w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={supplierSearchTerm}
                    onChange={(e) => {
                      setSupplierSearchTerm(e.target.value)
                      updateUrlParams({ supplierSearch: e.target.value })
                    }}
                    className="w-full pl-10 pr-12 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    ⌘/
                  </div>
                </div>
              </div>
            </div>

            {/* Unified DataTable for Suppliers with Server-side Pagination */}
            <DataTable<AdminProductListItem>
              items={supplierData}
              columns={supplierColumns}
              getRowKey={(item) => String(item.vendor_id || item.id)}
              pagination={serverSupplierPagination}
              totalItems={supplierTotalRecordCount}
              isLoading={(isLoadingSuppliers || isFetchingSuppliers) && !suppliersResponse}
              error={suppliersError}
              searchTerm={supplierSearchTerm}
              onClearSearch={() => setSupplierSearchTerm('')}
              emptyTitle="No suppliers found"
              emptyDescription={
                supplierSearchTerm 
                  ? `No results found for "${supplierSearchTerm}". Try adjusting your search terms or check for typos.`
                  : "No suppliers available at the moment. Please check back later."
              }
              withCard={false}
              className=""
              tableClassName="w-full"
              headerClassName="bg-gray-50 border-b border-gray-200"
              bodyClassName="bg-white"
              showPagination={supplierTotalRecordCount > 0}
            />
          </CardContent>
        </Card>

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
                {(isLoadingProducts || isFetchingProducts) && (
                  <div className="flex items-center text-secondary-900">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
                    <span className="text-body-4 font-urbanist">{isLoadingProducts ? 'Loading...' : 'Updating...'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar and Vendor Filter */}
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
                <div className="w-full sm:w-[240px]">
                  <Select 
                    value={vendorFilter || 'all'} 
                    onValueChange={(value) => {
                      const newVendorFilter = value === 'all' ? '' : value
                      setVendorFilter(newVendorFilter)
                      setServerPage(1)
                      updateUrlParams({ vendorFilter: newVendorFilter, currentPage: 1 })
                    }}
                    disabled={isLoadingSellerNames}
                  >
                    <SelectTrigger className="w-full bg-gray-50">
                      <SelectValue placeholder="Filter by vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {sellerNameList.map((seller) => (
                        <SelectItem key={seller.id} value={String(seller.id)}>
                          {seller.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Unified DataTable with Server-side Pagination */}
            <DataTable<AdminProductListItem>
              items={inventoryData}
              columns={inventoryColumns}
              getRowKey={(item) => String(item.id)}
              pagination={serverProductPagination}
              totalItems={productTotalRecordCount}
              isLoading={isLoadingProducts && !productsResponse}
              isFetching={isFetchingProducts && productsResponse !== undefined}
              error={productsError}
              onRetry={() => {
                // Retry logic if needed - TanStack Query handles refetch automatically
              }}
              searchTerm={productSearchTerm}
              onClearSearch={() => {
                setProductSearchTerm('')
                setServerPage(1)
                updateUrlParams({ searchTerm: '', currentPage: 1 })
              }}
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
              showPagination={productTotalRecordCount > 0}
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