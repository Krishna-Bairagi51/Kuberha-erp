"use client"
import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, AlertCircle, Loader2, FileText, Sheet } from 'lucide-react'
import { toast } from 'sonner'
import { uploadAndTransform, getTaskStatus } from '@/lib/api/endpoints/ai'
import type { TaskStatusResponse, ExtractedProduct, TaskResultMetadata } from '@/types/domains/ai'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { inventoryService } from '@/components/features/inventory/services/inventory.service'
import { formatIndianCurrency } from '@/lib/api/helpers/number'
import { LoadingAnimation } from '@/components/shared/ui/loading-animation'

const BASE_SELLER_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api.msme-dashboard.com"

interface ExtractDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProcessingChange?: (isProcessing: boolean) => void
}

export default function ExtractDetailModal({
  open,
  onOpenChange,
  onProcessingChange,
}: ExtractDetailModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatusResponse | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedProduct[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [canRetry, setCanRetry] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const allowedFileTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ]

  const allowedExtensions = ['.xlsx', '.xls']

  const validateFile = (file: File): boolean => {
    setError(null)

    // Check file type
    const isValidType = allowedFileTypes.includes(file.type) ||
      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isValidType) {
      setError('Please upload only Excel (.xlsx, .xls) files')
      return false
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return false
    }

    return true
  }

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
      setError(null)
      setCanRetry(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isUploading) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (isUploading) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (isUploading) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      if (files.length > 1) {
        setError('Please upload only one file at a time')
        return
      }
      handleFileSelect(files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError(null)
    setTaskId(null)
    setTaskStatus(null)
    setExtractedData([])
    setCanRetry(false)
    setEstimatedTime('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    if (extension === '.xlsx' || extension === '.xls') {
      return <Sheet className="h-8 w-8 text-green-600" />
    }
    return <FileText className="h-8 w-8 text-gray-600" />
  }

  // Save bulk products API
  const saveBulkProducts = async (products: ExtractedProduct[]): Promise<void> => {
    const res = await inventoryService.createBulkProductRecord(products)
    if (!res || res.status_code !== 200) {
      throw new Error(res?.message || 'Failed to save products')
    }
  }

  // Helper function to check if result is metadata object (new format)
  const isResultMetadata = (result: any): result is TaskResultMetadata => {
    return result && typeof result === 'object' && 'total_products' in result && !Array.isArray(result)
  }

  // Helper function to check if result is product array (old format)
  const isResultProductArray = (result: any): result is ExtractedProduct[] => {
    return Array.isArray(result) && result.length > 0
  }

  // Poll task status until result is available
  const pollTaskStatus = useCallback(async (taskIdToCheck: string) => {
    try {
      const status = await getTaskStatus(taskIdToCheck)
      setTaskStatus(status)

      // Check if we have a result
      if (status.status === 'SUCCESS' && status.result) {
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }

        setIsUploading(false)
        setShowLoadingModal(false)

        // Check if result is the new format (metadata object)
        if (isResultMetadata(status.result)) {
          const metadata = status.result as TaskResultMetadata
          
          // If total_products is 0, show error with retry option (unable to fetch products)
          if (metadata.total_products === 0) {
            const errorMsg = metadata.message || status.message || 'Unable to fetch products from the dataset'
            setError(errorMsg)
            setCanRetry(true)
            setExtractedData([])
            toast.error(`No products extracted: ${errorMsg}`)
          } else {
            // If we have products but result is metadata (not array), we can't display them
            // Show message and allow retry since we're unable to fetch the product array
            const errorMsg = metadata.message || status.message || 'Products processed but unable to fetch product data'
            setError(errorMsg)
            setCanRetry(true)
            setExtractedData([])
            toast.error(`Unable to fetch products: ${errorMsg}`)
          }
        } 
        // Check if result is the old format (array of products)
        else if (isResultProductArray(status.result)) {
          setCanRetry(false)
          
          // Flatten results if nested array
          const flattened = Array.isArray(status.result[0]) ? status.result.flat() : status.result
          setExtractedData(flattened)

          toast.success(`Extraction completed successfully: Successfully extracted ${flattened.length} product(s) from your file.`)
        } 
        // If result is null or empty
        else {
          setError(status.message || 'No products found in the result')
          setCanRetry(true)
          setExtractedData([])
          toast.error(`No products extracted: ${status.message || 'No products found in the result'}`)
        }
      } else if (status.status === 'FAILURE' || status.error) {
        // Stop polling on failure
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }

        setIsUploading(false)
        setShowLoadingModal(false)
        const errorMsg = status.error || status.message || 'Task failed'
        setError(errorMsg)
        setCanRetry(true)
        toast.error(`Extraction failed: ${errorMsg}`)
      }
      // If status is PROGRESS or PENDING, continue polling
    } catch (error) {
      // Stop polling on error
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      setIsUploading(false)
      setShowLoadingModal(false)
      setError(error instanceof Error ? error.message : 'Failed to check task status')
      setCanRetry(true)
    }
  }, [])

  useEffect(() => {
    if (!taskId || !isUploading) {
      return
    }

    // Poll immediately, then every 25 seconds
    pollTaskStatus(taskId)
    pollingIntervalRef.current = setInterval(() => {
      pollTaskStatus(taskId)
    }, 25000)

    // Cleanup on unmount or when taskId changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [taskId, isUploading, pollTaskStatus])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    onProcessingChange?.(isUploading || isSaving)
  }, [isUploading, isSaving, onProcessingChange])

  const startExtractionFlow = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    // Generate random estimated time between 5-10 minutes
    const minMinutes = 5
    const maxMinutes = 10
    const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes
    setEstimatedTime(`${randomMinutes} min`)

    setIsUploading(true)
    setShowLoadingModal(true)
    setError(null)
    setTaskStatus(null)
    setTaskId(null)
    setCanRetry(false)

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    try {
      const result = await uploadAndTransform(selectedFile)

      if (!result.task_id) {
        throw new Error('No task ID received from server')
      }

      setTaskId(result.task_id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      setError(errorMessage)
      setIsUploading(false)
      setShowLoadingModal(false)
      setCanRetry(true)
      toast.error(`Upload failed: ${errorMessage}`)

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }

  const handleSubmit = async () => {
    await startExtractionFlow()
  }

  const handleRetry = async () => {
    if (isUploading || !selectedFile) return
    await startExtractionFlow()
  }

  const handleSaveProducts = async () => {
    if (!extractedData || extractedData.length === 0) {
      setError('No products to save')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await saveBulkProducts(extractedData)
      toast.success('Products saved successfully: Page will refresh automatically...')
      
      // Wait a moment for the toast to show, then refresh
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save products'
      setError(errorMessage)
      toast.error(`Save failed: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseResults = () => {
    setExtractedData([])
    setTaskStatus(null)
    setError(null)
    setSelectedFile(null)
    setCanRetry(false)
    setEstimatedTime('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  const handleClose = () => {
    if (!isUploading && !isSaving) {
      // Stop polling if modal is closed
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      handleRemoveFile()
      onOpenChange(false)
    }
  }

  return (
    <>
      {/* Loading Modal */}
      <Dialog open={showLoadingModal} onOpenChange={(open) => !open && !isUploading && handleClose()}>
        <DialogContent
          className="sm:max-w-[420px] p-4 border border-gray-200 rounded-lg"
          onInteractOutside={(event) => {
            event.preventDefault()
          }}
        >
          <div className="flex flex-col items-center justify-center py-8">
            <DialogTitle className="text-[18px] font-semibold text-gray-900 mb-4 font-urbanist">
              Processing...
            </DialogTitle>

            {/* Circular Progress Bar */}
            <div className="relative w-full flex flex-col items-center justify-center mb-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer Glow Effect */}
                <div className="absolute inset-0 rounded-full bg-secondary-900/5 blur-xl animate-pulse" />

                <div className="flex justify-center items-center">
                  <LoadingAnimation />
                </div>
              </div>

              {/* Progress Percentage - Only show when progress > 0, displayed below spinner */}
              {taskStatus?.progress?.progress !== undefined && taskStatus.progress.progress > 0 && (
                <div className="mt-4 text-center">
                  <span className="text-lg font-semibold text-secondary-900 font-urbanist">
                    {taskStatus.progress.progress}%
                  </span>
                </div>
              )}

              <div className="mt-4 text-center">
                <p className="text-[14px] font-semibold text-red-600 font-urbanist">
                  Do not refresh the page
                </p>
                <p className="text-[13px] text-gray-600 font-urbanist mt-2">
                  Extracting details from your document. Please wait...
                </p>
              </div>

              {estimatedTime && (
                <div className="mt-2 text-center">
                  <p className="text-[16px] text-gray-400 font-urbanist ">
                    Estimated time: {estimatedTime}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 mt-3">
                <div className="w-2 h-2 bg-secondary-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-secondary-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-secondary-900 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={extractedData.length > 0 && !showLoadingModal} onOpenChange={handleCloseResults}>
        <DialogContent className="max-w-[1400px] w-[95vw] h-[88vh] p-0 border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <DialogTitle className="text-[18px] font-semibold text-gray-900 font-urbanist">
                  Extracted Products ({extractedData.length})
                </DialogTitle>
                <DialogDescription className="text-[13px] text-gray-600 font-urbanist">
                  Review the extracted product details below
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button className="text-red-500 hover:border-red-600 hover:text-red-600 border border-red-500 rounded-full p-1">
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex-shrink-0 mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
                <p className="text-sm text-red-600 font-urbanist">{error}</p>
                {canRetry && selectedFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs body-3 font-urbanist"
                    onClick={handleRetry}
                    disabled={isUploading}
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-hidden px-6 py-4">
              <div className="h-full overflow-auto border border-gray-200 rounded-lg">
                <Table className="w-full table-fixed">
                  <TableHeader className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="px-4 py-3 text-left body-3 font-semibold text-gray-500 font-urbanist w-[180px]">
                        Name
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left body-3 font-semibold text-gray-500 font-urbanist w-[120px]">
                        MRP
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left body-3 font-semibold text-gray-500 font-urbanist w-[140px]">
                        Price After Discount
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left body-3 font-semibold text-gray-500 font-urbanist w-[80px]">
                        Variants
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left body-3 font-semibold text-gray-500 font-urbanist w-[160px]">
                        Material
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left body-3 font-semibold text-gray-500 font-urbanist">
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {extractedData.map((product, index) => (
                      <TableRow key={index} className="hover:bg-gray-50 bg-white">
                        <TableCell className="px-4 py-2 font-semibold text-neutral-800 body-3 font-urbanist">
                          <div className="break-words">{product.name || '-'}</div>
                        </TableCell>
                        <TableCell className="px-4 py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
                          {formatIndianCurrency(product.mrp || 0)}
                        </TableCell>
                        <TableCell className="px-4 py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
                          {formatIndianCurrency(product.price_after_discount || 0)}
                        </TableCell>
                        <TableCell className="px-4 py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist text-center">
                          {product.variants?.length || 0}
                        </TableCell>
                        <TableCell className="px-4 py-2 font-semibold text-neutral-800 body-3 font-urbanist">
                          <div className="break-words">{product.product_material?.join(', ') || '-'}</div>
                        </TableCell>
                        <TableCell className="px-4 py-2 font-semibold text-neutral-800 body-3 font-urbanist">
                          <div className="line-clamp-2" title={product.description || '-'}>
                            {product.description || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
              <Button
                variant="outline"
                onClick={handleCloseResults}
                disabled={isSaving}
                className="h-9 px-4 body-3 font-urbanist"
              >
                Close
              </Button>
              <Button
                onClick={handleSaveProducts}
                disabled={isSaving || extractedData.length === 0}
                className="h-9 px-4 text-white body-3 font-urbanist hover:bg-secondary-800 bg-secondary-900 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Data'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Upload Modal */}
      <Dialog open={open && !showLoadingModal && extractedData.length === 0} onOpenChange={(isOpen) => {
        if (!isOpen && !isUploading && !isSaving) {
          handleClose()
        }
      }}>
        <DialogContent className="sm:max-w-[560px] p-0">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-[18px] font-semibold text-gray-900 font-urbanist">Media Upload</DialogTitle>
                <DialogDescription className="mt-1 text-[13px] text-gray-600 font-urbanist">
                  Upload one Excel file (.xlsx, .xls)
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
                <p className="text-sm text-red-600 font-urbanist">{error}</p>
                {canRetry && selectedFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs body-3 font-urbanist"
                    onClick={handleRetry}
                    disabled={isUploading}
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`mt-4 rounded-lg border-2 border-dashed p-6 flex items-center justify-center text-center ${selectedFile
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  : isDragOver
                    ? 'border-secondary-900 bg-secondary-50'
                    : 'border-[#A7C3CC] bg-[#F7FBFC]'
                }`}
            >
              <div>
                <div className={`mx-auto w-12 h-12 rounded-md flex items-center justify-center mb-3 ${selectedFile ? 'bg-gray-200' : 'bg-[#E6F2F5]'
                  }`}>
                  <Upload className={`h-6 w-6 ${selectedFile ? 'text-gray-400' : 'text-[#0E606F]'}`} />
                </div>
                <div className={`text-[14px] ${selectedFile ? 'text-gray-500' : 'text-gray-700'}`}>
                  {selectedFile ? 'File selected. Remove file to upload another.' : ''}
                </div>
                {!selectedFile && (
                  <>
                    {/* <div className="text-[12px] text-gray-400 my-2">OR</div> */}
                    <Button
                      variant="outline"
                      className="h-8 px-4 border-[#B7D2DA] text-[#0E606F]"
                      onClick={handleUploadClick}
                    >
                      Browse file
                    </Button>
                  </>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileInputChange}
                  disabled={!!selectedFile}
                />
              </div>
            </div>

            {selectedFile && (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(selectedFile.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate font-urbanist">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-urbanist">
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="flex-shrink-0 w-6 h-6 rounded-full border border-red-600 hover:bg-white text-red-600 hover:text-red-800 transition-colors flex items-center justify-center"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 text-[12px] text-gray-500 font-urbanist">
              Only support .xlsx and .xls files
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="h-9 px-4 body-3 font-urbanist"
              >
                Cancel
              </Button>
              <Button
                className="h-9 px-4 text-white body-3 font-urbanist hover:bg-primary-700 bg-primary-600"
                disabled={!selectedFile || isUploading}
                onClick={handleSubmit}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Extract Details'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

