"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { NotFoundIdRoute } from "@/components/shared/ui/not-found-id-route"

// Lazy load the ViewSupplierForm component for code splitting
const ViewSupplierForm = dynamic(
  () => import("@/components/features/supplier-details/components/View-supplier-details/view-supplier-form").then((mod) => ({ default: mod.ViewSupplierForm })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = useMemo(() => {
    const id = params.id
    if (!id || id === "undefined" || id === "") return null
    return String(id)
  }, [params.id])

  const handleClose = () => {
    router.push('/admin-dashboard/all-supplier-details')
  }

  // Show 404 if supplier ID is invalid
  if (supplierId === null) {
    return (
      <NotFoundIdRoute
        pageTitle="All Supplier Details"
        title="Supplier Not Found"
        message="The supplier you're looking for doesn't exist or the ID is invalid."
        backUrl="/admin-dashboard/all-supplier-details"
        backLabel="Back to Supplier Details"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <ViewSupplierForm
          supplierId={supplierId}
          onClose={handleClose}
        />
      </Suspense>
    </div>
  )
}
