/**
 * Order Helper Functions
 * 
 * Consolidated utility functions for order processing, progress calculation,
 * status formatting, and UI state management.
 */

import type { OrderLine, OrderItem, QCData } from '../types/orders.types'
import type { QcData } from '@/lib/api/helpers/types'

// ============================================================================
// Data Transformation Utilities
// ============================================================================

/**
 * Normalizes QC data from API format to OrderItem format
 */
export const normalizeQcDataToOrderItem = (data: QcData[] | undefined): QCData[] =>
  (data || []).map((qc) => ({
    id: qc.id ?? 0,
    order_line_id: qc.order_line_id,
    product_id: qc.product_id,
    product_name: qc.product_name,
    type: qc.type,
    qc_status: qc.qc_status,
    images: qc.images || [],
    note: qc.note,
  }))

/**
 * Converts QC data to stage QC data items format
 */
export interface StageQcDataItem {
  order_line_id: number
  product_id: number
  product_name: string
  type: 'mfg_qc' | 'pkg_qc'
  qc_status: string
  note?: string
  images: Array<{ img_url: string }>
}

export const toQcDataItems = (data?: QCData[]): StageQcDataItem[] =>
  (data || []).map((qc) => ({
    order_line_id: qc.order_line_id,
    product_id: qc.product_id,
    product_name: qc.product_name,
    type: qc.type === 'mfg_qc' || qc.type === 'pkg_qc' ? qc.type : 'mfg_qc',
    qc_status: qc.qc_status,
    note: qc.note,
    images: qc.images || [],
  }))

// ============================================================================
// Progress Calculation
// ============================================================================

export type ProgressStage = 'completed' | 'in-progress' | 'pending'

export type ProgressState = {
  manufacturing: ProgressStage
  mfgQc: ProgressStage
  packaging: ProgressStage
  pkgQc: ProgressStage
  shipped: ProgressStage
}

const DEFAULT_PROGRESS: ProgressState = {
  manufacturing: 'pending',
  mfgQc: 'pending',
  packaging: 'pending',
  pkgQc: 'pending',
  shipped: 'pending'
}

const STATUS_ORDER = ['new', 'manufacture', 'mfg_qc', 'packaging', 'pkg_qc', 'shipping', 'shipped', 'delivered']

/**
 * Maps a status string to its corresponding progress state
 */
const getProgressForStatus = (status: string): ProgressState => {
  const statusLower = status.toLowerCase()

  const statusMap: Record<string, ProgressState> = {
    'new': {
      manufacturing: 'in-progress',
      mfgQc: 'pending',
      packaging: 'pending',
      pkgQc: 'pending',
      shipped: 'pending'
    },
    'manufacture': {
      manufacturing: 'completed',
      mfgQc: 'pending',
      packaging: 'pending',
      pkgQc: 'pending',
      shipped: 'pending'
    },
    'mfg_qc': {
      manufacturing: 'completed',
      mfgQc: 'completed',
      packaging: 'in-progress',
      pkgQc: 'pending',
      shipped: 'pending'
    },
    'packaging': {
      manufacturing: 'completed',
      mfgQc: 'completed',
      packaging: 'completed',
      pkgQc: 'pending',
      shipped: 'pending'
    },
    'pkg_qc': {
      manufacturing: 'completed',
      mfgQc: 'completed',
      packaging: 'completed',
      pkgQc: 'completed',
      shipped: 'pending'
    },
    'shipping': {
      manufacturing: 'completed',
      mfgQc: 'completed',
      packaging: 'completed',
      pkgQc: 'completed',
      shipped: 'completed'
    },
    'shipped': {
      manufacturing: 'completed',
      mfgQc: 'completed',
      packaging: 'completed',
      pkgQc: 'completed',
      shipped: 'completed'
    },
    'delivered': {
      manufacturing: 'completed',
      mfgQc: 'completed',
      packaging: 'completed',
      pkgQc: 'completed',
      shipped: 'completed'
    }
  }

  return statusMap[statusLower] || DEFAULT_PROGRESS
}

/**
 * Calculates progress state from multiple order lines (takes the minimum progress)
 */
export const getProgressFromOrderLines = (orderLines: OrderLine[]): ProgressState => {
  if (!orderLines || orderLines.length === 0) {
    return DEFAULT_PROGRESS
  }

  let minStatusIndex = STATUS_ORDER.length - 1
  orderLines.forEach(line => {
    const lineStatus = (line.status || 'new').toLowerCase()
    const statusIndex = STATUS_ORDER.indexOf(lineStatus)
    if (statusIndex !== -1 && statusIndex < minStatusIndex) {
      minStatusIndex = statusIndex
    }
  })

  const currentStatus = STATUS_ORDER[minStatusIndex] || 'new'
  return getProgressForStatus(currentStatus)
}

