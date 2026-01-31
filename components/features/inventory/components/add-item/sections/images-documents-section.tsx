"use client"

import React, { memo, useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import { ImagePreviewModal } from '@/components/shared'

interface ImagesDocumentsSectionProps {
  isDragOver: boolean
  selectedImages: File[]
  uploadError: string | null
  onImageClick: () => void
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void
  onRemoveImage: (index: number) => void
  onDismissError: () => void
  imageInputRef: React.RefObject<HTMLInputElement | null>
}

export const ImagesDocumentsSection: React.FC<ImagesDocumentsSectionProps> = memo(function ImagesDocumentsSection({
  isDragOver,
  selectedImages,
  uploadError,
  onImageClick,
  onImageUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveImage,
  onDismissError,
  imageInputRef,
}) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Create object URLs for thumbnails
  const imageUrls = useMemo(() => {
    return selectedImages.map((file) => URL.createObjectURL(file))
  }, [selectedImages])

  // Cleanup object URLs on unmount or when images change
  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url))
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl)
      }
    }
  }, [imageUrls, previewImageUrl])

  const handleImageClick = (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    setPreviewImageUrl(imageUrl)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = (open: boolean) => {
    setIsPreviewOpen(open)
    if (!open && previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl)
      setPreviewImageUrl(null)
    }
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mx-[16px] mb-4">
      <CardContent className="space-y-4 py-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-secondary-900 bg-secondary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onImageClick}
        >
          {selectedImages.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative border border-gray-200 rounded-lg p-2">
                    <img
                      src={imageUrls[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageClick(file)
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

        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{uploadError}</p>
            <button
              type="button"
              onClick={onDismissError}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Dismiss
            </button>
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
})

export default ImagesDocumentsSection

