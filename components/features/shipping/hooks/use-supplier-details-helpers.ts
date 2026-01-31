import type { Order, AdminSaleOrderItem } from '@/components/features/orders/types/orders.types'
import type { ShipmentRecord, TrackingLog, UserType } from '../types/shipping.types'
import type { SupplierDetailsData, OrderItem, ShippingProgressStage, OrderTimelineActivity, TrackingActivity } from './use-supplier-details-types'
import { formatDateTime } from '@/lib/api/helpers/misc'

// Map shipment_status to progress bar stages
const mapShipmentStatusToProgress = (shipmentStatus: string | undefined): ShippingProgressStage[] => {
  const allStages: ShippingProgressStage[] = [
    { label: 'Pickup Scheduled', status: 'pending', step: 1 },
    { label: 'Pickup Done', status: 'pending', step: 2 },
    { label: 'In Transit', status: 'pending', step: 3 },
    { label: 'Out For Delivery', status: 'pending', step: 4 },
    { label: 'Delivered', status: 'pending', step: 5 }
  ]

  if (!shipmentStatus) {
    return allStages
  }

  const isCancelled = shipmentStatus === 'cancelled'

  if (isCancelled) {
    return allStages.map((stage, index) => {
      if (index < 4) {
        return { ...stage, status: 'completed' as const }
      } else {
        return { label: 'Cancelled', status: 'pending' as const, step: 5 }
      }
    })
  }

  const statusToStep: Record<string, number> = {
    'pickup_scheduled': 1,
    'pickup_done': 2,
    'in_transit': 3,
    'out_for_delivery': 4,
    'delivered': 5
  }

  const currentStep = statusToStep[shipmentStatus] || 0

  return allStages.map((stage, index) => {
    const stepNumber = index + 1

    if (stepNumber < currentStep) {
      return { ...stage, status: 'completed' as const }
    } else if (stepNumber === currentStep) {
      return { ...stage, status: 'completed' as const }
    } else if (stepNumber === currentStep + 1) {
      return { ...stage, status: 'in-progress' as const }
    } else {
      return { ...stage, status: 'pending' as const }
    }
  })
}

