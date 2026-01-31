"use client"

import { useMemo, useState, useCallback, useEffect } from 'react'

// ============================================================================
// Types
// ============================================================================

type Primitive = string | number | boolean | null | undefined

type GetValue<T> = (item: T) => Primitive

type FilterMatchFn<T> = (item: T, filterValue: string) => boolean

/**
 * Configuration for a custom filter
 */
export interface CustomFilterConfig<T> {
  /** Unique key for the filter */
  key: string
  /** Initial value for the filter */
  initialValue?: string
  /** Custom match function - if not provided, uses direct equality */
  matchFn?: FilterMatchFn<T>
  /** Field key to match against if no matchFn provided */
  fieldKey?: keyof T
  /** Get unique options from data */
  getOptions?: (items: T[]) => string[]
}

/**
 * URL persistence configuration
 */
export interface UrlPersistenceConfig {
  /** Enable URL persistence */
  enabled: boolean
  /** Prefix for URL params (e.g., 'order' -> 'orderPage', 'orderSearch') */
  prefix: string
  /** Tab value to check before updating URL (optional) */
  tabParam?: string
  /** Expected tab value (optional) */
  tabValue?: string
}

/**
 * Options for the unified table hook
 */
export interface UseUnifiedTableOptions<T extends Record<string, any>> {
  /** Array of items to display in the table */
  items: T[]
  
  // Search configuration
  /** Keys to search against */
  searchKeys?: Array<keyof T>
  /** Initial search term */
  initialSearchTerm?: string
  
  // Category filter configuration
  /** Key for category field */
  categoryKey?: keyof T
  /** Initial category value */
  initialCategory?: string
  /** Show category filter */
  enableCategoryFilter?: boolean
  
  // Status filter configuration
  /** Key for status field */
  statusKey?: keyof T
  /** Initial status value */
  initialStatus?: string
  /** Show status filter */
  enableStatusFilter?: boolean
  
  // ID configuration
  /** Key for unique identifier */
  idKey?: keyof T
  
  // Pagination configuration
  /** Initial items per page */
  initialItemsPerPage?: number
  /** Initial page number */
  initialPage?: number
  /** Available items per page options */
  itemsPerPageOptions?: number[]
  
  // Custom value getters
  /** Custom getter functions for nested or formatted values */
  getValue?: Partial<Record<keyof T, GetValue<T>>>
  
  // Custom filters
  /** Additional custom filters */
  customFilters?: CustomFilterConfig<T>[]
  
  // URL persistence
  /** URL persistence configuration */
  urlPersistence?: UrlPersistenceConfig
  
  // Default values for "all" state
  /** Value representing "all" for category/status filters */
  allValue?: string
}

/**
 * Custom filter state type
 */
export interface CustomFilterState {
  [key: string]: {
    value: string
    setValue: (value: string) => void
    options: string[]
  }
}

/**
 * Pagination state and handlers
 */
export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalPages: number
  pageNumbers: Array<number | string>
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  handlePreviousPage: () => void
  handleNextPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  canGoPrevious: boolean
  canGoNext: boolean
}

/**
 * Return type for the unified table hook
 */
export interface UseUnifiedTableReturn<T> {
  // Filtered and paginated data
  /** All filtered items (before pagination) */
  filteredItems: T[]
  /** Paginated items for current page */
  paginatedItems: T[]
  /** Total count of filtered items */
  filteredCount: number
  /** Total count of all items */
  totalCount: number
  
  // Search
  searchTerm: string
  setSearchTerm: (term: string) => void
  
  // Category filter
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  categories: string[]
  
  // Status filter
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  statuses: string[]
  
  // Custom filters
  customFilters: CustomFilterState
  
  // Pagination
  pagination: PaginationState
  
  // Actions
  resetFilters: () => void
  resetPagination: () => void
  resetAll: () => void
  
  // Configuration
  idKey: keyof T
  itemsPerPageOptions: number[]
  
