// QC (Quality Control) Feature Types
// ALL QC-related types consolidated here

// ============================================================================
// Shared Base Types (duplicated here to avoid cross-feature imports)
// ============================================================================

export interface QcDataImage {
  img_url: string
}

export interface ActivityLog {
  type: string
  note: string
  approved_by: string
  created_by: string
  created_on: string
  image: string[]
}

export interface QCDataItem {
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
  mfg_qc_data?: QCDataItem[]
  packaging_qc_data?: QCDataItem[]
  seller_id?: number
  seller_name?: string
  mfg_rejection_count?: number
  pkg_rejection_count?: number
}

export interface Order {
  id: number
  name: string
  date: string
  customer_name: string
  customer_mobile: string
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
// QC Status Types
// ============================================================================

export type QCStatus = 'pending' | 'approved' | 'rejected'
export type QCType = 'mfg' | 'pkg' | 'mfg_qc' | 'pkg_qc' | 'manufacturing' | 'packaging'
export type UserType = 'seller' | 'admin'

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  vendor_id?: number
}

// ============================================================================
// QC Insights Types
// ============================================================================

export interface QCInsightsData {
  pending_mfg_qc: number
  pending_pkg_qc: number
  mfg_rejected: number
  pkg_qc_rejected: number
  ready_to_ship: number
}

export interface QCInsightsResponse {
  status_code: number
  record: QCInsightsData
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApproveQCRequest {
  id: number
  type: string
}

export interface RejectQCRequest {
  id: number
  type: string
  note: string
}

export interface ApproveQCResponse {
  status_code: number
  message: string
}

export interface RejectQCResponse {
  status_code: number
  message: string
}

export interface UpdateProcessStatusRequest {
  order_line_id: number
  type: string
}

export interface UpdateProcessStatusWithImagesRequest {
  order_line_id: number
  type: string
  images: File[]
  note?: string
}

export interface UpdateProcessStatusResponse {
  status_code: number
  message: string
  record?: any
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface QCPageProps {
  userType?: UserType
  onSliderStateChange?: (isOpen: boolean) => void
  // Legacy section props for seller dashboard (to be refactored separately)
  section?: string | null
  sectionId?: string | null
  onSectionChange?: (section: string | null, id?: string | number | null) => void
  // Navigation callback for file-based routing (admin dashboard)
  onViewOrderDetail?: (orderId: number) => void
}

export interface TransformedQcItem {
  id: string
  productName: string
  customerName: string
  customerPhone: string
  sellerName?: string
  date: string
  time: string
  amount: string
  status: string
  isMultiple: boolean
  originalData: any
}

export interface QCOrderDetailProps {
  order?: Order
  orderData?: Order
  onBack: () => void
  onRefresh?: () => void
}

export interface ApprovalStatusSliderProps {
  isOpen: boolean
  onClose: () => void
  orderLine: OrderLine | null
  qcType: QCType
  onApprove?: () => void
  onReject?: (reason: string) => void
}

export interface OrderSummarySliderProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

// ============================================================================
// QC Summary Types
// ============================================================================

export interface QCSummary {
  pending_mfg_qc: number
  pending_pkg_qc: number
  approved_today: number
  rejected_today: number
  total_pending: number
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseQCOptions {
  userType?: UserType
}

export interface UseQCReturn {
  // Loading states
  isApproving: boolean
  isRejecting: boolean
  isUpdatingStatus: boolean
  
  // Error state
  error: string | null
  
  // Admin actions
  approveQC: (qcId: number, qcType: string) => Promise<boolean>
  rejectQC: (qcId: number, qcType: string, reason: string) => Promise<boolean>
  
  // Seller actions
  updateProcessStatus: (orderLineId: number, type: string) => Promise<boolean>
  updateProcessStatusWithImages: (orderLineId: number, type: string, images: File[]) => Promise<boolean>
  
  // Utilities
  clearError: () => void
  getStatusColor: (status: string) => { bg: string; text: string; border: string }
  formatQCType: (type: string) => string
}

// ============================================================================
// Service Types
// ============================================================================

export interface QCInsightsApiResponse {
  status_code: number
  record: QCInsightsData
}

