"use client"

import React, { useState, useMemo } from "react"
import { Search, Grid3x3, List, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { useVendorProductsQuery } from "@/components/features/inventory/hooks/use-inventory-query"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { PageHeader } from "@/components/shared/layout"
import type { AdminProductListItem } from "@/components/features/inventory/types/inventory.types"

// Import from website-setup feature module
import type { Brand } from "../../types/brand-management.types"
import { getStatusDisplay, formatIndianPrice, getBrandInitial } from "../../utills/brand-management.helpers"
import EditModal from "./section-brand-detail/edit-modal"
import ImagePreviewModal from "../../../../shared/ui/image-preview-modal"

interface BrandDetailPageProps {
  brand: Brand
  onBack: () => void
}

export default function BrandDetailPage({ brand, onBack }: BrandDetailPageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBannerPreviewOpen, setIsBannerPreviewOpen] = useState(false)
  
  // Convert brand.id (string) to number for vendor_id
  const vendorId = parseInt(brand.id, 10)
  
  // Fetch products for this specific vendor using vendor_id parameter
  const { data: productsData, isLoading: isLoadingProducts } = useVendorProductsQuery(
    vendorId,
    vendorId > 0 // Only enable if vendorId is valid
  )
  
  // Filter products by search term (API already filters by vendor_id)
  const filteredProducts = useMemo(() => {
    if (!productsData?.record) return []
    
    if (!searchTerm.trim()) return productsData.record
    
    const term = searchTerm.toLowerCase().trim()
    return productsData.record.filter((product: AdminProductListItem) =>
      product.name.toLowerCase().includes(term)
    )
  }, [productsData, searchTerm])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PageHeader 
        title="Brand Management" 
        subTitle={brand.name} 
        onTitleClick={onBack}
        action={
          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="h-[30px] px-3 bg-secondary-900 hover:bg-secondary-800 hover:text-white font-urbanist font-semibold"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Brand
          </Button>
        }
      />

      <div className="m-[24px]">
        {/* Banner and Profile Section */}
        <div className="relative w-full mb-6">
          {/* Banner Image - Clickable */}
          <div 
            className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => brand.bannerUrl && setIsBannerPreviewOpen(true)}
          >
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
          <div className="flex justify-center -mt-16 mb-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg flex items-center justify-center z-10">
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
                  <span className="text-3xl font-bold text-gray-400 font-urbanist">
                    {getBrandInitial(brand.name)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Brand Name and Product Count */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 font-urbanist mb-2">
              {brand.name}
            </h2>
            <p className="text-base text-gray-600 font-urbanist">
              {brand.productCount !== undefined ? `${brand.productCount} products` : 'No products'}
            </p>
          </div>
        </div>

        {/* Brand Information Section */}
        <Card className="mb-6 border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-urbanist mb-4">
              Brand Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 font-urbanist mb-1">
                  BRAND NAME
                </p>
                <p className="text-base text-gray-900 font-urbanist">
                  {brand.name}
                </p>
              </div>
              {brand.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 font-urbanist mb-1">
                    BRAND DESCRIPTION
                  </p>
                  <p className="text-base text-gray-900 font-urbanist">
                    {brand.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products under this brand Section */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-urbanist mb-4">
              Products under this brand
            </h3>
            
            {/* Search and View Toggle - Matching color management design */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm mb-6">
              <div className="text-sm font-semibold text-gray-600">Search Products</div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products in this brand..."
                    className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 font-urbanist"
                  />
                </div>
                {/* View Mode Switch Button */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid")}
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
                    onClick={() => setViewMode("list")}
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

            {/* Products Grid/List */}
            {isLoadingProducts ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <LoadingSpinner size={50} />
              </div>
            ) : filteredProducts.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product: AdminProductListItem) => {
                    const statusDisplay = getStatusDisplay(product.status)
                    return (
                      <Card
                        key={product.id}
                        className="border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="w-full h-48 bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                            {product.product_image ? (
                              <img
                                src={product.product_image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = "none"
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = '<span class="text-gray-400 font-urbanist">No Image</span>'
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 font-urbanist">No Image</span>
                            )}
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 font-urbanist truncate">
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500 font-urbanist">
                                <span>ID: {product.id}</span>
                                <span>•</span>
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md border ${statusDisplay.color}`}>
                                  {statusDisplay.text}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 font-urbanist whitespace-nowrap flex-shrink-0">
                              {formatIndianPrice(product.mrp)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider font-urbanist">
                          PRODUCT
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider font-urbanist">
                          SKU
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider font-urbanist">
                          STATUS
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider font-urbanist text-right">
                          PRICE
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {filteredProducts.map((product: AdminProductListItem) => {
                        const statusDisplay = getStatusDisplay(product.status)
                        return (
                          <TableRow key={product.id} className="hover:bg-gray-50 border-b border-gray-100">
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                                  {product.product_image ? (
                                    <img
                                      src={product.product_image}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = "none"
                                        const parent = target.parentElement
                                        if (parent) {
                                          parent.innerHTML = '<span class="text-gray-400 font-urbanist text-xs">No Image</span>'
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-gray-400 font-urbanist text-xs">No Image</span>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900 font-urbanist">
                                  {product.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span className="text-sm text-gray-600 font-urbanist">
                                {product.id}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${statusDisplay.color}`}>
                                {statusDisplay.text}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                              <span className="text-sm font-semibold text-gray-900 font-urbanist">
                                {formatIndianPrice(product.mrp)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              <div className="rounded-lg border-none bg-white p-8 text-center">
                <span className="font-urbanist text-base text-gray-500">
                  {searchTerm
                    ? `No products found for "${searchTerm}".`
                    : "No products available for this brand."}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <EditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        brand={brand}
      />

      {/* Banner Image Preview Modal */}
      <ImagePreviewModal
        open={isBannerPreviewOpen}
        onOpenChange={setIsBannerPreviewOpen}
        imageUrl={brand.bannerUrl || null}
        alt={`${brand.name} banner`}
      />
    </div>
  )
}

