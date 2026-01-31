// Brand Management Feature Types

// ============================================================================
// Brand Types
// ============================================================================

export interface Brand {
  id: string
  name: string
  displayName: string
  imageUrl?: string
  bannerUrl?: string
  description?: string
  productCount?: number
}

// Extended SupplierListItem with image_url for brand management
export interface SupplierListItemWithImage {
  id: number
  name: string
  phone: string
  address: string
  email: string
  supplier_name: string
  designation: string
  organisation_type: string
  unsigned_agreement_url: string
  signed_agreement_url: string
  gst: string
  docs_status?: string
  created_status?: string
  status?: string
  seller_state?: string
  image_url?: string // Brand logo/image URL from API
  banner_url?: string // Brand banner/background image URL from API
  description?: string // Brand description from API
  product_count?: number // Number of products for this brand
}

// Re-export supplier types for API responses
export type { SupplierListResponse } from '@/components/features/supplier-details/types/supplier.types'

