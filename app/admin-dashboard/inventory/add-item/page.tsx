"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useAdminDashboard } from "../../context"

// Lazy load the AddItemInventory component for code splitting
const AddItemInventory = dynamic(
  () => import("@/components/features/inventory/components/add-item/add-inventory").then((mod) => ({ default: mod.AddItemInventory })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AddInventoryPage() {
  const { setIsSliderOpen } = useAdminDashboard()
  const router = useRouter()
  
  const handleClose = () => {
    router.push('/admin-dashboard/inventory')
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <AddItemInventory
          onClose={handleClose}
          onSliderStateChange={setIsSliderOpen}
        />
      </Suspense>
    </div>
  )
}
