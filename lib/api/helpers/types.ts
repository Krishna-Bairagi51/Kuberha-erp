/**
 * Shared types used across helpers
 */

import type { FormData } from "@/types/domains/supplier"

// Re-export types that are commonly used
export type { FormData }

// QC Data type (used by mapQcData helper)
export interface QcData {
  id?: number
  order_line_id: number
  product_id: number
  product_name: string
  type: "mfg_qc" | "pkg_qc"
  qc_status: string
  note?: string
  images: { img_url: string }[]
}

/**
 * Map QC data from API response format
 */
export const mapQcData = (qcData: any[] | undefined, defaultType: 'mfg_qc' | 'pkg_qc'): QcData[] => {
  return (qcData || []).map((qc: any): QcData => ({
    id: qc.id,
    order_line_id: qc.order_line_id,
    product_id: qc.product_id,
    product_name: qc.product_name,
    type: (qc.type === 'mfg_qc' || qc.type === 'pkg_qc') ? qc.type : defaultType,
    qc_status: qc.qc_status,
    note: qc.note,
    images: qc.images || []
  }))
}
