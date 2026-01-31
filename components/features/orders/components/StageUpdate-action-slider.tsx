"use client"
import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Camera, CheckCircle, AlertCircle, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useUpdateProcessStatusWithImagesMutation } from '../hooks/use-orders-query'
import ImagePreviewModal from '@/components/shared/ui/image-preview-modal'

interface QcDataItem {
  order_line_id: number
  product_id: number
  product_name: string
  type: 'mfg_qc' | 'pkg_qc'
  qc_status: string
  note?: string
  images: Array<{ img_url: string }>
}

interface StageUpdateActionSliderProps {
  isOpen: boolean
  onClose: () => void
  stageType: 'manufacturing' | 'packaging'
  itemName: string
  itemId: string
  orderLineId: number
  orderId: number
  userType: 'seller' | 'admin'
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
    mfgQcData?: QcDataItem[]
    packagingQcData?: QcDataItem[]
  }
  onSubmit: (data: { imagesBase64: string[], note?: string }) => void
  onSliderStateChange?: (isOpen: boolean) => void
}

interface UploadedFile {
  id: string
  file: File
  type: 'image'
  preview: string
  base64: string
}

const StageUpdateActionSlider: React.FC<StageUpdateActionSliderProps> = ({
  isOpen,
  onClose,
  stageType,
  itemName,
  itemId,
  orderLineId,
  orderId,
  userType,
  itemDetails,
  onSubmit,
  onSliderStateChange
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  // Image preview modal state (shared UI)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewImages, setPreviewImages] = useState<string[] | undefined>(undefined)
  const [previewStartIndex, setPreviewStartIndex] = useState(0)

  const openImagePreview = (url: string) => {
    setPreviewImageUrl(url)
    setPreviewImages(undefined)
    setPreviewStartIndex(0)
    setIsImagePreviewOpen(true)
  }

  const openImagePreviewGallery = (urls: string[], startIndex: number) => {
    setPreviewImages(urls)
    setPreviewStartIndex(startIndex)
    setPreviewImageUrl(urls[startIndex] ?? null)
    setIsImagePreviewOpen(true)
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Initialize TanStack Query mutation hook
  const updateProcessStatusWithImagesMutation = useUpdateProcessStatusWithImagesMutation()

  // Notify parent component when slider state changes
  React.useEffect(() => {
    onSliderStateChange?.(isOpen)
  }, [isOpen, onSliderStateChange])

  // Handle close with state notification
  const handleClose = () => {
    onClose()
    onSliderStateChange?.(false)
    // Don't reset state when closing - preserve uploaded images and notes
    setIsSubmitting(false)
  }

  // Handle file selection and convert to base64
  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return
  
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // ✅ 50 MB limit (increase this if you want)
  
    const newFiles: UploadedFile[] = []
  
    for (const file of Array.from(files)) {
      if (file.size <= MAX_FILE_SIZE) {
        const base64 = await convertToBase64(file)
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: 'image' as const,
          preview: URL.createObjectURL(file),
          base64,
        })
      }
    }
  
    setUploadedFiles(prev => [...prev, ...newFiles])
  }
  
  

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files) {
      handleFileSelect(files)
    }
  }

  // Convert file to base64 (raw base64 string without data URL prefix)
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/png;base64,") to get only the base64 string
        const base64String = result.split(',')[1]
        resolve(base64String)
      }
      reader.onerror = error => reject(error)
    })
  }

  // Handle image upload
  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  // Remove uploaded file
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one image')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Send images as File objects (FormData)
      const imageFiles = uploadedFiles.map(f => f.file)
      
      // Determine the API type based on stageType
      const apiType = stageType === 'manufacturing' ? 'mfg_qc' : 'pkg_qc'

      // Use TanStack Query mutation with targeted invalidation
      const response = await updateProcessStatusWithImagesMutation.mutateAsync({
        order_line_id: orderLineId,
        type: apiType,
        images: imageFiles,
        note: note || undefined,
        orderId,
        userType
      })

      if (response.status_code === 200) {
        // Call the original onSubmit callback for any additional handling
        // Keep base64 for backward compatibility with callback
        const imagesBase64 = uploadedFiles.map(f => f.base64)
        await onSubmit({ imagesBase64, note })
        
        // Clean up preview URLs after successful submission
        uploadedFiles.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview)
          }
        })
        
        // Reset form after successful submission
        setUploadedFiles([])
        setNote('')
        handleClose()
      } else {
        toast.error(`Failed to update process status: ${response.message}`)
      }
    } catch (error) {
      toast.error('Error submitting files. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get progress for a single item based on status (from see-order-slider.tsx)
  const getProgressForSingleItem = (status: string, mfgQcStatus?: string, packagingQcStatus?: string): {
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
      // "manufacture" status: Manufacturing finalized, MFG QC is pending (grey) waiting for QC submission
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
      // "packaging" status: Packing finished, PKG QC is pending (grey) waiting for QC submission
      'packaging': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'pending',
        pkgQc: 'pending',
        shipped: 'pending'
      },
      // "pkg_qc" status: Packing QC approved, PKG QC is completed (green), ready for shipping
      'pkg_qc': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'pending'
      },
      // "shipping" status: Shipping completed
      'shipping': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'completed'
      },
      // "shipped" status: Shipping completed
      'shipped': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'completed'
      },
      // "delivered" status: All steps completed
      'delivered': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'completed'
      }
    }

    // Get base progress from status
    let progress = statusMap[statusLower] || defaultProgress

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
        // When MFG QC is rejected, revert to pending state
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
        // When PKG QC is rejected, revert to pending state
        progress.pkgQc = 'pending'
        progress.shipped = 'pending'
      }
    }

    return progress
  }

  // Get stage-specific content
  const getStageContent = () => {
    // Check if QC is rejected
    const isMfgQcRejected = stageType === 'manufacturing' && itemDetails.mfgQcStatus && itemDetails.mfgQcStatus.toLowerCase() === 'rejected'
    const isPkgQcRejected = stageType === 'packaging' && itemDetails.packagingQcStatus && itemDetails.packagingQcStatus.toLowerCase() === 'rejected'
    const isRejected = isMfgQcRejected || isPkgQcRejected
    
    switch (stageType) {
      case 'manufacturing':
        return {
          title: 'Manufacturing QC',
          instruction: 'Upload 5 photos from different angles',
          buttonText: isRejected ? 'Resubmit for QC' : 'Submit for QC',
          buttonColor: 'bg-secondary-900 hover:bg-secondary-800'
        }
      case 'packaging':
        return {
          title: 'Packaging QC',
          instruction: 'Upload 5 photos from different angles',
          buttonText: isRejected ? 'Resubmit for QC' : 'Submit for QC',
          buttonColor: 'bg-secondary-900 hover:bg-secondary-800'
        }
      default:
        return {
          title: 'QC Upload',
          instruction: 'Upload photos',
          buttonText: isRejected ? 'Resubmit for QC' : 'Submit for QC',
          buttonColor: 'bg-secondary-900 hover:bg-secondary-800'
        }
    }
  }

  const stageContent = getStageContent()
  
  // Get progress based on item status
  const itemProgress = getProgressForSingleItem(itemDetails.status || 'new', itemDetails.mfgQcStatus, itemDetails.packagingQcStatus)

  // Get QC data based on stage type
  const getQcHistoryData = (): QcDataItem[] => {
    if (stageType === 'manufacturing') {
      return itemDetails.mfgQcData || []
    } else {
      return itemDetails.packagingQcData || []
    }
  }

  const qcHistoryData = getQcHistoryData()

  // Filter to only show rejected items
  const rejectedItems = qcHistoryData.filter(item => item.qc_status.toLowerCase() === 'rejected')
  
  // Check if there's any rejected status in QC history
  const hasRejectedStatus = rejectedItems.length > 0

  if (!isOpen) return null

  return (
    <>
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
                Item Status 
              </h2>
              {/* <Info className="h-4 w-4 text-gray-400" /> */}
            </div>
            <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist" 
                      style={(() => {
                        const isMfgQcRejected = stageType === 'manufacturing' && itemDetails.mfgQcStatus && itemDetails.mfgQcStatus.toLowerCase() === 'rejected'
                        const isPkgQcRejected = stageType === 'packaging' && itemDetails.packagingQcStatus && itemDetails.packagingQcStatus.toLowerCase() === 'rejected'
                        if (isMfgQcRejected || isPkgQcRejected) {
                          return { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#DC2626' }
                        }
                        return { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }
                      })()}>
                  {(stageType === 'manufacturing' && itemDetails.mfgQcStatus && itemDetails.mfgQcStatus.toLowerCase() === 'rejected') ||
                   (stageType === 'packaging' && itemDetails.packagingQcStatus && itemDetails.packagingQcStatus.toLowerCase() === 'rejected')
                    ? `${stageContent.title} Rejected` : `Pending ${stageContent.title}`}
                </span>
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
                  className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                  onClick={() =>
                    openImagePreview(
                      itemDetails.image ||
                        "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    )
                  }
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
                    "w-[110px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
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
                    "w-[110px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    itemProgress.mfgQc === 'completed' ? "border-green-500 bg-green-50" : 
                    itemProgress.mfgQc === 'in-progress' ? "border-yellow-500 bg-yellow-50" : 
                    (itemDetails.mfgQcStatus && itemDetails.mfgQcStatus.toLowerCase() === 'rejected') ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 2</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">MFG QC</div>
                    <div className="mt-1">
                      {itemProgress.mfgQc === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {itemProgress.mfgQc === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {(itemDetails.mfgQcStatus && itemDetails.mfgQcStatus.toLowerCase() === 'rejected') && <AlertCircle className="h-6 w-6 text-red-500" />}
                      {itemProgress.mfgQc === 'pending' && !(itemDetails.mfgQcStatus && itemDetails.mfgQcStatus.toLowerCase() === 'rejected') && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  itemProgress.mfgQc === 'completed' ? "bg-green-500" : 
                  itemProgress.mfgQc === 'in-progress' ? "bg-yellow-500" : 
                  (itemDetails.mfgQcStatus && itemDetails.mfgQcStatus.toLowerCase() === 'rejected') ? "bg-red-500" : "bg-gray-300"
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
                    "w-[110px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    itemProgress.pkgQc === 'completed' ? "border-green-500 bg-green-50" : 
                    itemProgress.pkgQc === 'in-progress' ? "border-yellow-500 bg-yellow-50" : 
                    (itemDetails.packagingQcStatus && itemDetails.packagingQcStatus.toLowerCase() === 'rejected') ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 3</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">PKG QC</div>
                    <div className="mt-1">
                      {itemProgress.pkgQc === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {itemProgress.pkgQc === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {(itemDetails.packagingQcStatus && itemDetails.packagingQcStatus.toLowerCase() === 'rejected') && <AlertCircle className="h-6 w-6 text-red-500" />}
                      {itemProgress.pkgQc === 'pending' && !(itemDetails.packagingQcStatus && itemDetails.packagingQcStatus.toLowerCase() === 'rejected') && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  itemProgress.pkgQc === 'completed' ? "bg-green-500" : 
                  (itemDetails.packagingQcStatus && itemDetails.packagingQcStatus.toLowerCase() === 'rejected') ? "bg-red-500" : "bg-gray-300"
                )} />
                
                {/* Step 5: Shipping */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[110px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    itemProgress.shipped === 'completed' ? "border-green-500 bg-green-50" : 
                    itemProgress.shipped === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 4</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Shipping</div>
                    <div className="mt-1">
                      {itemProgress.shipped === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {itemProgress.shipped === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {itemProgress.shipped === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QC History Section - Only show rejected items, positioned ABOVE the upload section */}
            {hasRejectedStatus && (
              <div className="space-y-4 border border-gray-200 rounded-lg">
                <div className="bg-white rounded-lg">
                  <div className="flex items-center justify-between p-[8px] border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <h3 className="label-1 font-semibold text-gray-900 font-urbanist">{stageContent.title}</h3>
                      {/* <Info className="h-4 w-4 text-gray-400" /> */}  
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white font-urbanist">
                        Rejected
                      </span>
                      <span className="text-sm font-medium text-gray-700 font-urbanist">
                        : {rejectedItems.length} {rejectedItems.length === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="">
                    {rejectedItems.map((rejection, index) => (
                      <div key={index}>
                        {rejection.note && (
                          <div className="py-[2px] mx-[8px] mt-[4px]">
                            <p className="text-sm text-gray-700 font-urbanist">
                              Reason for Rejection : {rejection.note}
                            </p>
                          </div>
                        )}
                        {index < rejectedItems.length - 1 && (
                          <div className="border-b border-gray-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* QC Upload Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 p-2">
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
              
              {isExpanded && (
                <div className="p-4 space-y-4">
                  <div className="text-sm text-gray-600 font-urbanist">
                    {stageContent.instruction}
                  </div>
                  
                  {/* Upload Buttons - Only show when no images uploaded */}
                  {uploadedFiles.length === 0 && (
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleImageUpload}
                        className="flex items-center space-x-2 bg-secondary-900 hover:bg-secondary-800 text-white"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Upload Images</span>
                      </Button>
                    </div>
                  )}

                  {/* Drag and Drop Area - Show when there are uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                        isDragOver 
                          ? "border-secondary-900 bg-secondary-50" 
                          : "border-secondary-900 bg-gray-50 hover:bg-secondary-50"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="h-8 w-8 text-secondary-900" />
                        <div className="text-sm text-gray-600 font-urbanist">
                          Drag your file(s) or <span className="text-secondary-900 font-semibold cursor-pointer" onClick={handleImageUpload}>browse</span>
                        </div>
                        <div className="text-xs text-gray-500 font-urbanist">
                          Max 50 MB files are allowed
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />

                  {/* Uploaded Images Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 font-urbanist">Uploaded Images:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {uploadedFiles.map((file, idx) => (
                          <div key={file.id} className="relative border border-gray-200 rounded-lg p-2">
                            <img 
                              src={file.preview} 
                              alt="Preview" 
                              className="w-full h-20 object-cover rounded cursor-pointer"
                              onClick={() => openImagePreviewGallery(uploadedFiles.map(f => f.preview), idx)}
                            />
                            <button
                              onClick={() => removeFile(file.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {file.file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={uploadedFiles.length === 0 || isSubmitting}
                    className={cn(
                      "w-full text-white font-medium py-3 rounded-lg transition-colors font-urbanist",
                      uploadedFiles.length === 0 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : stageContent.buttonColor
                    )}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      stageContent.buttonText
                    )}
                  </Button>
                </div>
              )}
            </div>
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
        alt={itemName}
      />
    </>
  )
}

export default StageUpdateActionSlider