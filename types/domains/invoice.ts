// types/domains/invoice.ts

export interface CustomerInvoiceRecord {
  id: number
  name: string
  invoice_url: string
}

export interface CustomerInvoiceReportResponse {
  status_code: number
  record: CustomerInvoiceRecord[]
}
