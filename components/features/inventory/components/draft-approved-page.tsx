"use client"
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Edit, Trash2 } from 'lucide-react'
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
import * as XLSX from 'xlsx'
import type { DraftProductShape, ProductListResponse, PaginationParams } from '../types/inventory.types'
import FiltersBar from './shared/filters-bar'
import { DataTable } from '@/components/shared/table'
import { formatIndianCurrency, formatIndianNumber } from '@/lib/api/helpers/number'
import { toast } from 'sonner'
import { useEcomCategoriesQuery, useDraftProductsQuery, useInvalidateInventoryQueries, useDeleteVendorProductMutation } from '../hooks/use-inventory-query'
import { inventoryService } from '../services/inventory.service'
import { useUserType } from '@/hooks/use-user-type'



const extractProductRecords = (
  payload: ProductListResponse | DraftProductShape[] | null | undefined
): DraftProductShape[] => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.record)) return payload.record
  if (Array.isArray(payload.result)) return payload.result
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.products)) return payload.products
  return []
}

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

interface DraftApprovedPageProps {
  onClose: () => void
}

export function DraftApprovedPage({ onClose }: DraftApprovedPageProps) {
  const router = useRouter()
  type DraftRow = {
    sku: string
    productName: string
    status: 'Draft' | 'Pending'
    category: string
    stock: number
    mrp: number
    productId: number | null
  }

  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null)

  // Read initial filter and pagination state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        search: '',
        category: 'All',
        page: 1,
        limit: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      search: urlParams.get('search') || '',
      category: urlParams.get('category') || 'All',
      page: parseInt(urlParams.get('page') || '1', 10),
      limit: parseInt(urlParams.get('limit') || '10', 10),
    }
  }, [])

  // Get initial values from URL
  const initialUrlParams = getUrlParams()

  // Server-side pagination state
  const [serverPage, setServerPage] = useState(initialUrlParams.page)
  const [serverLimit, setServerLimit] = useState(initialUrlParams.limit)
  const [draftSearchTerm, setDraftSearchTerm] = useState(initialUrlParams.search)
  const [selectedCategory, setSelectedCategory] = useState(initialUrlParams.category)

  // Debounce search to avoid excessive API calls
  const debouncedDraftSearchTerm = useDebounce(draftSearchTerm, 500)

  // Create pagination params for API call with debounced search
  const paginationParams: PaginationParams = useMemo(() => ({
    page: serverPage,
    limit: serverLimit,
    search: debouncedDraftSearchTerm || undefined,
  }), [serverPage, serverLimit, debouncedDraftSearchTerm])

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    search?: string
    category?: string
    page?: number
    limit?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    if (updates.search !== undefined) {
      if (updates.search) {
        url.searchParams.set('search', updates.search)
      } else {
        url.searchParams.delete('search')
      }
    }
    
    if (updates.category !== undefined) {
      if (updates.category && updates.category !== 'All') {
        url.searchParams.set('category', updates.category)
      } else {
        url.searchParams.delete('category')
      }
    }
    
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        url.searchParams.set('page', String(updates.page))
      } else {
        url.searchParams.delete('page')
      }
    }
    
    if (updates.limit !== undefined) {
      if (updates.limit !== 10) {
        url.searchParams.set('limit', String(updates.limit))
      } else {
        url.searchParams.delete('limit')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Use TanStack Query for categories and draft products
  const { 
    data: apiCategories, 
    isLoading: isLoadingCategories 
  } = useEcomCategoriesQuery()
  
  const { 
    data: draftProductsResponse, 
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts
  } = useDraftProductsQuery(paginationParams)
  
  const { invalidateProducts } = useInvalidateInventoryQueries()
  const deleteProductMutation = useDeleteVendorProductMutation()
  const { userType } = useUserType()
  
  // Extract inventory data from query response
  const inventoryData = useMemo(() => {
    if (!draftProductsResponse) return []
    return extractProductRecords(draftProductsResponse)
  }, [draftProductsResponse])

  const categoryOptions = useMemo(() => {
    if (!apiCategories) return []
    const names = apiCategories
      .map((c) => (c?.name || c?.category_name || c?.category || '').toString())
      .filter((n) => n && n.trim().length > 0)
    return Array.from(new Set(names)).sort()
  }, [apiCategories])

  const normalizedRows: DraftRow[] = useMemo(() => {
    return inventoryData.map((item) => {
      const sku = (item?.sku || item?.sku_id || item?.id || '').toString()
      const productName = (item?.product_name || item?.name || item?.title || '').toString()
      const categoryName = (item?.category_name || item?.category || item?.categoryName || '').toString()
      const stock = Number(
        item?.stock_quantity ?? item?.stock ?? item?.qty ?? 0
      ) || 0
      const mrp = Number(item?.mrp ?? item?.price ?? item?.rate ?? 0) || 0
      return {
        sku: sku || '—',
        productName: productName || '—',
        status: 'Draft',
        category: categoryName || '—',
        stock,
        mrp,
        productId: item?.id || item?.product_id || Number(item?.sku || item?.sku_id || item?.id) || null,
      }
    })
  }, [inventoryData])

  // Get total_record_count from API response for server-side pagination
  const totalRecordCount = draftProductsResponse?.total_record_count ?? inventoryData.length

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
    updateUrlParams({ page })
  }, [serverTotalPages, updateUrlParams])

  const handleServerLimitChange = useCallback((limit: number) => {
    setServerLimit(limit)
    setServerPage(1)
    updateUrlParams({ limit, page: 1 })
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

  // Reset page to 1 when search term changes (debounced)
  useEffect(() => {
    if (serverPage !== 1) {
      setServerPage(1)
      updateUrlParams({ page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraftSearchTerm])

  // Client-side category filtering (category filter is still client-side)
  const filteredByCategory = useMemo(() => {
    if (selectedCategory === 'All') return normalizedRows
    return normalizedRows.filter(row => row.category === selectedCategory)
  }, [normalizedRows, selectedCategory])

  // Sync state changes to URL parameters
  useEffect(() => {
    updateUrlParams({
      search: draftSearchTerm,
      category: selectedCategory,
      page: serverPage,
      limit: serverLimit,
    })
  }, [draftSearchTerm, selectedCategory, serverPage, serverLimit, updateUrlParams])

  const handleEditInventory = (productId: number) => {
    // Navigate to edit page using file-based routing
    router.push(`/seller-dashboard/inventory/edit/${productId}`)
  }

  const handleDeleteInventory = (id: number) => {
    // Find the product to get its name for the confirmation message
    const product = normalizedRows.find((item) => item.productId === id)
    const productName = product?.productName || 'this product'
    
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
      // Invalidate queries to refetch fresh data after deletion
      invalidateProducts()
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

  // Define columns for the draft DataTable
  const draftColumns = useMemo(() => [
    {
      id: 'sku',
      header: 'SKU ID',
      cell: (item: DraftRow) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.sku}</span>
      ),
    },
    {
      id: 'productName',
      header: 'Product Name',
      cell: (item: DraftRow) => (
        <div className="font-semibold text-neutral-800 body-3 font-urbanist max-w-[220px] truncate">{item.productName}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: DraftRow) => (
        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]">
          {item.status}
        </span>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: (item: DraftRow) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.category}</span>
      ),
    },
    {
      id: 'stock',
      header: 'Stock',
      align: 'right' as const,
      cell: (item: DraftRow) => {
        const stockValue = Number(item.stock) || 0
        return (
          <span className={`body-3 font-urbanist ${stockValue <= 10 ? 'text-red-500' : 'text-neutral-800'}`}>
            {formatIndianNumber(stockValue)}
          </span>
        )
      },
    },
    {
      id: 'mrp',
      header: 'MRP ₹',
      align: 'right' as const,
      cell: (item: DraftRow) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {formatIndianCurrency(item.mrp || 0)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right' as const,
      cell: (item: DraftRow) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => item.productId && handleEditInventory(item.productId)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title="Edit product"
          >
            <Edit className="h-4 w-4" />
          </button>
          {userType === 'admin' && (
            <button
              onClick={() => item.productId && handleDeleteInventory(item.productId)}
              className="p-1.5 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
              title="Delete product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ], [handleEditInventory, handleDeleteInventory, userType])

  // Helper function to extract valid option names from variant options
  const getValidOptionNames = (options: any[]): string | null => {
    if (!options || !Array.isArray(options) || options.length === 0) {
      return null
    }
    
    const validNames = options
      .map((o: any) => o?.name)
      .filter((name: any) => {
        if (name === null || name === undefined) return false
        if (name === '' || name === 0) return false
        return String(name).trim() !== ''
      })
    
    return validNames.length > 0 ? validNames.join(', ') : null
  }

  // Helper function to format variant information for Excel export
  const formatVariantInfo = (variant: any): string => {
    const parts: string[] = []
    
    // if (variant.name) {
    //   parts.push(`NAME: ${variant.name}`)
    // }
    
    const optionNames = getValidOptionNames(variant.options)
    if (optionNames) {
      parts.push(`OPTIONS: ${optionNames}`)
    }
    
    if (variant.extra_charges !== 0 && variant.extra_charges !== '' && variant.extra_charges !== null) {
      parts.push(`EXTRA CHARGES: ${variant.extra_charges}`)
    }
    if (variant.extra_lead_time !== 0 && variant.extra_lead_time !== '' && variant.extra_lead_time !== null) {
      parts.push(`EXTRA LEAD TIME: ${variant.extra_lead_time}`)
    }
    if (variant.variant_product_length !== 0 && variant.variant_product_length !== '' && variant.variant_product_length !== null) {
      parts.push(`VARIANT PRODUCT LENGTH: ${variant.variant_product_length}`)
    }
    if (variant.variant_product_width !== 0 && variant.variant_product_width !== '' && variant.variant_product_width !== null) {
      parts.push(`VARIANT PRODUCT WIDTH: ${variant.variant_product_width}`)
    }
    if (variant.variant_product_height !== 0 && variant.variant_product_height !== '' && variant.variant_product_height !== null) {
      parts.push(`VARIANT PRODUCT HEIGHT: ${variant.variant_product_height}`)
    }
    if (variant.variant_product_weight !== 0 && variant.variant_product_weight !== '' && variant.variant_product_weight !== null) {
      parts.push(`VARIANT PRODUCT WEIGHT: ${variant.variant_product_weight}`)
    }
    if (variant.variant_package_length !== 0 && variant.variant_package_length !== '' && variant.variant_package_length !== null) {
      parts.push(`VARIANT PACKAGE LENGTH: ${variant.variant_package_length}`)
    }
    if (variant.variant_package_width !== 0 && variant.variant_package_width !== '' && variant.variant_package_width !== null) {
      parts.push(`VARIANT PACKAGE WIDTH: ${variant.variant_package_width}`)
    }
    if (variant.variant_package_height !== 0 && variant.variant_package_height !== '' && variant.variant_package_height !== null) {
      parts.push(`VARIANT PACKAGE HEIGHT: ${variant.variant_package_height}`)
    }
    if (variant.variant_package_weight !== 0 && variant.variant_package_weight !== '' && variant.variant_package_weight !== null) {
      parts.push(`VARIANT PACKAGE WEIGHT: ${variant.variant_package_weight}`)
    }
    
    return parts.join(' | ')
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      // Get vendor_id from localStorage using 'uid' key, only for sellers
      let vendorId: string | number | undefined = undefined
      if (userType === 'seller') {
        const uid = localStorage.getItem('uid')
        vendorId = uid || ''
      }
      
      // Build headers
      const records = await inventoryService.exportProductRecord(vendorId)
      
      if (records.length === 0) {
        toast.error('No data available to export')
        return
      }
      
      // Prepare data for Excel
      const excelData = records.map((item: any) => {
        // Format variants information
        const variantsInfo = item.variants?.map(formatVariantInfo).join(' | ') || ''

        return {
          'Product ID': item.id || '',
          'Product Name': item.name || '',
          'SKU Code': item.sku_code || '',
          'HSN Code': item.hsn_code || '',
          'Category': item.category || '',
          'Sub Category': item.sub_category || '',
          'Product Type': item.product_type || '',
          'Description': item.description || '',
          'Unit': item.unit || '',
          'Quantity': item.quantity || '',
          'MRP': item.mrp || '',
          'Taxes': item.taxes?.map((t: any) => t.name).join(', ') || '',
          'Price After Discount': item.price_after_discount || '',
          'Product Length (cm)': item.product_dimension_length || '',
          'Product Width (cm)': item.product_dimension_width || '',
          'Product Height (cm)': item.product_dimension_height || '',
          'Product Weight (kg)': item.product_dimension_weight || '',
          'Package Length (cm)': item.package_length || '',
          'Package Width (cm)': item.package_width || '',
          'Package Height (cm)': item.package_height || '',
          'Package Weight (kg)': item.package_weight || '',
          'Low Stock Value': item.low_stock_value || '',
          'Low Stock Alert': item.low_stock_alert ? 'Yes' : 'No',
          'Assembly Requirement': item.assembly_requirement || '',
          'Fragility Indicator': item.fragility_indicator ? 'Yes' : 'No',
          'Courier Feasibility': item.courier_feasibility || '',
          'Handling Instructions': item.handling_instructions || '',
          'Materials': item.product_material?.map((m: any) => m.name).join(', ') || '',
          'Finish': item.finish?.map((f: any) => f.name).join(', ') || '',
          'Usage Type': item.usage_type?.map((u: any) => u.name).join(', ') || '',
          'Collections': item.collections?.map((c: any) => c.name || c).join(', ') || '',
          'Variants': variantsInfo,
        }
      })
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
      
      // Auto-size columns
      const maxWidth = 50
      const columnWidths = Object.keys(excelData[0] || {}).map(key => ({
        wch: Math.min(
          Math.max(
            key.length,
            ...excelData.map((row: any) => String(row[key] || '').length)
          ),
          maxWidth
        )
      }))
      worksheet['!cols'] = columnWidths
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `product_export_${timestamp}.xlsx`
      
      // Download the file
      XLSX.writeFile(workbook, filename)
      
    } catch (error) {
      toast.error('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }


  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <PageHeader title="Inventory" subTitle="Draft"  onTitleClick={onClose}/>
      <div className="px-6">
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-0">
            {/* Title row */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Draft Inventory Items</h2>
              <div className="flex items-center gap-2">
                <Button
                  className={`bg-secondary-900 hover:bg-secondary-800 body-3 font-urbanist h-8 px-4`}
                  onClick={handleExportExcel}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export Excel'}
                </Button>
                {/* <Button variant="outline" onClick={onClose}>Back to Inventory</Button> */}
              </div>
            </div>

            {/* Toolbar row */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
              <FiltersBar
                searchTerm={draftSearchTerm}
                onSearchTermChange={setDraftSearchTerm}
                categories={categoryOptions}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                showStatus={false}
                searchPlaceholder="Search drafts"
              />
            </div>

            {/* Unified DataTable with Server-side Pagination */}
            <DataTable<DraftRow>
              items={filteredByCategory}
              columns={draftColumns}
              getRowKey={(item) => item.sku}
              pagination={serverPagination}
              totalItems={totalRecordCount}
              isLoading={(isLoadingProducts || isFetchingProducts) && !draftProductsResponse}
              error={null}
              searchTerm={draftSearchTerm}
              onClearSearch={() => {
                setDraftSearchTerm('')
                setServerPage(1)
                updateUrlParams({ search: '', page: 1 })
              }}
              emptyTitle="No draft items found"
              emptyDescription={
                draftSearchTerm 
                  ? `No results found for "${draftSearchTerm}". Try adjusting your search terms or check for typos.`
                  : "No draft items available at the moment. Please check back later."
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

export default DraftApprovedPage