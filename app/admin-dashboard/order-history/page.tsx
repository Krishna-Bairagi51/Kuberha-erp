"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useAdminDashboard } from "../context"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useOrderHistoryQuery, useNewOrdersQuery, useOrderSummaryQuery } from "@/components/features/orders/hooks/use-orders-query"

// Lazy load the OrderHistoryTableAdmin component for code splitting
const OrderHistoryTableAdmin = dynamic(
  () => import("@/components/features/orders").then((mod) => ({ default: mod.OrderHistoryTableAdmin })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AdminOrdersPage() {
  const { setIsSliderOpen } = useAdminDashboard()
  const router = useRouter()

  // Read initial pagination params from URL for queries
  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { page: 1, limit: 10, search: undefined, status: undefined }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      page: parseInt(urlParams.get('orderPage') || '1', 10),
      limit: parseInt(urlParams.get('orderItemsPerPage') || '10', 10),
      search: urlParams.get('orderSearch') || undefined,
      status: urlParams.get('orderStatus') || undefined,
    }
  }, [])

  // Get data loading state for scroll restoration
  const { data: ordersResult, isLoading: isLoadingOrders } = useOrderHistoryQuery(
    'admin',
    true,
    initialParams
  )
  const { data: newOrdersResult, isLoading: isLoadingNewOrders } = useNewOrdersQuery(
    'admin',
    true,
    { page: 1, limit: 10 }
  )
  const { data: summaryData, isLoading: isLoadingSummary } = useOrderSummaryQuery('admin', true)

  // Scroll persistence: restore scroll when order data is loaded
  useDashboardScrollPersistence({
    storageKey: 'admin-order-history-scroll',
    restoreWhen: !isLoadingOrders && !isLoadingNewOrders && !isLoadingSummary && !!ordersResult && !!summaryData,
  })

  const handleViewOrderDetail = (orderId: number) => {
    router.push(`/admin-dashboard/order-history/${orderId}`)
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrderHistoryTableAdmin
        userType="admin"
        onSliderStateChange={setIsSliderOpen}
        onViewOrderDetail={handleViewOrderDetail}
      />
    </Suspense>
  )
}
