"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useAdminDashboard } from "../context"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useTransformedQCData, useAdminPendingQCList } from "@/components/features/qc/hooks/use-qc-list"
import { useQCDashboardMetrics } from "@/components/features/qc/hooks/use-qc-insights"

// Lazy load the QCPage component for code splitting
const QCPage = dynamic(
  () => import("@/components/features/qc/components/qc-page").then((mod) => ({ default: mod.QCPage })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AdminQualityControlPage() {
  const { setIsSliderOpen } = useAdminDashboard()
  const router = useRouter()

  // Read initial pagination params from URL for queries
  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { page: 1, limit: 10, search: undefined, status: undefined }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      page: parseInt(urlParams.get('submissionsQcPage') || '1', 10),
      limit: parseInt(urlParams.get('submissionsQcItemsPerPage') || '10', 10),
      search: urlParams.get('submissionsQcSearch') || undefined,
      status: urlParams.get('submissionsQcStatus') || undefined,
    }
  }, [])

  // Get data loading state for scroll restoration
  const { data: transformedData, isLoading: isListLoading } = useTransformedQCData(
    'admin',
    initialParams
  )
  const { orderList: pendingQCOrders, isLoading: isPendingLoading } = useAdminPendingQCList(
    { page: 1, limit: 1000, search: undefined },
    { enabled: true }
  )
  const { isLoading: isInsightsLoading } = useQCDashboardMetrics()

  // Scroll persistence: restore scroll when QC data is loaded
  useDashboardScrollPersistence({
    storageKey: 'admin-quality-control-scroll',
    restoreWhen: !isListLoading && !isPendingLoading && !isInsightsLoading && !!transformedData,
  })

  const handleViewOrderDetail = (orderId: number) => {
    router.push(`/admin-dashboard/quality-control/${orderId}`)
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <QCPage
        userType="admin"
        onSliderStateChange={setIsSliderOpen}
        onViewOrderDetail={handleViewOrderDetail}
      />
    </Suspense>
  )
}
