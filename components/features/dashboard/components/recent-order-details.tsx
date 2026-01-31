"use client"
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Eye } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { DataTable } from '@/components/shared/table'
import type { Order } from '@/components/features/orders/types/orders.types'
import type {
  RecentOrderDetailsProps,
  ApiRecentOrder,
  RecentOrderRow,
} from '../types/dashboard.types'
import { useRecentOrdersQuery } from '../hooks/use-dashboard-query'

function RecentOrderDetails({ onOrderClick, onLoadingChange }: RecentOrderDetailsProps) {
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
      searchQuery: urlParams.get('recentSearch') || '',
      page: parseInt(urlParams.get('recentPage') || '1', 10),
      itemsPerPage: parseInt(urlParams.get('recentItemsPerPage') || '10', 10),
    }
  }, [])

  // Get initial values from URL
  const initialUrlParams = getUrlParams()
  
  // State for server-side pagination
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
        url.searchParams.set('recentSearch', updates.searchQuery)
      } else {
        url.searchParams.delete('recentSearch')
      }
    }
    
    if (updates.currentPage !== undefined) {
      if (updates.currentPage > 1) {
        url.searchParams.set('recentPage', String(updates.currentPage))
      } else {
        url.searchParams.delete('recentPage')
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set('recentItemsPerPage', String(updates.itemsPerPage))
      } else {
        url.searchParams.delete('recentItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 500)

  // Server-side pagination params with debounced search
  const paginationParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
  }), [currentPage, itemsPerPage, debouncedSearch])

  // Use TanStack Query hook for fetching recent orders with pagination
  const { data: ordersResponse, isLoading, isFetching, error } = useRecentOrdersQuery(
    { enabled: true },
    paginationParams
  )

  // Extract data from response
  const orders = ordersResponse?.orders ?? []
  const totalRecordCount = ordersResponse?.totalRecordCount ?? 0

  // Track initial load and only notify parent on initial load (not on search/fetching)
  useEffect(() => {
    if (!isLoading && !hasInitiallyLoaded && orders.length > 0) {
      setHasInitiallyLoaded(true)
    }
    // Only notify parent on initial load completion, not on subsequent fetches
    if (onLoadingChange && !hasInitiallyLoaded) {
      onLoadingChange(isLoading)
    }
  }, [isLoading, hasInitiallyLoaded, orders.length, onLoadingChange])

  // Map API data to table rows
  const tableData: RecentOrderRow[] = useMemo(() => {
    return orders.map((o) => {
      const dateObj = new Date(o.date)
      const hasValidDate = !isNaN(dateObj.getTime())
      const dateStr = hasValidDate ? dateObj.toISOString().slice(0, 10) : o.date
      const timeStr = hasValidDate ? dateObj.toTimeString().slice(0, 8) : ''
      const namesJoined = Array.isArray(o.product_name) ? o.product_name.join(', ') : String(o.product_name)
      return {
        orderId: o.order_name ?? String(o.order_id),
        orderIdNumber: o.order_id, // Store the numeric order_id
        multipleItems: Array.isArray(o.product_name) && o.product_name.length > 1,
        productName: namesJoined,
        customerName: o.customer_name,
        phone: o.customer_mobile,
        date: dateStr,
        time: timeStr,
        amount: o.amount,
        status: o.status,
      }
    })
  }, [orders])

  // Pagination object compatible with DataTable
  const paginationState = useMemo(() => ({
    currentPage,
    itemsPerPage,
    setCurrentPage: (page: number) => {
      setCurrentPage(page)
      updateUrlParams({ currentPage: page })
    },
    setItemsPerPage: (value: number) => {
      setItemsPerPage(value)
      setCurrentPage(1)
      updateUrlParams({ itemsPerPage: value, currentPage: 1 })
    },
    totalPages: Math.max(1, Math.ceil(totalRecordCount / itemsPerPage)),
  }), [currentPage, itemsPerPage, totalRecordCount, updateUrlParams])

  // Search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
    updateUrlParams({ searchQuery: e.target.value, currentPage: 1 })
  }
  
  // Clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
    updateUrlParams({ searchQuery: '', currentPage: 1 })
  }, [updateUrlParams])

  // Function to trim text with dots after specific length
  const trimText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength) + '...'
  }

  // Handle row click to show order details
  const handleRowClick = (row: RecentOrderRow) => {
    // Create a minimal Order object with just the ID
    // The OrderDetailPage component will fetch full details using this ID
    const order: Order = {
      id: row.orderIdNumber,
      name: row.orderId,
      date: row.date,
      customer_name: row.customerName,
      customer_mobile: row.phone,
      customer_address: '',
      total_amount: typeof row.amount === 'number' ? row.amount : 0,
      discount: 0,
      shipping_cost: 0,
      subtotal_amount: typeof row.amount === 'number' ? row.amount : 0,
      tax_amount: 0,
      x_shopify_order_id: '',
      x_shopify_payment_method: '',
      x_shopify_payment_reference: '',
      expected_delivery_days: '',
      order_line: [],
      activity_log: [],
      status: row.status,
    }
    // Notify parent component to show order details
    onOrderClick?.(order)
  }

  // Column definitions for DataTable
  const columns = useMemo(() => [
    {
      id: 'orderId',
      header: 'Order ID',
      cell: (row: RecentOrderRow) => (
        <div className="flex flex-col gap-1">
          <div className="font-semibold text-neutral-800 body-3 font-urbanist">{row.orderId}</div>
          {row.multipleItems && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-[#FFF4CC] text-[#E59213] border border-[#FBE1B2] rounded w-fit">
              Multiple Items!
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'productName',
      header: 'Product Name',
      width: 'w-[333px]',
      cell: (row: RecentOrderRow) => (
        <div className="font-semibold text-neutral-800 body-3 font-urbanist" title={row.productName}>
          {trimText(row.productName, 50)}
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer Name',
      cell: (row: RecentOrderRow) => (
        <div className="flex flex-col">
          <div className="font-semibold text-neutral-800 body-3 font-urbanist">
            {row.customerName}
          </div>
          {typeof window !== 'undefined' && localStorage.getItem('user_type') === 'admin' && (
            <div className="text-sm text-gray-500 body-3 font-urbanist">
              {row.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: (row: RecentOrderRow) => (
        <div className="flex flex-col">
          <div className="font-semibold text-neutral-800 body-3 font-urbanist">{row.date}</div>
          <div className="text-sm text-gray-500 body-3 font-urbanist">{row.time}</div>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      width: 'w-[138px]',
      cell: (row: RecentOrderRow) => (
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">
          {typeof row.amount === 'number' 
            ? row.amount.toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }) 
            : row.amount}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row: RecentOrderRow) => (
        <span className="inline-flex px-3 py-1 text-xs font-medium bg-[#FFEED0] text-[#E59213] rounded-md border border-[#FBE1B2]">
          {row.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row: RecentOrderRow) => (
        <button 
          className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1"
          onClick={(e) => {
            e.stopPropagation()
            handleRowClick(row)
          }}
        >
          <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
        </button>
      ),
    },
  ], [trimText, handleRowClick])



  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mb-[24px] mt-[24px]">
      <CardContent className="p-0">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Recent Orders</h2>
            {isFetching && !isLoading && (
              <div className="flex items-center text-secondary-900 ml-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
                <span className="text-body-4 font-urbanist">Updating...</span>
              </div>
            )}
          </div>
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-12 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              ⌘/
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable<RecentOrderRow>
          items={tableData}
          columns={columns}
          getRowKey={(row) => row.orderId}
          pagination={paginationState as any}
          totalItems={totalRecordCount}
          isLoading={isLoading && tableData.length === 0}
          isFetching={isFetching && tableData.length > 0}
          error={error}
          searchTerm={searchQuery}
          onClearSearch={handleClearSearch}
          emptyTitle="No orders found"
          emptyDescription={searchQuery 
            ? `No results found for "${searchQuery}". Try adjusting your search terms or check for typos.`
            : "No orders available at the moment. Please check back later."}
          withCard={false}
          className=""
          tableClassName="w-full"
          headerClassName="bg-gray-50 border-b border-gray-200"
          bodyClassName="bg-white"
          showPagination={totalRecordCount > 0}
        />
      </CardContent>
    </Card>
  )
}

export default RecentOrderDetails