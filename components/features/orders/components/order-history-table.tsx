"use client"

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatIndianCurrency } from '@/lib/api/helpers/number'
import { Eye, Search } from 'lucide-react'

import PageHeader from '@/components/shared/layout/page-header'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { DataTable } from '@/components/shared/table'
import { useOrderHistory } from '../hooks/use-order-history'
import { useSellerNameListQuery } from '../hooks/use-orders-query'
import type { Order } from '../types/orders.types'
import type { OrderHistoryTableProps, StatusCardConfig } from '../types/orders.types'

// Import slider components
import SeeOrderSliderSeller from './see-order-slider'
import SeeOrderSliderAdmin from './see-order-slider-admin'

/**
 * Unified Order History Table Component
 * Works for both seller and admin dashboards
 */
export function OrderHistoryTable({ 
  onSliderStateChange, 
  userType: propUserType = 'seller',
  onViewOrderDetail,
}: OrderHistoryTableProps) {
  // Get userType synchronously to prevent cache misses
  const userType = useMemo(() => {
    if (propUserType) return propUserType
    if (typeof window === 'undefined') return 'seller'
    return (localStorage.getItem('user_type') as 'seller' | 'admin') || 'seller'
  }, [propUserType])
  
  // UI state - declare before useOrderHistory so it can be used in enabled prop
  const [isSliderOpen, setIsSliderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  const {
    orders,
    summary,
    isLoading,
    isFetching,
    error,
    allOrdersLoading,
    allOrdersFetching,
    newOrdersLoading,
    newOrdersFetching,
    allOrdersPagination,
    newOrdersPagination,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    vendorFilter,
    setVendorFilter,
    newOrdersSearchTerm,
    setNewOrdersSearchTerm,
    refresh,
    formatDate,
    getProductNames,
    getSellerNames,
    totalRecordCount,
    newOrdersTotalRecordCount,
  } = useOrderHistory({ 
    userType, 
    enabled: !isSliderOpen 
  })

  // Fetch seller name list for vendor dropdown (admin only)
  const { data: sellerNameList = [], isLoading: isLoadingSellerNames } = useSellerNameListQuery(
    userType === 'admin' && !isSliderOpen
  )
  
  const tableContainerRef = useRef<HTMLDivElement | null>(null)

  // Status cards configuration
  const statusCards: StatusCardConfig[] = useMemo(() => [
    {
      title: "New Order",
      value: summary.new_order.toLocaleString("en-IN"),
      iconSrc: "/images/svg/tabler_clock-filled.svg",
      iconAlt: "New Order",
      status: "new"
    },
    {
      title: "MFG QC Pending",
      value: summary.mfg_qc_pending.toLocaleString("en-IN"),
      iconSrc: "/images/svg/material-symbols_timelapse-rounded.svg",
      iconAlt: "MFG QC Pending",
      status: "mfg_qc"
    },
    {
      title: "PKG QC Pending",
      value: (summary.pkg_qc_pending || 0).toLocaleString("en-IN"),
      iconSrc: "/images/svg/tabler_clock-filled.svg",
      iconAlt: "PKG QC Pending",
      status: "pkg_qc"
    },
    {
      title: "QC Rejected",
      value: summary.qc_rejected.toLocaleString("en-IN"),
      iconSrc: "/images/svg/material-symbols_cancel-rounded.svg",
      iconAlt: "QC Rejected",
      status: "qc_rejected"
    },
    {
      title: "Ready to Ship",
      value: summary.ready_to_ship.toLocaleString("en-IN"),
      iconSrc: "/images/svg/solar_delivery-bold.svg",
      iconAlt: "Ready to Ship",
      status: "ready_to_ship"
    },
    {
      title: "Pickup Schedule",
      value: summary.pickup_today.toLocaleString("en-IN"),
      iconSrc: "/images/svg/material-symbols_delivery-truck-speed-rounded (1).svg",
      iconAlt: "Pickup Schedule",
      status: "pickups_today"
    },
  ], [summary])

  // Handlers
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsSliderOpen(true)
    onSliderStateChange?.(true)
    // Note: We don't update URL for slider view, only for full page view
  }

  const handleCloseSlider = () => {
    setIsSliderOpen(false)
    setSelectedOrder(null)
    onSliderStateChange?.(false)
  }

  const handleViewFullPage = useCallback(() => {
    if (selectedOrder) {
      setIsSliderOpen(false)
      onSliderStateChange?.(false)
      // Navigate to order detail page using file-based routing
      onViewOrderDetail?.(selectedOrder.id)
    }
  }, [selectedOrder, onSliderStateChange, onViewOrderDetail])

  // Removed handleRefresh - mutations auto-invalidate, no manual refresh needed

  // Column definitions for New Orders table
  const newOrdersColumns = useMemo(() => [
    {
      id: 'orderId',
      header: 'Order ID',
      cell: (order: Order) => (
        <div className="flex flex-col">
          <span className="text-neutral-800 body-3 font-urbanist">{order.name}</span>
          {order.order_line && order.order_line.length > 1 && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md border bg-[#FFF4CC] text-[#E59213] border-[#FBE1B2] mt-1">
              Multiple Items
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'products',
      header: 'Products',
      cell: (order: Order) => (
        <div className="truncate max-w-[250px]" title={getProductNames(order)}>
          {getProductNames(order)}
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: (order: Order) => (
        <div className="flex flex-col">
          <span className="text-neutral-800 body-3 font-urbanist">
            {order.customer_name === "NA" ? <span className="text-neutral-500 italic">-</span> : order.customer_name}
          </span>
          {userType === 'admin' && (
            <span className="text-sm text-neutral-500 body-3 font-urbanist">
              {order.customer_mobile === "NA" ? <span className="italic">-</span> : order.customer_mobile}
            </span>
          )}
        </div>
      ),
    },
    ...(userType === 'admin' ? [{
      id: 'seller',
      header: 'Seller Name',
      cell: (order: Order) => (
        <span className="text-neutral-800 body-3 font-urbanist">{getSellerNames(order)}</span>
      ),
    }] : []),
    {
      id: 'date',
      header: 'Date',
      cell: (order: Order) => (
        <span className="text-neutral-800 body-3 font-urbanist whitespace-nowrap">{formatDate(order.date)}</span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right' as const,
      cell: (order: Order) => (
        <span className="font-semibold text-gray-600 body-2 font-urbanist">{formatIndianCurrency(order.total_amount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center' as const,
      cell: () => (
        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border" style={{ backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }}>
          New
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'center' as const,
      cell: (order: Order) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleViewOrder(order); }}
          className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
          title="View Order Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ], [userType, getProductNames, getSellerNames, formatDate, handleViewOrder])

  // Column definitions for All Orders table
  const allOrdersColumns = useMemo(() => [
    {
      id: 'orderId',
      header: 'Order ID',
      cell: (order: Order) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">{order.name}</span>
          {order.order_line && order.order_line.length > 1 && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md border bg-[#FFF4CC] text-[#E59213] border-[#FBE1B2] mt-1">
              Multiple Items
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'products',
      header: 'Products',
      cell: (order: Order) => (
        <div className="truncate max-w-[250px]" title={getProductNames(order)}>
          {getProductNames(order)}
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: (order: Order) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">
            {order.customer_name === "NA" ? <span className="text-neutral-500 italic">-</span> : order.customer_name}
          </span>
          {userType === 'admin' && (
            <span className="text-sm text-gray-500 body-3 font-urbanist">
              {order.customer_mobile === "NA" ? <span className="italic">-</span> : order.customer_mobile}
            </span>
          )}
        </div>
      ),
    },
    ...(userType === 'admin' ? [{
      id: 'seller',
      header: 'Seller Name',
      cell: (order: Order) => (
        <span className="text-neutral-700 body-3 font-urbanist">{getSellerNames(order)}</span>
      ),
    }] : []),
    {
      id: 'date',
      header: 'Date',
      cell: (order: Order) => (
        <span className="text-neutral-800 body-3 font-urbanist whitespace-nowrap">{formatDate(order.date)}</span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right' as const,
      cell: (order: Order) => (
        <span className="font-semibold text-neutral-800 body-2 font-urbanist">{formatIndianCurrency(order.total_amount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center' as const,
      cell: (order: Order) => (
        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]">
          {order.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'center' as const,
      cell: (order: Order) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleViewOrder(order); }}
          className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
          title="View Order Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ], [userType, getProductNames, getSellerNames, formatDate, handleViewOrder])

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50">
  //       <LoadingSpinner />
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Order History" />
      
      {/* Summary Cards */}
      <div className="py-6 px-4">
        <div className="border border-b-0 border-gray-200 rounded-t-lg p-4 bg-white">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 label-1 font-urbanist">Order Summary</span>
            {/* <Info className="h-4 w-4 text-gray-400" /> */}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-0">
          {statusCards.map((card, index) => {
            const isFirst = index === 0
            const isLast = index === statusCards.length - 1
            return (
              <Card
                key={card.title}
                className={`bg-white border border-gray-200 shadow-sm ${
                  isFirst ? "rounded-l-lg rounded-r-none rounded-t-none" :
                  isLast ? "rounded-r-lg rounded-l-none rounded-t-none border-l-0" :
                  "rounded-none rounded-t-none border-l-0"
                }`}
              >
                <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
                  <div className="mb-2 px-5">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-gray-800 body-3 font-urbanist">{card.title}</h3>
                      {/* <Info className="h-4 w-4 text-gray-400" /> */}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4 pl-5 mt-[13px]">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 font-spectral">{card.value}</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                      <img src={card.iconSrc} alt={card.iconAlt} className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* New Orders Today Table */}
      <div className="px-4 pb-6">
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-[16px] border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900 label-1 font-urbanist">New Orders</h2>
              </div>
              <div className="relative w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={newOrdersSearchTerm}
                  onChange={(e) => setNewOrdersSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  ⌘/
                </div>
              </div>
            </div>

            <DataTable<Order>
              items={newOrdersPagination.paginatedOrders}
              columns={newOrdersColumns}
              getRowKey={(order) => String(order.id)}
              pagination={newOrdersPagination as any}
              totalItems={newOrdersTotalRecordCount}
              isLoading={newOrdersLoading && newOrdersPagination.paginatedOrders.length === 0}
              isFetching={newOrdersFetching && newOrdersPagination.paginatedOrders.length > 0}
              error={error}
              searchTerm={newOrdersSearchTerm}
              onClearSearch={() => setNewOrdersSearchTerm('')}
              emptyTitle="No new orders found"
              emptyDescription={newOrdersSearchTerm ? `No results found for "${newOrdersSearchTerm}".` : "No new orders available at the moment."}
              withCard={false}
              className=""
              tableClassName="w-full"
              headerClassName="bg-gray-50 border-b border-gray-200"
              bodyClassName="bg-white"
              showPagination={newOrdersPagination.displayOrders.length > 0}
            />
          </CardContent>
        </Card>
      </div>

      {/* All Orders Table */}
      <div ref={tableContainerRef} className="px-4 pb-10">
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-[16px] border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900 label-1 font-urbanist">All Orders</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { value: '', label: 'All' },
                    { value: 'new', label: 'New' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'done', label: 'Done' }
                  ].map((tab) => (
                    <button
                      key={tab.value || 'all'}
                      onClick={() => {
                        setStatusFilter(tab.value)
                        allOrdersPagination.setCurrentPage(1)
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
                {(allOrdersLoading || allOrdersFetching) && (
                  <div className="flex items-center text-secondary-900">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
                    <span className="text-body-4 font-urbanist">{allOrdersLoading ? 'Loading...' : 'Updating...'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar and Vendor Filter */}
            {userType === 'admin' && (
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
                  <div className="w-full sm:w-[240px]">
                    <Select 
                      value={vendorFilter || 'all'} 
                      onValueChange={(value) => {
                        setVendorFilter(value === 'all' ? '' : value)
                        allOrdersPagination.setCurrentPage(1)
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
            )}

            {userType === 'seller' && (
              <div className="p-[8px] border-b border-gray-200">
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
              </div>
            )}

            <DataTable<Order>
              items={allOrdersPagination.paginatedOrders}
              columns={allOrdersColumns}
              getRowKey={(order) => String(order.id)}
              pagination={allOrdersPagination as any}
              totalItems={totalRecordCount}
              isLoading={allOrdersLoading && !orders.length}
              isFetching={allOrdersFetching && orders.length > 0}
              error={error}
              onRetry={() => {
                // Retry logic if needed - TanStack Query handles refetch automatically
              }}
              searchTerm={searchTerm}
              onClearSearch={() => setSearchTerm('')}
              emptyTitle="No orders found"
              emptyDescription={searchTerm ? `No results found for "${searchTerm}".` : "No orders available at the moment."}
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

      {/* Order Details Slider - Different for seller and admin */}
      {userType === 'admin' ? (
        <SeeOrderSliderAdmin
          isOpen={isSliderOpen}
          onClose={handleCloseSlider}
          order={selectedOrder}
          onSliderStateChange={onSliderStateChange}
          onViewFullPage={handleViewFullPage}
        />
      ) : (
        <SeeOrderSliderSeller
          isOpen={isSliderOpen}
          onClose={handleCloseSlider}
          order={selectedOrder}
          onSliderStateChange={onSliderStateChange}
          onViewFullPage={handleViewFullPage}
        />
      )}
    </div>
  )
}

// Export both named and aliased versions for compatibility
export { OrderHistoryTable as OrderHistoryTableAdmin }
export default OrderHistoryTable

