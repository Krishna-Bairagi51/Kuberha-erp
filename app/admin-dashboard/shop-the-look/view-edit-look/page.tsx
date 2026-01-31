"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import PageHeader from "@/components/shared/layout/page-header"
import { ViewEditLookForm } from "@/components/features/website-setup/components/shop-the-look/edit-view-look/view-edit-look-form"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import type { ProductListItem, AdminProductListItem } from "@/components/features/inventory/types/inventory.types"
import { useShopTheLook } from "@/components/features/website-setup/hooks/shop-the-look/use-shop-the-look"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ProductItem = ProductListItem | AdminProductListItem

interface ProductMarker {
  productId: number
  x: number
  y: number
}

export default function ViewEditLookPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeLooks, isLoading: isLoadingLooks } = useShopTheLook()
  const [lookData, setLookData] = useState<{
    id?: string | number
    name?: string
    mainImageUrl?: string
    products?: ProductItem[]
    markers?: ProductMarker[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mode = searchParams.get('mode') || 'view' // Default to view mode
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useEffect(() => {
    // Wait for looks to finish loading
    if (isLoadingLooks) {
      return
    }

    // Get look ID from URL params
    const lookId = searchParams.get('id')
    
    if (lookId) {
      // Try to find look in activeLooks
      const look = activeLooks.find((l) => l.id.toString() === lookId.toString())
      
      if (look) {
        // Handle case where product_list might be empty or undefined
        const productList = look.product_list || []
        // Map product_list from API to ProductItem format
        const products: ProductItem[] = productList.map((product) => ({
          id: product.product_id,
          name: product.name,
          mrp: product.mrp,
          product_image: product.image_url,
          image: product.image_url,
          // Required fields for AdminProductListItem
          vendor_id: 0,
          vendor_name: '',
          vendor_phone: '',
          vendor_address: '',
          total_sales: 0,
          status: 'active',
          category: '',
          stock: 0,
          stock_value: 0,
          // Required fields for ProductListItem
          shopify_status: 'active',
        } as AdminProductListItem))
        
        // Convert absolute pixel coordinates (API) to % of the NATURAL image size.
        // This avoids viewport/container issues and stays accurate for object-cover rendering.
        const imageUrl = look.image_url || undefined

        const setWithMarkers = (iw: number, ih: number) => {
          const markers: ProductMarker[] = productList.map((product) => ({
            productId: product.product_id,
            x: iw ? (product.x_coordinate / iw) * 100 : 0,
            y: ih ? (product.y_coordinate / ih) * 100 : 0,
          }))

          setLookData({
            id: look.id,
            name: look.name,
            mainImageUrl: imageUrl,
            products: products,
            markers: markers,
          })
        }

        if (imageUrl) {
          const img = new window.Image()
          img.onload = () => {
            const iw = img.naturalWidth || 1200
            const ih = img.naturalHeight || 800
            setWithMarkers(iw, ih)
          }
          img.onerror = () => {
            // Fallback if image can't be loaded
            setWithMarkers(1200, 800)
          }
          img.src = imageUrl
        } else {
          // No image URL; fallback
          setWithMarkers(1200, 800)
        }
      } else {
        // Try to get from sessionStorage (if coming from add flow)
        const storedData = sessionStorage.getItem('lookData')
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData)
            setLookData({
              id: parsedData.id,
              name: parsedData.name,
              mainImageUrl: parsedData.mainImage,
              products: parsedData.products || [],
              markers: parsedData.markers || [],
            })
          } catch (error) {
            console.error('Failed to parse stored look data:', error)
          }
        }
      }
    } else {
      // No ID provided, try sessionStorage
      const storedData = sessionStorage.getItem('lookData')
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          setLookData({
            id: parsedData.id,
            name: parsedData.name,
            mainImageUrl: parsedData.mainImage,
            products: parsedData.products || [],
            markers: parsedData.markers || [],
          })
        } catch (error) {
          console.error('Failed to parse stored look data:', error)
        }
      }
    }
    
    setIsLoading(false)
  }, [searchParams, activeLooks, isLoadingLooks])

  const handleBack = () => {
    // In view mode, navigate back directly without showing modal
    if (mode === 'view') {
      router.push("/admin-dashboard/shop-the-look")
      return
    }

    // Show confirmation modal before canceling (only in edit mode)
    setPendingAction(() => () => {
      // Clear sessionStorage when leaving edit mode to prevent data from persisting to add mode
      // Only preserve if user is currently in marker placement flow (will be cleared when they finish/cancel)
      if (typeof window !== 'undefined') {
        const sourcePageData = sessionStorage.getItem('markerSourcePage')
        // If no marker source page or if it's not an active edit flow, clear everything
        // The marker page will handle clearing when user finishes/cancels marker placement
        if (!sourcePageData) {
          sessionStorage.removeItem('lookData')
          sessionStorage.removeItem('lookFormData')
          sessionStorage.removeItem('markerSourcePage')
        } else {
          try {
            const parsed = JSON.parse(sourcePageData)
            // If user is going back from edit view (not from marker page), clear the data
            // The marker page URL would be /add-look/[id], so if we're here, user is leaving edit mode
            const currentPath = window.location.pathname
            if (!currentPath.includes('/add-look/')) {
              // User is leaving edit mode, clear the data
              sessionStorage.removeItem('lookData')
              sessionStorage.removeItem('lookFormData')
              sessionStorage.removeItem('markerSourcePage')
            }
          } catch (error) {
            // If parsing fails, clear to be safe
            sessionStorage.removeItem('lookData')
            sessionStorage.removeItem('lookFormData')
            sessionStorage.removeItem('markerSourcePage')
          }
        }
      }
      router.push("/admin-dashboard/shop-the-look")
    })
    setShowCancelModal(true)
  }

  const handleEditClick = () => {
    // Show confirmation modal before switching to edit mode
      router.push(`/admin-dashboard/shop-the-look/view-edit-look?id=${lookData?.id}&mode=edit`)
  }

  const handleCancelConfirm = () => {
    if (pendingAction) {
      pendingAction()
    }
    setShowCancelModal(false)
    setPendingAction(null)
  }

  const handleCancelCancel = () => {
    setShowCancelModal(false)
    setPendingAction(null)
  }

  if (isLoading || isLoadingLooks) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!lookData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader 
          title="Shop The Look"
          subTitle={mode === 'view' ? 'View Look' : 'Edit Look'}
          onTitleClick={handleBack}
        />
        <div className="m-4 sm:m-6 lg:m-[24px]">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Look not found</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Shop The Look"
        subTitle={mode === 'view' ? `View Look${lookData?.name ? ` / ${lookData.name}` : ''}` : `Edit Look${lookData?.name ? ` / ${lookData.name}` : ''}`}
        onTitleClick={handleBack}
        action={
          mode === 'view' ? (
            <Button
              onClick={handleEditClick}
              className="h-9 bg-secondary-900 text-white hover:bg-secondary-800"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Image
            </Button>
          ) : null
        }
      />
      <div className="m-4 sm:m-6 lg:m-[24px]">
        <ViewEditLookForm 
          initialData={lookData || undefined}
          mode={mode as 'view' | 'edit'}
        />
      </div>

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

