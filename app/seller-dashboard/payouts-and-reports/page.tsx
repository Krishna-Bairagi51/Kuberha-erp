"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"

// Lazy load the MainAccountingPage component for code splitting
const MainAccountingPage = dynamic(
  () => import("@/components/features/payout-and-reports/components/main-accounting-page"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function SellerPayoutsAndReportsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MainAccountingPage />
    </Suspense>
  )
}