export function mapOrderToSupplierDetails(
  order: Order | AdminSaleOrderItem,
  shipData: ShipmentRecord | null,
  userType: UserType
): SupplierDetailsData {
  // Map order data
  const mappedItems: OrderItem[] = order.order_line.map((line) => ({
    id: String(line.order_line_id),
    name: line.product_name,
    image: line.product_image || 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    quantity: line.product_uom_qty,
    unitPrice: line.price_unit,
    weight: `${line.weight} ${line.weight_unit}`,
    color: 'N/A',
    subtotal: line.price_total,
    status: line.status || 'Delivery in Progress',
    supplierName: userType === 'admin' ? (line as any).seller_name : undefined,
    supplierPhone: undefined
  }))

  const orderDate = new Date(order.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' • ' + new Date(order.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  let shippingData: any = null
  let shippingProgress: ShippingProgressStage[] = mapShipmentStatusToProgress(undefined)
  let lastEvent = ''
  let currentStatus = ''
  let isCancelled = false
  let orderTimeline: OrderTimelineActivity[] = []
  let trackingActivities: TrackingActivity[] = []
  let locations = {
    pickup: {
      address: '123 Mango Lane, Greenfield, 402001, Mumbai, Mahrasthra',
      label: 'Pickup Location'
    },
    destination: {
      address: '225 Udyog Vihar, 2010016, Gurugram, Haryana',
      label: 'Destination Locations'
    }
  }

  // Process shiprocket data
  if (shipData) {
    // Update supplier info if available (admin only)
    if (userType === 'admin' && (shipData.seller_name || shipData.seller_mobile)) {
      mappedItems.forEach(item => {
        item.supplierName = shipData.seller_name || item.supplierName
        item.supplierPhone = shipData.seller_mobile || item.supplierPhone
      })
    }

    shippingData = {
      awb_number: shipData.awb_number,
      shiprocket_order_id: shipData.shiprocket_order_id,
      tracking_id: shipData.tracking_id,
      courier_name: shipData.courier_name,
      item_count: String(shipData.item_count),
      invoice_number: shipData.invoice_no,
      transporter_name: shipData.transporter_name,
      estimated_days: shipData.estimated_days,
      box_type: shipData.box_type_name || 'N/A',
      label_url: shipData.label_url,
      manifest_url: shipData.manifest_url,
      invoice_url: shipData.invoice_url,
      shipment_partner: shipData.shipment_partner,
      shipment_status: shipData.shipment_status,
    }

    isCancelled = shipData.shipment_status === 'cancelled'
    shippingProgress = mapShipmentStatusToProgress(shipData.shipment_status)

    const statusMap: Record<string, string> = {
      'pickup_scheduled': 'Pickup Scheduled',
      'pickup_done': 'Pickup Done',
      'in_transit': 'In Transit',
      'out_for_delivery': 'Out For Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    }
    currentStatus = statusMap[shipData.shipment_status || ''] || shipData.shipment_status || ''

    if (shipData.tracking_log && shipData.tracking_log.length > 0) {
      const latestLog = shipData.tracking_log[0]
      lastEvent = `${latestLog.activity}${latestLog.location ? ` — ${latestLog.location}` : ''}${shipData.estimated_days ? `. EDD: ${shipData.estimated_days}` : ''}`
    } else if (shipData.last_event) {
      lastEvent = shipData.last_event
    }

    locations = {
      pickup: {
        address: shipData.pickup_address || '',
        label: 'Pickup Location'
      },
      destination: {
        address: shipData.delivery_address || '',
        label: 'Destination Locations'
      }
    }

    if (shipData.tracking_log && shipData.tracking_log.length > 0) {
      trackingActivities = shipData.tracking_log.map((log: TrackingLog, index: number) => {
        const logDate = new Date(log.date).toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

        return {
          title: log.activity + (log.location ? ` — ${log.location}` : ''),
          date: logDate,
          status: index === 0 ? 'in-progress' as const : 'completed' as const
        }
      })
    }
  }

  // Process timeline from activity log
  if (order.activity_log && order.activity_log.length > 0) {
    const typeMap: Record<string, string> = {
      'new': 'New Order',
      'manufacture': 'Manufacturing',
      'mfg_qc': 'MFG QC',
      'packaging': 'Packaging',
      'pkg_qc': 'PKG QC',
      'ready_to_ship': 'Ready to Ship',
      'shipped': 'Ready to ship',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    }

    // Get current order status for determining activity status
    const currentOrderStatus = order.status?.toLowerCase() || 'new'
    const statusOrder = ['new', 'manufacture', 'mfg_qc', 'packaging', 'pkg_qc', 'ready_to_ship', 'shipped', 'delivered']
    const orderIndex = statusOrder.indexOf(currentOrderStatus)

    orderTimeline = order.activity_log
      .sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime())
      .map((log, index) => {
        const activityType = log.type?.toLowerCase() || ''
        const typeLabel = typeMap[activityType] || log.type || 'Activity'
        
        const description = log.note
          ? `${typeLabel} - ${log.note}`
          : typeLabel

        // Determine activity status based on order status
        const getActivityStatus = (type: string): 'completed' | 'in-progress' | 'pending' => {
          const currentIndex = statusOrder.indexOf(type?.toLowerCase())
          if (currentIndex <= orderIndex) return 'completed'
          if (currentIndex === orderIndex + 1) return 'in-progress'
          return 'pending'
        }

        return {
          date: formatDateTime(log.created_on),
          description: description,
          status: getActivityStatus(log.type || ''),
          highlight: log.approved_by ? `Approved by: ${log.approved_by}` : undefined,
          createdBy: log.created_by || 'N/A',
          approvedBy: log.approved_by || 'N/A',
          type: log.type,
          images: log.image || [],
          qcStatus: (log as any).qc_status
        }
      })
  }

  const detailsData: SupplierDetailsData = {
    orderId: String(order.id),
    orderDate: orderDate,
    items: mappedItems,
    summary: {
      subtotalAmount: order.subtotal_amount,
      discount: order.discount,
      discountName: '',
      taxAmount: order.tax_amount,
      shippingCost: order.shipping_cost,
      totalAmount: order.total_amount
    },
    customer: {
      name: order.customer_name,
      phone: order.customer_mobile,
      email: (order as AdminSaleOrderItem).customer_email || 'N/A'
    },
    payment: {
      mode: order.x_shopify_payment_method || 'N/A',
      status: 'Paid',
      referenceId: order.x_shopify_payment_reference || 'N/A'
    },
    shippingData,
    shippingProgress,
    lastEvent,
    currentStatus,
    isCancelled,
    orderTimeline,
    trackingActivities,
    locations
  }

  return detailsData
}

