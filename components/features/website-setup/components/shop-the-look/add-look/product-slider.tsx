"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useShopTheLookProductsQuery } from "@/components/features/website-setup/hooks/shop-the-look/use-shop-the-look-query"
import type { ProductListItem, AdminProductListItem } from "@/components/features/inventory/types/inventory.types"
import { useAdminDashboard } from "@/app/admin-dashboard/context"

type ProductItem = ProductListItem | AdminProductListItem

interface ProductSliderProps {
  isOpen: boolean
  onClose: () => void
  selectedProducts: ProductItem[]
  onConfirm: (products: ProductItem[]) => void
}

const MAX_PRODUCTS = 5

export default function ProductSlider({
  isOpen,
  onClose,
  selectedProducts,
  onConfirm,
}: ProductSliderProps) {
  const { setIsSliderOpen } = useAdminDashboard()
  const [searchTerm, setSearchTerm] = useState("")
  const [selected, setSelected] = useState<ProductItem[]>(selectedProducts)
  const [isAnimating, setIsAnimating] = useState(false)

  // Fetch products from shop-the-look API
  const { data: productsResponse, isLoading } = useShopTheLookProductsQuery()
  
  // Map API response to ProductItem format
  const products = useMemo(() => {
    if (!productsResponse?.record) return []
    
    return productsResponse.record.map((product) => ({
      id: product.id,
      name: product.name,
      mrp: product.price,
      product_image: product.image,
      image: product.image,
      // Required fields for ProductItem compatibility
      vendor_id: 0,
      vendor_name: '',
      vendor_phone: '',
      vendor_address: '',
      total_sales: 0,
      status: 'active',
      category: '',
      stock: 0,
      stock_value: 0,
      shopify_status: 'active',
    } as ProductItem))
  }, [productsResponse])

  // Update selected when prop changes
  useEffect(() => {
    setSelected(selectedProducts)
  }, [selectedProducts])

  // Manage sidebar blur
  useEffect(() => {
    if (isOpen) {
      setIsSliderOpen(true)
      setIsAnimating(true)
    } else {
      setIsAnimating(false)
      // Delay to allow animation to complete
      setTimeout(() => {
        setIsSliderOpen(false)
      }, 300)
    }
  }, [isOpen, setIsSliderOpen])

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products
    
    const search = searchTerm.toLowerCase()
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(search) ||
        product.id?.toString().includes(search)
    )
  }, [products, searchTerm])

  const handleToggleProduct = (product: ProductItem) => {
    setSelected((prev) => {
      const isSelected = prev.some((p) => p.id === product.id)
      
      if (isSelected) {
        return prev.filter((p) => p.id !== product.id)
      } else {
        if (prev.length >= MAX_PRODUCTS) {
          return prev
        }
        return [...prev, product]
      }
    })
  }

  const handleConfirm = () => {
    onConfirm(selected)
    onClose()
  }

  const handleClose = () => {
    setSelected(selectedProducts) // Reset to original selection
    onClose()
  }

  const isProductSelected = (productId: number) => {
    return selected.some((p) => p.id === productId)
  }

  if (!isOpen && !isAnimating) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={handleClose}
      >
        <div
          className={cn(
            "fixed inset-0 bg-white transition-all duration-300 ease-in-out",
            isOpen ? "bg-opacity-50" : "bg-opacity-0"
          )}
        />
      </div>

      {/* Sliding Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-[606px] bg-gray-50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 h-[56px] bg-white border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Select Products
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name or SKU"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-gray-300"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selected.length} of {MAX_PRODUCTS} products selected
            </p>
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  {searchTerm ? "No products found" : "No products available"}
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = isProductSelected(product.id)
                // Use image from API response, with fallback
                const productImage =
                  (product as any).image ||
                  (product as any).product_image ||
                  "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "border border-gray-200 bg-white hover:shadow-md transition-shadow",
                      isSelected && "ring-2 ring-secondary-900"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Product Image */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={productImage}
                            alt={product.name || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {product.name || "Unnamed Product"}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            SKU: {product.id}
                          </p>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            ₹{product.mrp?.toLocaleString() || "0"}
                          </p>
                        </div>

                        {/* Add Button */}
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleProduct(product)}
                          disabled={!isSelected && selected.length >= MAX_PRODUCTS}
                          className={cn(
                            "h-10 w-10 p-0 flex-shrink-0",
                            isSelected
                              ? "bg-secondary-900 hover:bg-secondary-800 text-white"
                              : "border-gray-300 hover:bg-gray-50",
                            !isSelected &&
                              selected.length >= MAX_PRODUCTS &&
                              "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Plus
                            className={cn(
                              "h-5 w-5",
                              isSelected && "rotate-45"
                            )}
                          />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Fixed Bottom Bar */}
          <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 w-[155px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={selected.length === 0}
                className="px-6 py-2 bg-secondary-900 text-white hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed w-[155px]"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

