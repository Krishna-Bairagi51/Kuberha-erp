"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useShopTheLook } from "../../hooks/shop-the-look/use-shop-the-look"
import { SearchAndView } from "./search-and-view"
import { DraggableLooks } from "./draggable-looks"
import { EmptyState } from "./empty-state"
import { toast } from "sonner"
import type { Look } from "../../types/shop-the-look.types"

export function ShopTheLookMainPage() {
  const router = useRouter()
  const {
    activeLooks,
    isLoading,
    error,
    searchTerm,
    viewMode,
    setSearchTerm,
    setViewMode,
    handleReorder,
    handleDelete,
  } = useShopTheLook()

  const [isReordering, setIsReordering] = useState(false)

  const handleView = (look: Look) => {
    // Navigate to view-edit page in view mode
    router.push(`/admin-dashboard/shop-the-look/view-edit-look?id=${look.id}&mode=view`)
  }

  const handleEdit = (look: Look) => {
    // Navigate to view-edit page in edit mode
    router.push(`/admin-dashboard/shop-the-look/view-edit-look?id=${look.id}&mode=edit`)
  }

  const handleDeleteLook = async (look: Look) => {
    const success = await handleDelete(look.id)
    if (success) {
      toast.success(`"${look.name}" has been deleted`)
    } else {
      toast.error(`Failed to delete "${look.name}"`)
    }
  }


  const handleReorderLooks = async (newOrder: Look[]) => {
    setIsReordering(true)
    try {
      await handleReorder(newOrder)
      //toast.success("Look order updated successfully")
    } catch (err) {
    //   toast.error("Failed to update look order")
    } finally {
      setIsReordering(false)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="m-4 sm:m-6 lg:m-[24px]">
        {/* Search and View Toggle */}
        <div className="mb-4 sm:mb-6">
          <SearchAndView
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Looks Grid/List - White Card */}
        <div className="space-y-6 sm:space-y-10 border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-[16px] bg-white relative overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading looks...</div>
            </div>
          ) : activeLooks.length === 0 ? (
            <div className="min-h-[400px]">
              <EmptyState type="active" searchTerm={searchTerm} />
            </div>
          ) : (
            <DraggableLooks
              looks={activeLooks}
              onReorder={handleReorderLooks}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteLook}
              isDeleted={false}
              viewMode={viewMode}
              showInfoBanner={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
