// Data mapping utilities for shipping feature
// Transforms API responses into UI-ready formats

import type { ShipmentRecord, TrackingLog, ShipmentDetailsData } from '../types/shipping.types'
import type { AdminSaleOrderItem, Order } from '@/components/features/orders/types/orders.types'

// Re-export ShipmentDetailsData for convenience
export type { ShipmentDetailsData }

// ============================================================================
// Helper Types for Data Mappers
// ============================================================================

export interface ShipmentItem {
  id: string
  name: string
  image: string
  quantity: number
  unitPrice: number
  weight: string
  color: string
  subtotal: number
  supplierName?: string
  supplierPhone?: string
}

export interface ShipmentSummary {
  awbNumber: string
  courier: string
  invoiceNumber: string
  estimatedDays: string
  boxType: string
  totalItems: number
  totalWeight: string
  subtotalAmount: number
  taxAmount: number
  totalAmount: number
}

export interface ShipmentLocation {
  address: string
  label: string
}

export interface TrackingActivity {
  title: string
  date: string
  status: 'completed' | 'in-progress' | 'pending'
}

// ============================================================================
// Order Data Mappers
// ============================================================================

/**
 * Map order line items to shipment items
 */
export function mapOrderLineToShipmentItems(
  orderLine: any[],
  orderId: string | number,
  options: {
    includeSupplierInfo?: boolean
    sellerName?: string
    sellerPhone?: string
  } = {}
): ShipmentItem[] {
  const { includeSupplierInfo = false, sellerName, sellerPhone } = options

  return orderLine.map((line, index) => ({
    id: `${orderId}-${line.order_line_id}-${index}`,
    name: line.product_name,
    image: line.product_image || "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    quantity: line.product_uom_qty,
    unitPrice: line.price_unit,
    weight: `${line.weight} ${line.weight_unit}`,
    color: line.sku_name || "N/A",
    subtotal: line.price_total,
    ...(includeSupplierInfo && {
      supplierName: line.seller_name || sellerName,
      supplierPhone: sellerPhone
    })
  }))
}

/**
 * Calculate shipment summary from order data and shiprocket data
 */
export function buildShipmentSummary(
  orderData: { order_line: any[]; total_amount: number; subtotal_amount: number; tax_amount: number; id: number | string },
  shipData: ShipmentRecord | null
): ShipmentSummary {
  const totalItems = orderData.order_line.reduce((sum, line) => sum + line.product_uom_qty, 0)
  const totalWeight = orderData.order_line.length > 0 
    ? `${orderData.order_line.reduce((sum, line) => sum + (line.weight * line.product_uom_qty), 0)} ${orderData.order_line[0].weight_unit}`
    : "0 Kg"

  return {
    awbNumber: shipData?.awb_number || shipData?.tracking_id || 'N/A',
    courier: shipData?.courier_name || shipData?.transporter_name || 'N/A',
    invoiceNumber: shipData?.invoice_no || `#${String(orderData.id).slice(-5)}`,
    estimatedDays: shipData?.estimated_days || 'N/A',
    boxType: shipData?.box_type_name || "N/A",
    totalItems,
    totalWeight,
    subtotalAmount: orderData.subtotal_amount,
    taxAmount: orderData.tax_amount,
    totalAmount: orderData.total_amount
  }
}

/**
 * Build tracking activities from shiprocket data
 */
export function buildTrackingActivities(
  shipData: ShipmentRecord | null,
  fallbackDate: string
): TrackingActivity[] {
  if (shipData?.tracking_log && shipData.tracking_log.length > 0) {
    return shipData.tracking_log.map((log, index) => ({
      title: log.activity + (log.location ? ` — ${log.location}` : ''),
      date: new Date(log.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      status: index === 0 ? 'in-progress' as const : 'completed' as const
    }))
  }

  return [{
    title: shipData?.last_event || "Order processed",
    date: shipData?.pickup_date 
      ? new Date(shipData.pickup_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : fallbackDate,
    status: 'in-progress' as const
  }]
}

/**
 * Map admin sale order to shipment details data (for slider)
 */
export function mapAdminOrderToShipmentDetails(
  order: AdminSaleOrderItem,
  shipData: ShipmentRecord | null
): ShipmentDetailsData {
  const items = mapOrderLineToShipmentItems(order.order_line, order.id, {
    includeSupplierInfo: true,
    sellerName: order.order_line[0]?.seller_name || shipData?.seller_name,
    sellerPhone: shipData?.seller_mobile
  })

  const summary = buildShipmentSummary(order, shipData)

  const fallbackDate = new Date(order.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return {
    shipmentId: shipData?.shiprocket_order_id || shipData?.tracking_id || shipData?.awb_number || String(order.id),
    customerName: order.customer_name,
    phone: order.customer_mobile,
    supplierName: order.order_line[0]?.seller_name || shipData?.seller_name,
    supplierPhone: shipData?.seller_mobile,
    amountPaid: order.total_amount,
    items,
    summary,
    pickupLocation: {
      address: shipData?.pickup_address || order.customer_address || "N/A",
      label: "Pickup Location"
    },
    destinationLocation: {
      address: shipData?.delivery_address || order.customer_address || "N/A",
      label: "Destination Locations"
    },
    trackingActivities: buildTrackingActivities(shipData, fallbackDate)
  }
}

/**
 * Map seller order to shipment details data (for slider)
 */
export function mapSellerOrderToShipmentDetails(
  order: Order,
  shipData: ShipmentRecord | null
): ShipmentDetailsData {
  const items = mapOrderLineToShipmentItems(order.order_line, order.id, {
    includeSupplierInfo: false
  })

  const summary = buildShipmentSummary(order, shipData)

  const fallbackDate = new Date(order.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return {
    shipmentId: shipData?.shiprocket_order_id || shipData?.tracking_id || shipData?.awb_number || String(order.id),
    customerName: order.customer_name,
    phone: order.customer_mobile,
    amountPaid: order.total_amount,
    items,
    summary,
    pickupLocation: {
      address: shipData?.pickup_address || order.customer_address || "N/A",
      label: "Pickup Location"
    },
    destinationLocation: {
      address: shipData?.delivery_address || order.customer_address || "N/A",
      label: "Destination Locations"
    },
    trackingActivities: buildTrackingActivities(shipData, fallbackDate)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date to readable string
 */
export function formatOrderDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }) + ' • ' + dateObj.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

