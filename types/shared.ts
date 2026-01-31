// types/shared.ts
// Shared primitives and common types used by multiple domains.

export type LegacySuccess<T> = {
  success: true
  data?: T
  message?: string
}

/**
 * Some legacy endpoints (seller endpoints) return this *seller-style* object on failure:
 *   { status_code: number, message: string, record?: T }
 *
 * Other legacy code uses the { success: false, message } shape.
 *
 * Accept both to match runtime.
 */
export type SellerFail<T = any> = {
  status_code: number
  message: string
  record?: T
}

export type LegacyFail = { success: false; message: string } | SellerFail<any>

export type LegacyResponse<T> = LegacySuccess<T> | LegacyFail

export interface SendOTPResponse {
  message: string
  status_code: number
}

export interface ApiResponse<T = unknown> {
  status_code: number
  message?: string
  record?: T
  count?: number
}

/**
 * Canonical product detail used across domains.
 * Dedupe point for repeated ProductDetail definitions.
 */
export interface ProductDetail {
  product_id: number
  product_name: string
  price_total: number
  unit_price: number
  qty: number
}

/** Generic small helpers */
export interface TaskProgress {
  progress: number
}

export interface QcDataImage {
  img_url: string
}

export type ID = number | string

export interface ActivityLog {
  type: string
  note: string
  qc_status?: string
  approved_by: string
  created_by: string
  created_on: string
  image: string[]
}