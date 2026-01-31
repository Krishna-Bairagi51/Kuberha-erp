export type TimePeriod = "week" | "month" | "quarter" | "year" | "custom"

export interface PayoutRow {
  orderId: string
  date: string
  customerName: string
  customerPhone: string
  supplierName: string
  supplierPhone: string
  item: string
  qty: number
  itemPrice: number
  grossAmount: number
  taxes: number
  commission: number
  netPayable: number
  status: string
}

export interface PayoutKPI {
  title: string
  value: string
  subtitle: string
  trend?: string
}

export interface StatusTone {
  bg: string
  text: string
  border: string
}

