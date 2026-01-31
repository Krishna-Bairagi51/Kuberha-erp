import { get } from "@/lib/api/client"
import { TimePeriod } from "@/components/shared"
import {
  RevenueDataPoint,
  StatusBreakdown,
  TopCustomer,
  SellingItem,
  GSTSnapshot,
  UpcomingSettlement,
  Alert,
  KPICard,
} from "../types/sales-overview.types"
import { formatIndianCurrency, formatIndianNumberWithUnits } from "@/lib/api/helpers/number"

// API Response Types
export interface SalesOverviewResponse {
  message: string
  errors: string[]
  gross_sales: number
  total_gst: number
  casa_carigar_commission: number
  gst_commission: number
  status_code: number
}

export interface OrderStatusBreakdownResponse {
  message: string
  errors: string[]
  new_order_count: number
  pending_order_count: number
  done_order_count: number
  status_code: number
}

export interface TopCustomerRecord {
  customer_id: number
  customer_name: string
  total_gmv: number
  total_casa_commission: number
  net_payable: number
}

export interface TopCustomerSalesSummaryResponse {
  message: string
  errors: string[]
  record: TopCustomerRecord[]
  count: number
  status_code: number
}

export interface RevenueTrendRecord {
  period: string
  gross_sales: number
  total_gst: number
  casa_carigar_commission: number
  gst_commission: number
  supplier_payout: number
}

export interface RevenueTrendResponse {
  message: string
  errors: string[]
  result: RevenueTrendRecord[]
  status_code: number
}

export interface WhatsSellingRecord {
  product_id: number
  product_name: string
  total_units_sold: number
  total_sales: number
}

export interface WhatsSellingResponse {
  message: string
  errors: string[]
  record: WhatsSellingRecord[]
  status_code: number
}

export interface GSTSnapshotResponse {
  message: string
  errors: string[]
  gst_on_order: number
  gst_on_commission: number
  tentative_gst_liability: number
  status_code: number
}

export interface SettlementRecord {
  name: string
  date: string
  vendor_name: string
  amount: number
  status: string
}

export interface SettlementDashboardResponse {
  message: string
  errors: string[]
  record: SettlementRecord[]
  count: number
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

// API Service function to fetch sales overview KPI data
export async function fetchSalesOverview(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string }
): Promise<{ cards: KPICard[]; error: string | null }> {
  try {
    const { startDate, endDate } = getDateRange(timePeriod, customDates)

    const response = await get<SalesOverviewResponse>("/sales_overview_info", {
      start_date: startDate,
      end_date: endDate,
    })

    if (response.status_code === 200) {
      // Map API response to KPI cards
      const cards: KPICard[] = [
        {
          title: "Gross Sales(GMV)",
          value: formatIndianNumberWithUnits(response.gross_sales),
          subtitle: "Incl. GST & Shipping",
        },
        {
          title: "Casacarigar Commission",
          value: formatIndianNumberWithUnits(response.casa_carigar_commission),
          subtitle: "Your commission(not incl. GST)",
        },
        {
          title: "GST on Fee",
          value: formatIndianNumberWithUnits(response.gst_commission),
          subtitle: "GST on Commission",
        },
        {
          title: "GST Collected",
          value: formatIndianNumberWithUnits(response.total_gst),
          subtitle: "GST on Order & Commission",
        },
      ]
      return { cards, error: null }
    } else {
      return { cards: [], error: response.message || "Failed to fetch sales overview" }
    }
  } catch (err: any) {
    console.error("Error fetching sales overview:", err)
    return { cards: [], error: err.message || "Failed to fetch sales overview data" }
  }
}

