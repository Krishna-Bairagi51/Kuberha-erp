// Inventory Feature Types
// Consolidated from types/domains/inventory.ts and admin types

// ============================================================================
// Base Types
// ============================================================================

export interface ProductOption {
  name: string
  values: string[]
  selectedValues?: VariantOptionValue[]
}

export interface ProductVariant {
  title: string
  extra_charges: number
  stock_quantity: number
  images?: string[]
  extra_lead_time?: number
  variant_product_length?: number
  variant_product_width?: number
  variant_product_height?: number
  variant_product_dimension_unit?: string
  variant_shopify_weight?: string
  variant_shopify_weight_unit?: string
}

export interface ManufactureLeadTime {
  start_qty: number
  end_qty: number
  lead_time: number
  lead_time_unit: string
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface Category {
  id: number
  name: string
  parent_id?: number
  child_ids?: number[]
}

export interface EcomCategory {
  id: number
  name: string
  parent_id?: number
  child_ids?: number[]
}

export interface UOM {
  id: number
  name: string
  category_id?: number
  factor?: number
  rounding?: number
  active?: boolean
}

export interface Tax {
  id: number
  name: string
  amount: number
  amount_type: string
  active?: boolean
}

export interface VariantOptionValue {
  id: number
  name: string
}

export interface VariantOption {
  id: number
  name: string
  values: VariantOptionValue[]
}

export interface InventoryFormData {
  categories: Category[]
  ecomCategories: EcomCategory[]
  uomList: UOM[]
  taxList: Tax[]
  variantOptions: VariantOption[]
  packageTypes: Array<{ id: number; name: string }>
  collections: Array<{ id: number; name: string }>
  finishes: Array<{ id: number; name: string }>
  boxTypes: Array<{ id: number; name: string; box_volumetric_weight: number }>
  usageTypes: Array<{ id: number; name: string }>
  productMaterials: Array<{ id: number; name: string }>
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  category?: string
  vendor_id?: number
}

export interface PaginatedResponse {
  total_record_count?: number
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface InventoryItemRequest {
  name: string
  hsn_code: string
  item_status: string
  category: string
  sub_category: string
  collections: string[]
  cad_3d_files: string
  unit: number
  sku_code: string
  description: string
  product_material: string[]
  package_weight: number
  package_weight_unit: string
  finish: string[]
  product_dimension_length: number
  product_dimension_width: number
  product_dimension_height: number
  product_dimension_height_unit: string
  product_dimension_weight: number
  product_dimension_weight_unit: string
  usage_type: string[]
  quantity: number
  mrp: number
  taxes: number[]
  discount_type: string
  discount_value: number | string
  price_after_discount: number
  low_stock_value: number
  low_stock_alert: number
  package_length: number
  package_width: number
  package_height: number
  package_height_unit: string
  package_type: string[]
  box_type: string
  handling_instructions: string
  courier_feasibility: string
  fragility_indicator: number
  assembly_requirement: string
  assembly_requirement_document: string
  manufacture_lead_time: ManufactureLeadTime[]
  options: ProductOption[]
  variants: ProductVariant[]
  images: string[]
}

export interface InventoryItemResponse {
  status_code: number
  message: string
  record: InventoryItemRequest
}

// Seller product list item
export interface ProductListItem {
  id: number
  name: string
  status: string
  category: string
  stock: number
  mrp: number
  stock_value: number
  shopify_status: string
}

export interface ProductListResponse extends PaginatedResponse {
  status_code: number
  message: string
  count: number
  record: ProductListItem[]
  /**
   * Backends sometimes return list payloads under different keys.
   * Keep them optional so callers can normalize safely.
   */
  result?: ProductListItem[]
  data?: ProductListItem[]
  products?: ProductListItem[]
  total_inventory_value: number
  total_stock_quantity: number
  low_stock: number
  total_category: number
}

// Admin product list item (includes vendor info)
export interface AdminProductListItem {
  id: number
  name: string
  vendor_id: number | string
  vendor_name: string
  vendor_phone: string
  vendor_address: string
  total_sales: number
  status: string
  category: string
  stock: number
  mrp: number
  stock_value: number
  product_image?: string | null
}

export interface AdminProductListResponse extends PaginatedResponse {
  status_code: number
  message: string
  count: number
  record: AdminProductListItem[]
  total_inventory_value: number
  total_stock_quantity: number
  low_stock: number
  total_category: number
}

export interface ProductDetailsResponse {
  status_code: number
  message: string
  record: InventoryItemRequest
}

export interface UpdateProductStatusResponse {
  status_code: number
  message: string
}

// ============================================================================
// Component Props Types
// ============================================================================

export type UserType = 'seller' | 'admin'

export interface InventoryPageProps {
  userType?: UserType
  onSliderStateChange?: (isOpen: boolean) => void
}

export interface AddInventoryProps {
  onCancel: () => void
  onSave: () => void
  onSliderStateChange?: (isOpen: boolean) => void
}

export interface EditInventoryProps {
  productId: number
  userType?: UserType
  onCancel: () => void
  onSave: () => void
  onSliderStateChange?: (isOpen: boolean) => void
}

// ============================================================================
// Component Form Types
// ============================================================================

// Note: Variant and Option are aliases for ProductVariant and ProductOption
// but kept separate for component-specific usage
export interface Variant {
  title: string
  extra_charges: number
  stock_quantity: number
  images?: string[]
  extra_lead_time?: number
  variant_product_length?: number
  variant_product_width?: number
  variant_product_height?: number
  variant_product_dimension_unit?: string
  variant_shopify_weight?: string
  variant_shopify_weight_unit?: string
}

export interface Option {
  name: string
  values: string[]
  selectedValues?: VariantOptionValue[]
}

export interface LeadTimeEntry {
  quantity_range: string
  lead_time_value: number
  lead_time_unit: string
  start_qty: number
  end_qty: number
}

export interface InventoryItemFormData {
  name: string
  hsn_code: string
  product_type: string
  lead_time: number
  item_status: string
  lead_time_unit: string
  quantity_range: string
  lead_time_value: number
  manufacture_lead_times: LeadTimeEntry[]
  category: string
  Sub_category: string
  unit: number
  sku_item_code: string
  collections: string[]
  cad_3d_files: string
  description: string
  product_material: string[]
  finish: string[]
  package_weight: number
  package_weight_unit: string
  product_dimension_length: number
  product_dimension_width: number
  product_dimension_height: number
  product_dimension_height_unit: string
  product_dimension_weight: number
  product_dimension_weight_unit: string
  assembly_requirement: string
  usage_type: string[]
  quantity: number
  mrp: number
  taxes: number[]
  discount_type: string
  discount_value: number | string
  price_after_discount: number
  low_stock_value: number
  low_stock_alert: boolean
  package_length: number
  package_width: number
  package_height: number
  package_height_unit: string
  package_type: string[]
  box_type: string
  handling_instructions: string
  courier_feasibility: string
  fragility_indicator: boolean
  options: Option[]
  variants: Variant[]
  assembly_requirement_document: string
  images: string[]
  operation_status: string
  shopify_status?: string
  brand?: string
  color?: string
  features?: string | string[]
  additional_info?: string
}

export interface ApiVariant {
  id: number
  name: string
  options: Array<{
    name: string
    values: string
  }>
  images: string[]
  extra_charges: number
  price_after_discount: number
  stock_quantity: number
  is_active: boolean
  extra_lead_time?: number
  variant_product_length?: number
  variant_product_width?: number
  variant_product_height?: number
  variant_product_dimension_unit?: string
  variant_shopify_weight?: string
  variant_shopify_weight_unit?: string
}

export interface ProductOptionsVariantsProps {
  options: Option[]
  variants: Variant[]
  apiVariants?: ApiVariant[]
  variantOptions?: VariantOption[]
  onOptionsChange: (options: Option[]) => void
  onVariantsChange: (variants: Variant[]) => void
  onSliderStateChange?: (isOpen: boolean) => void
  productName?: string
  productPrice?: number
  productWeight?: number
  productImage?: File
  productImageUrl?: string
  isVariantChange?: boolean
}

export interface DraftProductShape extends ProductListItem {
  sku?: string | number
  sku_id?: string | number
  product_name?: string
  title?: string
  category_name?: string
  categoryName?: string
  stock_quantity?: number
  qty?: number
  price?: number
  rate?: number
  product_id?: number
}