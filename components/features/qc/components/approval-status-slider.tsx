"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle,
  AlertCircle,
  ChevronDown,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ImagePreviewModal from '@/components/shared/ui/image-preview-modal'

interface ApprovedRejectedSliderProps {
  isOpen: boolean
  onClose: () => void
  stageType: 'mfg_qc' | 'pkg_qc'
  itemName: string
  itemId: string
  orderLineId: number
  itemDetails: {
    quantity: number
    unitPrice: number
    weight: string
    color: string
    subtotal: number
    image?: string
    status?: string
    mfgQcStatus?: string
    packagingQcStatus?: string
  }
  qcData: {
    order_line_id: number
    product_id: number
    product_name: string
    type: string
    qc_status: string
    images: { img_url: string }[]
    note?: string
  }[]
  onApprove: (orderLineId: number, qcType: string) => void
  onReject: (orderLineId: number, qcType: string, reason?: string) => void
  onSliderStateChange?: (isOpen: boolean) => void
  mfgRejectionCount?: number
  pkgRejectionCount?: number
  allMfgQcData?: Array<{
    id: number
    order_line_id: number
    product_id: number
    product_name: string
    type: string
    qc_status: string
    images: { img_url: string }[]
    note?: string
  }>
  allPkgQcData?: Array<{
    id: number
    order_line_id: number
    product_id: number
    product_name: string
    type: string
    qc_status: string
    images: { img_url: string }[]
    note?: string
  }>
}

