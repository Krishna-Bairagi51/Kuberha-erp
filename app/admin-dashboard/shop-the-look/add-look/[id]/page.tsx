"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import PageHeader from "@/components/shared/layout/page-header"
import ProductMarkerPage from "@/components/features/website-setup/components/shop-the-look/add-look/product-marker-page"
import type { ProductListItem, AdminProductListItem } from "@/components/features/inventory/types/inventory.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { NotFoundIdRoute } from "@/components/shared/ui/not-found-id-route"

type ProductItem = ProductListItem | AdminProductListItem

interface ProductMarker {
  productId: number
  x: number
  y: number
}

interface LookData {
  id: string
  name: string
  mainImage: string | null
  mainImageUrl?: string
  products: ProductItem[]
  markers?: ProductMarker[]
}

export default function AddLookProductMarkerPage() {
  const router = useRouter()
  const params = useParams()
  const [lookData, setLookData] = useState<LookData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    // Get look data from sessionStorage
    const storedData = sessionStorage.getItem('lookData')
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        setLookData(parsedData)
        
        // Check if we're in edit mode
        const sourcePageData = sessionStorage.getItem('markerSourcePage')
        if (sourcePageData) {
          try {
            const parsed = JSON.parse(sourcePageData)
            setIsEditMode(parsed.type === 'edit')
          } catch {
            // Fall through to check ID
            setIsEditMode(parsedData.id && !parsedData.id.toString().startsWith('temp-'))
          }
        } else {
          // Check if lookData has a real ID (not temp)
          setIsEditMode(parsedData.id && !parsedData.id.toString().startsWith('temp-'))
        }
      } catch (error) {
        console.error('Failed to parse look data:', error)
        // Redirect back if data is invalid
        router.push('/admin-dashboard/shop-the-look/add-look')
      }
    } else {
      // No data found, redirect back
      router.push('/admin-dashboard/shop-the-look/add-look')
    }
    setIsLoading(false)
  }, [router])

  const handleBack = () => {
    // Show confirmation modal before canceling
    setShowCancelModal(true)
  }

  const handleCancelConfirm = () => {
    // Get source page info to route back correctly
    let returnUrl = "/admin-dashboard/shop-the-look/add-look" // Default to add page
    if (typeof window !== 'undefined') {
      const sourcePageData = sessionStorage.getItem('markerSourcePage')
      if (sourcePageData) {
        try {
          const parsed = JSON.parse(sourcePageData)
          if (parsed.returnUrl) {
            returnUrl = parsed.returnUrl
          }
        } catch (error) {
          console.error('Failed to parse source page data:', error)
        }
      }
    }
    setShowCancelModal(false)
    router.push(returnUrl)
  }

  const handleCancelCancel = () => {
    setShowCancelModal(false)
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!lookData) {
    return (
      <NotFoundIdRoute
        pageTitle="Shop The Look"
        title="Look Not Found"
        message="The look you're trying to edit doesn't exist or the session data is missing."
        backUrl="/admin-dashboard/shop-the-look/add-look"
        backLabel="Back to Add Look"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Shop The Look"
        subTitle={isEditMode ? `Edit Look / ${lookData.name}` : `Add New Look / ${lookData.name}`}
        onTitleClick={handleBack}
      />
      <div className="m-4 sm:m-6 lg:m-[24px]">
        <ProductMarkerPage 
          lookData={lookData}
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

