"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { NotFoundIdRoute } from "@/components/shared/ui/not-found-id-route"
import { useAdminDashboard } from "@/app/admin-dashboard/context"

// Lazy load the EditItemInventoryAdmin component for code splitting
const EditItemInventoryAdmin = dynamic(
  () => import("@/components/features/inventory/components/edit-item/edit-inventory-admin").then((mod) => ({ default: mod.EditItemInventoryAdmin })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function EditInventoryPage() {
  const params = useParams()
  const router = useRouter()
  const { setIsSliderOpen } = useAdminDashboard()
  const productId = useMemo(() => {
    const id = params.id
    if (!id || id === "undefined") return null
    const numId = Number(id)
    return isNaN(numId) ? null : numId
  }, [params.id])

  const handleClose = () => {
    // Prefer real "back" so the previous inventory instance + scroll container state is reused
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    // Fallback: if no history, navigate to inventory (scroll will be restored by persistence hook)
    router.push('/admin-dashboard/inventory')
  }

  // Show 404 if product ID is invalid
  if (productId === null) {
    return (
      <NotFoundIdRoute
        pageTitle="Inventory"
        title="Product Not Found"
        message="The product you're looking for doesn't exist or the ID is invalid."
        backUrl="/admin-dashboard/inventory"
        backLabel="Back to Inventory"
      />
    )
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <EditItemInventoryAdmin
          onClose={handleClose}
          onSliderStateChange={setIsSliderOpen}
          selectedProductId={productId}
        />
      </Suspense>
    </div>
  )
}
