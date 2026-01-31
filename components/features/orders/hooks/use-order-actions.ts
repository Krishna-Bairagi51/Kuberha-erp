/**
 * Order Actions Hook
 * 
 * Custom hook that consolidates all order action handlers:
 * - Manufacturing status updates
 * - QC submissions
 * - Shipping initiation
 * - Invoice printing
 * - Data fetching
 */

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getCustomerInvoiceReport } from '@/lib/api/endpoints/invoice'
import type { OrderItem } from '../types/orders.types'
import { 
  useInvalidateOrdersQueries, 
  useUpdateProcessStatusMutation,
  useShipmentByOrderIdQuery 
} from './use-orders-query'

export interface UseOrderActionsOptions {
  orderId?: number
  userType: 'seller' | 'admin'
}

export interface UseOrderActionsReturn {
  // Manufacturing actions
  handleManufacturingFinalized: (itemId: string, orderLineId: number) => Promise<void>
  
  // Shipping data from query
  shippingData: any
  isLoadingShipping: boolean
  fetchShippingData: () => void
  
  // Invoice actions
  handlePrintReceipt: () => Promise<void>
  isPrintingReceipt: boolean
  
  // Clipboard actions
  handleCopyDetails: (customerName: string, phone: string, address: string, paymentMode: string, paymentReference: string) => Promise<void>
}

/**
 * Hook for managing order-related actions with TanStack Query
 */
export function useOrderActions({ orderId, userType }: UseOrderActionsOptions): UseOrderActionsReturn {
  const { invalidateOrder } = useInvalidateOrdersQueries()
  
  // Use TanStack Query for shipping data
  const { 
    data: shippingQueryData, 
    isLoading: isLoadingShipping,
    refetch: refetchShipping 
  } = useShipmentByOrderIdQuery(
    orderId || null, 
    userType, 
    !!orderId
  )
  
  // Invoice state
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)
  
  // Use mutation for process status updates
  const updateProcessStatusMutation = useUpdateProcessStatusMutation()

  // Extract shipping data from query response
  const shippingData = shippingQueryData?.success && shippingQueryData?.data 
    ? shippingQueryData.data 
    : null

  // ============================================================================
  // Manufacturing Actions
  // ============================================================================

  /**
   * Handler for Manufacturing Finalized button
   * Updates the process status to 'manufacture' using TanStack Query mutation
   */
  const handleManufacturingFinalized = useCallback(async (itemId: string, orderLineId: number) => {
    if (!orderId) {
      toast.error("Order ID is required")
      return
    }
    
    try {
      const response = await updateProcessStatusMutation.mutateAsync({
        order_line_id: orderLineId,
        type: 'manufacture',
        orderId,
        userType
      })

      if (response.status_code === 200) {
        toast.success("Manufacturing status updated successfully")
        // Mutation automatically invalidates queries - no manual invalidation needed
      } else {
        toast.error(`Failed to update manufacturing status: ${response.message}`)
      }
    } catch (error) {
      toast.error("Failed to update manufacturing status. Please try again.")
    }
  }, [orderId, userType, updateProcessStatusMutation])

  // ============================================================================
  // Shipping Actions
  // ============================================================================

  /**
   * Refetch shipping data - only for explicit refresh button clicks
   * TanStack Query automatically handles data fetching via enabled prop
   */
  const fetchShippingData = useCallback(() => {
    // Do nothing - TanStack Query handles fetching automatically
    // Only refetch if explicitly needed (e.g., refresh button)
  }, [])

  // ============================================================================
  // Invoice Actions
  // ============================================================================

  /**
   * Handler for Print Receipt button
   * Opens all invoices for the order in new tabs
   */
  const handlePrintReceipt = useCallback(async () => {
    if (!orderId) {
      toast.error("Unable to fetch invoices: Missing order identifier. Please try refreshing the page.")
      return
    }

    setIsPrintingReceipt(true)

    try {
      const response = await getCustomerInvoiceReport(orderId.toString())

      if (!response.success || !response.data) {
        toast.error(`Failed to load invoices: ${response.message || "Please try again in a moment."}`)
        return
      }

      const invoices = (response.data.record || []).filter(
        (invoice: any) => invoice.invoice_url && invoice.invoice_url.trim() !== ""
      )

      if (invoices.length === 0) {
        toast.info("No invoices available: This order does not have any printable invoices yet.")
        return
      }

      let isBlocked = false

      invoices.forEach((invoice: any) => {
        const opened = window.open(invoice.invoice_url, "_blank", "noopener,noreferrer")
        if (!opened) {
          isBlocked = true
        }
      })

      if (isBlocked) {
        toast.error("Pop-up blocked: Please allow pop-ups in your browser to view the invoices.")
      } else {
        toast.success(`Opening ${invoices.length} ${invoices.length > 1 ? "invoices" : "invoice"}: Invoice PDFs are opening in new tabs.`)
      }
    } catch (error) {
      toast.error(`Failed to open invoices: ${error instanceof Error ? error.message : "Please try again later."}`)
    } finally {
      setIsPrintingReceipt(false)
    }
  }, [orderId])

  // ============================================================================
  // Clipboard Actions
  // ============================================================================

  /**
   * Handler to copy customer and payment details to clipboard
   */
  const handleCopyDetails = useCallback(async (
    customerName: string,
    phone: string,
    address: string,
    paymentMode: string,
    paymentReference: string
  ) => {
    const details = [
      `Customer Name: ${customerName}`,
      `Phone: ${phone}`,
      `Email: xyz@gmail.com`,
      `Shipping Address: ${address}`,
      `Payment Mode: ${paymentMode}`,
      `Payment Reference ID: ${paymentReference}`
    ].join('\n')

    try {
      await navigator.clipboard.writeText(details)
      toast.success("Copied! Customer and payment details copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy details. Please try again.")
    }
  }, [])

  return {
    handleManufacturingFinalized,
    fetchShippingData,
    shippingData,
    isLoadingShipping,
    handlePrintReceipt,
    isPrintingReceipt,
    handleCopyDetails,
  }
}
