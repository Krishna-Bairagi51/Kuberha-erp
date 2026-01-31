// Shop The Look Feature Types

// ============================================================================
// Look Types
// ============================================================================

export interface Look {
  id: number | string
  name: string
  image_url?: string
  product_count: number
  max_products?: number
  updated_at: string
  created_at?: string
  order?: number // For drag and drop ordering
  sequence?: number // API sequence field
  is_deleted?: boolean
  is_active?: boolean
  product_list?: ProductInLook[] // Products with coordinates
}

export interface ProductInLook {
  product_id: number
  name: string
  mrp: number
  image_url: string
  x_coordinate: number
  y_coordinate: number
}

export interface LookApiResponse {
  status_code: number
  message: string
  errors?: string[]
  count?: number
  record?: Look[]
  record_count?: number
}

export interface GetLooksResponse {
  looks: Look[]
  count: number
  record_count: number
}

export interface UpdateLookOrderRequest {
  look_ids: (number | string)[]
}

export interface UpdateLookOrderResponse {
  status_code: number
  message: string
}

export interface UpdateLookSequenceResponse {
  message: string
  errors: string[]
  status_code: number
}

export interface DeleteLookResponse {
  status_code: number
  message: string
  errors: string[]
}

export interface RestoreLookResponse {
  status_code: number
  message: string
}

// ============================================================================
// Hook Types
// ============================================================================

export type ViewMode = 'grid' | 'list'
export type TabType = 'active' | 'deleted'

export interface UseShopTheLookOptions {
  autoFetch?: boolean
}

export interface UseShopTheLookReturn {
  // Data
  activeLooks: Look[]
  deletedLooks: Look[]
  isLoading: boolean
  error: string | null
  
  // UI State
  searchTerm: string
  viewMode: ViewMode
  activeTab: TabType
  
  // Actions
  setSearchTerm: (term: string) => void
  setViewMode: (mode: ViewMode) => void
  setActiveTab: (tab: TabType) => void
  handleReorder: (newOrder: Look[]) => Promise<void>
  handleDelete: (lookId: number | string) => Promise<boolean>
  handleRestore: (lookId: number | string) => Promise<boolean>
  refetch: () => void
}

