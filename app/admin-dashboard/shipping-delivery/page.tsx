"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useAdminDashboard } from "../context"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useShipmentsQuery, useShipmentInsightsQuery } from "@/components/features/shipping/hooks/use-shipping-query"

// Lazy load the ShippingPage component for code splitting
const ShippingPage = dynamic(
  () => import("@/components/features/shipping/components/shipping-page").then((mod) => ({ default: mod.ShippingPage })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AdminShippingPage() {
  const { setIsSliderOpen } = useAdminDashboard()
  const router = useRouter()

  // Read initial pagination params from URL for queries
  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { page: 1, limit: 10, search: undefined, status: undefined }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const tabValue = urlParams.get('shippingTab') || 'All Shipments'
    const validTabs = ['All Shipments', 'In Transit', 'Pickup Schedule', 'Delivered']
    const activeTab = validTabs.includes(tabValue) ? tabValue : 'All Shipments'
    
    const getStatusFromTab = (tab: string) => {
      switch (tab) {
        case 'In Transit': return 'in_transit'
        case 'Pickup Schedule': return 'pickup_scheduled'
        case 'Delivered': return 'delivered'
        default: return undefined
      }
    }
    
    return {
      page: parseInt(urlParams.get('shippingPage') || '1', 10),
      limit: parseInt(urlParams.get('shippingItemsPerPage') || '10', 10),
      search: urlParams.get('shippingSearch') || undefined,
      status: getStatusFromTab(activeTab),
    }
  }, [])

  // Get data loading state for scroll restoration
  const { data: shipmentsResponse, isLoading: isLoadingShipments } = useShipmentsQuery(
    'admin',
    true,
    initialParams
  )
  const { isLoading: isLoadingInsights } = useShipmentInsightsQuery(undefined, true)

  // Scroll persistence: restore scroll when shipping data is loaded
  useDashboardScrollPersistence({
    storageKey: 'admin-shipping-delivery-scroll',
    restoreWhen: !isLoadingShipments && !isLoadingInsights && !!shipmentsResponse,
  })

  const handleViewOrderDetail = (orderId: string | number) => {
    router.push(`/admin-dashboard/shipping-delivery/${orderId}`)
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ShippingPage
        userType="admin"
        onSliderStateChange={setIsSliderOpen}
        onViewOrderDetail={handleViewOrderDetail}
      />
    </Suspense>
  )
}
