"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, Image as ImageIcon, Trash2, RefreshCw, X, Loader2 } from "lucide-react"
import Image from "next/image"
import ProductSlider from "./product-slider"
import type { ProductListItem, AdminProductListItem } from "@/components/features/inventory/types/inventory.types"
import { uploadProductImage, deleteProductImage } from "@/components/features/website-setup/services/shop-the-look.service"

type ProductItem = ProductListItem | AdminProductListItem

interface AddLookFormProps {
  onSubmit?: (data: {
    name: string
    mainImage: File | null
    mainImageUrl?: string
    products: ProductItem[]
  }) => void
  onCancel?: () => void
  initialData?: {
    name?: string
    mainImageUrl?: string
    products?: ProductItem[]
  }
}

export function AddLookForm({ onSubmit, onCancel, initialData }: AddLookFormProps) {
  const router = useRouter()
  const [lookName, setLookName] = useState(initialData?.name || "")
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(
    initialData?.mainImageUrl || null
  )
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
    initialData?.mainImageUrl || null
  )
  const [isUploading, setIsUploading] = useState(false)
  const [products, setProducts] = useState<ProductItem[]>(initialData?.products || [])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProductSliderOpen, setIsProductSliderOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [imageSizeError, setImageSizeError] = useState<string | null>(null)

  const validateImageIs1024 = async (file: File): Promise<{ ok: boolean; width: number; height: number }> => {
    const objectUrl = URL.createObjectURL(file)
    try {
      const img = new window.Image()
      const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = objectUrl
      })
      return { ok: dims.width === 1024 && dims.height === 1024, ...dims }
    } catch {
      return { ok: false, width: 0, height: 0 }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  // Load data from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      // Check if data is from edit mode (has markers and non-temp ID) - don't restore edit mode data
      const lookData = sessionStorage.getItem('lookData')
      let isEditModeData = false
      if (lookData) {
        try {
          const parsed = JSON.parse(lookData)
          // If lookData has markers and an ID that's not a temp ID, it's from edit mode
          if (parsed.markers && parsed.markers.length > 0 && parsed.id && !parsed.id.toString().startsWith('temp-')) {
            isEditModeData = true
          }
        } catch (error) {
          // If parsing fails, treat as edit mode data to be safe
          isEditModeData = true
        }
      }
      
      // Only restore if not edit mode data
      if (!isEditModeData) {
        // First check for lookFormData (used when coming back from marker page)
        const formData = sessionStorage.getItem('lookFormData')
        if (formData) {
          try {
            const parsedFormData = JSON.parse(formData)
            // Only restore if we don't have initialData (to allow parent to override)
            if (!initialData?.name && parsedFormData.name) {
              setLookName(parsedFormData.name)
            }
            if (!initialData?.mainImageUrl && parsedFormData.mainImage) {
              setMainImagePreview(parsedFormData.mainImage)
              if (parsedFormData.mainImageUrl) {
                setUploadedImageUrl(parsedFormData.mainImageUrl)
              } else if (parsedFormData.mainImage && parsedFormData.mainImage.startsWith('http')) {
                // If mainImage is a URL (not base64), treat it as uploaded
                setUploadedImageUrl(parsedFormData.mainImage)
              }
            }
            if (!initialData?.products?.length && parsedFormData.products?.length) {
              setProducts(parsedFormData.products)
            }
          } catch (error) {
            console.error('Failed to parse stored form data:', error)
          }
        } else if (lookData) {
          // Fallback to lookData if lookFormData doesn't exist
          try {
            const parsedData = JSON.parse(lookData)
            // Only restore if we don't have initialData (to allow parent to override)
            if (!initialData?.name && parsedData.name) {
              setLookName(parsedData.name)
            }
            if (!initialData?.mainImageUrl && parsedData.mainImage) {
              setMainImagePreview(parsedData.mainImage)
              if (parsedData.mainImageUrl) {
                setUploadedImageUrl(parsedData.mainImageUrl)
              } else if (parsedData.mainImage && parsedData.mainImage.startsWith('http')) {
                // If mainImage is a URL (not base64), treat it as uploaded
                setUploadedImageUrl(parsedData.mainImage)
              }
            }
            if (!initialData?.products?.length && parsedData.products?.length) {
              setProducts(parsedData.products)
            }
          } catch (error) {
            console.error('Failed to parse stored look data:', error)
          }
        }
      }
      setIsInitialized(true)
    }
  }, [initialData, isInitialized])

  // Check image dimensions when image is loaded (from initial data or sessionStorage)
  useEffect(() => {
    if (mainImagePreview && !imageDimensions) {
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        // If image fails to load, clear dimensions
        setImageDimensions(null)
      }
      img.src = mainImagePreview
    } else if (!mainImagePreview) {
      setImageDimensions(null)
    }
  }, [mainImagePreview, imageDimensions])

  // Save data to sessionStorage whenever form data changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      const formData = {
        name: lookName,
        mainImage: uploadedImageUrl || mainImagePreview,
        mainImageUrl: uploadedImageUrl || undefined,
        products: products
      }
      // Only save if we have meaningful data
      if (lookName.trim() || mainImagePreview || products.length > 0) {
        sessionStorage.setItem('lookFormData', JSON.stringify(formData))
      }
    }
  }, [lookName, mainImagePreview, uploadedImageUrl, products, isInitialized])

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageSizeError(null)
      if (!file.type.startsWith("image/")) {
        //alert("Please upload an image file")
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        //alert("File is too large (max 20MB)")
        return
      }

      // Strictly enforce 1024x1024
      const validation = await validateImageIs1024(file)
      setImageDimensions({ width: validation.width, height: validation.height })
      if (!validation.ok) {
        setImageSizeError(`Image must be exactly 1024 x 1024 pixels. Your image is ${validation.width} x ${validation.height}.`)
        setMainImage(null)
        setMainImagePreview(null)
        setUploadedImageUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
      
      // Delete previous uploaded image if exists
      if (uploadedImageUrl && uploadedImageUrl !== initialData?.mainImageUrl) {
        try {
          await deleteProductImage(uploadedImageUrl)
        } catch (error) {
          console.error("Failed to delete previous image:", error)
        }
      }
      
      setMainImage(file)
      setIsUploading(true)
      
      // Create preview immediately and check dimensions
      const reader = new FileReader()
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string)
        
        // Check image dimensions
        const img = new window.Image()
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
      
      // Upload to server
      try {
        const imageUrl = await uploadProductImage(file)
        setUploadedImageUrl(imageUrl)
        setMainImagePreview(imageUrl) // Update preview with server URL
        
        // Check dimensions from uploaded image
        const img = new window.Image()
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = imageUrl
      } catch (error) {
        console.error("Failed to upload image:", error)
        //alert("Failed to upload image. Please try again.")
        setMainImage(null)
        setMainImagePreview(null)
        setImageDimensions(null)
        setImageSizeError(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      setImageSizeError(null)
      if (!file.type.startsWith("image/")) {
        //alert("Please upload an image file")
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        //alert("File is too large (max 20MB)")
        return
      }

      // Strictly enforce 1024x1024
      const validation = await validateImageIs1024(file)
      setImageDimensions({ width: validation.width, height: validation.height })
      if (!validation.ok) {
        setImageSizeError(`Image must be exactly 1024 x 1024 pixels. Your image is ${validation.width} x ${validation.height}.`)
        setMainImage(null)
        setMainImagePreview(null)
        setUploadedImageUrl(null)
        return
      }
      
      // Delete previous uploaded image if exists
      if (uploadedImageUrl && uploadedImageUrl !== initialData?.mainImageUrl) {
        try {
          await deleteProductImage(uploadedImageUrl)
        } catch (error) {
          console.error("Failed to delete previous image:", error)
        }
      }
      
      setMainImage(file)
      setIsUploading(true)
      
      // Create preview immediately and check dimensions
      const reader = new FileReader()
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string)
        
        // Check image dimensions
        const img = new window.Image()
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
      
      // Upload to server
      try {
        const imageUrl = await uploadProductImage(file)
        setUploadedImageUrl(imageUrl)
        setMainImagePreview(imageUrl) // Update preview with server URL
        
        // Check dimensions from uploaded image
        const img = new window.Image()
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = imageUrl
      } catch (error) {
        console.error("Failed to upload image:", error)
        //alert("Failed to upload image. Please try again.")
        setMainImage(null)
        setMainImagePreview(null)
        setImageDimensions(null)
        setImageSizeError(null)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleAddProducts = () => {
    setIsProductSliderOpen(true)
  }

  const handleProductConfirm = (selectedProducts: ProductItem[]) => {
    setProducts(selectedProducts)
    setIsProductSliderOpen(false)
  }

  const handleRemoveProduct = (productId: number) => {
    setProducts(products.filter((p) => p.id !== productId))
  }

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Delete uploaded image from server if it exists
    if (uploadedImageUrl && uploadedImageUrl !== initialData?.mainImageUrl) {
      try {
        await deleteProductImage(uploadedImageUrl)
      } catch (error) {
        console.error("Failed to delete image:", error)
        // Continue with removal even if delete fails
      }
    }
    
    setMainImage(null)
    setMainImagePreview(null)
    setUploadedImageUrl(null)
    setImageDimensions(null)
    setImageSizeError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleReplaceImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  const handleCancel = () => {
    // Show confirmation modal before canceling
    setShowCancelModal(true)
  }

  const handleCancelConfirm = async () => {
    // Delete uploaded image from server if it exists (and not from initial data)
    if (uploadedImageUrl && uploadedImageUrl !== initialData?.mainImageUrl) {
      try {
        await deleteProductImage(uploadedImageUrl)
      } catch (error) {
        console.error("Failed to delete image on cancel:", error)
        // Continue with cancel even if delete fails
      }
    }
    
    // Clear sessionStorage when canceling
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lookData')
      sessionStorage.removeItem('lookFormData')
    }
    setShowCancelModal(false)
    if (onCancel) {
      onCancel()
    } else {
      router.push("/admin-dashboard/shop-the-look")
    }
  }

  const handleCancelCancel = () => {
    setShowCancelModal(false)
  }

  // Check if all mandatory fields are filled
  const isFormValid = 
    lookName.trim() !== "" && 
    (mainImage !== null || mainImagePreview !== null) && 
    products.length > 0

  const handleSave = () => {
    if (!lookName.trim()) {
      //alert("Please enter a look name")
      return
    }
    if (!mainImage && !mainImagePreview) {
      //alert("Please upload a main image")
      return
    }
    if (products.length === 0) {
      //alert("Please add at least one product")
      return
    }
    
    if (onSubmit) {
      onSubmit({
        name: lookName,
        mainImage,
        mainImageUrl: uploadedImageUrl || undefined,
        products
      })
    } else {
      // Generate a temporary ID based on timestamp and name
      // In a real app, this would be the ID returned from the API
      const tempId = `temp-${Date.now()}-${lookName.toLowerCase().replace(/\s+/g, '-')}`
      
      // Store the look data in sessionStorage to pass to the next page
      const lookData = {
        id: tempId,
        name: lookName,
        mainImage: uploadedImageUrl || mainImagePreview,
        mainImageUrl: uploadedImageUrl || undefined,
        products: products
      }
      sessionStorage.setItem('lookData', JSON.stringify(lookData))
      // Also keep the form data for when user comes back
      sessionStorage.setItem('lookFormData', JSON.stringify({
        name: lookName,
        mainImage: uploadedImageUrl || mainImagePreview,
        mainImageUrl: uploadedImageUrl || undefined,
        products: products
      }))
      // Store source page info to route back correctly
      sessionStorage.setItem('markerSourcePage', JSON.stringify({
        type: 'add',
        returnUrl: '/admin-dashboard/shop-the-look/add-look'
      }))
      
      // Redirect to the product marker page
      router.push(`/admin-dashboard/shop-the-look/add-look/${tempId}`)
    }
  }

  return (
    <div className="h-[calc(100vh-150px)] flex flex-col">
      {/* Form Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto pb-24">
        {/* Left Column: Look Name and Main Image */}
        <div className="flex flex-col gap-6 h-full">
          {/* Look Name Card */}
          <Card className="bg-white rounded-lg border border-gray-200">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="look-name" className="text-sm font-semibold text-gray-900">
                  Look Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="look-name"
                  type="text"
                  value={lookName}
                  onChange={(e) => setLookName(e.target.value)}
                  placeholder="e.g. Dining Room Set, Outdoor Lounge, Modern Bedroom"
                  className="w-full border-gray-300"
                />
                <p className="text-xs text-gray-500">
                  This name is used internally to manage and order looks.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Main Image Card */}
          <Card className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col flex-1 space-y-4 min-h-0">
                <div className="space-y-2 flex-shrink-0">
                  <Label className="text-sm font-semibold text-gray-900">
                    Main Image <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-500">
                    This image will appear on the left side of the Shop the Look section on the website.
                  </p>
                </div>
                
                {/* Image Upload Area */}
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg transition-colors flex-1 min-h-0
                    ${isDragOver ? "border-gray-400 bg-gray-50" : "border-gray-300 bg-white"}
                    ${mainImagePreview ? "p-2" : "p-8"}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleImageClick}
                >
                  {mainImagePreview ? (
                    <div className="relative w-full h-full rounded-md overflow-hidden">
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                          <div className="flex flex-col items-center gap-2 text-white">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-sm">Uploading...</p>
                          </div>
                        </div>
                      )}
                      <Image
                        src={mainImagePreview}
                        alt="Main look image"
                        fill
                        className="object-contain"
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          disabled={isUploading}
                          className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Remove
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleReplaceImage}
                          disabled={isUploading}
                          className="h-8 px-3 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 disabled:opacity-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-1.5" />
                          Replace
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer h-full">
                      <div className="w-12 h-12 rounded-full border border-gray-300 bg-white flex items-center justify-center">
                        <Upload className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-gray-900">
                          Upload main look image
                        </p>
                        <p className="text-xs text-gray-500">
                          Click to browse or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">
                          Strictly Recommend : 1024 x 1024 pixels, JPG or PNG 
                        </p>
                        {imageSizeError && (
                          <p className="text-xs text-red-600 font-medium">
                            {imageSizeError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Products Section */}
        <div className="flex flex-col h-full">
          <Card className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col flex-1 space-y-4 min-h-0">
                <div className="space-y-2 flex-shrink-0">
                  <Label className="text-sm font-semibold text-gray-900">
                    Products in this Look <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-500">
                    Select up to 5 products visible in this image.
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddProducts}
                  className="w-full bg-secondary-900 text-white hover:bg-secondary-800 hover:text-white flex-shrink-0"
                >
                  Add Products
                </Button>

                {/* Products Display Area */}
                <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 min-h-0 overflow-y-auto">
                  {products.length > 0 ? (
                    <div className="p-4 space-y-3">
                      {products.map((product) => {
                        const productImage =
                          (product as any).product_image ||
                          (product as any).image ||
                          "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"

                        return (
                          <Card
                            key={product.id}
                            className="border border-gray-200 bg-white"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={productImage}
                                    alt={product.name || "Product"}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                                    {product.name || "Unnamed Product"}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    ₹{product.mrp?.toLocaleString() || "0"}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(product.id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-2 text-gray-400">
                      <ImageIcon className="h-12 w-12" />
                      <p className="text-sm">No products added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Bar with Cancel and Save Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 h-[65px]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-[24px] py-4">
          <div className="flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 w-[155px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isFormValid}
              className="px-6 py-2 bg-secondary-900 text-white hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed w-[155px]"
            >
              Save & place markers
            </Button>
          </div>
        </div>
      </div>

      {/* Product Selection Slider */}
      <ProductSlider
        isOpen={isProductSliderOpen}
        onClose={() => setIsProductSliderOpen(false)}
        selectedProducts={products}
        onConfirm={handleProductConfirm}
      />

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All your progress will be lost and you will be redirected back to the Shop The Look page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelCancel}
              className="flex-1"
            >
              Keep Editing
            </Button>
            <Button
              onClick={handleCancelConfirm}
              className="flex-1 bg-red-500 text-white hover:bg-red-600"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

