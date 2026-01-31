// Orders Feature Types
// ALL order-related types consolidated here

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  vendor_id?: number
}

export interface PaginatedResponse {
  total_record_count?: number
}

// ============================================================================
// Seller Name List Types
// ============================================================================

export interface SellerNameItem {
  id: number
  name: string
}

export interface SellerNameListResponse {
  status_code: number
  record: SellerNameItem[]
}

// ============================================================================
// Shared Base Types (duplicated here to avoid cross-feature imports)
// ============================================================================

export interface QcDataImage {
  img_url: string
}

export interface ActivityLog {
  type: string
  note: string
  qc_status?: string
  approved_by: string
  created_by: string
  created_on: string
  image: string[]
}

// ============================================================================
// Order Line Types
// ============================================================================

export interface QCData {
  id: number
  order_line_id: number
  product_id: number
  product_name: string
  type: string
  qc_status: string
  images: QcDataImage[]
  note?: string
}

export interface OrderLine {
  order_line_id: number
  product_id: number
  product_name: string
  product_image?: string
  product_uom_qty: number
  product_weight: number
  product_unit: string
  price_unit: number
  price_subtotal: number
  price_total: number
  sku_name: string
  product_variant_id: string
  cost_price: number
  weight: number
  weight_unit: string
  status: string
  mfg_qc_status?: string
  packaging_qc_status?: string
  mfg_qc_data?: QCData[]
  packaging_qc_data?: QCData[]
  seller_id?: number
  seller_name?: string
  mfg_rejection_count?: number
  pkg_rejection_count?: number
}

// ============================================================================
// Order Types
// ============================================================================

export interface Order {
  id: number
  name: string
  date: string
  customer_name: string
  customer_mobile: string
  customer_email?: string
  customer_address: string
  total_amount: number
  discount: number
  shipping_cost: number
  subtotal_amount: number
  tax_amount: number
  x_shopify_order_id: string
  x_shopify_payment_method: string
  x_shopify_payment_reference: string
  expected_delivery_days: string
  order_line: OrderLine[]
  activity_log: ActivityLog[]
  status: string
  amount?: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface OrderHistoryResponse extends PaginatedResponse {
  status_code: number
  record: Order[]
  total_count?: number
  count?: number
}

export interface OrderSummaryRecord {
  new_order: number
  mfg_qc_pending: number
  qc_rejected: number
  pickup_today: number
  ready_to_ship: number
}

export interface OrderSummary {
  new_order: number
  mfg_qc_pending: number
  pkg_qc_pending?: number
  qc_rejected: number
  pickup_today: number
  ready_to_ship: number
}

export interface OrderSummaryResponse {
  status_code: number
  record: OrderSummaryRecord
}

export interface OrderDetailResponse {
  status_code: number
  message?: string
  record: Order | Order[]
  total_count?: number
}

// ============================================================================
// Admin Order Types
// ============================================================================

export interface AdminOrderLineItem {
  order_line_id: number
  product_id: number
  product_name: string
  product_image?: string
  product_uom_qty: number
  product_weight: number
  product_unit: string
  price_unit: number
  price_subtotal: number
  price_total: number
  sku_name: string
  product_variant_id: string
  cost_price: number
  weight: number
  weight_unit: string
  status: string
  mfg_qc_status: string
  packaging_qc_status: string
  mfg_qc_data: QCData[]
  packaging_qc_data: QCData[]
  seller_id: number
  seller_name: string
  mfg_rejection_count?: number
  pkg_rejection_count?: number
}

export interface AdminActivityLogItem {
  type: string
  note: string
  qc_status?: string
  approved_by: string
  created_by: string
  created_on: string
  image: string[]
}

export interface AdminSaleOrderItem {
  id: number
  name: string
  date: string
  customer_name: string
  customer_mobile: string
  customer_email?: string
  customer_address: string
  total_amount: number
  discount: number
  shipping_cost: number
  subtotal_amount: number
  tax_amount: number
  x_shopify_order_id: string
  x_shopify_payment_method: string
  x_shopify_payment_reference: string
  expected_delivery_days: string
  order_line: AdminOrderLineItem[]
  activity_log: AdminActivityLogItem[]
  status: string
}

export interface AdminSaleOrderListResponse extends PaginatedResponse {
  status_code: number
  record: AdminSaleOrderItem[]
  total_count: number
}

export interface AdminOrderSummaryRecord {
  new_order: number
  mfg_qc_pending: number
  qc_rejected: number
  pickup_today: number
  ready_to_ship: number
}

export interface AdminOrderSummaryResponse {
  status_code: number
  record: AdminOrderSummaryRecord
}

// ============================================================================
// Component Props Types
// ============================================================================

export type UserType = 'seller' | 'admin'

export interface OrderHistoryTableProps {
  onSliderStateChange?: (isOpen: boolean) => void
  userType?: UserType
  // Navigation callback for file-based routing
  onViewOrderDetail?: (orderId: number) => void
}

export interface StatusCardConfig {
  title: string
  value: string
  iconSrc: string
  iconAlt: string
  status: string
}

export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

// ============================================================================
// Component Types
// ============================================================================

export interface StartPackagingQCProps {
  onBack?: () => void
  orderId: number
}

export interface BoxDimension {
  id: number
  box_type: string
  box_length: number
  box_width: number
  box_height: number
  box_unit: string
  box_volumetric_weight: number
}

export interface BoxDimensionResponse {
  status_code: number
  record: BoxDimension[]
}

export interface ShippingItem {
  order_line_id: number
  product_id: number
  product_name: string
  price_total?: number
  unit_price?: number
  qty?: number
  discount?: number
  tax?: number
  hsn?: string
}

export interface ShippingItemsResponse {
  status_code: number
  record: ShippingItem[]
  total_count: number
}

export interface OrderDetailPageProps {
  order: Order
  onRefresh: () => void
  onSliderStateChange?: (isOpen: boolean) => void
  onBackToList?: () => void
}

export interface OrderItem {
  id: string
  orderLineId: number // order_line_id from the API
  name: string
  image: string
  quantity: number
  unitPrice: number
  weight: string
  color: string
  subtotal: number
  status: string
  mfgQcStatus?: string
  packagingQcStatus?: string
  mfgQcData?: QCData[]
  packagingQcData?: QCData[]
}

export interface OrderData {
  trackingId: string
  customerName: string
  phone: string
  orderDate: string
  amountPaid: number
  orderStatus: string
  items: OrderItem[]
  progress: {
    manufacturing: 'completed' | 'in-progress' | 'pending'
    mfgQc: 'completed' | 'in-progress' | 'pending'
    packaging: 'completed' | 'in-progress' | 'pending'
    pkgQc: 'completed' | 'in-progress' | 'pending'
    shipped: 'completed' | 'in-progress' | 'pending'
  }
  summary: {
    subtotal: number
    tax: number
    shipping: number
    discount: number
    total: number
  }
}

// ============================================================================
// Service Types
// ============================================================================

export interface OrderHistoryResult {
  orders: Order[]
  totalCount: number
  totalRecordCount?: number
}