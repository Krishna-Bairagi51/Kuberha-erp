"use client"

import React, { useState, useMemo } from "react"
import { Search } from "lucide-react"

import PageHeader from "@/components/shared/layout/page-header"
import { ColorItem } from "@/components/features/website-setup/types/color-management.types"
import { Button } from "@/components/ui/button"
import { useColorCodeDashboardQuery, useCreateColorCodeMutation } from "@/components/features/website-setup/hooks/use-color-code-query"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import AddColorModal from "./add-color-modal"
import { toast } from "sonner"

type ColorToolbarProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  onAddNew?: () => void
}

const ColorToolbar: React.FC<ColorToolbarProps> = ({ searchTerm, onSearchChange, onAddNew }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
    <div className="text-sm font-semibold text-gray-600">Search Colors</div>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by color name or hex code..."
          className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
      </div>
      <Button
        onClick={onAddNew}
        className="flex h-9 items-center justify-center gap-2 rounded-lg bg-secondary-900 px-4 sm:px-5 text-sm font-semibold text-white hover:bg-secondary-800 whitespace-nowrap w-full sm:w-auto"
      >
        Add New Color
      </Button>
    </div>
  </div>
)

const ColorCard: React.FC<{ color: ColorItem }> = ({ color }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-neutral2-100 shadow-sm transition-transform hover:-translate-y-0.5 w-full h-auto min-h-[200px] sm:min-h-[230px] p-3 sm:p-4 flex flex-col">
    <div
      className="w-full h-32 sm:h-36 md:h-40 rounded-lg flex-shrink-0"
      style={{ backgroundColor: color.hex }}
    />
    <div className="space-y-1 p-2 sm:p-3 flex-1 flex flex-col justify-end">
      <div className="text-sm font-semibold text-gray-800 truncate">{color.name}</div>
      <div className="text-xs font-semibold text-gray-600">{color.hex}</div>
    </div>
  </div>
)

function MainColorManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Fetch color code dashboard data when component mounts
  const { data: colorCodeData, isLoading: isLoadingColorCodes, error: colorCodeError } = useColorCodeDashboardQuery()
  
  // Mutation for creating new color
  const createColorMutation = useCreateColorCodeMutation()

  // Transform API data to ColorItem format
  const colors: ColorItem[] = useMemo(() => {
    if (!colorCodeData?.record) return []
    
    return colorCodeData.record.map((item) => ({
      name: item.name,
      key: `color-${item.id}`,
      hex: item.code,
    }))
  }, [colorCodeData])

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  // Filter colors based on search term with improved validation
  const filteredColors = useMemo(() => {
    if (!searchTerm.trim()) return colors

    const term = searchTerm.toLowerCase().trim()
    
    return colors.filter((color) => {
      const colorName = color.name.toLowerCase()
      const colorHex = color.hex.toLowerCase()
      
      // Match by color name (simple substring match)
      // This will match "white-2" when searching for "white-2", "-2", "white", or "2"
      if (colorName.includes(term)) {
        return true
      }
      
      // Match by hex code - only if search term contains valid hex characters
      // Skip hex matching if search term starts with "-" (likely searching for color name with "-2", etc.)
      if (!term.startsWith('-')) {
        const validHexChars = /^[#0-9a-f]+$/i
        if (validHexChars.test(term)) {
          // Remove # for comparison
          const searchHex = term.replace('#', '')
          const colorHexClean = colorHex.replace('#', '')
          
          // Only match if the search term is a valid hex pattern
          if (searchHex.length > 0 && /^[0-9a-f]+$/i.test(searchHex)) {
            return colorHexClean.includes(searchHex)
          }
        }
      }
      
      return false
    })
  }, [colors, searchTerm])

  // Loading state
  if (isLoadingColorCodes) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Material library" className="" />
        <div className="m-4 sm:m-6 lg:m-[24px] flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size={70} className="min-h-[400px]" />
        </div>
      </div>
    )
  }

  // Error state
  if (colorCodeError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Material library" className="" />
        <div className="m-4 sm:m-6 lg:m-[24px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 sm:p-8 text-center">
            <p className="text-base sm:text-lg font-semibold text-red-900 font-urbanist mb-2">
              Error Loading Colors
            </p>
            <p className="text-sm text-red-700 font-urbanist">
              {colorCodeError.message || "Failed to load color data. Please try again later."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Material library" className="" />
      <div className="m-4 sm:m-6 lg:m-[24px]">
          <ColorToolbar 
            searchTerm={searchTerm} 
            onSearchChange={handleSearchChange} 
            onAddNew={() => setIsAddModalOpen(true)}
          />
        <div className="space-y-6 sm:space-y-10 mt-4 sm:mt-6 border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-[16px] bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredColors.map((color) => (
              <ColorCard key={color.key} color={color} />
            ))}
          </div>
          {filteredColors.length === 0 && (
            <div className="rounded-lg border-none bg-white p-6 sm:p-8 text-center text-sm text-gray-500 text-muted-foreground">
              <span className="font-urbanist text-base">
                {searchTerm ? `No colors found for "${searchTerm}".` : "No colors available."}
              </span>
            </div>
          )}
        </div>
      </div>
      <AddColorModal 
        open={isAddModalOpen} 
        onOpenChange={(open) => {
          setIsAddModalOpen(open)
          // Reset form when modal closes
          if (!open) {
            // Clear any form state if needed
          }
        }}
        onSubmit={async (data) => {
          try {
            await createColorMutation.mutateAsync({
              name: data.name,
              code: data.hex,
            })
            toast.success("Color created successfully")
            setIsAddModalOpen(false)
          } catch (error: any) {
            // Extract error message from API response
            // Error structure: { message: { message: "This color already exist", status_code: 400 }, errors: [], status_code: 400 }
            let errorMessage = "Failed to create color. Please try again."
            
            if (error?.body?.message) {
              if (typeof error.body.message === 'object' && error.body.message?.message) {
                // Handle nested error structure: { message: { message: "...", status_code: 400 } }
                errorMessage = error.body.message.message
              } else if (typeof error.body.message === 'string') {
                // Handle simple message string
                errorMessage = error.body.message
              }
            } else if (error?.message) {
              errorMessage = error.message
            }
            
            toast.error(errorMessage)
            throw error // Re-throw to prevent modal from closing on error
          }
        }}
      />
    </div>
  )
}

export default MainColorManagement