"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, ChevronDown, FileDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TimePicker, TimePeriod } from "@/components/shared"
import { Skeleton } from "@/components/ui/skeleton"
import { SalesRow } from "../types/sales-details.types"
import { useSalesDetailsQuery, useExportSalesReportQuery } from "../hooks/use-payout-query"
import {
  exportSalesReportToExcel,
  downloadFile,
  formatCurrency,
  getDateRange,
} from "../services/sales-details.service"
import { toast } from "sonner"

export const SalesDetailsTable: React.FC = () => {
  // Load saved time period from localStorage or default to "month"
  const getSavedTimePeriod = (): TimePeriod => {
    if (typeof window === "undefined") return "month"
    const saved = localStorage.getItem("salesDetails_timePeriod")
    return (saved as TimePeriod) || "month"
  }

  const getSavedCustomDates = (): { startDate: string; endDate: string } | undefined => {
    if (typeof window === "undefined") return undefined
    const saved = localStorage.getItem("salesDetails_customDates")
    return saved ? JSON.parse(saved) : undefined
  }

  const [timePeriod, setTimePeriod] = useState<TimePeriod>(getSavedTimePeriod())
  const [customDates, setCustomDates] = useState<{ startDate: string; endDate: string } | undefined>(getSavedCustomDates())
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Server-side pagination params
  const paginationParams = React.useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
  }), [currentPage, itemsPerPage])

  // Use TanStack Query hook for data fetching with caching and pagination
  const { data: salesResponse, isLoading, isFetching, error: queryError } = useSalesDetailsQuery(
    timePeriod, 
    customDates,
    true,
    paginationParams
  )
  
  // Extract data from response
  const salesData = salesResponse?.data ?? []
  const totalRecordCount = salesResponse?.totalRecordCount ?? 0
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch sales details") : null

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

  // Items are already paginated from server, no need to slice
  const paginated = salesData
  const shouldDisablePagination = totalPages <= 1

  const handlePeriodChange = (period: TimePeriod, customDatesParam?: { startDate: string; endDate: string }) => {
    setTimePeriod(period)
    if (period === "custom" && customDatesParam) {
      setCustomDates(customDatesParam)
      localStorage.setItem("salesDetails_customDates", JSON.stringify(customDatesParam))
    } else {
      setCustomDates(undefined)
      localStorage.removeItem("salesDetails_customDates")
    }
    localStorage.setItem("salesDetails_timePeriod", period)
    // Reset to page 1 when period changes
    setCurrentPage(1)
  }
  
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1) // Reset to page 1 when changing items per page
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    
    try {
      const result = await exportSalesReportToExcel(timePeriod, customDates)
      
      if (result.error) {
        toast.error(result.error)
      } else if (result.url) {
        const { startDate, endDate } = getDateRange(timePeriod, customDates)
        downloadFile(result.url, `sales_report_${startDate}_${endDate}.xlsx`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export report")
    } finally {
      setIsExporting(false)
    }
  }

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
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-[16px] border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">All sales</h2>
              {/* <Info className="h-4 w-4 text-gray-400" /> */}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* <TimePeriodDropdown
                selectedPeriod={timePeriod}
                onPeriodChange={(period, customDates) => {
                  setTimePeriod(period)
                  if (period === "custom" && customDates) {
                    setCustomLabel(`${customDates.startDate} - ${customDates.endDate}`)
                  } else {
                    setCustomLabel(null)
                  }
                }}
                className=""
              />
              {customLabel && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span>{customLabel}</span>
                </div>
              )} */}
              <Button 
                variant="secondary" 
                className="gap-2 rounded-xl px-4 shadow-sm"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {isExporting ? "Exporting..." : "Export in Excel format"}
              </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Skeleton loaders for table rows
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="hover:bg-gray-50">
                      <TableCell className="align-top px-[20px] py-3">
                        <Skeleton className="h-4 w-16 bg-gray-200" />
                        <Skeleton className="h-3 w-24 bg-gray-200 mt-1" />
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
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="text-red-600 text-sm">{error}</div>
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="text-gray-500 text-sm">No sales data available</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((row, index) => (
                  <TableRow key={`${row.orderId}-${index}`} className="hover:bg-gray-50">
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
                  </TableRow>
                  ))
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
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
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
                      onClick={() => setCurrentPage(page as number)}
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
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
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

export default SalesDetailsTable
