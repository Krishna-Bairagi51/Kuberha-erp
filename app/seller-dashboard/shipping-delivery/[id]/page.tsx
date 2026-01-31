"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { NotFoundIdRoute } from "@/components/shared/ui/not-found-id-route"

// Lazy load the ShipmentSupplierDetails component for code splitting
const ShipmentSupplierDetails = dynamic(
  () => import("@/components/features/shipping/components/shipment-supplier-details").then((mod) => ({ default: mod.ShipmentSupplierDetails })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function ShippingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = useMemo(() => {
    const id = params.id
    if (!id || id === "undefined" || id === "") return null
    return String(id)
  }, [params.id])

  const handleBack = () => {
    // Use browser history to go back to the previous page
    // This ensures proper navigation whether coming from home or shipping-delivery list
    router.back()
  }

  // Show 404 if order ID is invalid
  if (orderId === null) {
    return (
      <NotFoundIdRoute
        pageTitle="Shipping & Delivery"
        title="Shipment Not Found"
        message="The shipment you're looking for doesn't exist or the ID is invalid."
        backUrl="/seller-dashboard/shipping-delivery"
        backLabel="Back to Shipping & Delivery"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <ShipmentSupplierDetails
          orderId={orderId}
          onBack={handleBack}
          userType="seller"
        />
      </Suspense>
    </div>
  )
}
