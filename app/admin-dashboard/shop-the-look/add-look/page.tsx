"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import PageHeader from "@/components/shared/layout/page-header"
import { AddLookForm } from "@/components/features/website-setup/components/shop-the-look/add-look/add-look-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function AddLookPage() {
  const router = useRouter()
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Clear sessionStorage from edit mode when entering add page (unless coming from active add flow)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sourcePageData = sessionStorage.getItem('markerSourcePage')
      // Only clear edit mode data, preserve add mode data
      if (sourcePageData) {
        try {
          const parsed = JSON.parse(sourcePageData)
          // If coming from edit mode, clear everything
          if (parsed.type === 'edit') {
            sessionStorage.removeItem('lookData')
            sessionStorage.removeItem('lookFormData')
            sessionStorage.removeItem('markerSourcePage')
          }
          // If coming from add mode, keep the data (user is returning from marker page)
        } catch (error) {
          // If parsing fails, clear everything to be safe
          sessionStorage.removeItem('lookData')
          sessionStorage.removeItem('lookFormData')
          sessionStorage.removeItem('markerSourcePage')
        }
      } else {
        // No source page data - check if lookData exists and has markers (indicates edit mode data)
        const lookData = sessionStorage.getItem('lookData')
        if (lookData) {
          try {
            const parsed = JSON.parse(lookData)
            // If lookData has markers and an ID that's not a temp ID, it's from edit mode
            if (parsed.markers && parsed.markers.length > 0 && parsed.id && !parsed.id.toString().startsWith('temp-')) {
              // Clear edit mode data
              sessionStorage.removeItem('lookData')
              sessionStorage.removeItem('lookFormData')
            }
          } catch (error) {
            // If parsing fails, clear to be safe
            sessionStorage.removeItem('lookData')
            sessionStorage.removeItem('lookFormData')
          }
        }
      }
    }
  }, [])

  const handleBack = () => {
    // Show confirmation modal before canceling
    setShowCancelModal(true)
  }

  const handleCancelConfirm = () => {
    // User explicitly wants a clean exit (no confirmation modal, no restored draft).
    // Clear add-flow state so returning to "Add New Look" starts fresh.
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lookData')
      sessionStorage.removeItem('lookFormData')
      sessionStorage.removeItem('markerSourcePage')
    }
    setShowCancelModal(false)
    router.push("/admin-dashboard/shop-the-look")
  }

  const handleCancelCancel = () => {
    setShowCancelModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Shop The Look"
        subTitle="Add New Look"
        onTitleClick={handleBack}
      />
      <div className="m-4 sm:m-6 lg:m-[24px]">
        <AddLookForm />
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