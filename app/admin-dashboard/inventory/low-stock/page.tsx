"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/shared/layout/page-header"

export default function LowStockPage() {
  const router = useRouter()

  const handleBackToInventory = () => {
    router.push('/admin-dashboard/inventory')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Low Stock Products" />
      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Products with stock levels below their threshold will be shown here.
        </p>
        <Button onClick={handleBackToInventory}>Back to Inventory</Button>
      </div>
    </div>
  )
}
