"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useAdminDashboard } from "../context"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useSupplierListQuery } from "@/components/features/supplier-details/hooks/use-supplier-query"

// Lazy load the SupplierDetailsPage component for code splitting
const SupplierDetailsPage = dynamic(
  () => import("@/components/features/supplier-details/components/supplier-details-page"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AdminSupplierDetailsPage() {
  const { setIsSliderOpen } = useAdminDashboard()
  const router = useRouter()

  // Read initial pagination params from URL for queries
  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { page: 1, limit: 10, search: undefined, status: undefined }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get('supplierStatus') || 'All'
    
    const mapStatusToApi = (uiStatus: string): string | undefined => {
      switch (uiStatus) {
        case 'All': return undefined
        case 'Draft': return 'draft'
        case 'Pending': return 'pending'
        case 'Approved': return 'approved'
        case 'Rejected': return 'rejected'
        default: return undefined
      }
    }
    
    return {
      page: parseInt(urlParams.get('supplierPage') || '1', 10),
      limit: parseInt(urlParams.get('supplierItemsPerPage') || '10', 10),
      search: urlParams.get('supplierSearch') || undefined,
      status: mapStatusToApi(status),
    }
  }, [])

  // Get data loading state for scroll restoration
  const { data: supplierListData, isLoading: isLoadingSuppliers } = useSupplierListQuery(
    { enabled: true },
    initialParams
  )

  // Scroll persistence: restore scroll when supplier data is loaded
  useDashboardScrollPersistence({
    storageKey: 'admin-all-supplier-details-scroll',
    restoreWhen: !isLoadingSuppliers && !!supplierListData,
  })

  const handleViewSupplierDetail = (supplierId: string | number) => {
    router.push(`/admin-dashboard/all-supplier-details/${supplierId}`)
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SupplierDetailsPage
        onSliderStateChange={setIsSliderOpen}
        onViewSupplierDetail={handleViewSupplierDetail}
      />
    </Suspense>
  )
}
