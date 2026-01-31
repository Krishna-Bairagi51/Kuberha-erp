"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supplierService } from '../services/supplier.service'
import type {
  SupplierListItem,
  SupplierDetail,
  UseSupplierOptions,
  UseSupplierReturn,
} from '../types/supplier.types'

export function useSupplier(options: UseSupplierOptions = {}): UseSupplierReturn {
  const { autoFetch = true } = options
  
  // List data state
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Single supplier state
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetail | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Fetch all suppliers
  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await supplierService.getSupplierList()
      
      if (response.status_code === 200 && Array.isArray(response.record)) {
        setSuppliers(response.record)
      } else {
        throw new Error(response.message || 'Failed to fetch suppliers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch single supplier by ID
  const fetchSupplierById = useCallback(async (supplierId: string): Promise<SupplierDetail | null> => {
    setIsLoadingDetails(true)
    
    try {
      const response = await supplierService.getSupplierById(supplierId)
      
      if (response.status_code === 200 && response.record?.length > 0) {
        const supplier = response.record[0]
        setSelectedSupplier(supplier)
        return supplier
      }
      return null
    } catch (err) {
      return null
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  // Update supplier state
  const updateSupplierState = useCallback(async (supplierId: string, state: string): Promise<boolean> => {
    try {
      const response = await supplierService.updateSupplierState(supplierId, state)
      
      if (response.status_code === 200) {
        // Refresh the list after update
        await fetchSuppliers()
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }, [fetchSuppliers])

  // Refresh
  const refresh = useCallback(async () => {
    await fetchSuppliers()
  }, [fetchSuppliers])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchSuppliers()
    }
  }, [autoFetch, fetchSuppliers])

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const query = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        supplier.name?.toLowerCase().includes(query) ||
        supplier.email?.toLowerCase().includes(query) ||
        supplier.phone?.includes(query) ||
        supplier.supplier_name?.toLowerCase().includes(query)
      
      const matchesStatus = !statusFilter || 
        supplier.seller_state === statusFilter ||
        supplier.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [suppliers, searchTerm, statusFilter])

  // Pagination
  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(filteredSuppliers.length / itemsPerPage)),
    [filteredSuppliers.length, itemsPerPage]
  )

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredSuppliers.slice(start, start + itemsPerPage)
  }, [filteredSuppliers, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  return {
    suppliers,
    isLoading,
    error,
    selectedSupplier,
    isLoadingDetails,
    fetchSuppliers,
    fetchSupplierById,
    updateSupplierState,
    refresh,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredSuppliers,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedSuppliers,
    getStatusInfo: supplierService.getSupplierStatusInfo,
    formatOrganisationType: supplierService.formatOrganisationType,
  }
}

export default useSupplier

