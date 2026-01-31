"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { TimePicker, TimePeriod } from "@/components/shared"
import { PayoutRow, PayoutKPI } from "../types/supplier-payout.types"
import {
  useSupplierPayoutOverviewQuery,
  useCommissionDetailsQuery,
} from "../hooks/use-payout-query"
import {
  formatCurrency,
  getStatusTone,
  getDefaultPayoutKPICards,
} from "../services/supplier-payout.service"
import { useSellerNameListQuery } from "@/components/features/orders/hooks/use-orders-query"

const SupplierPayout: React.FC = () => {
  // Load saved time period from localStorage or default to "month"
  const getSavedTimePeriod = (): TimePeriod => {
    if (typeof window === "undefined") return "month"
    const saved = localStorage.getItem("supplierPayout_timePeriod")
    return (saved as TimePeriod) || "month"
  }

  const getSavedCustomDates = (): { startDate: string; endDate: string } | undefined => {
    if (typeof window === "undefined") return undefined
    const saved = localStorage.getItem("supplierPayout_customDates")
    return saved ? JSON.parse(saved) : undefined
  }

  // Read initial state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        searchTerm: '',
        selectedSupplier: 'All Suppliers',
        selectedStatus: 'All Status',
        currentPage: 1,
        itemsPerPage: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      searchTerm: urlParams.get('payoutSearch') || '',
      selectedSupplier: urlParams.get('payoutSupplier') || 'All Suppliers',
      selectedStatus: urlParams.get('payoutStatus') || 'All Status',
      currentPage: parseInt(urlParams.get('payoutPage') || '1', 10),
      itemsPerPage: parseInt(urlParams.get('payoutItemsPerPage') || '10', 10),
    }
  }, [])

  const urlParams = getUrlParams()

  const [timePeriod, setTimePeriod] = useState<TimePeriod>(getSavedTimePeriod())
  const [customDates, setCustomDates] = useState<{ startDate: string; endDate: string } | undefined>(getSavedCustomDates())
  const [selectedSupplier, setSelectedSupplier] = useState<string>(urlParams.selectedSupplier)
  const [selectedStatus, setSelectedStatus] = useState<string>(urlParams.selectedStatus)
  const [searchTerm, setSearchTerm] = useState<string>(urlParams.searchTerm)
  
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(urlParams.currentPage)
  const [itemsPerPage, setItemsPerPage] = useState(urlParams.itemsPerPage)

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Fetch seller name list for supplier dropdown (admin only) - this provides the complete list of suppliers
  // and never changes based on filtered data
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("user_type") === "admin"
  const { data: sellerNameList = [] } = useSellerNameListQuery(isAdmin)

  // Determine vendor_id for API call (only for admin users)
  // Find the vendor_id from sellerNameList based on selected supplier name
  const vendorId = useMemo(() => {
    if (selectedSupplier !== "All Suppliers" && isAdmin) {
      const seller = sellerNameList.find(item => item.name === selectedSupplier)
      return seller?.id
    }
    return undefined
  }, [selectedSupplier, sellerNameList, isAdmin])

  // Server-side pagination params with debounced search
  const paginationParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
  }), [currentPage, itemsPerPage, debouncedSearch])

  // Use TanStack Query hooks for data fetching with caching and pagination
  const { data: payoutKpis = [], isLoading, error: queryError } = useSupplierPayoutOverviewQuery(timePeriod, customDates)
  const { data: commissionResponse, isLoading: isTableLoading, isFetching, error: tableQueryError } = useCommissionDetailsQuery(
    timePeriod, 
    customDates, 
    vendorId,
    true,
    paginationParams
  )
  
  // Extract data from response
  const allPayoutRows = commissionResponse?.data ?? []
  const totalRecordCount = commissionResponse?.totalRecordCount ?? 0
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch supplier payout overview") : null
  const tableError = tableQueryError ? (tableQueryError instanceof Error ? tableQueryError.message : "Failed to fetch commission details") : null

  // Get supplier list from sellerNameList query (complete list, never filtered)
  // This ensures the dropdown always shows all suppliers regardless of current filter/pagination
  const uniqueSuppliers = useMemo(() => {
    if (!isAdmin || sellerNameList.length === 0) return []
    return sellerNameList.map(item => item.name).sort()
  }, [sellerNameList, isAdmin])

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>()
    allPayoutRows.forEach((row) => {
      if (row.status) {
        statuses.add(row.status)
      }
    })
    return Array.from(statuses).sort()
  }, [allPayoutRows])

  // Client-side filtering for status (supplier filtering is already server-side via vendorId)
  const filteredRows = useMemo(() => {
    let filtered = [...allPayoutRows]

    if (selectedStatus !== "All Status") {
      filtered = filtered.filter((row) => row.status === selectedStatus)
    }

    return filtered
  }, [allPayoutRows, selectedStatus])

  // Update URL parameters when filters or pagination change
  const updateUrlParams = useCallback((updates: {
    searchTerm?: string
    selectedSupplier?: string
    selectedStatus?: string
    currentPage?: number
    itemsPerPage?: number
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    // Only update URL params if we're on the payouts-and-reports page (file-based route)
    const pathname = window.location.pathname
    const isPayoutsPage = pathname.includes('/payouts-and-reports')
    if (!isPayoutsPage) return
    
    if (updates.searchTerm !== undefined) {
      if (updates.searchTerm) {
        url.searchParams.set('payoutSearch', updates.searchTerm)
      } else {
        url.searchParams.delete('payoutSearch')
      }
    }
    
    if (updates.selectedSupplier !== undefined) {
      if (updates.selectedSupplier && updates.selectedSupplier !== 'All Suppliers') {
        url.searchParams.set('payoutSupplier', updates.selectedSupplier)
      } else {
        url.searchParams.delete('payoutSupplier')
      }
    }
    
    if (updates.selectedStatus !== undefined) {
      if (updates.selectedStatus && updates.selectedStatus !== 'All Status') {
        url.searchParams.set('payoutStatus', updates.selectedStatus)
      } else {
        url.searchParams.delete('payoutStatus')
      }
    }
    
    if (updates.currentPage !== undefined) {
      if (updates.currentPage > 1) {
        url.searchParams.set('payoutPage', String(updates.currentPage))
      } else {
        url.searchParams.delete('payoutPage')
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set('payoutItemsPerPage', String(updates.itemsPerPage))
      } else {
        url.searchParams.delete('payoutItemsPerPage')
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Restore state from URL when URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      // Only restore if we're on the payouts-and-reports page
      const pathname = window.location.pathname
      const isPayoutsPage = pathname.includes('/payouts-and-reports')
      if (isPayoutsPage) {
        const params = getUrlParams()
        // Always set from URL - React will handle no-op if values are the same
        setSearchTerm(params.searchTerm)
        setSelectedSupplier(params.selectedSupplier)
        setSelectedStatus(params.selectedStatus)
        setCurrentPage(params.currentPage)
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
      selectedSupplier,
      selectedStatus,
      currentPage,
      itemsPerPage,
    })
  }, [searchTerm, selectedSupplier, selectedStatus, currentPage, itemsPerPage, updateUrlParams])

  // Server-side pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalRecordCount / itemsPerPage))
  
  // Helper function to generate page numbers
  const getPageNumbers = (): Array<number | string> => {
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
  }

  // Items are already paginated from server, but we apply status filter client-side
  const paginated = filteredRows
  const shouldDisablePagination = totalPages <= 1

  const handlePeriodChange = (period: TimePeriod, customDatesParam?: { startDate: string; endDate: string }) => {
    setTimePeriod(period)
    if (period === "custom" && customDatesParam) {
      setCustomDates(customDatesParam)
      localStorage.setItem("supplierPayout_customDates", JSON.stringify(customDatesParam))
    } else {
      setCustomDates(undefined)
      localStorage.removeItem("supplierPayout_customDates")
    }
    localStorage.setItem("supplierPayout_timePeriod", period)
    // Reset to page 1 when period changes
    setCurrentPage(1)
  }
  
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1) // Reset to page 1 when changing items per page
    updateUrlParams({ itemsPerPage: value, currentPage: 1 })
  }

  const handleSupplierChange = (supplier: string) => {
    setSelectedSupplier(supplier)
    setCurrentPage(1) // Reset to page 1 when supplier changes
    updateUrlParams({ selectedSupplier: supplier, currentPage: 1 })
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    setCurrentPage(1) // Reset to page 1 when status changes
    updateUrlParams({ selectedStatus: status, currentPage: 1 })
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      updateUrlParams({ currentPage: page })
    }
  }

  const handlePreviousPage = () => {
    const newPage = Math.max(1, currentPage - 1)
    setCurrentPage(newPage)
    updateUrlParams({ currentPage: newPage })
  }

  const handleNextPage = () => {
    const newPage = Math.min(totalPages, currentPage + 1)
    setCurrentPage(newPage)
    updateUrlParams({ currentPage: newPage })
  }

  // Default KPI card structure (for loading state)
  const defaultKpiCards = getDefaultPayoutKPICards()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TimePicker 
          selectedPeriod={timePeriod}
          onPeriodChange={handlePeriodChange}
          isLoading={isLoading || isFetching}
          className="items-end mt-6"
        />
      </div>
      
      {error ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {(isLoading ? defaultKpiCards : payoutKpis).map((kpi) => (
            <Card key={kpi.title} className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-800">{kpi.title}</div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-32 bg-gray-200" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900 font-spectral">{(kpi as PayoutKPI).value}</div>
                )}
                <div className="text-xs text-gray-500">{kpi.subtitle}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-[16px] border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-gray-900">Eligible Payouts</div>
              {/* <Info className="h-4 w-4 text-gray-400" /> */}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {typeof window !== "undefined" && localStorage.getItem("user_type") === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm hover:bg-gray-50">
                    {selectedSupplier}
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => handleSupplierChange("All Suppliers")}
                      className={cn(
                        selectedSupplier === "All Suppliers" 
                          ? "!bg-secondary-900 !text-white hover:!bg-secondary-900 focus:!bg-secondary-900" 
                          : ""
                      )}
                    >
                      All Suppliers
                    </DropdownMenuItem>
                    {uniqueSuppliers.map((supplier) => (
                      <DropdownMenuItem
                        key={supplier}
                        onClick={() => handleSupplierChange(supplier)}
                        className={cn(
                          selectedSupplier === supplier 
                            ? "!bg-secondary-900 !text-white hover:!bg-secondary-900 focus:!bg-secondary-900" 
                            : ""
                        )}
                      >
                        {supplier}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm hover:bg-gray-50">
                  {selectedStatus}
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("All Status")}
                    className={cn(
                      selectedStatus === "All Status" 
                        ? "!bg-secondary-900 !text-white hover:!bg-secondary-900 focus:!bg-secondary-900" 
                        : ""
                    )}
                  >
                    All Status
                  </DropdownMenuItem>
                  {uniqueStatuses.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={cn(
                        selectedStatus === status 
                          ? "!bg-secondary-900 !text-white hover:!bg-secondary-900 focus:!bg-secondary-900" 
                          : ""
                      )}
                    >
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-gray-50 border-b border-gray-200">
                <TableRow>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Order ID</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Date</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Customer</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Supplier</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Items</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">qty</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Item Price</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Gross Amount (₹)</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Taxes</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Commission (₹)</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Net Payable (₹)</TableHead>
                  <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  // Skeleton loaders for table rows
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="hover:bg-gray-50">
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-16 bg-gray-200" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-20 bg-gray-200" />
                        <Skeleton className="h-3 w-16 bg-gray-200 mt-1" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-24 bg-gray-200" />
                        <Skeleton className="h-3 w-20 bg-gray-200 mt-1" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-24 bg-gray-200" />
                        <Skeleton className="h-3 w-20 bg-gray-200 mt-1" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-32 bg-gray-200" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-8 bg-gray-200" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-20 bg-gray-200" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-24 bg-gray-200" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-16 bg-gray-200" />
                        <Skeleton className="h-3 w-12 bg-gray-200 mt-1" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-20 bg-gray-200" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-24 bg-gray-200" />
                      </TableCell>
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-6 w-20 bg-gray-200 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : tableError ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="text-red-600 text-sm">{tableError}</div>
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="text-gray-500 text-sm">No payout data available</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((row, idx) => {
                    const tone = getStatusTone(row.status)
                    return (
                      <TableRow key={`${row.orderId}-${idx}`} className="hover:bg-gray-50">
                        <TableCell className="align-top px-[20px] py-3">
                          <div className="font-semibold text-gray-900">{row.orderId}</div>
                        </TableCell>
                        <TableCell className="align-top px-[20px] py-3">
                          <div className="text-sm text-gray-700">{row.date.split(" ")[0]}</div>
                        </TableCell>
                        <TableCell className="align-top px-[20px] py-3">
                          <div className="text-sm font-semibold text-gray-900">{row.customerName}</div>
                          {row.customerPhone && localStorage.getItem("user_type") === "admin" && (
                            <div className="text-xs text-gray-500">{row.customerPhone}</div>
                          )}
                        </TableCell>
                        <TableCell className="align-top px-[20px] py-3">
                          <div className="text-sm font-semibold text-gray-900">{row.supplierName}</div>
                          {row.supplierPhone && localStorage.getItem("user_type") === "admin" && (
                            <div className="text-xs text-gray-500">{row.supplierPhone}</div>
                          )}
                        </TableCell>
                        <TableCell className="align-top px-[20px] py-3 text-sm text-gray-800">{row.item}</TableCell>
                        <TableCell className="align-top px-[20px] py-3 text-sm text-gray-800">{row.qty}</TableCell>
                        <TableCell className="align-top px-[20px] py-3 text-sm text-gray-800">{formatCurrency(row.itemPrice)}</TableCell>
                        <TableCell className="align-top px-[20px] py-3 text-sm text-gray-800">{formatCurrency(row.grossAmount)}</TableCell>
                        <TableCell className="align-top px-[20px] py-3">
                          <div className="text-sm text-gray-800">{formatCurrency(row.taxes)}</div>
                        </TableCell>
                        <TableCell className="align-top px-[20px] py-3 text-sm text-gray-800">{formatCurrency(row.commission)}</TableCell>
                        <TableCell className="align-top px-[20px] py-3 text-sm text-gray-800">{formatCurrency(row.netPayable)}</TableCell>
                        <TableCell className="align-top px-[20px] py-3">
                          <span
                            className={cn(
                              "inline-flex px-3 py-1 text-xs font-medium rounded-md border",
                              tone.bg,
                              tone.text,
                              tone.border
                            )}
                          >
                            {row.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Row Per Page</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 border border-gray-200 rounded-md px-2 py-1 text-sm bg-white shadow-sm hover:bg-gray-50">
                  {itemsPerPage}
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[80px]">
                  {[10, 25, 50, 100].map((value) => {
                    // Disable options that are greater than totalRecordCount (except the first option)
                    const isDisabled = totalRecordCount < value && value !== 10
                    return (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => !isDisabled && handleItemsPerPageChange(value)}
                        disabled={isDisabled}
                        className={cn(
                          itemsPerPage === value 
                            ? "!bg-secondary-900 !text-white hover:!bg-secondary-900 focus:!bg-secondary-900" 
                            : "",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {value}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <span>Entries</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePreviousPage}
                disabled={shouldDisablePagination || currentPage === 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={`${page}-${idx}`} className="px-2 text-sm text-gray-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`${page}-${idx}`}
                      onClick={() => handlePageChange(page as number)}
                      disabled={shouldDisablePagination}
                      className={cn(
                        "w-8 h-8 text-sm rounded-full border flex items-center justify-center",
                        currentPage === page
                          ? "bg-secondary-900 text-white"
                          : "text-gray-700 hover:bg-gray-200 border-gray-200 bg-white",
                        shouldDisablePagination && "disabled:opacity-50"
                      )}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={handleNextPage}
                disabled={shouldDisablePagination || currentPage === totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SupplierPayout
