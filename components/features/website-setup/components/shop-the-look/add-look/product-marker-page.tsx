"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Check, Loader2 } from "lucide-react"
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
import type { ProductListItem, AdminProductListItem } from "@/components/features/inventory/types/inventory.types"
import { getActiveLooks } from "@/components/features/website-setup/services/shop-the-look.service"
import { useCreateShopTheLookMutation } from "@/components/features/website-setup/hooks/shop-the-look/use-shop-the-look-query"
import { 
  useMarkerCoordinates, 
  checkMarkerOverlap, 
  calculateMinDistance,
  type PercentageCoordinate 
} from "@/components/features/website-setup/hooks/shop-the-look/use-marker-coordinates"

type ProductItem = ProductListItem | AdminProductListItem

interface LookData {
  id: string
  name: string
  mainImage: string | null
  mainImageUrl?: string
  products: ProductItem[]
  markers?: ProductMarker[]
}

interface ProductMarker {
  productId: number
  x: number // Percentage position
  y: number // Percentage position
}

interface ProductMarkerPageProps {
  lookData: LookData
}

export default function ProductMarkerPage({ lookData }: ProductMarkerPageProps) {
  const router = useRouter()
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [markers, setMarkers] = useState<Map<number, ProductMarker>>(new Map())
  const [initialPositions, setInitialPositions] = useState<Map<number, ProductMarker>>(new Map())
  const [confirmedPositions, setConfirmedPositions] = useState<Map<number, ProductMarker>>(new Map())
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0)
  const [draggedMarker, setDraggedMarker] = useState<{ productId: number; x: number; y: number; previousX: number; previousY: number } | null>(null)
  const [tooltipDismissed, setTooltipDismissed] = useState<Set<number>>(new Set())
  const [confirmedMarkers, setConfirmedMarkers] = useState<Set<number>>(new Set())
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingMarker, setPendingMarker] = useState<{ productId: number; newX: number; newY: number; previousX: number; previousY: number } | null>(null)
  const [pendingProductSwitch, setPendingProductSwitch] = useState<number | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  
  // Use the coordinate utility hook for viewport-independent coordinate handling
  const {
    imageDimensions,
    isReady: isImageReady,
    getContainTransform,
    containerToPercentage,
    percentageToContainer,
    percentageToPixels,
    clampPercentage,
  } = useMarkerCoordinates({
    imageUrl: lookData.mainImage,
    containerRef: imageContainerRef,
  })
  
  // Use mutation hook for creating look (automatically invalidates cache)
  const createLookMutation = useCreateShopTheLookMutation()
  const isSaving = createLookMutation.isPending
  
  // Detect if we're in edit mode (has markers from API)
  const isEditMode = lookData.markers && lookData.markers.length > 0

  // Initialize markers for all products - use existing markers from API if available, otherwise random positions
  useEffect(() => {
    const initialMarkers = new Map<number, ProductMarker>()
    const initialPos = new Map<number, ProductMarker>()
    const confirmedPos = new Map<number, ProductMarker>()
    const confirmedSet = new Set<number>()
    
    lookData.products.forEach((product) => {
      // Check if we have existing markers from API (edit mode)
      const existingMarker = lookData.markers?.find(m => m.productId === product.id)
      
      if (existingMarker) {
        // Use exact position from API
        const position = {
          productId: product.id,
          x: existingMarker.x,
          y: existingMarker.y,
        }
        initialMarkers.set(product.id, position)
        initialPos.set(product.id, position)
        confirmedPos.set(product.id, position)
        confirmedSet.add(product.id)
      } else {
        // Generate random position between 20% and 80% to keep markers visible (new/add mode)
        const randomX = 20 + Math.random() * 60
        const randomY = 20 + Math.random() * 60
        const position = {
          productId: product.id,
          x: randomX,
          y: randomY,
        }
        initialMarkers.set(product.id, position)
        initialPos.set(product.id, position)
      }
    })
    
    setMarkers(initialMarkers)
    setInitialPositions(initialPos)
    setConfirmedPositions(confirmedPos)
    setSelectedProductIndex(0)
    setTooltipDismissed(new Set())
    setConfirmedMarkers(confirmedSet)
  }, [lookData.products, lookData.markers])

  const handleMarkerMouseDown = (e: React.MouseEvent, productId: number) => {
    e.stopPropagation()
    e.preventDefault() // Prevent text/image selection
    // Only allow dragging if this is the selected product
    const selectedProduct = lookData.products[selectedProductIndex]
    if (selectedProduct?.id !== productId) {
      return
    }
    const marker = markers.get(productId)
    if (marker) {
      // Store previous position (either confirmed position or current position)
      const confirmedPos = confirmedPositions.get(productId)
      const previousX = confirmedPos ? confirmedPos.x : marker.x
      const previousY = confirmedPos ? confirmedPos.y : marker.y
      
      setDraggedMarker({ 
        productId, 
        x: marker.x, 
        y: marker.y,
        previousX,
        previousY
      })
      // Dismiss tooltip when user starts dragging
      setTooltipDismissed(prev => new Set(prev).add(productId))
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedMarker || !imageContainerRef.current) return

    // Prevent text selection during drag
    if (e.buttons === 1) {
      e.preventDefault()
    }

    const transform = getContainTransform()
    if (!transform) return

    const rect = imageContainerRef.current.getBoundingClientRect()
    const xInContainer = e.clientX - rect.left
    const yInContainer = e.clientY - rect.top

    // Convert container pixel to percentage of natural image using the utility
    const rawPercentage = containerToPercentage(xInContainer, yInContainer)
    if (!rawPercentage) return

    // Clamp coordinates so the marker dot stays within image bounds
    // Marker is 32px (w-8 h-8). Radius = 16px in container coordinates.
    const MARKER_RADIUS_PX = 16
    const clamped = clampPercentage(rawPercentage.x, rawPercentage.y, MARKER_RADIUS_PX)

    // Calculate minimum distance for overlap detection
    const MIN_DISTANCE = calculateMinDistance(MARKER_RADIUS_PX, transform)
    
    // Check for overlap with other markers
    let canPlace = true
    for (const [productId, marker] of markers.entries()) {
      // Skip the marker being dragged
      if (productId === draggedMarker.productId) continue
      
      // Check if markers would overlap
      if (checkMarkerOverlap(clamped, marker, MIN_DISTANCE)) {
        canPlace = false
        break
      }
    }

    // Only update if the marker can be placed without overlapping
    if (canPlace) {
      const newMarkers = new Map(markers)
      newMarkers.set(draggedMarker.productId, {
        productId: draggedMarker.productId,
        x: clamped.x,
        y: clamped.y,
      })
      setMarkers(newMarkers)
    }
  }

  const handleMouseUp = () => {
    // Just clear the dragged marker, don't show modal yet
    // Modal will show when user tries to switch products or confirm
    setDraggedMarker(null)
  }

  // Check if there's an unconfirmed change to a confirmed marker
  const checkForUnconfirmedChanges = (productIdToCheck?: number): { hasChanges: boolean; productId: number | null; data: any } => {
    // Check all confirmed markers for unconfirmed changes
    for (const [productId, marker] of markers.entries()) {
      if (productIdToCheck && productId !== productIdToCheck) continue
      
      if (confirmedMarkers.has(productId)) {
        const confirmedPos = confirmedPositions.get(productId)
        if (confirmedPos) {
          const hasMoved = Math.abs(marker.x - confirmedPos.x) > 1 || Math.abs(marker.y - confirmedPos.y) > 1
          if (hasMoved) {
            return {
              hasChanges: true,
              productId,
              data: {
                productId,
                newX: marker.x,
                newY: marker.y,
                previousX: confirmedPos.x,
                previousY: confirmedPos.y
              }
            }
          }
        }
      }
    }
    return { hasChanges: false, productId: null, data: null }
  }

  const handleProductSelect = (index: number) => {
    const currentProduct = lookData.products[selectedProductIndex]
    
    // Check if there are unconfirmed changes to the current product
    if (currentProduct) {
      const unconfirmedChanges = checkForUnconfirmedChanges(currentProduct.id)
      if (unconfirmedChanges.hasChanges) {
        setPendingMarker(unconfirmedChanges.data)
        setShowConfirmModal(true)
        // Store the target index to switch to after modal is resolved
        setPendingProductSwitch(index)
        return
      }
    }
    
    setSelectedProductIndex(index)
  }

  const getPlacedMarkersCount = () => {
    return Array.from(markers.values()).filter(
      (marker) => marker.x >= 0 && marker.y >= 0 && marker.x <= 100 && marker.y <= 100
    ).length
  }

  const getConfirmedMarkersCount = () => {
    return confirmedMarkers.size
  }

  const allMarkersPlaced = () => {
    return getPlacedMarkersCount() === lookData.products.length
  }

  const allMarkersConfirmed = () => {
    return confirmedMarkers.size === lookData.products.length
  }

  const handleConfirmPlacement = () => {
    const currentProduct = lookData.products[selectedProductIndex]
    if (!currentProduct) return

    // Check if there are unconfirmed changes to a confirmed marker
    const unconfirmedChanges = checkForUnconfirmedChanges()
    if (unconfirmedChanges.hasChanges && unconfirmedChanges.productId !== currentProduct.id) {
      // There's an unconfirmed change to another product
      setPendingMarker(unconfirmedChanges.data)
      setShowConfirmModal(true)
      // Store that we want to confirm placement after modal
      setPendingProductSwitch(-1) // -1 means confirm placement
      return
    }

    const marker = markers.get(currentProduct.id)
    if (!marker) return

    // Check if marker has been moved from initial position (if not confirmed) or confirmed position (if confirmed)
    const isConfirmed = confirmedMarkers.has(currentProduct.id)
    let hasBeenMoved = false
    
    if (isConfirmed) {
      const confirmedPos = confirmedPositions.get(currentProduct.id)
      hasBeenMoved = confirmedPos ? (
        Math.abs(marker.x - confirmedPos.x) > 1 || 
        Math.abs(marker.y - confirmedPos.y) > 1
      ) : false
    } else {
      const initialPos = initialPositions.get(currentProduct.id)
      hasBeenMoved = initialPos ? (
        Math.abs(marker.x - initialPos.x) > 1 || 
        Math.abs(marker.y - initialPos.y) > 1
      ) : false
    }

    if (!hasBeenMoved) {
      //alert("Please drag the marker to place it on the product")
      return
    }

    // Mark this marker as confirmed and save its position
    setConfirmedMarkers(prev => new Set(prev).add(currentProduct.id))
    setConfirmedPositions(prev => {
      const newMap = new Map(prev)
      newMap.set(currentProduct.id, { ...marker })
      return newMap
    })
    // Dismiss tooltip for current product
    setTooltipDismissed(prev => new Set(prev).add(currentProduct.id))

    // Move to next product if available
    if (selectedProductIndex < lookData.products.length - 1) {
      setSelectedProductIndex(selectedProductIndex + 1)
      // Reset tooltip for next product
      const nextProduct = lookData.products[selectedProductIndex + 1]
      if (nextProduct) {
        setTooltipDismissed(prev => {
          const newSet = new Set(prev)
          newSet.delete(nextProduct.id)
          return newSet
        })
      }
    } else {
      // All products are confirmed
      //alert("All markers have been placed!")
    }
  }

  const handleModalConfirm = () => {
    if (pendingMarker) {
      // Update confirmed position to new position
      setConfirmedPositions(prev => {
        const newMap = new Map(prev)
        newMap.set(pendingMarker.productId, {
          productId: pendingMarker.productId,
          x: pendingMarker.newX,
          y: pendingMarker.newY
        })
        return newMap
      })
    }
    
    // Handle pending product switch or confirm placement
    if (pendingProductSwitch !== null) {
      if (pendingProductSwitch === -1) {
        // Retry confirm placement
        setPendingProductSwitch(null)
        setShowConfirmModal(false)
        setPendingMarker(null)
        // Small delay to ensure state is updated
        setTimeout(() => {
          handleConfirmPlacement()
        }, 100)
        return
      } else {
        // Switch to the pending product
        setSelectedProductIndex(pendingProductSwitch)
        setPendingProductSwitch(null)
      }
    }
    
    setShowConfirmModal(false)
    setPendingMarker(null)
  }

  const handleModalDiscard = () => {
    if (pendingMarker) {
      // Revert marker to previous position
      const newMarkers = new Map(markers)
      newMarkers.set(pendingMarker.productId, {
        productId: pendingMarker.productId,
        x: pendingMarker.previousX,
        y: pendingMarker.previousY
      })
      setMarkers(newMarkers)
    }
    
    // Handle pending product switch
    if (pendingProductSwitch !== null && pendingProductSwitch !== -1) {
      setSelectedProductIndex(pendingProductSwitch)
      setPendingProductSwitch(null)
    } else {
      setPendingProductSwitch(null)
    }
    
    setShowConfirmModal(false)
    setPendingMarker(null)
  }

  const handleCancel = () => {
    // Show confirmation modal before canceling
    setShowCancelModal(true)
  }

  const handleCancelConfirm = () => {
    // Get source page info to route back correctly
    let returnUrl = "/admin-dashboard/shop-the-look/add-look" // Default to add page
    let isEditMode = false
    if (typeof window !== 'undefined') {
      const sourcePageData = sessionStorage.getItem('markerSourcePage')
      if (sourcePageData) {
        try {
          const parsed = JSON.parse(sourcePageData)
          if (parsed.returnUrl) {
            returnUrl = parsed.returnUrl
          }
          if (parsed.type === 'edit') {
            isEditMode = true
          }
        } catch (error) {
          console.error('Failed to parse source page data:', error)
        }
      }
      // Clear only marker-related data, preserve form data for add mode
      sessionStorage.removeItem('lookData') // Contains marker positions
      sessionStorage.removeItem('markerSourcePage')
      
      // Only clear lookFormData if in edit mode (edit form doesn't need it)
      // For add mode, keep lookFormData so the form can restore its state
      if (isEditMode) {
        sessionStorage.removeItem('lookFormData')
      }
      // Otherwise, keep lookFormData intact for add-look-form to restore
    }
    setShowCancelModal(false)
    router.push(returnUrl)
  }

  const handleCancelCancel = () => {
    setShowCancelModal(false)
  }

  const handleSaveLook = async () => {
    if (!allMarkersConfirmed()) {
      //alert("Please confirm markers for all products")
      return
    }
    
    // CRITICAL: Ensure image dimensions are loaded before saving
    // This prevents incorrect coordinate calculations
    if (!isImageReady || !imageDimensions) {
      console.error("Image dimensions not ready. Cannot save coordinates accurately.")
      return
    }
    
    // Get the main image URL - prefer mainImageUrl (uploaded URL) over mainImage
    const mainImageUrl = lookData.mainImageUrl || 
      (lookData.mainImage?.startsWith('http') ? lookData.mainImage : null)

    if (!mainImageUrl || !mainImageUrl.startsWith('http')) {
      //alert("Main image URL is required. Please ensure the image was uploaded successfully.")
      return
    }

    try {
      // Detect if we're in edit mode (has a real ID, not a temp ID)
      const isEditing = lookData.id && !lookData.id.toString().startsWith('temp-')
      
      // Get sequence number
      let sequence = 1
      if (isEditing) {
        // In edit mode, try to get existing sequence from the look
        try {
          const existingLooks = await getActiveLooks()
          const existingLook = existingLooks.looks?.find(l => l.id.toString() === lookData.id.toString())
          if (existingLook?.sequence) {
            sequence = existingLook.sequence
          }
        } catch (error) {
          console.error("Failed to fetch existing looks, calculating new sequence:", error)
        }
      }
      
      // If still no sequence, calculate next sequence
      if (sequence === 1 && !isEditing) {
        try {
          const existingLooks = await getActiveLooks()
          if (existingLooks.looks && existingLooks.looks.length > 0) {
            const maxSequence = Math.max(...existingLooks.looks.map(look => look.sequence || 0))
            sequence = maxSequence + 1
          }
        } catch (error) {
          console.error("Failed to fetch existing looks, using default sequence:", error)
          // Default to 1 if fetch fails
        }
      }

      // Prepare product list with pixel coordinates using the utility
      // Coordinates are stored as percentage of natural image, converted to pixels for API
      const productList = lookData.products.map((product) => {
        const confirmedPos = confirmedPositions.get(product.id)
        const marker = markers.get(product.id)
        const xPercent = confirmedPos?.x || marker?.x || 0
        const yPercent = confirmedPos?.y || marker?.y || 0
        
        // Use the utility to convert percentage to pixel coordinates
        // This ensures accurate coordinates based on natural image dimensions
        const pixelCoords = percentageToPixels(xPercent, yPercent)
        
        return {
          id: product.id,
          x_coordinate: pixelCoords.x,
          y_coordinate: pixelCoords.y,
        }
      })

      // Prepare request payload
      const requestPayload: any = {
        name: lookData.name,
        sequence: sequence,
        main_img_url: mainImageUrl,
        product_list: productList,
      }

      // Include id when in edit mode
      if (isEditing) {
        // Convert string id to number if needed
        const id = typeof lookData.id === 'string' ? Number(lookData.id) : lookData.id
        if (!isNaN(id as number)) {
          requestPayload.id = id
        }
      }

      // Call the mutation to create/update the look (automatically invalidates cache)
      const response = await createLookMutation.mutateAsync(requestPayload)

      if (response.status_code === 200) {
        // Clear sessionStorage when successfully saving
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('lookData')
          sessionStorage.removeItem('lookFormData')
          sessionStorage.removeItem('markerSourcePage')
        }
        //alert("Look saved successfully!")
        router.push("/admin-dashboard/shop-the-look")
      } else {
        throw new Error(response.message || 'Failed to save look')
      }
    } catch (error) {
      console.error("Failed to save look:", error)
      //alert(error instanceof Error ? error.message : "Failed to save look. Please try again.")
    }
  }

  const currentProduct = lookData.products[selectedProductIndex]
  const currentMarker = currentProduct ? markers.get(currentProduct.id) : null

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Main Content */}
      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Left Section: Main Image */}
        <div className="flex-1 relative bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
          <div
            ref={imageContainerRef}
            className="w-full h-full relative select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragStart={(e) => e.preventDefault()}
            style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          >
            {lookData.mainImage && (
              <Image
                src={lookData.mainImage}
                alt={lookData.name}
                fill
                className="object-contain"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            )}

            {/* Render all markers */}
            {Array.from(markers.entries()).map(([productId, marker]) => {
              const product = lookData.products.find((p) => p.id === productId)
              const isSelected = currentProduct?.id === productId
              const productIndex = lookData.products.findIndex((p) => p.id === productId)
              const isConfirmed = confirmedMarkers.has(productId)
              const confirmedPos = confirmedPositions.get(productId)
              const initialPos = initialPositions.get(productId)
              
              // Use the utility to convert percentage to container position
              const containerPos = percentageToContainer(marker.x, marker.y)
              const leftPercent = containerPos?.left ?? marker.x
              const topPercent = containerPos?.top ?? marker.y
              
              // Check if moved from confirmed position (if confirmed) or initial position (if not confirmed)
              const hasBeenMoved = isConfirmed && confirmedPos
                ? (Math.abs(marker.x - confirmedPos.x) > 1 || Math.abs(marker.y - confirmedPos.y) > 1)
                : initialPos && (Math.abs(marker.x - initialPos.x) > 1 || Math.abs(marker.y - initialPos.y) > 1)
              
              // Show tooltip if:
              // - It's selected
              // - Tooltip hasn't been dismissed
              // - OR it's confirmed (to show product details)
              // - OR it's edit mode and marker is confirmed (show product info initially)
              const showTooltip = isSelected && (
                (!tooltipDismissed.has(productId) && !isConfirmed) || 
                (isConfirmed && hasBeenMoved) ||
                (isEditMode && isConfirmed && !hasBeenMoved && !tooltipDismissed.has(productId))
              )

              return (
                <div
                  key={productId}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none ${
                    // Keep the selected marker always on top so it stays draggable even when overlapping others
                    isSelected ? "z-30 cursor-move" : "z-10 cursor-not-allowed"
                  }`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                  }}
                  onMouseDown={(e) => handleMarkerMouseDown(e, productId)}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Dismiss tooltip on click (only if not confirmed)
                    if (isSelected && !tooltipDismissed.has(productId) && !isConfirmed) {
                      setTooltipDismissed(prev => new Set(prev).add(productId))
                    }
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 select-none ${
                      isSelected
                        ? "bg-red-500 border-white"
                        : "bg-white border-red-500 opacity-60"
                    } shadow-lg flex items-center justify-center relative`}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  >
                    <span 
                      className={`text-xs font-bold select-none ${
                        isSelected ? "text-white" : "text-red-500"
                      }`}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    >
                      {productIndex + 1}
                    </span>
                    {/* Tooltip */}
                    {showTooltip && product && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800/95 text-white text-xs rounded-lg shadow-xl z-20 backdrop-blur-sm">
                        {(isConfirmed && hasBeenMoved) || (isEditMode && isConfirmed && !hasBeenMoved) ? (
                          // Show product details when confirmed (and moved) OR in edit mode with confirmed marker
                          <div className="flex items-center gap-2.5 p-2.5">
                            {/* Product Image - Left Side */}
                            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-700 flex-shrink-0">
                              <Image
                                src={
                                  (product as any).product_image ||
                                  (product as any).image ||
                                  "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                }
                                alt={product.name || "Product"}
                                fill
                                className="object-contain"
                              />
                            </div>
                            {/* Product Info - Right Side */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="font-semibold text-white truncate">
                                {product.name || "Unnamed Product"}
                              </div>
                              <div className="text-gray-300">
                                ₹{product.mrp?.toLocaleString() || "0"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Show "Drag to place" instruction for add mode
                          <div className="px-3 py-1.5 whitespace-nowrap text-center">
                            Drag to place
                          </div>
                        )}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-2 h-2 bg-gray-800/95 rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Section: Control Panel */}
        <div className="w-[400px] flex flex-col h-full min-h-0">
          <Card className="bg-white rounded-lg border border-gray-200 flex-1 flex flex-col h-full min-h-0">
            <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden py-4">
              <div className="flex flex-col flex-1 min-h-0 space-y-4">
                {/* Header Section - Fixed */}
                <div className="flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Place Product Markers
                  </h2>
                  <p className="text-xs text-gray-600">
                    Drag the marker to the position of each product in the image.
                  </p>
                </div>

                {/* Progress Indicator - Fixed */}
                <div className="flex-shrink-0 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">
                      {getConfirmedMarkersCount()} of {lookData.products.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-secondary-900 h-2 rounded-full transition-all"
                      style={{
                        width: `${(getConfirmedMarkersCount() / lookData.products.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Product List - Scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
                  {lookData.products.map((product, index) => {
                    const productImage =
                      (product as any).product_image ||
                      (product as any).image ||
                      "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"

                    const marker = markers.get(product.id)
                    const isConfirmed = confirmedMarkers.has(product.id)
                    const isSelected = index === selectedProductIndex

                    return (
                      <Card
                        key={product.id}
                        className={`border-2 cursor-pointer transition-all flex-shrink-0 ${
                          isSelected
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                        onClick={() => handleProductSelect(index)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-gray-600">
                                {index + 1}
                              </span>
                            </div>
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={productImage}
                                alt={product.name || "Product"}
                                fill
                                className="object-contain"
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
                            {isConfirmed && (
                              <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0 bg-white">
                                <Check className="w-3 h-3 text-green-500" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Action Buttons - Fixed */}
                <div className="flex-shrink-0 space-y-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleConfirmPlacement}
                    disabled={(() => {
                      if (!currentProduct) return true
                      const isConfirmed = confirmedMarkers.has(currentProduct.id)
                      if (!isConfirmed) {
                        // Not confirmed yet - check if moved from initial
                        const marker = markers.get(currentProduct.id)
                        const initialPos = initialPositions.get(currentProduct.id)
                        if (!marker || !initialPos) return true
                        const hasBeenMoved = Math.abs(marker.x - initialPos.x) > 1 || Math.abs(marker.y - initialPos.y) > 1
                        return !hasBeenMoved
                      } else {
                        // Confirmed - check if moved from confirmed position
                        const marker = markers.get(currentProduct.id)
                        const confirmedPos = confirmedPositions.get(currentProduct.id)
                        if (!marker || !confirmedPos) return true
                        const hasBeenMoved = Math.abs(marker.x - confirmedPos.x) > 1 || Math.abs(marker.y - confirmedPos.y) > 1
                        return !hasBeenMoved
                      }
                    })()}
                    className="w-full bg-secondary-900 text-white hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {confirmedMarkers.has(currentProduct?.id || 0) 
                      ? "Confirm Placement" 
                      : "Confirm Placement"}
                  </Button>
                  {/* <p className="text-xs text-gray-500 text-center">
                    Drag the beacon to position it
                  </p> */}
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
              onClick={handleSaveLook}
              disabled={!allMarkersConfirmed() || isSaving || !isImageReady}
              className="px-6 py-2 bg-secondary-900 text-white hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed w-[155px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : !isImageReady ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm/Discard Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Marker Position</DialogTitle>
            <DialogDescription>
              You have moved the marker from its confirmed position. Do you want to confirm the new position or discard the changes?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleModalDiscard}
              className="flex-1"
            >
              Discard
            </Button>
            <Button
              onClick={handleModalConfirm}
              className="flex-1 bg-secondary-900 text-white hover:bg-secondary-800"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All your progress including marker placements will be lost and you will be redirected back to the form page.
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