  // State check
  hasActiveFilters: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert any primitive value to string for search/filter matching
 */
function stringValue(value: Primitive): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/**
 * Generate page numbers array with ellipsis for large page counts
 */
function generatePageNumbers(currentPage: number, totalPages: number): Array<number | string> {
  const pages: Array<number | string> = []
  const maxVisiblePages = 5

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, '...', totalPages)
    return pages
  }

  if (currentPage >= totalPages - 2) {
    pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    return pages
  }

  pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
  return pages
}

/**
 * Parse URL search params safely
 */
function getUrlParam(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') return defaultValue
  const params = new URLSearchParams(window.location.search)
  return params.get(key) || defaultValue
}

/**
 * Parse URL search params for number values
 */
function getUrlParamNumber(key: string, defaultValue: number): number {
  if (typeof window === 'undefined') return defaultValue
  const params = new URLSearchParams(window.location.search)
  const value = params.get(key)
  return value ? parseInt(value, 10) : defaultValue
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Unified table hook with built-in pagination and filtering
 * 
 * Consolidates common table patterns:
 * - Search filtering across multiple fields
 * - Category and status filters
 * - Custom filters with flexible matching
 * - Pagination with page numbers and navigation
 * - Optional URL persistence for state
 * 
 * @example
 * ```tsx
 * const {
 *   paginatedItems,
 *   searchTerm,
 *   setSearchTerm,
 *   pagination,
 *   resetFilters,
 * } = useUnifiedTable({
 *   items: products,
 *   searchKeys: ['name', 'sku'],
 *   categoryKey: 'category',
 *   statusKey: 'status',
 *   initialItemsPerPage: 10,
 * })
 * ```
 */
export function useUnifiedTable<T extends Record<string, any>>(
  options: UseUnifiedTableOptions<T>
): UseUnifiedTableReturn<T> {
  const {
    items,
    searchKeys = [],
    categoryKey,
    statusKey,
    idKey = 'id' as keyof T,
    initialItemsPerPage = 10,
    initialSearchTerm = '',
    initialCategory = 'All',
    initialStatus = 'All',
    initialPage = 1,
    itemsPerPageOptions = [10, 25, 50, 100],
    getValue = {} as Partial<Record<keyof T, GetValue<T>>>,
    customFilters: customFilterConfigs = [],
    urlPersistence,
    enableCategoryFilter = true,
    enableStatusFilter = true,
    allValue = 'All',
  } = options

  // ============================================================================
  // URL Parameter Initialization
  // ============================================================================

  const getInitialValues = useCallback(() => {
    if (!urlPersistence?.enabled) {
      return {
        searchTerm: initialSearchTerm,
        category: initialCategory,
        status: initialStatus,
        page: initialPage,
        itemsPerPage: initialItemsPerPage,
        customFilters: customFilterConfigs.reduce((acc, filter) => {
          acc[filter.key] = filter.initialValue || allValue
          return acc
        }, {} as Record<string, string>),
      }
    }

    const prefix = urlPersistence.prefix

    return {
      searchTerm: getUrlParam(`${prefix}Search`, initialSearchTerm),
      category: getUrlParam(`${prefix}Category`, initialCategory),
      status: getUrlParam(`${prefix}Status`, initialStatus),
      page: getUrlParamNumber(`${prefix}Page`, initialPage),
      itemsPerPage: getUrlParamNumber(`${prefix}ItemsPerPage`, initialItemsPerPage),
      customFilters: customFilterConfigs.reduce((acc, filter) => {
        acc[filter.key] = getUrlParam(`${prefix}${filter.key}`, filter.initialValue || allValue)
        return acc
      }, {} as Record<string, string>),
    }
  }, [
    urlPersistence,
    initialSearchTerm,
    initialCategory,
    initialStatus,
    initialPage,
    initialItemsPerPage,
    customFilterConfigs,
    allValue,
  ])

  // Get initial values (only on mount)
  const initialValues = useMemo(() => getInitialValues(), [])

  // ============================================================================
  // State
  // ============================================================================

  // Search state
  const [searchTerm, setSearchTermState] = useState(initialValues.searchTerm)

  // Filter states
  const [selectedCategory, setSelectedCategoryState] = useState(initialValues.category)
  const [selectedStatus, setSelectedStatusState] = useState(initialValues.status)

  // Custom filter states
  const [customFilterValues, setCustomFilterValues] = useState<Record<string, string>>(
    initialValues.customFilters
  )

  // Pagination state
  const [currentPage, setCurrentPageState] = useState(initialValues.page)
  const [itemsPerPage, setItemsPerPageState] = useState(initialValues.itemsPerPage)

  // ============================================================================
  // URL Persistence
  // ============================================================================

  const updateUrlParams = useCallback((updates: Record<string, string | number | undefined>) => {
    if (!urlPersistence?.enabled || typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const prefix = urlPersistence.prefix

    // Check tab if configured
    if (urlPersistence.tabParam && urlPersistence.tabValue) {
      const currentTab = url.searchParams.get(urlPersistence.tabParam)
      if (currentTab !== urlPersistence.tabValue) return
    }

    Object.entries(updates).forEach(([key, value]) => {
      const paramKey = `${prefix}${key}`
      
      // Remove default values from URL to keep it clean
      const isDefault = 
        (key === 'Search' && value === '') ||
        (key === 'Category' && value === allValue) ||
        (key === 'Status' && value === allValue) ||
        (key === 'Page' && value === 1) ||
        (key === 'ItemsPerPage' && value === initialItemsPerPage) ||
        (customFilterConfigs.some(f => f.key === key) && value === allValue)

      if (isDefault || value === undefined) {
        url.searchParams.delete(paramKey)
      } else {
        url.searchParams.set(paramKey, String(value))
      }
    })

    window.history.replaceState({}, '', url.toString())
  }, [urlPersistence, allValue, initialItemsPerPage, customFilterConfigs])

  // Listen for browser back/forward
  useEffect(() => {
    if (!urlPersistence?.enabled) return

    const handlePopState = () => {
      // Check tab if configured
      if (urlPersistence.tabParam && urlPersistence.tabValue) {
        const currentTab = new URLSearchParams(window.location.search).get(urlPersistence.tabParam)
        if (currentTab !== urlPersistence.tabValue) return
      }

      const values = getInitialValues()
      setSearchTermState(values.searchTerm)
      setSelectedCategoryState(values.category)
      setSelectedStatusState(values.status)
      setCurrentPageState(values.page)
      setItemsPerPageState(values.itemsPerPage)
      setCustomFilterValues(values.customFilters)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [urlPersistence, getInitialValues])

  // ============================================================================
  // Value Getters
  // ============================================================================

  const getFieldValue = useCallback((item: T, key: keyof T): Primitive => {
    const getter = getValue[key]
    if (getter) return getter(item)
    return item?.[key]
  }, [getValue])

  // ============================================================================
  // Derived Data: Categories and Statuses
  // ============================================================================

  const categories = useMemo(() => {
    if (!enableCategoryFilter || !categoryKey) return []
    
    const set = new Set<string>()
    items.forEach((item) => {
      const val = getFieldValue(item, categoryKey)
      const label = stringValue(val).trim()
      if (label) set.add(label)
    })
    return Array.from(set).sort()
  }, [items, categoryKey, enableCategoryFilter, getFieldValue])

  const statuses = useMemo(() => {
    if (!enableStatusFilter || !statusKey) return []
    
    const set = new Set<string>()
    items.forEach((item) => {
      const val = getFieldValue(item, statusKey)
      const label = stringValue(val).trim()
      if (label) set.add(label)
    })
    return Array.from(set).sort()
  }, [items, statusKey, enableStatusFilter, getFieldValue])

  // Custom filter options
  const customFilterOptions = useMemo(() => {
    return customFilterConfigs.reduce((acc, config) => {
      if (config.getOptions) {
        acc[config.key] = config.getOptions(items)
      } else if (config.fieldKey) {
        const set = new Set<string>()
        items.forEach((item) => {
          const val = getFieldValue(item, config.fieldKey!)
          const label = stringValue(val).trim()
          if (label) set.add(label)
        })
        acc[config.key] = Array.from(set).sort()
      } else {
        acc[config.key] = []
      }
      return acc
    }, {} as Record<string, string[]>)
  }, [items, customFilterConfigs, getFieldValue])

  // ============================================================================
  // Filtering Logic
  // ============================================================================

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        term.length === 0 ||
        searchKeys.length === 0 ||
        searchKeys.some((key) => {
          const val = getFieldValue(item, key)
          return stringValue(val).toLowerCase().includes(term)
        })

      // Category filter
      let matchesCategory = true
      if (enableCategoryFilter && categoryKey) {
        const category = stringValue(getFieldValue(item, categoryKey))
        matchesCategory =
          selectedCategory === allValue ||
          selectedCategory === '' ||
          category === selectedCategory
      }

      // Status filter
      let matchesStatus = true
      if (enableStatusFilter && statusKey) {
        const status = stringValue(getFieldValue(item, statusKey))
        matchesStatus =
          selectedStatus === allValue ||
          selectedStatus === '' ||
          status === selectedStatus
      }

      // Custom filters
      const matchesCustomFilters = customFilterConfigs.every((config) => {
        const filterValue = customFilterValues[config.key]
        
        // Skip if "all" value
        if (filterValue === allValue || filterValue === '') return true

        // Use custom match function if provided
        if (config.matchFn) {
          return config.matchFn(item, filterValue)
        }

        // Use field key for direct comparison
        if (config.fieldKey) {
          const fieldValue = stringValue(getFieldValue(item, config.fieldKey))
          return fieldValue === filterValue
        }

        return true
      })

      return matchesSearch && matchesCategory && matchesStatus && matchesCustomFilters
    })
  }, [
    items,
    searchTerm,
    searchKeys,
    categoryKey,
    selectedCategory,
    statusKey,
    selectedStatus,
    customFilterConfigs,
    customFilterValues,
    enableCategoryFilter,
    enableStatusFilter,
    allValue,
    getFieldValue,
  ])

  // ============================================================================
  // Pagination Logic
  // ============================================================================

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / itemsPerPage)),
    [filteredItems.length, itemsPerPage]
  )

  // Auto-correct page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPageState(1)
      if (urlPersistence?.enabled) {
        updateUrlParams({ Page: 1 })
      }
    }
  }, [currentPage, totalPages, urlPersistence, updateUrlParams])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  )

  // ============================================================================
  // Action Handlers
  // ============================================================================

  // Search
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term)
    setCurrentPageState(1)
    if (urlPersistence?.enabled) {
      updateUrlParams({ Search: term, Page: 1 })
    }
  }, [urlPersistence, updateUrlParams])

  // Category
  const setSelectedCategory = useCallback((category: string) => {
    setSelectedCategoryState(category)
    setCurrentPageState(1)
    if (urlPersistence?.enabled) {
      updateUrlParams({ Category: category, Page: 1 })
    }
  }, [urlPersistence, updateUrlParams])

  // Status
  const setSelectedStatus = useCallback((status: string) => {
    setSelectedStatusState(status)
    setCurrentPageState(1)
    if (urlPersistence?.enabled) {
      updateUrlParams({ Status: status, Page: 1 })
    }
  }, [urlPersistence, updateUrlParams])

  // Custom filter setters
  const setCustomFilterValue = useCallback((key: string, value: string) => {
    setCustomFilterValues(prev => ({ ...prev, [key]: value }))
    setCurrentPageState(1)
    if (urlPersistence?.enabled) {
      updateUrlParams({ [key]: value, Page: 1 })
    }
  }, [urlPersistence, updateUrlParams])

  // Pagination handlers
  const setCurrentPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPageState(page)
    if (urlPersistence?.enabled) {
      updateUrlParams({ Page: page })
    }
  }, [totalPages, urlPersistence, updateUrlParams])

  const setItemsPerPage = useCallback((value: number) => {
    setItemsPerPageState(value)
    setCurrentPageState(1)
    if (urlPersistence?.enabled) {
      updateUrlParams({ ItemsPerPage: value, Page: 1 })
    }
  }, [urlPersistence, updateUrlParams])

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage, setCurrentPage])

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, totalPages, setCurrentPage])

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1)
  }, [setCurrentPage])

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages)
  }, [setCurrentPage, totalPages])

  // Reset functions
  const resetFilters = useCallback(() => {
    setSearchTermState(initialSearchTerm)
    setSelectedCategoryState(initialCategory)
    setSelectedStatusState(initialStatus)
    setCustomFilterValues(
      customFilterConfigs.reduce((acc, filter) => {
        acc[filter.key] = filter.initialValue || allValue
        return acc
      }, {} as Record<string, string>)
    )
    setCurrentPageState(1)
    
    if (urlPersistence?.enabled) {
      updateUrlParams({
        Search: '',
        Category: allValue,
        Status: allValue,
        Page: 1,
        ...customFilterConfigs.reduce((acc, filter) => {
          acc[filter.key] = allValue
          return acc
        }, {} as Record<string, string | number | undefined>),
      })
    }
  }, [
    initialSearchTerm,
    initialCategory,
    initialStatus,
    customFilterConfigs,
    allValue,
    urlPersistence,
    updateUrlParams,
  ])

  const resetPagination = useCallback(() => {
    setCurrentPageState(1)
    setItemsPerPageState(initialItemsPerPage)
    if (urlPersistence?.enabled) {
      updateUrlParams({ Page: 1, ItemsPerPage: initialItemsPerPage })
    }
  }, [initialItemsPerPage, urlPersistence, updateUrlParams])

  const resetAll = useCallback(() => {
    resetFilters()
    resetPagination()
  }, [resetFilters, resetPagination])

  // ============================================================================
  // Build Custom Filters Return Object
  // ============================================================================

  const customFiltersState: CustomFilterState = useMemo(() => {
    return customFilterConfigs.reduce((acc, config) => {
      acc[config.key] = {
        value: customFilterValues[config.key],
        setValue: (value: string) => setCustomFilterValue(config.key, value),
        options: customFilterOptions[config.key] || [],
      }
      return acc
    }, {} as CustomFilterState)
  }, [customFilterConfigs, customFilterValues, customFilterOptions, setCustomFilterValue])

  // ============================================================================
  // Check for Active Filters
  // ============================================================================

  const hasActiveFilters = useMemo(() => {
    const hasSearch = searchTerm !== ''
    const hasCategory = selectedCategory !== allValue && selectedCategory !== ''
    const hasStatus = selectedStatus !== allValue && selectedStatus !== ''
    const hasCustom = Object.values(customFilterValues).some(v => v !== allValue && v !== '')
    
    return hasSearch || hasCategory || hasStatus || hasCustom
  }, [searchTerm, selectedCategory, selectedStatus, customFilterValues, allValue])

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Data
    filteredItems,
    paginatedItems,
    filteredCount: filteredItems.length,
    totalCount: items.length,

    // Search
    searchTerm,
    setSearchTerm,

    // Category filter
    selectedCategory,
    setSelectedCategory,
    categories,

    // Status filter
    selectedStatus,
    setSelectedStatus,
    statuses,

    // Custom filters
    customFilters: customFiltersState,

    // Pagination
    pagination: {
      currentPage,
      itemsPerPage,
      totalPages,
      pageNumbers,
      setCurrentPage,
      setItemsPerPage,
      handlePreviousPage,
      handleNextPage,
      goToFirstPage,
      goToLastPage,
      canGoPrevious: currentPage > 1,
      canGoNext: currentPage < totalPages,
    },

    // Actions
    resetFilters,
    resetPagination,
    resetAll,

    // Configuration
    idKey,
    itemsPerPageOptions,

    // State check
    hasActiveFilters,
  }
}

export default useUnifiedTable