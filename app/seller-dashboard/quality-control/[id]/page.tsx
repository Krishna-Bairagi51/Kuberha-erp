"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { NotFoundIdRoute } from "@/components/shared/ui/not-found-id-route"

// Lazy load the OrderDetailPage component for code splitting
const OrderDetailPage = dynamic(
  () => import("@/components/features/orders/components/order-detail-page"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function QCOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = useMemo(() => {
    const id = params.id
    if (!id || id === "undefined") return null
    const numId = Number(id)
    return isNaN(numId) ? null : numId
  }, [params.id])

  const handleBack = () => {
    // Prefer real "back" so the previous quality control instance + URL params are preserved
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    // Fallback: if no history, navigate to quality control (URL params will be lost, but it's a fallback)
    router.push('/seller-dashboard/quality-control')
  }

  const handleRefresh = () => {
    // OrderDetailPage handles its own data fetching and invalidation
  }

  // Show 404 if order ID is invalid
  if (orderId === null) {
    return (
      <NotFoundIdRoute
        pageTitle="Quality Control"
        title="Order Not Found"
        message="The order you're looking for doesn't exist or the ID is invalid."
        backUrl="/seller-dashboard/quality-control"
        backLabel="Back to Quality Control"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <OrderDetailPage
          order={{ id: orderId } as any}
          onRefresh={handleRefresh}
          onBackToList={handleBack}
        />
      </Suspense>
    </div>
  )
}
