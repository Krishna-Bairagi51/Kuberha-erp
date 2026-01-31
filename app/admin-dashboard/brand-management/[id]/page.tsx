"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { NotFoundIdRoute } from "@/components/shared/ui/not-found-id-route"
import { useBrandsQuery } from "@/components/features/website-setup/hooks/use-brand-management"
import { PageHeader } from "@/components/shared/layout"

// Lazy load the BrandDetailPage component for code splitting
const BrandDetailPage = dynamic(
  () => import("@/components/features/website-setup/components/brand-management/brand-detail-page"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function BrandDetailRoutePage() {
  const params = useParams()
  const router = useRouter()
  const brandId = String(params.id)
  const { brands, isLoading, error } = useBrandsQuery()

  const selectedBrand = useMemo(() => {
    return brands.find((b) => b.id === brandId)
  }, [brands, brandId])

  const handleBack = () => {
    router.push('/admin-dashboard/brand-management')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Brand Management" className="" />
        <div className="m-[24px] flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size={70} className="min-h-[400px]" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Brand Management" className="" />
        <div className="m-[24px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-lg font-semibold text-red-900 font-urbanist mb-2">
              Error Loading Brand
            </p>
            <p className="text-sm text-red-700 font-urbanist">
              {error.message || "Failed to load brand data. Please try again later."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Brand not found - use shared NotFound component
  if (!selectedBrand) {
    return (
      <NotFoundIdRoute
        pageTitle="Brand Management"
        title="Brand Not Found"
        message="The brand you're looking for doesn't exist or has been removed."
        backUrl="/admin-dashboard/brand-management"
        backLabel="Back to Brand Management"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <BrandDetailPage
          brand={selectedBrand}
          onBack={handleBack}
        />
      </Suspense>
    </div>
  )
}
