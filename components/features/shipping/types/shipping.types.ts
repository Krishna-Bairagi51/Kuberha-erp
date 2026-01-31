// Shipping Feature Types
// ALL shipping/shiprocket-related types consolidated here

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

// ============================================================================
// Shared Base Types (duplicated here to avoid cross-feature imports)
// ============================================================================

export interface ProductDetail {
  product_id: number
  product_name: string
  price_total: number
  unit_price: number
  qty: number
}

// ============================================================================
// Shipment Data Types
// ============================================================================

export interface TrackingLog {
  id: number
  delivery_id: number
  activity: string
  date: string
  location: string
  status: string
}

export interface ShipmentRecord {
  product_details: ProductDetail[]
  awb_number: string
  shiprocket_order_id: string
  tracking_id: string
  courier_name: string
  item_count: number
  pickup_address: string
  pickup_date?: string
  delivery_address: string
  label_url?: string
  manifest_url?: string
  invoice_url?: string
  invoice_no?: string
  transporter_name?: string
  estimated_days?: string
  box_type_name?: string
  last_event?: string
  status?: string
  seller_name?: string
  seller_mobile?: string
  customer_name?: string
  order_id?: number
  shipment_partner?: string
  shipment_status?: string
  tracking_log?: TrackingLog[]
}

export interface ShipmentListResponse {
  status_code: number
  record: ShipmentRecord[]
  total_count: number
  total_record_count?: number
}

// ============================================================================
// Shipment Insights Types
// ============================================================================

export interface ShipmentInsights {
  pickup_scheduled: number
  pickup_done: number
  in_transit: number
  out_for_delivery: number
  delivered: number
  cancelled: number
}

export interface ShipmentInsightsResponse {
  status_code: number
  pickup_scheduled: number
  pickup_done: number
  in_transit: number
  out_for_delivery: number
  delivered: number
  cancelled: number
}

export interface ShipmentPerformance {
  total_shipments: number
  on_time_delivery: number
  avg_delivery_time: number
}

export interface ShipmentInsightsAndPerformanceResponse {
  status_code: number
  message?: string
  record?: {
    insights: ShipmentInsights
    performance: ShipmentPerformance
  }
  insights?: ShipmentInsights
  performance?: ShipmentPerformance
}

export interface ShipmentInsightsApiResponse {
  status_code: number
  pickup_scheduled: number
  pickup_done: number
  in_transit: number
  out_for_delivery: number
  delivered: number
  cancelled: number
}

// ============================================================================
// UI Display Types
// ============================================================================

export type ShipmentStatus =
  | 'Ready to Ship'
  | 'Pickup Schedule'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Exceptions/RTO/NDR'
  | 'Shipped'
  | 'Reached at Destination Hub'

export interface ShipmentTableRow {
  awb: string
  shipmentId: string
  courier: string
  supplierName: string
  supplierPhone: string
  items: string
  customerName: string
  customerPhone: string
  lastEvent: string
  amount: number
  status: ShipmentStatus | string
  rawData?: ShipmentRecord
}

export interface ShipmentDetailsData {
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
// Component Props Types
// ============================================================================

export type UserType = 'seller' | 'admin'

export interface ShippingPageProps {
  userType?: UserType
  onSliderStateChange?: (isOpen: boolean) => void
}

export interface ShipmentDetailsSliderProps {
  isOpen: boolean
  onClose: () => void
  shipment: ShipmentDetailsData | null
  onViewFullPage?: () => void
}

export interface ShipmentSupplierDetailsProps {
  orderId: string
  onBack: () => void
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseShippingOptions {
  userType?: UserType
  autoFetch?: boolean
}

export interface UseShippingReturn {
  // Data
  shipments: ShipmentRecord[]
  insights: ShipmentInsights | null
  isLoading: boolean
  isLoadingInsights: boolean
  error: string | null
  
  // Actions
  fetchShipments: () => Promise<void>
  fetchInsights: (timePeriod?: string) => Promise<void>
  refresh: () => Promise<void>
  getShipmentByOrderId: (orderId: number) => Promise<ShipmentRecord | null>
  
  // Search & Filter
  searchTerm: string
  setSearchTerm: (term: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  filteredShipments: ShipmentRecord[]
  
  // Table data (formatted for display)
  tableData: ShipmentTableRow[]
  
  // Pagination
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  setItemsPerPage: (count: number) => void
  totalPages: number
  paginatedShipments: ShipmentRecord[]
}

