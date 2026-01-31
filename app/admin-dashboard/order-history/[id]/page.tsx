"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { NotFoundIdRoute } from "@/components/shared/ui/not-found-id-route"

// Lazy load the MfgQcOrderDetail component for code splitting
const MfgQcOrderDetail = dynamic(
  () => import("@/components/features/qc/components/qc-order-detail"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = useMemo(() => {
    const id = params.id
    if (!id || id === "undefined") return null
    const numId = Number(id)
    return isNaN(numId) ? null : numId
  }, [params.id])

  const handleBack = () => {
    // Use browser history to go back to the previous page
    // This ensures proper navigation whether coming from home or order-history list
    router.back()
  }

  // Show 404 if order ID is invalid
  if (orderId === null) {
    return (
      <NotFoundIdRoute
        pageTitle="Order History"
        title="Order Not Found"
        message="The order you're looking for doesn't exist or the ID is invalid."
        backUrl="/admin-dashboard/order-history"
        backLabel="Back to Order History"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <MfgQcOrderDetail
          onBack={handleBack}
          orderId={orderId}
          pageHeaderTitle="Order History"
        />
      </Suspense>
    </div>
  )
}
