"use client"

import React, { useState, useMemo } from "react"
import { Search, Grid3x3, List } from "lucide-react"
import PageHeader from "@/components/shared/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useBrandsQuery } from "../../hooks/use-brand-management"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import BrandDetailPage from "./brand-detail-page"
import type { Brand } from "../../types/brand-management.types"

type ViewMode = "grid" | "list"

// Brand Card Component
const BrandCard: React.FC<{ 
  brand: Brand
  onCardClick?: (brand: Brand) => void
  viewMode?: ViewMode
}> = ({ brand, onCardClick, viewMode = "grid" }) => {
  const handleCardClick = () => {
    onCardClick?.(brand)
  }

  if (viewMode === "list") {
    return (
      <Card 
        onClick={handleCardClick}
        className="relative group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-transform hover:shadow-md cursor-pointer"
      >
        <CardContent className="p-4 flex items-center gap-4">
          {/* Logo */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            {brand.imageUrl ? (
              <img
                src={brand.imageUrl}
                alt={brand.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="text-lg font-bold text-gray-400 font-urbanist">
                  {brand.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Brand Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 font-urbanist mb-1 truncate">
              {brand.name}
            </h3>
            {brand.displayName && brand.displayName !== brand.name && (
              <p className="text-sm text-gray-600 font-urbanist mb-1 truncate">
                {brand.displayName}
              </p>
            )}
            <p className="text-sm text-gray-500 font-urbanist">
              {brand.productCount !== undefined ? `${brand.productCount} products` : 'No products'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      onClick={handleCardClick}
      className="relative group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    >
      <CardContent className="p-0">
        {/* Banner Background Image - Rectangular/Landscape (wider than tall) */}
        <div className="relative w-full h-32 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {brand.bannerUrl ? (
            <img
              src={brand.bannerUrl}
              alt={`${brand.name} banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
          
        </div>

        {/* Circular Logo - Positioned above text section */}
        <div className="flex justify-center -mt-10 mb-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg flex items-center justify-center z-10">
            {brand.imageUrl ? (
              <img
                src={brand.imageUrl}
                alt={brand.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="text-xl font-bold text-gray-400 font-urbanist">
                  {brand.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Brand Info Section */}
        <div className="pb-6 px-4 text-center">
          {/* Brand Name */}
          <h3 className="text-lg font-semibold text-gray-900 font-urbanist mb-1">
            {brand.name}
          </h3>
          
          {/* Display Name (if different from name) */}
          {brand.displayName && brand.displayName !== brand.name && (
            <p className="text-sm text-gray-600 font-urbanist mb-2">
              {brand.displayName}
            </p>
          )}
          
          {/* Product Count */}
          <p className="text-sm text-gray-500 font-urbanist">
            {brand.productCount !== undefined ? `${brand.productCount} products` : 'No products'}
          </p>
        </div>
      </CardContent>

    </Card>
  )
}

// Search Toolbar Component
const BrandToolbar: React.FC<{
  searchTerm: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}> = ({ searchTerm, onSearchChange, viewMode, onViewModeChange }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm mb-6">
    <div className="text-sm font-semibold text-gray-600">Search Brands</div>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by brand name or display name..."
          className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 font-urbanist"
        />
      </div>
      {/* View Mode Switch Button */}
      <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange("grid")}
          className={`h-8 px-3 transition-all ${
            viewMode === "grid"
              ? "bg-white text-secondary-900 shadow-sm border border-gray-200 hover:bg-white hover:text-secondary-900"
              : "bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-600"
          }`}
        >
          <Grid3x3 className={`h-4 w-4 mr-1 ${viewMode === "grid" ? "text-secondary-900" : "text-gray-500"}`} />
          Grid
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange("list")}
          className={`h-8 px-3 transition-all ${
            viewMode === "list"
              ? "bg-white text-secondary-900 shadow-sm border border-gray-200 hover:bg-white hover:text-secondary-900"
              : "bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-600"
          }`}
        >
          <List className={`h-4 w-4 mr-1 ${viewMode === "list" ? "text-secondary-900" : "text-gray-500"}`} />
          List
        </Button>
      </div>
    </div>
  </div>
)

interface MainBrandManagementProps {
  // Legacy section props (to be removed after full migration)
  section?: string | null
  sectionId?: string | null
  onSectionChange?: (section: string | null, id?: string | number | null) => void
  // Navigation callback for file-based routing
  onViewBrandDetail?: (brandId: string | number) => void
}

function MainBrandManagement({ section, sectionId, onSectionChange, onViewBrandDetail }: MainBrandManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const { brands, isLoading, error } = useBrandsQuery()

  // Filter brands based on search term
  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return brands || []

    const term = searchTerm.toLowerCase().trim()
    return (brands || []).filter(
      (brand) =>
        brand.name.toLowerCase().includes(term) ||
        brand.displayName.toLowerCase().includes(term)
    )
  }, [brands, searchTerm])

  // Handle card click - navigate to detail page
  const handleCardClick = (brand: Brand) => {
    if (onViewBrandDetail) {
      // File-based routing: use navigation callback
      onViewBrandDetail(brand.id)
    } else {
      // Legacy section-based routing (for backward compatibility)
      onSectionChange?.("brand-detail", brand.id)
    }
  }

  // Legacy: If section is brand-detail, show detail page (for backward compatibility)
  if (section === "brand-detail" && sectionId && !onViewBrandDetail) {
    const selectedBrand = brands.find((b) => b.id === sectionId)
    if (selectedBrand) {
      return (
        <BrandDetailPage
          brand={selectedBrand}
          onBack={() => onSectionChange?.(null, null)}
        />
      )
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Brand Management" className="" />
        <div className="m-[24px] flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size={70} className="min-h-[400px]" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Brand Management" className="" />
        <div className="m-[24px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-lg font-semibold text-red-900 font-urbanist mb-2">
              Error Loading Brands
            </p>
            <p className="text-sm text-red-700 font-urbanist">
              {error.message || "Failed to load brand data. Please try again later."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Brand Management" className="" />
      <div className="m-[24px]">
        {/* Search Toolbar */}
        <BrandToolbar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Brand Cards Grid/List */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden p-6">
          {filteredBrands.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-4"
              }
            >
              {filteredBrands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} onCardClick={handleCardClick} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-none bg-white p-8 text-center">
              <span className="font-urbanist text-base text-gray-500">
                {searchTerm
                  ? `No brands found for "${searchTerm}".`
                  : "No brands available."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MainBrandManagement