/**
 * Calculates progress for a single order item, taking QC statuses into account
 */
export const getProgressForSingleItem = (
  status: string,
  mfgQcStatus?: string,
  packagingQcStatus?: string
): ProgressState => {
  const statusLower = status.toLowerCase()
  
  // Get base progress from status
  let progress = getProgressForStatus(statusLower)

  // Override QC statuses if they have values
  if (mfgQcStatus && mfgQcStatus.trim() !== '') {
    const mfgQcStatusLower = mfgQcStatus.toLowerCase()
    if (mfgQcStatusLower === 'pending') {
      progress.mfgQc = 'in-progress'
      progress.packaging = 'pending'
    } else if (mfgQcStatusLower === 'approved' || mfgQcStatusLower === 'completed') {
      progress.mfgQc = 'completed'
      if (progress.packaging === 'pending') {
        progress.packaging = 'in-progress'
      }
    } else if (mfgQcStatusLower === 'in-progress' || mfgQcStatusLower === 'in_progress') {
      progress.mfgQc = 'in-progress'
      progress.packaging = 'pending'
    } else if (mfgQcStatusLower === 'rejected') {
      progress.mfgQc = 'pending'
      progress.packaging = 'pending'
    }
  }

  if (packagingQcStatus && packagingQcStatus.trim() !== '') {
    const packagingQcStatusLower = packagingQcStatus.toLowerCase()
    if (packagingQcStatusLower === 'pending') {
      progress.pkgQc = 'in-progress'
      progress.shipped = 'pending'
    } else if (packagingQcStatusLower === 'approved' || packagingQcStatusLower === 'completed') {
      progress.pkgQc = 'completed'
      if (progress.shipped === 'pending') {
        progress.shipped = 'in-progress'
      }
    } else if (packagingQcStatusLower === 'in-progress' || packagingQcStatusLower === 'in_progress') {
      progress.pkgQc = 'in-progress'
      progress.shipped = 'pending'
    } else if (packagingQcStatusLower === 'rejected') {
      progress.pkgQc = 'pending'
      progress.shipped = 'pending'
    }
  }

  return progress
}

// ============================================================================
// Status Formatting
// ============================================================================

export interface StatusDisplay {
  label: string
  color: string
  bgColor: string
}

/**
 * Formats status string for display with appropriate styling
 */
