"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import { ImagePreviewModal } from '@/components/shared'
import type { EditInventoryFormValues } from '../schemas/edit-inventory-form.schema'

interface ImagesDocumentsSectionProps {
  selectedImages: File[]
  apiImageUrls: string[]
  isDragOver: boolean
  uploadError: string | null
  imageInputRef: React.RefObject<HTMLInputElement | null>
  onImageClick: () => void
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  onRemoveApiImage: (index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onUploadErrorDismiss: () => void
  // Optional highlighting function for admin version
  getHighlightStyles?: (fieldKey: string, baseClassName: string) => string
  // Optional field changes tracking for admin version
  fieldChanges?: Record<string, boolean>
}

export const ImagesDocumentsSection: React.FC<ImagesDocumentsSectionProps> = ({
  selectedImages,
  apiImageUrls,
  isDragOver,
  uploadError,
  imageInputRef,
  onImageClick,
  onImageUpload,
  onRemoveImage,
  onRemoveApiImage,
  onDragOver,
  onDragLeave,
  onDrop,
  onUploadErrorDismiss,
  getHighlightStyles,
  fieldChanges,
}) => {
  const { formState: { errors } } = useFormContext<EditInventoryFormValues>()
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Create object URLs for newly uploaded files
  const fileImageUrls = useMemo(() => {
    return selectedImages.map((file) => URL.createObjectURL(file))
  }, [selectedImages])

  // Cleanup object URLs on unmount or when files change
  useEffect(() => {
    return () => {
      fileImageUrls.forEach((url) => URL.revokeObjectURL(url))
      if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewImageUrl)
      }
    }
  }, [fileImageUrls, previewImageUrl])

  const handleImageClick = (url: string) => {
    // Clean up previous preview URL if it was an object URL
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }
    setPreviewImageUrl(url)
    setIsPreviewOpen(true)
  }

  const handleFileClick = (file: File) => {
    // Clean up previous preview URL if it was an object URL
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }
    const imageUrl = URL.createObjectURL(file)
    setPreviewImageUrl(imageUrl)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = (open: boolean) => {
    setIsPreviewOpen(open)
    if (!open && previewImageUrl) {
      // Only revoke if it's an object URL (starts with blob:)
      if (previewImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewImageUrl)
      }
      setPreviewImageUrl(null)
    }
  }

  // Helper function to apply highlighting if available
  const applyHighlight = (fieldKey: string, baseClassName: string) => {
    return getHighlightStyles ? getHighlightStyles(fieldKey, baseClassName) : baseClassName
  }

  // Determine border styling based on errors, drag state, and field changes
  const getBorderClassName = () => {
    if (errors.images) {
      return 'border-red-500 bg-red-50'
    }
    if (isDragOver) {
      return 'border-secondary-900 bg-secondary-50'
    }
    if (fieldChanges?.is_images_change) {
      return 'border-yellow-400 bg-yellow-50 hover:border-yellow-500'
    }
    return 'border-gray-300 hover:border-gray-400'
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mx-[16px] mb-4">
      <CardContent className="space-y-4 px-[16px] py-4">
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${getBorderClassName()}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onImageClick}
        >
          {(apiImageUrls.length > 0 || selectedImages.length > 0) ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* Display API images */}
                {apiImageUrls.map((url, index) => (
                  <div key={`api-${index}`} className="relative border border-gray-200 rounded-lg p-2">
                    <img
                      src={url}
                      alt={`API Image ${index + 1}`}
                      className="w-full min-h-80 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageClick(url)
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveApiImage(index)
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate">From Server</p>
                  </div>
                ))}
                
                {/* Display newly uploaded files */}
                {selectedImages.map((file, index) => (
                  <div key={`file-${index}`} className="relative border border-gray-200 rounded-lg p-2">
                    <img
                      src={fileImageUrls[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-80 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFileClick(file)
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveImage(index)
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
              <Button type="button" className="h-8 cursor-pointer text-white border-gray-600 bg-secondary-900 hover:bg-secondary-800 hover:text-white">
                Add More Images
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-1 text-sm">Upload product images (optional)</p>
              <p className="text-xs text-gray-500 mb-3">Drag and drop images here or click to browse</p>
              <Button type="button" variant="outline" className="h-8 cursor-pointer text-white body-3 font-urbanist text-sm bg-secondary-900 hover:bg-secondary-800 hover:text-white">
                Choose Images
              </Button>
            </>
          )}
          <input
            ref={imageInputRef}
            type="file"
            id="image-upload"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={onImageUpload}
            className="hidden"
          />
        </div>

        {/* Upload Error Display */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{uploadError}</p>
            <button 
              type="button"
              onClick={onUploadErrorDismiss}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Images Validation Error */}
        {errors.images && (
          <div className="">
            <p className="text-sm text-red-600 font-urbanist">{errors.images.message}</p>
          </div>
        )}
      </CardContent>
      <ImagePreviewModal
        open={isPreviewOpen}
        onOpenChange={handleClosePreview}
        imageUrl={previewImageUrl}
        alt="Image preview"
      />
    </Card>
  )
}

export default ImagesDocumentsSection

