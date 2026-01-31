"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"

// Lazy load the ColorManagementPage component for code splitting
const ColorManagementPage = dynamic(
  () => import("@/components/features/website-setup/components/color-management/main-color-management"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AdminColorManagementPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ColorManagementPage />
    </Suspense>
  )
}
