"use client"
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import PageHeader from '@/components/shared/layout/page-header'
import { Search, AlertCircle, Edit, Trash2 } from 'lucide-react'
import type { AdminProductListItem, PaginationParams } from '../types/inventory.types'
import { useAdminDraftProductsQuery, useDeleteVendorProductMutation } from '../hooks/use-inventory-query'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { DataTable } from '@/components/shared/table'
import FiltersBar from './shared/filters-bar'
import { formatIndianCurrency, formatIndianNumber } from '@/lib/api/helpers/number'
import { mapApiToTableData } from '@/lib/utils/table'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'
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

interface PendingApprovalsTableProps {
  onClose: () => void
  onEditProduct?: (productId: number) => void
}

const PendingApprovalsTable = ({ onClose, onEditProduct }: PendingApprovalsTableProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null)

  // Read initial filter and pagination state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        pendingSearch: '',
        pendingCategory: 'All',
        pendingStatus: 'All',
        pendingPage: 1,
        pendingItemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      pendingSearch: urlParams.get('pendingSearch') || '',
      pendingCategory: urlParams.get('pendingCategory') || 'All',
      pendingStatus: urlParams.get('pendingStatus') || 'All',
      pendingPage: parseInt(urlParams.get('pendingPage') || '1', 10),
      pendingItemsPerPage: parseInt(urlParams.get('pendingItemsPerPage') || '10', 10),
    }
  }, [])

  // Get initial values from URL
  const initialUrlParams = getUrlParams()

  // Server-side pagination state
  const [serverPage, setServerPage] = useState(initialUrlParams.pendingPage)
  const [serverLimit, setServerLimit] = useState(initialUrlParams.pendingItemsPerPage)
  const [searchTerm, setSearchTerm] = useState(initialUrlParams.pendingSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialUrlParams.pendingCategory)
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Create pagination params for API call with debounced search
  const paginationParams: PaginationParams = useMemo(() => ({
    page: serverPage,
    limit: serverLimit,
    search: debouncedSearch || undefined,
  }), [serverPage, serverLimit, debouncedSearch])

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    pendingSearch?: string
    pendingCategory?: string
    pendingPage?: number
    pendingItemsPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    if (updates.pendingSearch !== undefined) {
      if (updates.pendingSearch) {
        url.searchParams.set('pendingSearch', updates.pendingSearch)
      } else {
        url.searchParams.delete('pendingSearch')
      }
    }
    
    if (updates.pendingCategory !== undefined) {
      if (updates.pendingCategory && updates.pendingCategory !== 'All') {
        url.searchParams.set('pendingCategory', updates.pendingCategory)
      } else {
        url.searchParams.delete('pendingCategory')
      }
    }
    
    if (updates.pendingPage !== undefined) {
      if (updates.pendingPage > 1) {
        url.searchParams.set('pendingPage', String(updates.pendingPage))
      } else {
        url.searchParams.delete('pendingPage')
      }
    }
    
    if (updates.pendingItemsPerPage !== undefined) {
      if (updates.pendingItemsPerPage !== 10) {
        url.searchParams.set('pendingItemsPerPage', String(updates.pendingItemsPerPage))
      } else {
        url.searchParams.delete('pendingItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])
  
  // Use TanStack Query for draft products with server-side pagination, search, and status filtering
  const { 
    data: productsResponse, 
    isLoading, 
    isFetching,
    error: productsError 
  } = useAdminDraftProductsQuery(paginationParams)
  
  const deleteProductMutation = useDeleteVendorProductMutation()
  
  // Extract data from query response using mapApiToTableData utility
  const draftItems = useMemo(() => {
    if (!productsResponse) return []
    const result = mapApiToTableData<AdminProductListItem, AdminProductListItem>(
      productsResponse,
      {
        extractOptions: {
          dataKey: 'record',
          returnEmptyOnError: true,
        },
      }
    )
    // No need to filter for draft status - API already returns only draft items
    return result.data
  }, [productsResponse])

  // Apply category filter client-side (if needed)
  const filteredDraftItems = useMemo(() => {
    if (selectedCategory === 'All') return draftItems
    return draftItems.filter(item => item.category === selectedCategory)
  }, [draftItems, selectedCategory])

  // Get unique suppliers count
  const uniqueSuppliers = useMemo(() => {
    return new Set(filteredDraftItems.map(item => item.vendor_id)).size
  }, [filteredDraftItems])

  // Get total_record_count from API response for server-side pagination
  // Note: This is total count from API, but we filter for drafts client-side
  // So the actual displayed count may be less
  const totalRecordCount = productsResponse?.total_record_count ?? filteredDraftItems.length

  // Server-side pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalRecordCount / serverLimit))

  // Generate page numbers with ellipsis
  const generatePageNumbers = (currentPage: number, totalPages: number): Array<number | string> => {
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

  const pageNumbers = useMemo(() => 
    generatePageNumbers(serverPage, totalPages),
    [serverPage, totalPages]
  )

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return
    setServerPage(page)
    updateUrlParams({ pendingPage: page })
  }, [totalPages, updateUrlParams])

  const handleLimitChange = useCallback((limit: number) => {
    setServerLimit(limit)
    setServerPage(1)
    updateUrlParams({ pendingItemsPerPage: limit, pendingPage: 1 })
  }, [updateUrlParams])

  const handlePreviousPage = useCallback(() => {
    if (serverPage > 1) {
      handlePageChange(serverPage - 1)
    }
  }, [serverPage, handlePageChange])

  const handleNextPage = useCallback(() => {
    if (serverPage < totalPages) {
      handlePageChange(serverPage + 1)
    }
  }, [serverPage, totalPages, handlePageChange])

  // Pagination state object
  const pagination = useMemo(() => ({
    currentPage: serverPage,
    itemsPerPage: serverLimit,
    totalPages,
    pageNumbers,
    setCurrentPage: handlePageChange,
    setItemsPerPage: handleLimitChange,
    handlePreviousPage,
    handleNextPage,
    goToFirstPage: () => handlePageChange(1),
    goToLastPage: () => handlePageChange(totalPages),
    canGoPrevious: serverPage > 1,
    canGoNext: serverPage < totalPages,
  }), [
    serverPage,
    serverLimit,
    totalPages,
    pageNumbers,
    handlePageChange,
    handleLimitChange,
    handlePreviousPage,
    handleNextPage
  ])

  // Get unique categories from filtered draft items
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>()
    filteredDraftItems.forEach(item => {
      if (item.category) categories.add(item.category)
    })
    return Array.from(categories).sort()
  }, [filteredDraftItems])

  // Restore state from URL when URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = getUrlParams()
      setServerPage(params.pendingPage)
      setServerLimit(params.pendingItemsPerPage)
      setSearchTerm(params.pendingSearch)
      setSelectedCategory(params.pendingCategory)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getUrlParams])

  // Sync URL parameters when state changes
  useEffect(() => {
    updateUrlParams({
      pendingSearch: searchTerm,
      pendingCategory: selectedCategory,
      pendingPage: serverPage,
      pendingItemsPerPage: serverLimit,
    })
  }, [searchTerm, selectedCategory, serverPage, serverLimit, updateUrlParams])

  // Reset to first page when search or category changes
  useEffect(() => {
    setServerPage(1)
    updateUrlParams({ pendingPage: 1 })
  }, [searchTerm, selectedCategory, updateUrlParams])

  const handleEditInventory = (id: number) => {
    onEditProduct?.(id)
  }

  const handleDeleteInventory = (id: number) => {
    // Find the product to get its name for the confirmation message
    const product = draftItems.find((item) => item.id === id)
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

  // Define columns for the pending approvals DataTable
  const pendingColumns = useMemo(() => [
    {
      id: 'sku',
      header: 'SKU ID',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.id || '-'}</span>
      ),
    },
    {
      id: 'name',
      header: 'Product Name',
      cell: (item: AdminProductListItem) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.name || '-'}</span>
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
      id: 'status',
      header: 'Status',
      cell: () => (
        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]">
          Draft
        </span>
      ),
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
        if (!item.id) return null
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleEditInventory(item.id!)}
              className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
              title="Edit product"
            >
              <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleDeleteInventory(item.id!)}
              className="text-gray-400 w-6 h-6 hover:text-red-600 border border-gray-200 rounded-md p-1 transition-colors"
              title="Delete draft product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ], [handleEditInventory, handleDeleteInventory])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Inventory" 
        subTitle={`Pending Approvals (${filteredDraftItems.length} items from ${uniqueSuppliers} supplier${uniqueSuppliers !== 1 ? 's' : ''})`}
        onTitleClick={onClose} 
      />
      
      {/* Pending Approvals Table Section */}
      <div className="py-6 px-4">
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mx-2">
          <CardContent className="p-0">
            {/* Card Header */}
            <div className="flex items-center justify-between px-2 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900 label-1 font-urbanist font-size-[16px]">All Pending Items</h2>
              </div>
            </div>

            {/* Search and Filter Dropdowns */}
            <div className="px-[8px] py-[15px] border-b border-gray-200">
              <FiltersBar
                searchTerm={searchTerm}
                onSearchTermChange={(term) => {
                  setSearchTerm(term)
                  setServerPage(1) // Reset to first page when search changes
                  updateUrlParams({ pendingSearch: term, pendingPage: 1 })
                }}
                categories={categoryOptions}
                selectedCategory={selectedCategory}
                onCategoryChange={(category) => {
                  setSelectedCategory(category)
                  setServerPage(1) // Reset to first page when category changes
                  updateUrlParams({ pendingCategory: category, pendingPage: 1 })
                }}
                statuses={[]}
                selectedStatus="All"
                onStatusChange={() => {}}
                searchPlaceholder="Search products, vendors, IDs"
                showStatus={false}
              />
            </div>

            {/* Unified DataTable with Server-side Pagination and Skeleton Loading */}
            <DataTable<AdminProductListItem>
              items={filteredDraftItems}
              columns={pendingColumns}
              getRowKey={(item) => String(item.id)}
              pagination={pagination as any}
              totalItems={totalRecordCount}
              isLoading={isLoading}
              isFetching={isFetching}
              error={productsError}
              searchTerm={searchTerm}
              onClearSearch={() => {
                setSearchTerm('')
                setServerPage(1)
                updateUrlParams({ pendingSearch: '', pendingPage: 1 })
              }}
              emptyTitle="No pending items found"
              emptyDescription={
                searchTerm 
                  ? `No results found for "${searchTerm}". Try adjusting your search terms or check for typos.`
                  : "No pending items available at the moment."
              }
              withCard={false}
              className=""
              tableClassName="w-full"
              headerClassName="bg-gray-50 border-b border-gray-200"
              bodyClassName="bg-white"
              showPagination={totalRecordCount > 0}
              skeletonRows={serverLimit}
            />
          </CardContent>
        </Card>
      </div>

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

export default PendingApprovalsTable

