"use client"

import { Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useSellerDashboard } from "../context"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useTransformedQCData, useSellerPendingQCList, useSellerRejectedQCList } from "@/components/features/qc/hooks/use-qc-list"
import { useQCDashboardMetrics } from "@/components/features/qc/hooks/use-qc-insights"

// Lazy load the QCPage component for code splitting
const QCPage = dynamic(
  () => import("@/components/features/qc/components/qc-page").then((mod) => ({ default: mod.QCPage })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function SellerQualityControlPage() {
  const { setIsSliderOpen, section, sectionId, onSectionChange } = useSellerDashboard()
  const router = useRouter()

  // Read initial pagination params from URL for queries
  const initialSubmissionsParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { page: 1, limit: 10, search: undefined, status: undefined, type: undefined }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get('submissionsQcStatus') || 'all'
    // Map seller filter values to API params
    const getFilterParams = (filterValue: string) => {
      if (!filterValue || filterValue === 'all' || filterValue === "All QC's") {
        return {}
      }
      const normalized = filterValue.toLowerCase()
      if (normalized === 'pending mfg qc' || normalized === 'pending manufacturing qc') {
        return { status: 'pending', type: 'mfg_qc' }
      }
      if (normalized === 'pending pkg qc' || normalized === 'pending packaging qc') {
        return { status: 'pending', type: 'pkg_qc' }
      }
      if (normalized === 'rejected' || normalized === 'rejected qc') {
        return { status: 'rejected' }
      }
      return {}
    }
    const filterParams = getFilterParams(status)
    return {
      page: parseInt(urlParams.get('submissionsQcPage') || '1', 10),
      limit: parseInt(urlParams.get('submissionsQcItemsPerPage') || '10', 10),
      search: urlParams.get('submissionsQcSearch') || undefined,
      status: filterParams.status,
      type: filterParams.type,
    }
  }, [])

  const initialPendingParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { page: 1, limit: 10, search: undefined, type: undefined }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const statusFilter = urlParams.get('pendingQcStatus') || 'All'
    const mapTypeFilterToApi = (filterValue: string) => {
      if (!filterValue || filterValue === 'All' || filterValue === 'all') return undefined
      const typeMap: Record<string, string> = {
        'Manufacturing QC': 'mfg_qc',
        'MFG QC': 'mfg_qc',
        'Packaging QC': 'pkg_qc',
        'PKG QC': 'pkg_qc',
      }
      return typeMap[filterValue] || undefined
    }
    return {
      page: parseInt(urlParams.get('pendingQcPage') || '1', 10),
      limit: parseInt(urlParams.get('pendingQcItemsPerPage') || '10', 10),
      search: urlParams.get('pendingQcSearch') || undefined,
      type: mapTypeFilterToApi(statusFilter),
    }
  }, [])

  const initialRejectedParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { page: 1, limit: 10, search: undefined, type: undefined }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const statusFilter = urlParams.get('rejectedQcStatus') || 'All'
    const mapTypeFilterToApi = (filterValue: string) => {
      if (!filterValue || filterValue === 'All' || filterValue === 'all') return undefined
      const typeMap: Record<string, string> = {
        'Manufacturing QC': 'mfg_qc',
        'MFG QC': 'mfg_qc',
        'Packaging QC': 'pkg_qc',
        'PKG QC': 'pkg_qc',
      }
      return typeMap[filterValue] || undefined
    }
    return {
      page: parseInt(urlParams.get('rejectedQcPage') || '1', 10),
      limit: parseInt(urlParams.get('rejectedQcItemsPerPage') || '10', 10),
      search: urlParams.get('rejectedQcSearch') || undefined,
      type: mapTypeFilterToApi(statusFilter),
    }
  }, [])

  // Get data loading state for scroll restoration
  const { data: transformedData, isLoading: isListLoading } = useTransformedQCData(
    'seller',
    initialSubmissionsParams
  )
  const { qcList: sellerPendingQCList, isLoading: isSellerPendingLoading } = useSellerPendingQCList(
    initialPendingParams,
    { enabled: true }
  )
  const { qcList: sellerRejectedQCList, isLoading: isSellerRejectedLoading } = useSellerRejectedQCList(
    initialRejectedParams,
    { enabled: true }
  )
  const { isLoading: isInsightsLoading } = useQCDashboardMetrics()

  // Scroll persistence: restore scroll when QC data is loaded
  useDashboardScrollPersistence({
    storageKey: 'seller-quality-control-scroll',
    restoreWhen: !isListLoading && !isSellerPendingLoading && !isSellerRejectedLoading && !isInsightsLoading && !!transformedData,
  })

  const handleViewOrderDetail = (orderId: number) => {
    router.push(`/seller-dashboard/quality-control/${orderId}`)
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <QCPage
        userType="seller"
        onSliderStateChange={setIsSliderOpen}
        section={section}
        sectionId={sectionId}
        onSectionChange={onSectionChange}
        onViewOrderDetail={handleViewOrderDetail}
      />
    </Suspense>
  )
}
