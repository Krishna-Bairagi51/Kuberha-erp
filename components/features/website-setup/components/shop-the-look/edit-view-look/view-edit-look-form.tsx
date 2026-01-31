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
import { ImageIcon, X } from "lucide-react"
import Image from "next/image"
import ProductSlider from "../add-look/product-slider"
import type { ProductListItem, AdminProductListItem } from "@/components/features/inventory/types/inventory.types"
import { useMarkerCoordinates } from "@/components/features/website-setup/hooks/shop-the-look/use-marker-coordinates"

type ProductItem = ProductListItem | AdminProductListItem

interface ProductMarker {
  productId: number
  x: number // Percentage position
  y: number // Percentage position
}

interface ViewEditLookFormProps {
  onSubmit?: (data: {
    name: string
    mainImage: File | null
    products: ProductItem[]
  }) => void
  onCancel?: () => void
  initialData?: {
    id?: string | number
    name?: string
    mainImageUrl?: string
    products?: ProductItem[]
    markers?: ProductMarker[]
  }
  mode?: 'view' | 'edit'
}

export function ViewEditLookForm({ onSubmit, onCancel, initialData, mode = 'view' }: ViewEditLookFormProps) {
  const router = useRouter()
  const [lookName, setLookName] = useState(initialData?.name || "")
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(
    initialData?.mainImageUrl || null
  )
  const [products, setProducts] = useState<ProductItem[]>(initialData?.products || [])
  const [markers, setMarkers] = useState<Map<number, ProductMarker>>(new Map())
  const [isProductSliderOpen, setIsProductSliderOpen] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Use the coordinate utility hook for viewport-independent coordinate handling
  const { percentageToContainer } = useMarkerCoordinates({
    imageUrl: mainImagePreview,
    containerRef: imageContainerRef,
  })

  // Initialize markers from initialData
  useEffect(() => {
    if (initialData?.markers && initialData.markers.length > 0) {
      const markersMap = new Map<number, ProductMarker>()
      initialData.markers.forEach((marker) => {
        markersMap.set(marker.productId, marker)
      })
      setMarkers(markersMap)
    } else if (initialData?.products && initialData.products.length > 0) {
      // If no markers provided, generate random positions for display
      const markersMap = new Map<number, ProductMarker>()
      initialData.products.forEach((product) => {
        const randomX = 20 + Math.random() * 60
        const randomY = 20 + Math.random() * 60
        markersMap.set(product.id, {
          productId: product.id,
          x: randomX,
          y: randomY,
        })
      })
      setMarkers(markersMap)
    }
  }, [initialData])

  const handleAddProducts = () => {
    setIsProductSliderOpen(true)
  }

  const handleProductConfirm = (selectedProducts: ProductItem[]) => {
    setProducts(selectedProducts)
    
    // Update markers - remove markers for products that are no longer selected
    const newMarkers = new Map<number, ProductMarker>()
    selectedProducts.forEach((product) => {
      const existingMarker = markers.get(product.id)
      if (existingMarker) {
        newMarkers.set(product.id, existingMarker)
      } else {
        // Generate random position for new products
        const randomX = 20 + Math.random() * 60
        const randomY = 20 + Math.random() * 60
        newMarkers.set(product.id, {
          productId: product.id,
          x: randomX,
          y: randomY,
        })
      }
    })
    setMarkers(newMarkers)
    
    setIsProductSliderOpen(false)
  }

  const handleRemoveProduct = (productId: number) => {
    setProducts(products.filter((p) => p.id !== productId))
    const newMarkers = new Map(markers)
    newMarkers.delete(productId)
    setMarkers(newMarkers)
  }

  const handleCancel = () => {
    setShowCancelModal(true)
  }

  const handleCancelConfirm = () => {
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
        products
      })
    } else {
      // Prepare marker coordinates data
      const markerCoordinates = products.map((product) => {
        const marker = markers.get(product.id)
        return {
          product_id: product.id,
          product_name: product.name,
          x: marker?.x || 0,
          y: marker?.y || 0,
        }
      })

      const lookData = {
        id: initialData?.id || `temp-${Date.now()}-${lookName.toLowerCase().replace(/\s+/g, '-')}`,
        name: lookName,
        mainImage: mainImagePreview,
        products: products,
        markers: Array.from(markers.values())
      }
      
      sessionStorage.setItem('lookData', JSON.stringify(lookData))
      sessionStorage.setItem('lookFormData', JSON.stringify({
        name: lookName,
        mainImage: mainImagePreview,
        products: products
      }))
      // Store source page info to route back correctly
      sessionStorage.setItem('markerSourcePage', JSON.stringify({
        type: 'edit',
        lookId: initialData?.id,
        returnUrl: `/admin-dashboard/shop-the-look/view-edit-look?id=${initialData?.id}&mode=edit`
      }))
      
      // Redirect to marker placement page if markers need to be updated
      router.push(`/admin-dashboard/shop-the-look/add-look/${lookData.id}`)
    }
  }

  return (
    <div className="h-[calc(100vh-150px)] flex flex-col">
      {/* Form Content - Two Column Layout (Swapped) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto pb-24">
        {/* Right Column on desktop (second): Look Name and Products */}
        <div className="flex flex-col gap-6 h-full order-2 lg:order-2">
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
                  disabled={mode === 'view'}
                  readOnly={mode === 'view'}
                />
                <p className="text-xs text-gray-500">
                  This name is used internally to manage and order looks.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Products Section Card */}
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
                
                {mode === 'edit' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddProducts}
                    className="w-full bg-secondary-900 text-white hover:bg-secondary-800 hover:text-white flex-shrink-0"
                  >
                    Manage Products
                  </Button>
                )}

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
                                {mode === 'edit' && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveProduct(product.id)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
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

        {/* Left Column on desktop (first): Main Image with Markers */}
        <div className="flex flex-col h-full order-1 lg:order-1">
          <Card className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col flex-1 space-y-4 min-h-0">
                <div className="space-y-2 flex-shrink-0">
                  <Label className="text-sm font-semibold text-gray-900">
                    Main Image with Product Markers
                  </Label>
                  <p className="text-xs text-gray-500">
                    {mode === 'view' 
                      ? 'Product markers are displayed on the image.'
                      : 'Product markers are displayed on the image. Click "Place Markers" to adjust positions.'}
                  </p>
                </div>
                
                {mode === 'edit' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Save current form data and navigate to marker placement
                      const lookData = {
                        id: initialData?.id || `temp-${Date.now()}-${lookName.toLowerCase().replace(/\s+/g, '-')}`,
                        name: lookName,
                        mainImage: mainImagePreview,
                        products: products,
                        markers: Array.from(markers.values())
                      }
                      sessionStorage.setItem('lookData', JSON.stringify(lookData))
                      sessionStorage.setItem('lookFormData', JSON.stringify({
                        name: lookName,
                        mainImage: mainImagePreview,
                        products: products
                      }))
                      // Store source page info to route back correctly
                      sessionStorage.setItem('markerSourcePage', JSON.stringify({
                        type: 'edit',
                        lookId: initialData?.id,
                        returnUrl: `/admin-dashboard/shop-the-look/view-edit-look?id=${initialData?.id}&mode=edit`
                      }))
                      router.push(`/admin-dashboard/shop-the-look/add-look/${lookData.id}`)
                    }}
                    disabled={!mainImagePreview || products.length === 0}
                    className="w-full bg-secondary-900 text-white hover:bg-secondary-800 hover:text-white flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Place Markers
                  </Button>
                )}
                
                {/* Image with Markers */}
                <div
                  ref={imageContainerRef}
                  className="relative border-2 border-gray-300 rounded-lg flex-1 min-h-0 overflow-hidden bg-gray-50"
                >
                  {mainImagePreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={mainImagePreview}
                        alt={lookName || "Look image"}
                        fill
                        className="object-contain"
                      />
                      
                      {/* Render markers */}
                      {Array.from(markers.entries()).map(([productId, marker]) => {
                        const product = products.find((p) => p.id === productId)
                        const productIndex = products.findIndex((p) => p.id === productId)
                        
                        if (!product) return null

                        // Use the utility to convert percentage to container position
                        const containerPos = percentageToContainer(marker.x, marker.y)
                        const leftPercent = containerPos?.left ?? marker.x
                        const topPercent = containerPos?.top ?? marker.y

                        return (
                          <div
                            key={productId}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                            style={{
                              left: `${leftPercent}%`,
                              top: `${topPercent}%`,
                            }}
                          >
                            <div className="w-8 h-8 rounded-full border-2 bg-red-500 border-white shadow-lg flex items-center justify-center relative">
                              <span className="text-xs font-bold text-white">
                                {productIndex + 1}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-3 text-gray-400">
                      <ImageIcon className="h-12 w-12" />
                      <p className="text-sm">No image uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Bar with Cancel and Save Buttons - Only show in edit mode */}
      {mode === 'edit' && (
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
      )}

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

