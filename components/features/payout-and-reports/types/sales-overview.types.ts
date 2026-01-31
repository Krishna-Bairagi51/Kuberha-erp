export type TimePeriod = "week" | "month" | "quarter" | "year" | "custom"

export interface KPICard {
  title: string
  value: string
  subtitle: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface RevenueDataPoint {
  name: string
  gross: number
  commission: number
  payout: number
}

export interface StatusBreakdown {
  name: string
  value: number
  color: string
}

export interface TopCustomer {
  name: string
  phone: string
  gmv: string
  commission: string
  payable: string
}

export interface SellingItem {
  label: string
  value: string
  units: string
  percent: number
}

export interface GSTSnapshot {
  title: string
  amount: string
  subtitle: string
}

export interface UpcomingSettlement {
  dateLabel: string
  period: string
  amount: string
  status: "Scheduled" | "Processing" | "Paid"
  tone: "blue" | "green"
}

export interface Alert {
  severity: "high" | "medium"
  text: string
}

