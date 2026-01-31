// src/lib/api/endpoints/invoice.ts
import { get } from "../client"
import type { CustomerInvoiceReportResponse } from "@/types/domains/invoice"

/**
 * getCustomerInvoiceReport
 * Uses cookieSession to include session cookie; client will include access-token header if available.
 */
export async function getCustomerInvoiceReport(orderId: string): Promise<{ success: boolean; data?: CustomerInvoiceReportResponse; message?: string }> {
  try {
    const res = await get<CustomerInvoiceReportResponse>("/get_customer_invoice_report", { order_id: orderId }, { cookieSession: true })
    if (!res) return { success: false, message: "Empty response from server" }
    if (res.status_code !== 200) return { success: false, message: "Failed to fetch invoice report" }
    if (!res.record) return { success: false, message: "Invalid response structure from server" }
    return { success: true, data: res }
  } catch (err: any) {
    return { success: false, message: err?.message ?? "Failed to fetch invoice report" }
  }
}
