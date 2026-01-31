// types/domains/ai.ts
import { ApiResponse, TaskProgress } from "../shared";

export interface UploadTransformResponse {
  task_id: string
  status: string
  message: string
}

export interface ExtractedProduct {
  name: string
  hsn_code: string
  product_type: string
  category: string
  sub_category: string
  collections: string[]
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
  mrp: number
  taxes: any[]
  discount_type: string
  discount_value: number
  price_after_discount: number
  low_stock_value: number
  low_stock_alert: number
  package_length: number
  package_width: number
  package_height: number
  package_height_unit: string
  package_type: string[]
  options: Array<{
    name: string
    values: string[]
  }>
  variants: Array<{
    title: string
    extra_charges: number
    stock_quantity: number
    extra_lead_time: number
    variant_product_length: number
    variant_product_width: number
    variant_product_height: number
    variant_product_dimension_unit: string
    variant_shopify_weight: string
    variant_shopify_weight_unit: string
  }>
  item_status?: string
}

export interface TaskResultMetadata {
  user_id: number
  status: string
  message: string
  output_file: string
  total_products: number
  total_chunks: number
  images_extracted: number
}

export interface TaskStatusResponse {
  task_id: string
  status: "PROGRESS" | "SUCCESS" | "FAILURE" | "PENDING"
  progress: TaskProgress
  result: ExtractedProduct[] | TaskResultMetadata | null
  error: string | null
  current: number | null
  total: number | null
  message: string
}

export interface UploadTransformApiResponse extends ApiResponse<UploadTransformResponse> {}
export interface TaskStatusApiResponse extends ApiResponse<TaskStatusResponse> {}