const ApprovedRejectedSlider: React.FC<ApprovedRejectedSliderProps> = ({ 
  isOpen, 
  onClose, 
  stageType,
  itemName,
  itemId,
  orderLineId,
  itemDetails,
  qcData,
  onApprove,
  onReject,
  onSliderStateChange,
  mfgRejectionCount = 0,
  pkgRejectionCount = 0,
  allMfgQcData = [],
  allPkgQcData = []
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null)
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedReason, setSelectedReason] = useState<string>('')
  
  // Shared image preview modal state
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewImages, setPreviewImages] = useState<string[] | undefined>(undefined)
  const [previewStartIndex, setPreviewStartIndex] = useState(0)
  
  const predefinedReasons = [
    'Bad Packaging',
    'Bad Label',
    'No Label',
    'No Invoice',
    'Quality Issue',
    'Wrong Item',
    'Damaged Product'
  ]

  // Notify parent component when slider state changes
  React.useEffect(() => {
    onSliderStateChange?.(isOpen)
  }, [isOpen, onSliderStateChange])

  // Handle close with state notification
  const handleClose = () => {
    onClose()
    onSliderStateChange?.(false)
    setIsProcessing(false)
    setProcessingAction(null)
    setShowRejectionForm(false)
    setRejectionReason('')
    setSelectedReason('')
  }

  // Handle approve action
  const handleApprove = async () => {
    setIsProcessing(true)
    setProcessingAction('approve')
    try {
      await onApprove(orderLineId, stageType)
      handleClose()
    } catch (error) {
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  // Handle reject button click - show rejection form
  const handleRejectClick = () => {
    setShowRejectionForm(true)
  }

  // Handle reject action with reason
  const handleRejectSubmit = async () => {
    const customReason = rejectionReason.trim()
    
    if (!customReason && !selectedReason) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    const finalReason = [selectedReason, customReason].filter(Boolean).join(' - ')
    
    setIsProcessing(true)
    setProcessingAction('reject')
    try {
      await onReject(orderLineId, stageType, finalReason)
      handleClose()
    } catch (error) {
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  // Handle cancel rejection
  const handleCancelRejection = () => {
    setShowRejectionForm(false)
    setRejectionReason('')
    setSelectedReason('')
  }
  
  // Select predefined reason (single selection)
  const selectReason = (reason: string) => {
    setSelectedReason(reason === selectedReason ? '' : reason)
  }

  const openImagePreview = (urls: string[], startIndex: number) => {
    setPreviewImages(urls)
    setPreviewStartIndex(startIndex)
    setPreviewImageUrl(urls[startIndex] ?? null)
    setIsImagePreviewOpen(true)
  }

  // Helper function to get progress for a single item based on status
  const getProgressForSingleItem = (status: string): {
    manufacturing: 'completed' | 'in-progress' | 'pending'
    mfgQc: 'completed' | 'in-progress' | 'pending'
    packaging: 'completed' | 'in-progress' | 'pending'
    pkgQc: 'completed' | 'in-progress' | 'pending'
    shipped: 'completed' | 'in-progress' | 'pending'
  } => {
    const statusLower = status.toLowerCase()
    
    type ProgressStage = 'completed' | 'in-progress' | 'pending'
    type ProgressType = {
      manufacturing: ProgressStage
      mfgQc: ProgressStage
      packaging: ProgressStage
      pkgQc: ProgressStage
      shipped: ProgressStage
    }
    
    const defaultProgress: ProgressType = {
      manufacturing: 'pending',
      mfgQc: 'pending',
      packaging: 'pending',
      pkgQc: 'pending',
      shipped: 'pending'
    }
    
    const statusMap: Record<string, ProgressType> = {
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
        mfgQc: 'in-progress',
        packaging: 'pending',
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
        pkgQc: 'in-progress',
        shipped: 'pending'
      },
      'shipping': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'in-progress'
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

    return statusMap[statusLower] || defaultProgress
  }

  // Get stage-specific content
  const getStageContent = () => {
    switch (stageType) {
      case 'mfg_qc':
        return {
          title: 'Manufacturing QC',
          instruction: 'Review 5 photos from different angle and a video',
          qcStatus: qcData[0]?.qc_status || 'pending'
        }
      case 'pkg_qc':
        return {
          title: 'Packaging QC',
          instruction: 'Review 5 photos from different angle and a video',
          qcStatus: qcData[0]?.qc_status || 'pending'
        }
      default:
        return {
          title: 'QC Review',
          instruction: 'Review 5 photos from different angle and a video',
          qcStatus: 'pending'
        }
    }
  }

  const stageContent = getStageContent()
  
  // Get progress based on item status
  const itemProgress = getProgressForSingleItem(itemDetails.status || 'new')

  if (!isOpen) return null

  return (
    <>
      {/* Progress Modal - Above everything */}
      {isProcessing && (
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 z-[9999]">
            <div className="text-center mb-4">
              <h2 className="font-urbanist text-xl font-semibold">
                {processingAction === 'approve' ? 'Approving...' : processingAction === 'reject' ? 'Rejecting...' : 'Processing...'}
              </h2>
            </div>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              <p className="text-gray-600 font-urbanist text-center text-base">
                {processingAction === 'approve' 
                  ? 'Please wait while we process your approval...' 
                  : processingAction === 'reject' 
                  ? 'Please wait while we process your rejection...' 
                  : 'Please wait...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        "fixed inset-0 z-40 transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-white transition-all duration-300 ease-in-out",
          isOpen ? "bg-opacity-50" : "bg-opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Sliding Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-[606px] bg-gray-50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out rounded-l-lg",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-[16px] h-[56px] bg-white border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h2 className="label-1 font-semibold text-gray-900 font-urbanist">
                QC Review
              </h2>
              {/* <Info className="h-4 w-4 text-gray-400" /> */}
            </div>
            {/* <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist" 
                      style={{ backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }}>
                  {stageContent.qcStatus === 'pending' ? 'Pending Review' : stageContent.qcStatus}
                </span> */}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-[16px] space-y-4 bg-gray-50">

            {/* Item Detail */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between p-[8px] border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Item Detail</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              <div className="flex items-center space-x-4 p-[8px]">
                <img 
                  src={itemDetails.image || "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                  alt={itemName}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 font-urbanist">{itemName}</h4>
                  <div className="text-sm text-gray-500 font-urbanist">
                    Qty: {itemDetails.quantity} • ₹{(itemDetails.unitPrice || 0).toLocaleString()}/unit • {itemDetails.weight} • Color: {itemDetails.color || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 font-urbanist">₹{(itemDetails.subtotal || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-500 font-urbanist">Subtotal</div>
                </div>
              </div>

              {/* Combined Progress View */}
              <div className="flex items-center py-[16px] px-[16px]">
                {/* Step 1: Manufacturing */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    itemProgress.manufacturing === 'completed' ? "border-green-500 bg-green-50" : 
                    itemProgress.manufacturing === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 1</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Manufacturing</div>
                    <div className="mt-1">
                      {itemProgress.manufacturing === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {itemProgress.manufacturing === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {itemProgress.manufacturing === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  itemProgress.manufacturing === 'completed' ? "bg-green-500" : "bg-gray-300"
                )} />
                
                {/* Step 2: MFG QC */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    itemProgress.mfgQc === 'completed' ? "border-green-500 bg-green-50" : 
                    itemProgress.mfgQc === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 2</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">MFG QC</div>
                    <div className="mt-1">
                      {itemProgress.mfgQc === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {itemProgress.mfgQc === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {itemProgress.mfgQc === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  itemProgress.mfgQc === 'completed' ? "bg-green-500" : 
                  itemProgress.mfgQc === 'in-progress' ? "bg-yellow-500" : "bg-gray-300"
                )} />
                
                {/* Step 3: Packaging */}
                {/* <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    itemProgress.packaging === 'completed' ? "border-green-500 bg-green-50" : 
                    itemProgress.packaging === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 3</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Packaging</div>
                    <div className="mt-1">
                      {itemProgress.packaging === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {itemProgress.packaging === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {itemProgress.packaging === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div> */}
                
                <div className={cn(
                  "h-0.5 w-8",
                  itemProgress.packaging === 'completed' ? "bg-green-500" : "bg-gray-300"
                )} />
                
                {/* Step 4: PKG QC */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    itemProgress.pkgQc === 'completed' ? "border-green-500 bg-green-50" : 
                    itemProgress.pkgQc === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 4</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">PKG QC</div>
                    <div className="mt-1">
                      {itemProgress.pkgQc === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {itemProgress.pkgQc === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {itemProgress.pkgQc === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  itemProgress.pkgQc === 'completed' ? "bg-green-500" : "bg-gray-300"
                )} />
                
                {/* Step 5: Ready to ship */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    itemProgress.shipped === 'completed' ? "border-green-500 bg-green-50" : 
                    itemProgress.shipped === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 5</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Ready to ship</div>
                    <div className="mt-1">
                      {itemProgress.shipped === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {itemProgress.shipped === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {itemProgress.shipped === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection History Section */}
            {stageType === 'mfg_qc' && mfgRejectionCount > 0 && (
              <div className="space-y-4 border border-gray-200 rounded-lg">
                <div className="bg-white rounded-lg">
                  <div className="flex items-center justify-between p-[8px] border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Manufacturing QC</h3>
                      {/* <Info className="h-4 w-4 text-gray-400" /> */}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white font-urbanist">
                        Rejected
                      </span>
                      <span className="text-sm font-medium text-gray-700 font-urbanist">
                        : {mfgRejectionCount} {mfgRejectionCount === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="">
                    {allMfgQcData
                      .filter(data => data.qc_status === 'rejected')
                      .map((rejection, index) => (
                        <div key={index}>
                          {rejection.note && (
                            <div className="py-[2px] mx-[8px] mt-[4px]">
                              <p className="text-sm text-gray-700 font-urbanist">
                                Reason for Rejection : {rejection.note}
                              </p>
                            </div>
                          )}
                          {index < allMfgQcData.filter(data => data.qc_status === 'rejected').length - 1 && (
                            <div className="border-b border-gray-200"></div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {stageType === 'pkg_qc' && pkgRejectionCount > 0 && (
              <div className="space-y-4 border border-gray-200 rounded-lg">
                <div className="bg-white rounded-lg">
                  <div className="flex items-center justify-between p-[8px] border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Packaging QC</h3>
                      {/* <Info className="h-4 w-4 text-gray-400" /> */}  
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white font-urbanist">
                        Rejected
                      </span>
                      <span className="text-sm font-medium text-gray-700 font-urbanist">
                        : {pkgRejectionCount} {pkgRejectionCount === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="">
                    {allPkgQcData
                      .filter(data => data.qc_status === 'rejected')
                      .map((rejection, index) => (
                        <div key={index}>
                          {rejection.note && (
                            <div className="py-[2px] mx-[8px] mt-[4px]">
                              <p className="text-sm text-gray-700 font-urbanist">
                                Reason for Rejection : {rejection.note}
                              </p>
                            </div>
                          )}
                          {index < allPkgQcData.filter(data => data.qc_status === 'rejected').length - 1 && (
                            <div className="border-b border-gray-200"></div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* QC Review Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200">
                <div className="flex items-center justify-between p-[8px] pb-[0px]">
                  <div className="flex items-center space-x-2">
                    <h3 className="label-1 font-semibold text-gray-900 font-urbanist">{stageContent.title}</h3>
                    {/* <Info className="h-4 w-4 text-gray-400" /> */}  
                  </div>
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                </div>
                <div className="text-sm text-gray-600 font-urbanist p-[8px] pt-[0px]">
                  {stageContent.instruction}
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Submitted Images Display */}
                  {qcData && qcData.length > 0 && qcData[0].images && qcData[0].images.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {qcData[0].images.map((image, index) => (
                          <div 
                            key={index} 
                            className="relative border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-blue-500 transition-all group"
                            onClick={() => openImagePreview(qcData[0].images.map(i => i.img_url), index)}
                          >
                            <div className="relative">
                              <img 
                                src={image.img_url} 
                                alt={`QC Image ${index + 1}`} 
                                className="w-full h-32 object-cover rounded"
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              QC Image {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 font-urbanist">
                      No images submitted for QC review
                    </div>
                  )}

                  {/* Rejection Form */}
                  {showRejectionForm && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      {/* Predefined Reasons */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-urbanist mb-2">
                          Select reasons for rejection
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {predefinedReasons.map((reason) => (
                            <button
                              key={reason}
                              onClick={() => selectReason(reason)}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all font-urbanist",
                                selectedReason === reason
                                  ? "bg-gray-200 text-gray-800 border-2 border-gray-600 shadow-sm"
                                  : "bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100"
                              )}
                            >
                              {reason}
                              {selectedReason === reason && (
                                <XCircle className="h-3 w-3 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Custom Reason Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-urbanist mb-2">
                          Enter your reason for rejection
                        </label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Please provide a detailed reason for rejection..."
                          className="w-full min-h-[60px] border-gray-300 focus:border-red-500 focus:ring-red-500"
                          rows={2}
                        />
                      </div>
                      
                      {/* Action Buttons - Right Aligned */}
                      <div className="flex justify-end space-x-3">
                        <Button
                          onClick={handleCancelRejection}
                          disabled={isProcessing}
                          className="w-auto px-6 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors font-urbanist"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRejectSubmit}
                          disabled={isProcessing || (!rejectionReason.trim() && !selectedReason)}
                          className="w-auto px-6 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors font-urbanist"
                        >
                          {isProcessing ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            <span>Reject/Resubmit</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!showRejectionForm && (
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        onClick={handleRejectClick}
                        disabled={isProcessing}
                        className="w-auto px-6 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors font-urbanist"
                      >
                        <span>Reject/Resubmit</span>
                      </Button>
                      
                      <Button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="w-auto px-6 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors font-urbanist"
                      >
                        {isProcessing ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <span>Approve</span>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ImagePreviewModal
        open={isImagePreviewOpen}
        onOpenChange={setIsImagePreviewOpen}
        imageUrl={previewImageUrl}
        images={previewImages}
        startIndex={previewStartIndex}
        alt={`${stageContent.title} image`}
      />
    </div>
    </>
  )
}

export default ApprovedRejectedSlider
