"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useSellerDashboard } from "../context"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useOrderHistoryQuery, useNewOrdersQuery, useOrderSummaryQuery } from "@/components/features/orders/hooks/use-orders-query"

// Lazy load the OrderHistoryTable component for code splitting
const OrderHistoryTable = dynamic(
  () => import("@/components/features/orders").then((mod) => ({ default: mod.OrderHistoryTable })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function SellerOrderHistoryPage() {
  const { setIsSliderOpen } = useSellerDashboard()
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
    'seller',
    true,
    initialParams
  )
  const { data: newOrdersResult, isLoading: isLoadingNewOrders } = useNewOrdersQuery(
    'seller',
    true,
    { page: 1, limit: 10 }
  )
  const { data: summaryData, isLoading: isLoadingSummary } = useOrderSummaryQuery('seller', true)

  // Scroll persistence: restore scroll when order data is loaded
  useDashboardScrollPersistence({
    storageKey: 'seller-order-history-scroll',
    restoreWhen: !isLoadingOrders && !isLoadingNewOrders && !isLoadingSummary && !!ordersResult && !!summaryData,
  })

  const handleViewOrderDetail = (orderId: number) => {
    router.push(`/seller-dashboard/order-history/${orderId}`)
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrderHistoryTable
        userType="seller"
        onSliderStateChange={setIsSliderOpen}
        onViewOrderDetail={handleViewOrderDetail}
      />
    </Suspense>
  )
}
