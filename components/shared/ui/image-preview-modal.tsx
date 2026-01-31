"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImagePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Backward compatible single-image usage.
   * If `images` is provided, it takes precedence over `imageUrl`.
   */
  imageUrl: string | null
  /** Optional gallery mode. When provided, enables next/prev navigation. */
  images?: string[]
  /** Used to set the initial image when opening in gallery mode. */
  startIndex?: number
  alt?: string
}

export default function ImagePreviewModal({
  open,
  onOpenChange,
  imageUrl,
  images,
  startIndex = 0,
  alt = "Image preview",
}: ImagePreviewModalProps) {
  const resolvedImages = useMemo(() => {
    const cleaned = (images ?? []).filter(Boolean)
    if (cleaned.length > 0) return cleaned
    return imageUrl ? [imageUrl] : []
  }, [images, imageUrl])

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!open) return
    const safeStart =
      resolvedImages.length > 0
        ? Math.min(Math.max(startIndex, 0), resolvedImages.length - 1)
        : 0
    setIndex(safeStart)
  }, [open, startIndex, resolvedImages.length])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
      if (resolvedImages.length <= 1) return
      if (e.key === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length)
      } else if (e.key === "ArrowRight") {
        setIndex((prev) => (prev + 1) % resolvedImages.length)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange, resolvedImages.length])

  if (resolvedImages.length === 0) return null

  const currentUrl = resolvedImages[index]
  const canNavigate = resolvedImages.length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-white border border-gray-200">
        <div className="relative w-full h-[95vh] flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors backdrop-blur-sm border border-gray-200"
            aria-label="Close preview"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>

          {/* Navigation Buttons */}
          {canNavigate && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIndex((prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length)}
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 hover:bg-white border border-gray-200",
                  "h-11 w-11"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIndex((prev) => (prev + 1) % resolvedImages.length)}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 hover:bg-white border border-gray-200",
                  "h-11 w-11"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 text-gray-800" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/80 border border-gray-200 text-xs text-gray-700">
                {index + 1} / {resolvedImages.length}
              </div>
            </>
          )}

          {/* Image */}
          <div className="w-full h-full flex items-center justify-center p-8">
            <img
              src={currentUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

