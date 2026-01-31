import { useMemo, useState, useCallback, useEffect } from 'react'
import type { TransformedQcItem } from './use-qc-list'
import type { UserType } from '../types/qc.types'

/**
 * Filter type for QC data
 */
export type QCFilterType = 'all' | 'pending' | 'rejected' | 'approved' | 'done'

/**
 * Hook for managing QC data filtering and searching
 * Consolidates all filter logic in one place
 */
export function useQCFilters(data: TransformedQcItem[], userType: UserType) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')

  /**
   * Filter data based on search term and filters
   */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerPhone.includes(searchTerm) ||
        item.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === '' || 
        statusFilter === 'all' || 
        statusFilter === 'All' ||
        item.status.toLowerCase().includes(statusFilter.toLowerCase())
      
      // Supplier filter (admin only)
      const matchesSupplier = supplierFilter === 'all' || 
        (item.sellerName && item.sellerName.split(',').map(n => n.trim()).some(name => 
          name.toLowerCase() === supplierFilter.toLowerCase()
        ))
      
      return matchesSearch && matchesStatus && matchesSupplier
    })
  }, [data, searchTerm, statusFilter, supplierFilter])

  /**
   * Filter pending items (not done)
   */
  const pendingData = useMemo(() => {
    return filteredData.filter(item => {
      const normalizedStatus = item.status?.trim().toLowerCase()
      return normalizedStatus !== 'done'
    })
  }, [filteredData])

  /**
   * Filter rejected items
   */
  const rejectedData = useMemo(() => {
    return filteredData.filter(item => 
      item.status.toLowerCase().includes('rejected')
    )
  }, [filteredData])

  /**
   * Get unique supplier options (admin only)
   */
  const supplierOptions = useMemo(() => {
    if (userType !== 'admin') return []
    
    const names = new Set<string>()
    data.forEach(item => {
      if (item.sellerName) {
        item.sellerName.split(',').forEach(name => {
          const trimmedName = name.trim()
          if (trimmedName) {
            names.add(trimmedName)
          }
        })
      }
    })
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [data, userType])

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('')
    setSupplierFilter('all')
  }, [])

  return {
    // State
    searchTerm,
    statusFilter,
    supplierFilter,
    
    // Setters
    setSearchTerm,
    setStatusFilter,
    setSupplierFilter,
    
    // Filtered data
    filteredData,
    pendingData,
    rejectedData,
    
    // Options
    supplierOptions,
    
    // Actions
    resetFilters,
  }
}

/**
 * Hook for managing section-specific filters (pending, rejected, all submissions)
 */
export interface SectionFilters {
  searchTerm: string
  statusFilter: string
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  reset: () => void
}

export function useSectionFilters(sectionPrefix: 'pending' | 'rejected' = 'pending'): SectionFilters {
  // Read initial filter state from URL parameters
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        searchTerm: '',
        statusFilter: '',
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      searchTerm: urlParams.get(`${sectionPrefix}QcSearch`) || '',
      statusFilter: urlParams.get(`${sectionPrefix}QcStatus`) || '',
    }
  }, [sectionPrefix])

  // Initialize state from URL parameters
  const urlParams = getUrlParams()
  const [searchTerm, setSearchTerm] = useState(urlParams.searchTerm)
  const [statusFilter, setStatusFilter] = useState(urlParams.statusFilter)

  // Update URL parameters when filters change
  const updateUrlParams = useCallback((updates: {
    searchTerm?: string
    statusFilter?: string
  }) => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    
    // Only update URL params if we're on the quality-control page (file-based route or tab query)
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    const isQualityControlPage = pathname.includes('/quality-control') || tab === 'quality-control'
    if (!isQualityControlPage) return
    
    if (updates.searchTerm !== undefined) {
      if (updates.searchTerm) {
        url.searchParams.set(`${sectionPrefix}QcSearch`, updates.searchTerm)
      } else {
        url.searchParams.delete(`${sectionPrefix}QcSearch`)
      }
    }
    
    if (updates.statusFilter !== undefined) {
      if (updates.statusFilter) {
        url.searchParams.set(`${sectionPrefix}QcStatus`, updates.statusFilter)
      } else {
        url.searchParams.delete(`${sectionPrefix}QcStatus`)
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [sectionPrefix])

  // Restore state from URL when URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      const isQualityControlPage = pathname.includes('/quality-control') || tab === 'quality-control'
      if (isQualityControlPage) {
        const params = getUrlParams()
        setSearchTerm(params.searchTerm)
        setStatusFilter(params.statusFilter)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getUrlParams])

  // Sync URL parameters when state changes
  useEffect(() => {
    updateUrlParams({
      searchTerm,
      statusFilter,
    })
  }, [searchTerm, statusFilter, updateUrlParams])

  const reset = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('')
  }, [])

  return {
    searchTerm,
    statusFilter,
    setSearchTerm,
    setStatusFilter,
    reset,
  }
}

/**
 * Hook for filtering data with section-specific filters
 */
export function useFilteredData(
  data: TransformedQcItem[],
  searchTerm: string,
  statusFilter: string
) {
  return useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = searchTerm === '' || 
        `${item.id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerPhone.includes(searchTerm) ||
        item.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === '' || 
        statusFilter === 'all' || 
        statusFilter === 'All' ||
        item.status.toLowerCase().includes(statusFilter.toLowerCase())
      
      return matchesSearch && matchesStatus
    })
  }, [data, searchTerm, statusFilter])
}