// Helper function to convert date from YYYY-MM-DD to DD-MM-YYYY format
function convertDateFormat(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${day}-${month}-${year}`
}

// API Service function to fetch order status breakdown
export async function fetchOrderStatusBreakdown(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string }
): Promise<{ data: StatusBreakdown[]; error: string | null }> {
  try {
    const { startDate, endDate } = getDateRange(timePeriod, customDates)

    const response = await get<OrderStatusBreakdownResponse>(
      "/order_status_breakdown",
      {
        start_date: startDate,
        end_date: endDate,
      },
      {
        cookieSession: true,
      }
    )

    if (response.status_code === 200) {
      // Map API response to StatusBreakdown format
      const data: StatusBreakdown[] = [
        {
          name: "New Orders",
          value: response.new_order_count,
          color: "#FF8042",
        },
        {
          name: "In Progress",
          value: response.pending_order_count,
          color: "#0088FE",
        },
        {
          name: "Completed",
          value: response.done_order_count,
          color: "#00C49F",
        },
      ]
      return { data, error: null }
    } else {
      return { data: [], error: response.message || "Failed to fetch order status breakdown" }
    }
  } catch (err: any) {
    console.error("Error fetching order status breakdown:", err)
    return { data: [], error: err.message || "Failed to fetch order status breakdown data" }
  }
}

// API Service function to fetch top customers
export async function fetchTopCustomers(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string }
): Promise<{ data: TopCustomer[]; error: string | null }> {
  try {
    const { startDate, endDate } = getDateRange(timePeriod, customDates)

    const response = await get<TopCustomerSalesSummaryResponse>(
      "/top_customer_sales_summary",
      {
        start_date: startDate,
        end_date: endDate,
      },
      {
        cookieSession: true,
      }
    )

    if (response.status_code === 200) {
      // Map API response to TopCustomer format
      const data: TopCustomer[] = response.record.map((record) => ({
        name: record.customer_name,
        phone: "", // API doesn't provide phone number
        gmv: formatIndianCurrency(record.total_gmv),
        commission: formatIndianCurrency(record.total_casa_commission),
        payable: formatIndianCurrency(record.net_payable),
      }))
      return { data, error: null }
    } else {
      return { data: [], error: response.message || "Failed to fetch top customers" }
    }
  } catch (err: any) {
    console.error("Error fetching top customers:", err)
    return { data: [], error: err.message || "Failed to fetch top customers data" }
  }
}

// API Service function to fetch revenue trend data
export async function fetchRevenueTrend(
  filterType: "week" | "month"
): Promise<{ data: RevenueDataPoint[]; error: string | null }> {
  try {
    const response = await get<RevenueTrendResponse>(
      "/sales_revenue_and_payout_trends",
      {
        filter_type: filterType,
      },
      {
        cookieSession: true,
      }
    )

    if (response.status_code === 200) {
      // Map API response to RevenueDataPoint format
      const data: RevenueDataPoint[] = response.result.map((record) => ({
        name: record.period,
        gross: record.gross_sales,
        commission: record.casa_carigar_commission,
        payout: record.supplier_payout,
      }))
      return { data, error: null }
    } else {
      return { data: [], error: response.message || "Failed to fetch revenue trend" }
    }
  } catch (err: any) {
    console.error("Error fetching revenue trend:", err)
    return { data: [], error: err.message || "Failed to fetch revenue trend data" }
  }
}

// API Service function to fetch what's selling data
export async function fetchWhatsSelling(
  filter: "by_product" | "by_categ"
): Promise<{ data: SellingItem[]; error: string | null }> {
  try {
    const response = await get<WhatsSellingResponse>(
      "/what_is_selling",
      {
        filter: filter,
      },
      {
        cookieSession: true,
      }
    )

    if (response.status_code === 200) {
      // Calculate total sales for percentage calculation
      const totalSales = response.record.reduce((sum, record) => sum + record.total_sales, 0)
      
      // Map API response to SellingItem format
      const data: SellingItem[] = response.record.map((record) => {
        const percent = totalSales > 0 ? record.total_sales / totalSales : 0
        return {
          label: record.product_name,
          value: formatIndianCurrency(record.total_sales),
          units: `${record.total_units_sold} ${record.total_units_sold === 1 ? 'unit' : 'units'}`,
          percent: percent,
        }
      })
      return { data, error: null }
    } else {
      return { data: [], error: response.message || "Failed to fetch what's selling" }
    }
  } catch (err: any) {
    console.error("Error fetching what's selling:", err)
    return { data: [], error: err.message || "Failed to fetch what's selling data" }
  }
}





// API Service function to fetch GST snapshot data
export async function fetchGSTSnapshot(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string },
  userType?: string | null
): Promise<{ data: GSTSnapshot[]; error: string | null }> {
  try {
    const { startDate, endDate } = getDateRange(timePeriod, customDates)

    const response = await get<GSTSnapshotResponse>("/get_gst_snapshot", {
      start_date: startDate,
      end_date: endDate,
    }, {
      cookieSession: true,
    })

    if (response.status_code === 200) {
      const payoutTitle = userType === "admin" ? "Net GST Position" : "GST on Payouts"
      
      // Map API response to GSTSnapshot format
      const data: GSTSnapshot[] = [
        {
          title: "GST Collected on Orders",
          amount: formatIndianCurrency(response.gst_on_order),
          subtitle: "GST on product sales",
        },
        {
          title: "GST on CasaCarigar Commission",
          amount: formatIndianCurrency(response.gst_on_commission),
          subtitle: "GST on commission",
        },
        {
          title: payoutTitle,
          amount: formatIndianCurrency(response.tentative_gst_liability),
          subtitle: "GST on payouts",
        },
      ]
      return { data, error: null }
    } else {
      return { data: [], error: response.message || "Failed to fetch GST snapshot" }
    }
  } catch (err: any) {
    console.error("Error fetching GST snapshot:", err)
    return { data: [], error: err.message || "Failed to fetch GST snapshot data" }
  }
}

// Helper function to format date from YYYY-MM-DD to "DD MMM" format
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = monthNames[date.getMonth()]
  return `${day} ${month}`
}

// Helper function to map API status to component status and tone
function mapStatusToSettlement(status: string): { status: "Scheduled" | "Processing" | "Paid"; tone: "blue" | "green" } {
  const statusLower = status.toLowerCase()
  if (statusLower === "paid") {
    return { status: "Paid", tone: "blue" }
  } else if (statusLower === "processing" || statusLower === "in progress") {
    return { status: "Processing", tone: "green" }
  } else {
    return { status: "Scheduled", tone: "blue" }
  }
}

// API Service function to fetch settlement dashboard data
export async function fetchSettlementDashboard(
  timePeriod: TimePeriod,
  customDates?: { startDate: string; endDate: string }
): Promise<{ data: UpcomingSettlement[]; error: string | null }> {
  try {

    const response = await get<SettlementDashboardResponse>("/get_settlement_dashboard", {
      
    }, {
      cookieSession: true,
    })

    if (response.status_code === 200) {
      // Map API response to UpcomingSettlement format
      const data: UpcomingSettlement[] = response.record.map((record) => {
        const { status, tone } = mapStatusToSettlement(record.status)
        return {
          dateLabel: formatDateLabel(record.date),
          period: record.vendor_name,
          amount: formatIndianCurrency(record.amount),
          status,
          tone,
        }
      })
      return { data, error: null }
    } else {
      return { data: [], error: response.message || "Failed to fetch settlement dashboard" }
    }
  } catch (err: any) {
    console.error("Error fetching settlement dashboard:", err)
    return { data: [], error: err.message || "Failed to fetch settlement dashboard data" }
  }
}


