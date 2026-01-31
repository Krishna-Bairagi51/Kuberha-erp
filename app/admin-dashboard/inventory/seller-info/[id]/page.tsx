"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { NotFoundIdRoute } from "@/components/shared/ui/not-found-id-route"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"

// Lazy load the SellerInfoTable component for code splitting
const SellerInfoTable = dynamic(
  () => import("@/components/features/inventory/components/seller-info-table"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function SellerInfoPage() {
  const params = useParams()
  const router = useRouter()
  const sellerId = useMemo(() => {
    const id = params.id
    if (!id || id === "undefined") return null
    const numId = Number(id)
    return isNaN(numId) ? null : numId
  }, [params.id])

  // Persist and restore scroll position for the seller info page
  const { save: saveScroll } = useDashboardScrollPersistence({
    storageKey: `admin-seller-info-scroll-${sellerId || 0}`,
    // We don't depend on data loading here; restoring on mount is sufficient
    restoreWhen: true,
  })

  const handleClose = () => {
    // Save scroll position before navigating away
    saveScroll()
    router.push('/admin-dashboard/inventory')
  }

  const handleEditProduct = (productId: number) => {
    // Save scroll position before navigating to edit page
    saveScroll()
    router.push(`/admin-dashboard/inventory/edit/${productId}`)
  }

  // Show 404 if seller ID is invalid
  if (sellerId === null) {
    return (
      <NotFoundIdRoute
        pageTitle="Inventory"
        title="Seller Not Found"
        message="The seller you're looking for doesn't exist or the ID is invalid."
        backUrl="/admin-dashboard/inventory"
        backLabel="Back to Inventory"
      />
    )
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <SellerInfoTable
          onClose={handleClose}
          selectedSellerId={sellerId}
          onEditProduct={handleEditProduct}
        />
      </Suspense>
    </div>
  )
}
