"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"

// Lazy load the CategoriesManagementPage component for code splitting
const CategoriesManagementPage = dynamic(
  () => import("@/components/features/website-setup/components/categories-management/main-categories-management"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function CategoriesManagementPathPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CategoriesManagementPage />
    </Suspense>
  )
}
