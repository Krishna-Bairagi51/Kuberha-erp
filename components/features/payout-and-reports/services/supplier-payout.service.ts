import { get } from "@/lib/api/client"
import { TimePeriod } from "@/components/shared"
import { PayoutRow, PayoutKPI, StatusTone } from "../types/supplier-payout.types"
import { formatIndianCurrency, formatIndianNumberWithUnits } from "@/lib/api/helpers/number"

// Pagination Types
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

// API Response Types
export interface SupplierPayoutResponse {
  message: string
  errors: string[]
  gross_sales: number
  total_gst: number
  casa_carigar_commission: number
  gst_commission: number
  status_code: number
}

export interface CommissionDetailRecord {
  id: number
  order_id: number
  date: string
  customer_name: string
  customer_mobile: string
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  gross_amount: number
  tax_amount: number
  commission: number
  vendor_id: number
  vendor_name: string
  vendor_mobile: string
  net_payable: number
  payment_status: string
}

export interface SupplierCommissionDetailsResponse {
  message: string
  errors: string[]
  count: number
  record: CommissionDetailRecord[]
  status_code: number
  total_record_count?: number
  record_total_count?: number
}


// Helper function to format currency (optimized version using centralized function)
export function formatCurrency(value: number): string {
  return formatIndianCurrency(value)
}

// Helper function to get status tone based on payment status
export function getStatusTone(status: string): StatusTone {
  const statusLower = status.toLowerCase()
  if (statusLower === "paid") {
    return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
  } else if (statusLower === "unpaid") {
    return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" }
  } else if (statusLower.includes("past") || statusLower.includes("due")) {
    return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
  } else {
    // Default tone for any other status
    return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }
  }
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

// API Service function to fetch supplier payout overview KPIs
export async function fetchSupplierPayoutOverview(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string }
): Promise<{ kpis: PayoutKPI[]; error: string | null }> {
  try {
    const { startDate, endDate } = getDateRange(timePeriod, customDates)

    const response = await get<SupplierPayoutResponse>("/supplier_payout_overview_info", {
      start_date: startDate,
      end_date: endDate,
    })

    if (response.status_code === 200) {
      // Map API response to KPI cards
      const kpis: PayoutKPI[] = [
        {
          title: "Gross Payout",
          value: formatIndianNumberWithUnits(response.gross_sales),
          subtitle: "Total amount to get",
        },
        {
          title: "Casacarigar Commission",
          value: formatIndianNumberWithUnits(response.casa_carigar_commission),
          subtitle: "Your 30% (excl. GST)",
        },
        {
          title: "GST on Commission",
          value: formatIndianNumberWithUnits(response.gst_commission),
          subtitle: "GST on your final payout",
        },
        {
          title: "GST on Payout",
          value: formatIndianNumberWithUnits(response.total_gst),
          subtitle: "GST on your final payout",
        },
      ]
      return { kpis, error: null }
    } else {
      return { kpis: [], error: response.message || "Failed to fetch supplier payout overview" }
    }
  } catch (err: any) {
    console.error("Error fetching supplier payout overview:", err)
    return { kpis: [], error: err.message || "Failed to fetch supplier payout overview data" }
  }
}

// API Service function to fetch commission details table data
// Supports server-side pagination with page and limit params
export async function fetchCommissionDetails(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  vendorId?: number,
  pagination?: PaginationParams
): Promise<{ data: PayoutRow[]; error: string | null; totalRecordCount?: number }> {
  try {
    const { startDate, endDate } = getDateRange(timePeriod, customDates)

    // Build API params
    const params: Record<string, string | number> = {
      start_date: startDate,
      end_date: endDate,
    }

    // Add vendor_id if provided
    if (vendorId) {
      params.vendor_id = vendorId
    }
    
    // Add pagination params if provided
    if (pagination?.page) params.page = pagination.page
    if (pagination?.limit) params.limit = pagination.limit
    if (pagination?.search) params.search = pagination.search

    const response = await get<SupplierCommissionDetailsResponse>(
      "/supplier_commission_details",
      params
    )

    if (response.status_code === 200 && response.record) {
      // Map API response to PayoutRow format
      const mappedData: PayoutRow[] = response.record.map((record) => ({
        orderId: `IDO${String(record.order_id).padStart(2, "0")}`,
        date: `${record.date} 00:00:00`, // Add time component for display
        customerName: record.customer_name,
        customerPhone: record.customer_mobile || "",
        supplierName: record.vendor_name,
        supplierPhone: record.vendor_mobile || "",
        item: record.product_name,
        qty: record.quantity,
        itemPrice: record.unit_price,
        grossAmount: record.gross_amount,
        taxes: record.tax_amount,
        commission: record.commission,
        netPayable: record.net_payable,
        status: record.payment_status,
      }))
      return { 
        data: mappedData, 
        error: null,
        totalRecordCount: response.record_total_count ?? response.total_record_count ?? response.count ?? mappedData.length
      }
    } else {
      return { data: [], error: response.message || "Failed to fetch commission details" }
    }
  } catch (err: any) {
    console.error("Error fetching commission details:", err)
    return { data: [], error: err.message || "Failed to fetch commission details data" }
  }
}

// Default KPI card structure (for loading state)
export function getDefaultPayoutKPICards(): Array<{ title: string; subtitle: string }> {
  return [
    { title: "Gross Payout", subtitle: "Total amount to get" },
    { title: "Casacarigar Commission", subtitle: "Your 30% (excl. GST)" },
    { title: "GST on Commission", subtitle: "GST on your final payout" },
    { title: "GST on Payout", subtitle: "GST on your final payout" },
  ]
}

