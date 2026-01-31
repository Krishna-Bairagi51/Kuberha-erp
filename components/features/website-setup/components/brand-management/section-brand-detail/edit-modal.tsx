"use client"

import React, { useState, useRef, useEffect } from "react"
import { Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Import from website-setup feature module
import { useUpdateBrandImageMutation } from "../../../hooks/use-brand-management"
import type { Brand } from "../../../types/brand-management.types"
import { validateBrandImageFile, getBrandInitial } from "../../../utills/brand-management.helpers"
import ImagePreviewModal from "@/components/shared/ui/image-preview-modal"

interface EditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: Brand | null
  onSave?: (brand: Brand, imageFile?: File | null) => void
}

export default function EditModal({
  open,
  onOpenChange,
  brand,
  onSave,
}: EditModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null)
  const [isRemovingLogo, setIsRemovingLogo] = useState(false)
  const [isRemovingBanner, setIsRemovingBanner] = useState(false)
  const [isBannerPreviewOpen, setIsBannerPreviewOpen] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  
  const updateBrandImageMutation = useUpdateBrandImageMutation()

  // Initialize form when brand changes or modal opens
  useEffect(() => {
    if (brand && open) {
      // Always initialize with brand data when modal opens
      const brandName = brand.name || brand.displayName || ""
      const brandDescription = brand.description || ""
      const logoUrl = brand.imageUrl || null
      const bannerUrl = brand.bannerUrl || null
      
      setName(brandName)
      setDescription(brandDescription)
      setLogoPreview(logoUrl)
      setBannerPreview(bannerUrl)
      setSelectedLogoFile(null)
      setSelectedBannerFile(null)
      setIsRemovingLogo(false)
      setIsRemovingBanner(false)
      
      // Reset file inputs
      if (logoInputRef.current) {
        logoInputRef.current.value = ""
      }
      if (bannerInputRef.current) {
        bannerInputRef.current.value = ""
      }
    }
  }, [brand, open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      // Don't reset immediately - wait a bit to avoid flicker
      const timer = setTimeout(() => {
        setName("")
        setDescription("")
        setLogoPreview(null)
        setBannerPreview(null)
        setSelectedLogoFile(null)
        setSelectedBannerFile(null)
        setIsRemovingLogo(false)
        setIsRemovingBanner(false)
        if (logoInputRef.current) {
          logoInputRef.current.value = ""
        }
        if (bannerInputRef.current) {
          bannerInputRef.current.value = ""
        }
      }, 300) // Wait for close animation
      
      return () => clearTimeout(timer)
    }
  }, [open])

  const validateFile = (file: File): boolean => {
    const result = validateBrandImageFile(file)
    if (!result.valid && result.error) {
      toast.error(result.error)
      return false
    }
    return true
  }

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!validateFile(file)) return

    setSelectedLogoFile(file)
    setIsRemovingLogo(false)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleBannerSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!validateFile(file)) return

    setSelectedBannerFile(file)
    setIsRemovingBanner(false)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setBannerPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoUploadClick = () => {
    logoInputRef.current?.click()
  }

  const handleBannerUploadClick = () => {
    bannerInputRef.current?.click()
  }

  // Check if any field has changed
  const originalName = brand?.name || ""
  const originalDescription = brand?.description || ""
  const nameChanged = name !== originalName
  const descriptionChanged = description !== originalDescription
  const logoChanged = selectedLogoFile !== null || (isRemovingLogo && brand?.imageUrl)
  const bannerChanged = selectedBannerFile !== null || (isRemovingBanner && brand?.bannerUrl)
  const hasChanges = nameChanged || descriptionChanged || logoChanged || bannerChanged

  const handleSave = async () => {
    if (!brand) return

    // Validate required fields
    if (!name.trim()) {
      toast.error("Brand name is required")
      return
    }

    if (!description.trim()) {
      toast.error("Brand description is required")
      return
    }

    // Only call API if something has changed
    if (hasChanges) {
      try {
        await updateBrandImageMutation.mutateAsync({
          id: brand.id,
          brandName: name,
          imageFile: selectedLogoFile || null,
          description: description,
          imageUrl: !selectedLogoFile && !isRemovingLogo ? brand.imageUrl : null,
          coverImageFile: selectedBannerFile || null,
          coverImageUrl: !selectedBannerFile && !isRemovingBanner ? brand.bannerUrl : null,
        })
        // Close modal on success (toast notification is handled by mutation)
        onOpenChange(false)
      } catch (error) {
        // Error is already handled by mutation onError with exact API message
        // Don't close modal on error so user can retry
      }
    } else {
      // Nothing changed, just close the modal
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!brand) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 font-urbanist">
            Edit Brand
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Name Input */}
          <div className="space-y-2">
            <Label htmlFor="brand-name" className="text-sm font-medium text-gray-700 font-urbanist">
              Brand Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="brand-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Modern Comfort Furniture"
              className="w-full font-urbanist"
            />
            {/* <p className="text-xs text-gray-500 font-urbanist">
              This name is visible on the website.
            </p> */}
          </div>

          {/* Brand Images Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 font-urbanist">
              Brand Images <span className="text-red-500">*</span>
            </Label>
            
            {/* Combined Banner and Logo Preview */}
            <div className="relative w-full rounded-lg border-2 border-gray-200 bg-gray-50 overflow-visible">
              {/* Banner Preview - reduced height, clickable */}
              <div 
                className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => bannerPreview && setIsBannerPreviewOpen(true)}
              >
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 font-urbanist">No banner image</span>
                  </div>
                )}
              </div>
              
              {/* Logo Preview - Overlaid on bottom center, positioned outside banner */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-xl font-bold text-gray-400 font-urbanist">
                        {getBrandInitial(name)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Spacer to accommodate logo extending below banner */}
            <div className="h-12"></div>

            {/* Upload Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBannerUploadClick}
                className="flex-1 font-urbanist"
              >
                <Upload className="h-4 w-4 mr-2" />
                {bannerPreview ? "Change Banner" : "Upload Banner"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleLogoUploadClick}
                className="flex-1 font-urbanist"
              >
                <Upload className="h-4 w-4 mr-2" />
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
              onChange={handleBannerSelect}
              className="hidden"
            />
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
              onChange={handleLogoSelect}
              className="hidden"
            />

            <p className="text-xs text-gray-500 font-urbanist">
              Supported formats: JPG, PNG (Max 20MB)
            </p>
          </div>

          {/* Brand Description Section */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 font-urbanist">
              Brand Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the brand style, positioning, or materials..."
              className="w-full font-urbanist min-h-[100px]"
              rows={4}
            />
            {/* <p className="text-xs text-gray-500 font-urbanist">
              Describe the brand style, positioning, or materials.
            </p> */}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="font-urbanist"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateBrandImageMutation.isPending || !name.trim() || !description.trim()}
            className="font-urbanist"
          >
            {updateBrandImageMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Banner Image Preview Modal */}
      <ImagePreviewModal
        open={isBannerPreviewOpen}
        onOpenChange={setIsBannerPreviewOpen}
        imageUrl={bannerPreview}
        alt="Banner preview"
      />
    </Dialog>
  )
}
