/**
 * Dashboard Feature Types
 */

import type { Order } from '@/components/features/orders/types/orders.types'

export interface SellerSummary {
  total_earning: number
  order_shipped: number
  order_delivered: number
  new_orders: number
  pickup_today?: number
}

export interface SellerInsights {
  pending_mfg_pkg_qc: number
  rejected_mfg_pkg_qc: number
  timelines_at_risk: number
  ready_to_ship: number
  pickup_today: number
}

export interface SellerSummaryResponse {
  status_code: number
  total_earning: number
  order_shipped: number
  order_delivered: number
  new_orders: number
  pickup_today?: number
}

export interface SellerInsightsResponse {
  status_code: number
  pending_mfg_pkg_qc: number
  rejected_mfg_pkg_qc: number
  timelines_at_risk: number
  ready_to_ship: number
  pickup_today: number
}

export interface DashboardContentProps {
  /** Callback when slider state changes */
  onSliderStateChange?: (isOpen: boolean) => void
  /** Callback to navigate to a tab */
  onNavigateToTab?: (tab: string) => void
  /** User type (affects which components are shown) */
  userType?: 'seller' | 'admin'
  // URL section params for deep linking
  section?: string | null
  sectionId?: string | null
  onSectionChange?: (section: string | null, id?: string | number | null) => void
}

export interface MetricCard {
  title: string
  value: string | number
  subLabel?: string
  icon: React.ReactNode
  iconBgColor: string
  onClick?: () => void
}

export interface InsightMetric {
  title: string
  value: number
  iconSrc: string
  iconAlt: string
}

// ============================================================================
// Admin Analytics Types
// ============================================================================

export interface TopCategoryRecord {
  categ_id: number
  category_name: string
  total_amount: number
  total_qty: number
}

export interface TopCategoriesResponse {
  status_code: number
  record: TopCategoryRecord[]
  count: number
}

export interface OrderCountRecord {
  date: string
  count: number
}

export interface OrderCountSummaryResponse {
  status_code: number
  record: OrderCountRecord[]
  count: number
}

export interface TopCustomerRecord {
  customer_name: string
  customer_mobile: string
  address: string
  order_count: number
  amount: number
}

export interface TopCustomersResponse {
  status_code: number
  record: TopCustomerRecord[]
  count: number
}

export type UserType = 'seller' | 'admin'

// ============================================================================
// Pickups Scheduled Table Types
// ============================================================================

export interface PickupsScheduledTableProps {
  onViewOrderDetails?: (trackingId: string) => void
  onNavigateToShippingDelivery?: () => void
  onViewSupplierDetails?: (orderId: string) => void
  onLoadingChange?: (isLoading: boolean) => void
}

export interface TableDataRow {
  trackingId: string
  productName: string
  productSubtitle: string
  customerName: string
  phone: string
  shipRocketId: string
  trackingId2: string
  deliveryAddress: string
  status: string
}

export interface ShipmentData {
  shipmentId: string
  customerName: string
  phone: string
  supplierName?: string
  supplierPhone?: string
  amountPaid: number
  items: {
    id: string
    name: string
    image: string
    quantity: number
    unitPrice: number
    weight: string
    color: string
    subtotal: number
  }[]
  summary: {
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
  pickupLocation: {
    address: string
    label: string
  }
  destinationLocation: {
    address: string
    label: string
  }
  trackingActivities: {
    title: string
    date: string
    status: 'completed' | 'in-progress' | 'pending'
  }[]
}

// ============================================================================
// Recent Order Details Types
// ============================================================================

export interface RecentOrderDetailsProps {
  onOrderClick?: (order: Order) => void
  onLoadingChange?: (isLoading: boolean) => void
}

export interface ApiRecentOrder {
  order_id: number
  order_name: string
  product_name: string[]
  customer_name: string
  customer_mobile: string
  date: string
  amount: number
  status: string
}

export interface RecentOrderResponse {
  status_code: number
  record: ApiRecentOrder[]
  total_count: number
}

export interface RecentOrderRow {
  orderId: string
  orderIdNumber: number
  multipleItems: boolean
  productName: string
  customerName: string
  phone: string
  date: string
  time: string
  amount: string | number
  status: string
}

// ============================================================================
// Order Details Slider Types
// ============================================================================

export interface OrderDetailsSliderProps {
  isOpen: boolean
  onClose: () => void
  trackingId: string
}

export interface OrderItem {
  id: string
  name: string
  image: string
  quantity: number
  unitPrice: number
  weight: string
  color: string
  subtotal: number
}

export interface OrderData {
  trackingId: string
  customerName: string
  phone: string
  orderDate: string
  amountPaid: number
  items: OrderItem[]
  progress: {
    manufacturing: 'completed' | 'in-progress' | 'pending'
    mfgQc: 'completed' | 'in-progress' | 'pending'
    packaging: 'completed' | 'in-progress' | 'pending'
    pkgQc: 'completed' | 'in-progress' | 'pending'
    shipped: 'completed' | 'in-progress' | 'pending'
  }
  summary: {
    totalItems: number
    totalWeight: string
    subtotalAmount: number
    taxAmount: number
    totalAmount: number
  }
  activities: {
    date: string
    description: string
    status: 'completed' | 'in-progress' | 'pending'
    highlight?: string
  }[]
}

// ============================================================================
// Sale Purchase Graph Types
// ============================================================================

export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y'

export interface GraphDataPoint {
  name: string
  sales: number
  earnings: number
  total: number
}

export interface GraphDataResponse {
  status_code: number
  sales_amount: number
  earning_amount: number
  data: Array<{ date: string; sale_amt: number; earn_amt: number }>
}
