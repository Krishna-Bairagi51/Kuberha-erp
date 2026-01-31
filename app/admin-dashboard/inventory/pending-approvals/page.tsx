"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"

// Lazy load the PendingApprovalsTable component for code splitting
const PendingApprovalsTable = dynamic(
  () => import("@/components/features/inventory/components/pending-approvals-table"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function PendingApprovalsPage() {
  const router = useRouter()

  const handleClose = () => {
    router.push('/admin-dashboard/inventory')
  }

  const handleEditProduct = (productId: number) => {
    router.push(`/admin-dashboard/inventory/edit/${productId}`)
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <PendingApprovalsTable
          onClose={handleClose}
          onEditProduct={handleEditProduct}
        />
      </Suspense>
    </div>
  )
}
