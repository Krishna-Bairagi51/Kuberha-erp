"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { inventoryService } from '../services/inventory.service'
import type {
  ProductListItem,
  AdminProductListItem,
  InventoryFormData,
  UserType,
} from '../types/inventory.types'

interface UseInventoryOptions {
  userType?: UserType
  autoFetch?: boolean
}

interface UseInventoryReturn {
  // Data
  products: ProductListItem[] | AdminProductListItem[]
  formData: InventoryFormData | null
  isLoading: boolean
  isLoadingFormData: boolean
  error: string | null
  
  // Stats
  stats: {
    totalProducts: number
    totalStockValue: number
    totalStockQuantity: number
    lowStockCount: number
    totalCategories: number
  }
  
  // Actions
  fetchProducts: () => Promise<void>
  fetchFormData: () => Promise<void>
  refresh: () => Promise<void>
  
  // Search & Filter
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  filteredProducts: ProductListItem[] | AdminProductListItem[]
  
  // Pagination
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  setItemsPerPage: (count: number) => void
  totalPages: number
  paginatedProducts: ProductListItem[] | AdminProductListItem[]
}

export function useInventory(options: UseInventoryOptions = {}): UseInventoryReturn {
  const { userType = 'seller', autoFetch = true } = options
  
  // Data state
  const [products, setProducts] = useState<ProductListItem[] | AdminProductListItem[]>([])
  const [formData, setFormData] = useState<InventoryFormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFormData, setIsLoadingFormData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockValue: 0,
    totalStockQuantity: 0,
    lowStockCount: 0,
    totalCategories: 0,
  })
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await inventoryService.getProducts(userType)
      
      if (response.status_code === 200 && Array.isArray(response.record)) {
        setProducts(response.record)
        setStats({
          totalProducts: response.count || response.record.length,
          totalStockValue: response.total_inventory_value || 0,
          totalStockQuantity: response.total_stock_quantity || 0,
          lowStockCount: response.low_stock || 0,
          totalCategories: response.total_category || 0,
        })
      } else {
        throw new Error(response.message || 'Failed to fetch products')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }, [userType])

  // Fetch form data (categories, UOM, taxes, etc.)
  const fetchFormData = useCallback(async () => {
    setIsLoadingFormData(true)
    
    try {
      const data = await inventoryService.fetchInventoryFormData()
      setFormData(data)
    } catch (err) {
    } finally {
      setIsLoadingFormData(false)
    }
  }, [])

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchFormData()])
  }, [fetchProducts, fetchFormData])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchProducts()
      fetchFormData()
    }
  }, [autoFetch, fetchProducts, fetchFormData])

  // Filtered products
  const filteredProducts = useMemo((): ProductListItem[] | AdminProductListItem[] => {
    return products.filter((product) => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = !selectedCategory || 
        product.category === selectedCategory
      
      const matchesStatus = !selectedStatus || 
        product.status === selectedStatus
      
      return matchesSearch && matchesCategory && matchesStatus
    }) as ProductListItem[] | AdminProductListItem[]
  }, [products, searchTerm, selectedCategory, selectedStatus])

  // Pagination
  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage)),
    [filteredProducts.length, itemsPerPage]
  )

  const paginatedProducts = useMemo((): ProductListItem[] | AdminProductListItem[] => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage) as ProductListItem[] | AdminProductListItem[]
  }, [filteredProducts, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedStatus])

  return {
    products,
    formData,
    isLoading,
    isLoadingFormData,
    error,
    stats,
    fetchProducts,
    fetchFormData,
    refresh,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    filteredProducts,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedProducts,
  }
}

export default useInventory

