"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useSellerProductsQuery } from "@/components/features/inventory/hooks/use-inventory-query"

// Lazy load the seller-specific InventoryPage component for code splitting
const InventoryPageSeller = dynamic(
  () => import("@/components/features/inventory/components/inventory-page-seller").then((mod) => ({ default: mod.MainInventoryPage })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function SellerInventoryPage() {

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
  const { data: productsResponse, isLoading: isLoadingProducts } = useSellerProductsQuery({
    page: initialParams.page,
    limit: initialParams.limit,
  })

  // Scroll persistence at page level
  const { save: saveScroll } = useDashboardScrollPersistence({
    storageKey: 'seller-inventory-scroll',
    restoreWhen: !isLoadingProducts && !!productsResponse,
  })

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InventoryPageSeller onSaveScroll={saveScroll} />
    </Suspense>
  )
}
