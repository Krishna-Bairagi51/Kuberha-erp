/**
 * Order Item Card Component
 * 
 * Displays a single order item with:
 * - Product information and image
 * - Progress tracker (5 stages)
 * - Current status
 * - Action buttons based on status
 */

'use client'

import React, { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIndianCurrency } from '@/lib/api/helpers/number'
import { ImagePreviewModal } from '@/components/shared'
import { 
  getProgressForSingleItem, 
  getCurrentStatusLabel, 
  getButtonStates,
  type ProgressState 
} from '../utils/order-helpers'
import type { OrderItem } from '../types/orders.types'

export interface OrderItemCardProps {
  item: OrderItem
  index: number
  totalItems: number
  userType: 'seller' | 'admin'
  onManufacturingFinalized: (itemId: string, orderLineId: number) => Promise<void>
  onSubmitManufacturingQC: (item: OrderItem) => void
  onSubmitPackingQC: (item: OrderItem) => void
  onStartShipping: (itemId: string, orderLineId: number) => void
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  item,
  index,
  totalItems,
  userType,
  onManufacturingFinalized,
  onSubmitManufacturingQC,
  onSubmitPackingQC,
  onStartShipping,
}) => {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const itemProgress = getProgressForSingleItem(item.status, item.mfgQcStatus, item.packagingQcStatus)
  const buttonStates = getButtonStates(item.status, itemProgress, item)
  const statusLabel = getCurrentStatusLabel(itemProgress, item.mfgQcStatus, item.packagingQcStatus)
  
  const completedSteps = [
    itemProgress.manufacturing,
    itemProgress.mfgQc,
    itemProgress.packaging,
    itemProgress.pkgQc,
    itemProgress.shipped
  ].filter(status => status === 'completed').length

  const statusLower = item.status.toLowerCase()
  const isShippingStage = ['shipping', 'shipped', 'delivered'].includes(statusLower)

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = (open: boolean) => {
    setIsPreviewOpen(open)
    if (!open) {
      setPreviewImageUrl(null)
    }
  }

  return (
    <div className={index > 0 ? "mt-[16px]" : ""}>
      {/* Product Header */}
      <div className="flex items-start gap-4 mb-4">
        <img
          src={item.image}
          alt={item.name}
          className="w-[50px] h-[50px] object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleImageClick(item.image)}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 font-urbanist body-2">
            {item.name} • Qty: {item.quantity}
          </h3>
          <p className="text-sm text-gray-600 font-urbanist body-3 font-spectral">
            <span className="text-gray-900 font-semibold font-spectral">
              {formatIndianCurrency(item.unitPrice || 0)}
            </span>
            /unit • {item.weight}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 font-spectral">
            {formatIndianCurrency(item.subtotal || 0)}
          </div>
          <div className="text-sm text-gray-500 font-urbanist body-3">Subtotal</div>
        </div>
      </div>

      {/* Progress Info */}
      <div className="flex items-center gap-2 mb-[4px]">
        <span className="body-3 font-medium text-gray-600 font-urbanist">
          {completedSteps} of 5 steps completed
        </span>
      </div>

      {/* Progress Flow */}
      <div className="flex items-center gap-2 mb-[16px] flex-nowrap">
        {[
          { label: 'Manufacturing', progress: itemProgress.manufacturing, step: 1 },
          { label: 'MFG QC', progress: itemProgress.mfgQc, step: 2 },
          { label: 'PKG QC', progress: itemProgress.pkgQc, step: 3 },
          { label: 'Ready to ship', progress: itemProgress.shipped, step: 4 }
        ].map(({ label, progress, step }, stepIndex) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className={cn(
                "w-full h-[62px] rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium font-urbanist",
                progress === 'completed' ? "border-green-500 bg-green-50" :
                  progress === 'in-progress' ? "border-yellow-500 bg-yellow-50" :
                    (label === 'MFG QC' && item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ||
                      (label === 'PKG QC' && item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected')
                      ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"
              )}>
                <div className="text-xs whitespace-nowrap">{label}</div>
                <div className="mt-1">
                  {progress === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {progress === 'in-progress' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                  {(label === 'MFG QC' && item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ||
                    (label === 'PKG QC' && item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected')
                    ? <AlertCircle className="h-4 w-4 text-red-500" /> : null}
                  {progress === 'pending' && !((label === 'MFG QC' && item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ||
                    (label === 'PKG QC' && item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected')) &&
                    <span className="text-xs font-semibold text-gray-400">{step}</span>}
                </div>
              </div>
            </div>
            {stepIndex < 3 && (
              <div className={cn(
                "h-0.5 w-4 flex-shrink-0",
                progress === 'completed' ? "bg-green-500" :
                  (label === 'MFG QC' && item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ||
                    (label === 'PKG QC' && item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected')
                    ? "bg-red-500" : "bg-gray-300"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-urbanist body-3">Status:</span>
          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist"
            style={(() => {
              if (statusLabel === 'MFG QC Rejected' || statusLabel === 'PKG QC Rejected') {
                return { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#DC2626' }
              }
              return { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }
            })()}>
            {statusLabel}
          </span>
        </div>

        <div className="flex gap-2">
          {!isShippingStage && (
            <>
              {/* Waiting for Admin Approval Tag */}
              {(itemProgress.mfgQc === 'in-progress' || itemProgress.pkgQc === 'in-progress') && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 font-urbanist">
                    Waiting for Admin Approval
                  </span>
                </div>
              )}

              {/* Manufacturing Button */}
              {buttonStates.manufacturingButton && (
                userType === 'seller' ? (
                  <button
                    onClick={async () => {
                      if (buttonStates.manufacturingButton?.label === 'Manufacturing Finalized') {
                        await onManufacturingFinalized(item.id, item.orderLineId)
                      } else if (buttonStates.manufacturingButton?.label === 'Submit for QC' || buttonStates.manufacturingButton?.label === 'Resubmit for QC') {
                        onSubmitManufacturingQC(item)
                      }
                    }}
                    disabled={buttonStates.manufacturingButton.disabled}
                    className={cn(
                      "px-4 py-2 text-white text-sm font-medium rounded-md transition-colors font-urbanist label-2",
                      buttonStates.manufacturingButton.variant === 'primary'
                        ? "bg-secondary-900 hover:bg-secondary-800"
                        : "bg-secondary-900 hover:bg-secondary-800",
                      buttonStates.manufacturingButton.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {buttonStates.manufacturingButton.label}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 font-urbanist">
                      Waiting for Seller Actions
                    </span>
                  </div>
                )
              )}

              {/* Waiting for Approval Button (Disabled) - MFG QC */}
              {buttonStates.waitingApprovalButton && (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md cursor-not-allowed font-urbanist label-2"
                >
                  {buttonStates.waitingApprovalButton.label}
                </button>
              )}

              {/* Packing Button */}
              {buttonStates.packingButton && (
                <button
                  onClick={() => {
                    if (buttonStates.packingButton?.label === 'Submit for QC' || buttonStates.packingButton?.label === 'Resubmit for QC') {
                      onSubmitPackingQC(item)
                    }
                  }}
                  disabled={buttonStates.packingButton.disabled}
                  className={cn(
                    "px-4 py-2 bg-secondary-900 text-white text-sm font-medium rounded-md hover:bg-secondary-800 transition-colors font-urbanist label-2",
                    buttonStates.packingButton.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {buttonStates.packingButton.label}
                </button>
              )}

              {/* Waiting for Approval Button (Disabled) - PKG QC */}
              {buttonStates.approvedByAdminButton && (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md cursor-not-allowed font-urbanist label-2"
                >
                  {buttonStates.approvedByAdminButton.label}
                </button>
              )}

              {/* Shipping Button */}
              {buttonStates.shippingButton && (
                <button
                  onClick={() => onStartShipping(item.id, item.orderLineId)}
                  className="px-4 py-2 bg-secondary-900 text-white text-sm font-medium rounded-md hover:bg-secondary-800 transition-colors font-urbanist label-2"
                >
                  {buttonStates.shippingButton.label}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Divider between items */}
      {index < totalItems - 1 && (
        <div className="border-t border-gray-200 mt-6"></div>
      )}

      <ImagePreviewModal
        open={isPreviewOpen}
        onOpenChange={handleClosePreview}
        imageUrl={previewImageUrl}
        alt="Product image preview"
      />
    </div>
  )
}
