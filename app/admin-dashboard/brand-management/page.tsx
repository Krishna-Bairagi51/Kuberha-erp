"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"

// Lazy load the BrandManagementPage component for code splitting
const BrandManagementPage = dynamic(
  () => import("@/components/features/website-setup/components/brand-management/main-brand-management"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AdminBrandManagementPage() {
  const router = useRouter()

  const handleViewBrandDetail = (brandId: string | number) => {
    router.push(`/admin-dashboard/brand-management/${brandId}`)
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BrandManagementPage
        onViewBrandDetail={handleViewBrandDetail}
      />
    </Suspense>
  )
}