export const formatStatusDisplay = (status: string): StatusDisplay => {
  const statusMap: Record<string, StatusDisplay> = {
    'new': { label: 'New Order', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
    'manufacturing': { label: 'In Manufacturing', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
    'mfg_qc': { label: 'MFG QC', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
    'packaging': { label: 'Packaging', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
    'pkg_qc': { label: 'PKG QC', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' },
    'ready_to_ship': { label: 'Ready to Ship', color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-200' },
    'shipped': { label: 'Ready to ship', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
    'delivered': { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
    'cancelled': { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' }
  }

  const statusLower = status.toLowerCase()
  return statusMap[statusLower] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' }
}

/**
 * Gets the current status label for display based on progress state
 */
export const getCurrentStatusLabel = (
  itemProgress: ProgressState,
  mfgQcStatus?: string,
  packagingQcStatus?: string
): string => {
  // Check for rejected status first
  if (mfgQcStatus && mfgQcStatus.toLowerCase() === 'rejected') return 'MFG QC Rejected'
  if (packagingQcStatus && packagingQcStatus.toLowerCase() === 'rejected') return 'PKG QC Rejected'

  // Check progress states in order of workflow
  if (itemProgress.shipped === 'completed') return 'Completed'
  if (itemProgress.shipped === 'in-progress') return 'Shipping in Progress'
  if (itemProgress.pkgQc === 'completed' && itemProgress.shipped === 'pending') return 'Ready to Ship'
  if (itemProgress.pkgQc === 'in-progress') return 'PKG QC Pending'
  if (itemProgress.packaging === 'completed' && itemProgress.pkgQc === 'pending') return 'Pending PKG QC'
  if (itemProgress.packaging === 'in-progress') return 'Packing in Progress'
  if (itemProgress.mfgQc === 'completed' && itemProgress.packaging === 'pending') return 'MFG QC Approved'
  if (itemProgress.mfgQc === 'in-progress') return 'MFG QC Pending'
  if (itemProgress.manufacturing === 'completed' && itemProgress.mfgQc === 'pending') return 'Pending MFG QC'
  if (itemProgress.manufacturing === 'in-progress') return 'Manufacturing in Progress'
  return 'New Order'
}

// ============================================================================
// Button States
// ============================================================================

export type ButtonVariant = 'primary' | 'success'

export interface ButtonState {
  show: boolean
  label: string
  variant?: ButtonVariant
  disabled: boolean
}

export interface ButtonStates {
  manufacturingButton: ButtonState | null
  waitingApprovalButton: ButtonState | null
  packingButton: ButtonState | null
  approvedByAdminButton?: ButtonState | null
  shippingButton: ButtonState | null
}

/**
 * Determines which action buttons should be shown based on item status and progress
 */
export const getButtonStates = (
  itemStatus: string,
  itemProgress: ProgressState,
  item: OrderItem
): ButtonStates => {
  const statusLower = itemStatus.toLowerCase()

  // Check if QC is rejected
  const isMfgQcRejected = item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected'
  const isPkgQcRejected = item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected'

  // Initial State – "New": Manufacturing is in-progress, show "Manufacturing Finalized" button
  if (statusLower === 'new') {
    return {
      manufacturingButton: { show: true, label: 'Manufacturing Finalized', variant: 'primary', disabled: false },
      waitingApprovalButton: null,
      packingButton: null,
      shippingButton: null
    }
  }

  // When status is "manufacture" - Manufacturing completed, MFG QC is grey/pending
  if (statusLower === 'manufacture' || isMfgQcRejected) {
    return {
      manufacturingButton: {
        show: true,
        label: isMfgQcRejected ? 'Resubmit for QC' : 'Submit for QC',
        variant: 'primary',
        disabled: false
      },
      waitingApprovalButton: item.mfgQcStatus === 'pending' ? { show: true, label: 'Waiting for Approval', disabled: true } : null,
      packingButton: null,
      shippingButton: null
    }
  }

  // When status is "mfg_qc" - Admin approved Manufacturing QC
  if (statusLower === 'mfg_qc') {
    const isMfgQcApproved = !item.mfgQcStatus || item.mfgQcStatus.toLowerCase() === 'approved' || item.mfgQcStatus.toLowerCase() === 'completed'

    return {
      manufacturingButton: null,
      waitingApprovalButton: null,
      packingButton: isMfgQcApproved ? {
        show: true,
        label: isPkgQcRejected ? 'Resubmit for QC' : 'Submit for QC',
        variant: 'success',
        disabled: false
      } : null,
      shippingButton: null
    }
  }

  // When status is "packaging" - Packing completed, PKG QC is grey/pending
  if (statusLower === 'packaging' || isPkgQcRejected) {
    return {
      manufacturingButton: null,
      waitingApprovalButton: null,
      packingButton: {
        show: true,
        label: isPkgQcRejected ? 'Resubmit for QC' : 'Submit for QC',
        variant: 'success',
        disabled: false
      },
      approvedByAdminButton: item.packagingQcStatus === 'pending' ? { show: true, label: 'Waiting for Approval', disabled: true } : null,
      shippingButton: null
    }
  }

  // When status is "pkg_qc" - Packing QC approved
  if (statusLower === 'pkg_qc') {
    const isPkgQcApproved = !item.packagingQcStatus || item.packagingQcStatus.toLowerCase() === 'approved' || item.packagingQcStatus.toLowerCase() === 'completed'

    return {
      manufacturingButton: null,
      waitingApprovalButton: null,
      packingButton: null,
      approvedByAdminButton: null,
      shippingButton: isPkgQcApproved ? { show: true, label: 'Create Shipping Order', variant: 'primary', disabled: false } : null
    }
  }

  // When shipping or later stages
  if (['shipping', 'shipped', 'delivered'].includes(statusLower)) {
    return {
      manufacturingButton: null,
      waitingApprovalButton: null,
      packingButton: null,
      approvedByAdminButton: null,
      shippingButton: null
    }
  }

  return {
    manufacturingButton: null,
    waitingApprovalButton: null,
    packingButton: null,
    approvedByAdminButton: null,
    shippingButton: null
  }
}

// ============================================================================
// Pagination Helpers
// ============================================================================

/**
 * Generates page numbers for pagination display with ellipsis
 */
export const getPageNumbers = (currentPage: number, totalPages: number): Array<number | string> => {
  const pages: Array<number | string> = []
  const maxVisiblePages = 5

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) {
      pages.push(i)
    }
    pages.push("...")
    pages.push(totalPages)
  } else if (currentPage >= totalPages - 2) {
    pages.push(1)
    pages.push("...")
    for (let i = totalPages - 3; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    pages.push("...")
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pages.push(i)
    }
    pages.push("...")
    pages.push(totalPages)
  }

  return pages
}
