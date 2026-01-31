import { useState, useMemo, useCallback, useEffect } from 'react'

/**
 * Pagination state and handlers
 */
export interface UsePaginationReturn {
  // State
  currentPage: number
  itemsPerPage: number
  totalPages: number
  
  // Setters
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  
  // Handlers
  handlePageChange: (page: number) => void
  handleItemsPerPageChange: (value: string) => void
  handlePreviousPage: () => void
  handleNextPage: () => void
  
  // Utilities
  getPageNumbers: () => (number | string)[]
  resetToFirstPage: () => void
}

/**
 * Reusable pagination hook
 * Handles all pagination logic including page numbers display
 */
export function usePagination(totalItems: number, initialItemsPerPage: number = 10): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Auto-correct if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }, [])

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, totalPages])

  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }, [currentPage, totalPages])

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage,
    setItemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    handlePreviousPage,
    handleNextPage,
    getPageNumbers,
    resetToFirstPage,
  }
}

/**
 * Hook to get paginated data slice
 */
export function usePaginatedData<T>(data: T[], currentPage: number, itemsPerPage: number) {
  return useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, itemsPerPage])
}

/**
 * Combined hook that provides both pagination and paginated data
 * Supports URL persistence with optional section prefix
 */
export function usePaginationWithData<T>(
  data: T[], 
  initialItemsPerPage: number = 10,
  sectionPrefix?: 'pending' | 'rejected' | 'submissions'
) {
  // Read initial pagination state from URL parameters if prefix provided
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined' || !sectionPrefix) {
      return {
        page: 1,
        itemsPerPage: initialItemsPerPage,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    return {
      page: parseInt(urlParams.get(`${sectionPrefix}QcPage`) || '1', 10),
      itemsPerPage: parseInt(urlParams.get(`${sectionPrefix}QcItemsPerPage`) || String(initialItemsPerPage), 10),
    }
  }, [sectionPrefix, initialItemsPerPage])

  const urlParams = getUrlParams()
  const [currentPage, setCurrentPage] = useState(urlParams.page)
  const [itemsPerPage, setItemsPerPage] = useState(urlParams.itemsPerPage)

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))

  // Update URL parameters when pagination changes
  const updateUrlParams = useCallback((updates: {
    page?: number
    itemsPerPage?: number
  }) => {
    if (typeof window === 'undefined' || !sectionPrefix) return
    
    const url = new URL(window.location.href)
    
    // Only update URL params if we're on the quality-control tab
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab !== 'quality-control') return
    
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        url.searchParams.set(`${sectionPrefix}QcPage`, String(updates.page))
      } else {
        url.searchParams.delete(`${sectionPrefix}QcPage`)
      }
    }
    
    if (updates.itemsPerPage !== undefined) {
      if (updates.itemsPerPage !== 10) {
        url.searchParams.set(`${sectionPrefix}QcItemsPerPage`, String(updates.itemsPerPage))
      } else {
        url.searchParams.delete(`${sectionPrefix}QcItemsPerPage`)
      }
    }
    
    window.history.replaceState({}, '', url.toString())
  }, [sectionPrefix])

  // Restore state from URL when URL changes (browser back/forward)
  useEffect(() => {
    if (!sectionPrefix) return
    
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      if (tab === 'quality-control') {
        const params = getUrlParams()
        setCurrentPage(params.page)
        setItemsPerPage(params.itemsPerPage)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getUrlParams, sectionPrefix])

  // Sync URL parameters when state changes
  useEffect(() => {
    if (sectionPrefix) {
      updateUrlParams({
        page: currentPage,
        itemsPerPage,
      })
    }
  }, [currentPage, itemsPerPage, sectionPrefix, updateUrlParams])

  // Auto-correct if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }, [])

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, totalPages])

  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }, [currentPage, totalPages])

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const paginatedData = usePaginatedData(data, currentPage, itemsPerPage)

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage,
    setItemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    handlePreviousPage,
    handleNextPage,
    getPageNumbers,
    resetToFirstPage,
    paginatedData,
  }
}

