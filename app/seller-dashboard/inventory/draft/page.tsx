"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useSellerDashboard } from "../../context"

// Lazy load the DraftApprovedPage component for code splitting
const DraftApprovedPage = dynamic(
  () => import("@/components/features/inventory/components/draft-approved-page").then((mod) => ({ default: mod.DraftApprovedPage })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function DraftInventoryPage() {
  const router = useRouter()
  
  const handleClose = () => {
    router.push('/seller-dashboard/inventory')
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <DraftApprovedPage
          onClose={handleClose}
        />
      </Suspense>
    </div>
  )
}
