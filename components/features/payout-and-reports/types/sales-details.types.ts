export type TimePeriod = "week" | "month" | "quarter" | "year" | "custom"

export interface SalesRow {
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
}

