import { get } from "@/lib/api/client"
import { TimePeriod } from "@/components/shared"
import { SalesRow } from "../types/sales-details.types"

// Pagination Types
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

// API Response Types
export interface OrderDetailRecord {
  id: number
  order_id: number
  date: string
  customer_name: string
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  gross_amount: number
  tax_amount: number
  commission: number
  vendor_id: number
  vendor_name: string
  net_payable: number
  customer_mobile: string
  vendor_mobile: string
}

export interface SupplierCustomerOrderDetailsResponse {
  message: string
  errors: string[]
  count: number
  record: OrderDetailRecord[]
  status_code: number
  total_record_count?: number
  record_total_count?: number
}

export interface DetailedSaleOrderReportResponse {
  message: string
  errors: string[]
  url: string
  status_code: number
}

// Helper function to calculate date range based on time period
export function getDateRange(
  period: TimePeriod,
  customDates?: { startDate: string; endDate: string }
): { startDate: string; endDate: string } {
  const today = new Date()
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  if (period === "custom" && customDates) {
    return customDates
  }

  const endDate = formatDate(today)
  let startDate: string

  switch (period) {
    case "today":
      startDate = endDate
      break
    case "week":
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      startDate = formatDate(weekAgo)
      break
    case "month":
      const monthAgo = new Date(today)
      monthAgo.setMonth(today.getMonth() - 1)
      startDate = formatDate(monthAgo)
      break
    default:
      startDate = endDate
  }

  return { startDate, endDate }
}

// Helper function to format currency
export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`
}

// API Service function to fetch sales details
// Supports server-side pagination with page and limit params
export async function fetchSalesDetails(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  pagination?: PaginationParams
): Promise<{ data: SalesRow[]; error: string | null; totalRecordCount?: number }> {
  try {
    const { startDate, endDate } = getDateRange(timePeriod, customDates)

    const params: Record<string, string | number> = {
      start_date: startDate,
      end_date: endDate,
    }
    
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search

    const response = await get<SupplierCustomerOrderDetailsResponse>(
      "/supplier_customer_order_details",
      params
    )

    if (response.status_code === 200 && response.record) {
      // Map API response to SalesRow format
      const mappedData: SalesRow[] = response.record.map((record) => ({
        orderId: `IDO${String(record.order_id).padStart(2, "0")}`,
        date: `${record.date} 00:00:00`, // Add time component for display
        customerName: record.customer_name,
        customerPhone: record.customer_mobile,
        supplierName: record.vendor_name,
        supplierPhone: record.vendor_mobile,
        item: record.product_name,
        qty: record.quantity,
        itemPrice: record.unit_price,
        grossAmount: record.gross_amount,
        taxes: record.tax_amount,
        commission: record.commission,
        netPayable: record.net_payable,
      }))
      return { 
        data: mappedData, 
        error: null,
        totalRecordCount: response.record_total_count ?? response.total_record_count ?? response.count ?? mappedData.length
      }
    } else {
      return { data: [], error: response.message || "Failed to fetch sales details" }
    }
  } catch (err: any) {
    console.error("Error fetching sales details:", err)
    return { data: [], error: err.message || "Failed to fetch sales details data" }
  }
}

// API Service function to export sales report to Excel
export async function exportSalesReportToExcel(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string }
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { startDate, endDate } = getDateRange(timePeriod, customDates)

    const response = await get<DetailedSaleOrderReportResponse>(
      "/detailed_sale_order_reports",
      {
        start_date: startDate,
        end_date: endDate,
      }
    )

    if (response.status_code === 200 && response.url) {
      return { url: response.url, error: null }
    } else {
      return { url: null, error: response.message || "Failed to generate Excel report" }
    }
  } catch (err: any) {
    console.error("Error exporting Excel:", err)
    return { url: null, error: err.message || "Failed to export Excel report" }
  }
}

// Helper function to trigger file download
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.target = "_blank"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

