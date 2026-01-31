"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useAdminDashboard } from "../context"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useAdminProductsQuery } from "@/components/features/inventory/hooks/use-inventory-query"

// Lazy load the InventoryDashboard component for code splitting
const InventoryDashboard = dynamic(
  () => import("@/components/features/inventory/components/inventory-page-admin").then((mod) => ({ default: mod.MainInventoryPage })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AdminInventoryPage() {
  const { setIsSliderOpen } = useAdminDashboard()
  const router = useRouter()

  // Get data loading state for scroll restoration
  // We need to check URL params to get initial pagination state
  const getInitialParams = () => {
    if (typeof window === 'undefined') return { page: 1, limit: 10 }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      page: parseInt(urlParams.get('page') || '1', 10),
      limit: parseInt(urlParams.get('itemsPerPage') || '10', 10),
    }
  }
  const initialParams = getInitialParams()
  
  // Fetch products to know when data is loaded (for scroll restoration)
  const { data: productsResponse, isLoading: isLoadingProducts } = useAdminProductsQuery({
    page: initialParams.page,
    limit: initialParams.limit,
  })

  // Scroll persistence at page level
  const { save: saveScroll } = useDashboardScrollPersistence({
    storageKey: 'admin-inventory-scroll',
    restoreWhen: !isLoadingProducts && !!productsResponse,
  })

  const handleAddItem = () => {
    router.push('/admin-dashboard/inventory/add-item')
  }

  const handleEditProduct = (productId: number) => {
    router.push(`/admin-dashboard/inventory/edit/${productId}`)
  }

  const handleViewPendingApprovals = () => {
    router.push('/admin-dashboard/inventory/pending-approvals')
  }

  const handleViewSellerInfo = (sellerId: number) => {
    router.push(`/admin-dashboard/inventory/seller-info/${sellerId}`)
  }

  const handleViewLowStock = () => {
    router.push('/admin-dashboard/inventory/low-stock')
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InventoryDashboard
        onSliderStateChange={setIsSliderOpen}
        onAddItem={handleAddItem}
        onEditProduct={handleEditProduct}
        onViewPendingApprovals={handleViewPendingApprovals}
        onViewSellerInfo={handleViewSellerInfo}
        onViewLowStock={handleViewLowStock}
        onSaveScroll={saveScroll}
      />
    </Suspense>
  )
}
