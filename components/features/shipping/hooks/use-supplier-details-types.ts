export interface OrderItem {
  id: string
  name: string
  image: string
  quantity: number
  unitPrice: number
  weight: string
  color?: string
  subtotal: number
  status: string
  supplierName?: string
  supplierPhone?: string
}

export interface ShippingProgressStage {
  label: string
  status: 'completed' | 'in-progress' | 'pending'
  step: number
}

export interface OrderTimelineActivity {
  date: string
  description: string
  status: 'completed' | 'in-progress' | 'pending'
  highlight?: string
  createdBy?: string
  approvedBy?: string
  type?: string
  images?: string[]
  qcStatus?: string
}

export interface TrackingActivity {
  title: string
  date: string
  status: 'completed' | 'in-progress' | 'pending'
}

export interface SupplierDetailsData {
  orderId: string
  orderDate: string
  items: OrderItem[]
  summary: {
    subtotalAmount: number
    discount: number
    discountName: string
    taxAmount: number
    shippingCost: number
    totalAmount: number
  }
  customer: {
    name: string
    phone: string
    email: string
  }
  payment: {
    mode: string
    status: string
    referenceId: string
  }
  shippingData: any
  shippingProgress: ShippingProgressStage[]
  lastEvent: string
  currentStatus: string
  isCancelled: boolean
  orderTimeline: OrderTimelineActivity[]
  trackingActivities: TrackingActivity[]
  locations: {
    pickup: { address: string; label: string }
    destination: { address: string; label: string }
  }
}

