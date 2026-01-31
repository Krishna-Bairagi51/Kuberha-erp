/**
 * Unified Table Pagination Component
 *
 * Consolidated pagination controls for tables with:
 * - Items per page selector
 * - Page navigation buttons (previous/next)
 * - Page number buttons with ellipsis for large page counts
 * - Support for direct integration with useUnifiedTable hook
 *
 * This component merges patterns from:
 * - components/features/orders/components/shared/table-pagination.tsx
 * - components/features/inventory/components/shared/pagination-controls.tsx
 */

'use client'

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { PaginationState } from '@/hooks/table'

// ============================================================================
// Types
// ============================================================================

export interface TablePaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Current items per page */
  itemsPerPage: number
  /** Total number of items (used to disable options larger than total) */
  totalItems?: number
  /** Pre-computed page numbers with ellipsis - if not provided, will be generated */
  pageNumbers?: Array<number | string>
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when items per page changes */
  onItemsPerPageChange: (items: number) => void
  /** Callback for previous button - if not provided, uses onPageChange */
  onPrevious?: () => void
  /** Callback for next button - if not provided, uses onPageChange */
  onNext?: () => void
  /** Available items per page options */
  itemsPerPageOptions?: number[]
  /** Label for rows per page (e.g., "Rows per page", "Row Per Page") */
  rowsPerPageLabel?: string
  /** Show "Entries" suffix after the dropdown */
  showEntriesSuffix?: boolean
  /** Additional class name for the container */
  className?: string
  /** Variant for styling */
  variant?: 'default' | 'compact'
  /** Whether to disable all controls */
  disabled?: boolean
  /** Hide the rows per page selector */
  hideRowsPerPage?: boolean
  /** Hide the page numbers (show only prev/next) */
  hidePageNumbers?: boolean
}

/**
 * Props for direct integration with useUnifiedTable hook
 */
export interface TablePaginationFromHookProps {
  /** Pagination state from useUnifiedTable hook */
  pagination: PaginationState
  /** Total number of items */
  totalItems?: number
  /** Available items per page options */
  itemsPerPageOptions?: number[]
  /** Label for rows per page */
  rowsPerPageLabel?: string
  /** Show "Entries" suffix */
  showEntriesSuffix?: boolean
  /** Additional class name */
  className?: string
  /** Variant for styling */
  variant?: 'default' | 'compact'
  /** Whether to disable all controls */
  disabled?: boolean
  /** Hide the rows per page selector */
  hideRowsPerPage?: boolean
  /** Hide the page numbers */
  hidePageNumbers?: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

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

// ============================================================================
// Components
// ============================================================================

/**
 * Page number button component
 */
const PageButton: React.FC<{
  page: number | string
  currentPage: number
  onClick: (page: number) => void
  disabled?: boolean
}> = ({ page, currentPage, onClick, disabled }) => {
  if (page === '...') {
    return (
      <span className="px-2 text-sm text-gray-500">...</span>
    )
  }

  const isActive = currentPage === page

  return (
    <button
      onClick={() => onClick(page as number)}
      disabled={disabled}
      className={cn(
        'w-8 h-8 text-sm rounded-full border flex items-center justify-center transition-colors duration-200',
        isActive
          ? 'text-white bg-secondary-900 border-secondary-900'
          : 'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={`Go to page ${page}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {page}
    </button>
  )
}

/**
 * Navigation button component (previous/next)
 */
const NavButton: React.FC<{
  direction: 'previous' | 'next'
  onClick: () => void
  disabled?: boolean
}> = ({ direction, onClick, disabled }) => {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={direction === 'previous' ? 'Go to previous page' : 'Go to next page'}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

/**
 * Items per page selector component
 */
const ItemsPerPageSelector: React.FC<{
  itemsPerPage: number
  options: number[]
  onChange: (value: number) => void
  totalItems?: number
  label?: string
  showSuffix?: boolean
  disabled?: boolean
}> = ({ itemsPerPage, options, onChange, totalItems, label = 'Rows per page', showSuffix = false, disabled }) => {
  return (
    <div className="flex items-center gap-1 text-sm text-gray-600">
      <span>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'bg-white hover:bg-gray-50 transition-colors duration-200 min-w-[60px]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
        >
          {itemsPerPage}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[80px] min-w-[80px]">
          {options.map((value) => {
            const isDisabled = totalItems !== undefined && totalItems < value && value !== options[0]
            return (
              <DropdownMenuItem
                key={value}
                onClick={() => onChange(value)}
                disabled={isDisabled}
                className={cn(
                  itemsPerPage === value && !isDisabled ? 'bg-secondary-900 hover:bg-secondary-900 focus:bg-secondary-900 text-white' : ''
                )}
              >
                {value}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {showSuffix && <span>Entries</span>}
    </div>
  )
}

/**
 * Main Table Pagination Component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TablePagination
 *   currentPage={1}
 *   totalPages={10}
 *   itemsPerPage={10}
 *   onPageChange={(page) => setPage(page)}
 *   onItemsPerPageChange={(items) => setItemsPerPage(items)}
 * />
 *
 * // With useUnifiedTable hook
 * const { pagination } = useUnifiedTable({ items, ... })
 * <TablePagination
 *   currentPage={pagination.currentPage}
 *   totalPages={pagination.totalPages}
 *   itemsPerPage={pagination.itemsPerPage}
 *   pageNumbers={pagination.pageNumbers}
 *   onPageChange={pagination.setCurrentPage}
 *   onItemsPerPageChange={pagination.setItemsPerPage}
 *   onPrevious={pagination.handlePreviousPage}
 *   onNext={pagination.handleNextPage}
 * />
 * ```
 */
export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  pageNumbers: providedPageNumbers,
  onPageChange,
  onItemsPerPageChange,
  onPrevious,
  onNext,
  itemsPerPageOptions = [10, 25, 50, 100],
  rowsPerPageLabel = 'Rows per page',
  showEntriesSuffix = false,
  className,
  variant = 'default',
  disabled = false,
  hideRowsPerPage = false,
  hidePageNumbers = false,
}) => {
  // Generate page numbers if not provided
  const pageNumbers = useMemo(
    () => providedPageNumbers || generatePageNumbers(currentPage, totalPages),
    [providedPageNumbers, currentPage, totalPages]
  )

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious()
    } else {
      onPageChange(Math.max(currentPage - 1, 1))
    }
  }

  const handleNext = () => {
    if (onNext) {
      onNext()
    } else {
      onPageChange(Math.min(currentPage + 1, totalPages))
    }
  }

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div
      className={cn(
        'w-full flex items-center justify-between gap-3 flex-wrap',
        variant === 'default' && 'px-5 py-[15px] border-t border-gray-200',
        variant === 'compact' && 'py-2',
        className
      )}
    >
      {/* Items Per Page Selector */}
      {!hideRowsPerPage ? (
        <ItemsPerPageSelector
          itemsPerPage={itemsPerPage}
          options={itemsPerPageOptions}
          onChange={onItemsPerPageChange}
          totalItems={totalItems}
          label={rowsPerPageLabel}
          showSuffix={showEntriesSuffix}
          disabled={disabled}
        />
      ) : (
        <div /> // Spacer to maintain layout
      )}

      {/* Page Navigation */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <NavButton
          direction="previous"
          onClick={handlePrevious}
          disabled={disabled || !canGoPrevious}
        />

        {/* Page Numbers */}
        {!hidePageNumbers && (
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => (
              <PageButton
                key={typeof page === 'number' ? page : `ellipsis-${index}`}
                page={page}
                currentPage={currentPage}
                onClick={onPageChange}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        {/* Next Button */}
        <NavButton
          direction="next"
          onClick={handleNext}
          disabled={disabled || !canGoNext}
        />
      </div>
    </div>
  )
}

/**
 * Helper component for direct integration with useUnifiedTable hook
 *
 * @example
 * ```tsx
 * const { pagination, filteredCount } = useUnifiedTable({ items, ... })
 *
 * <TablePaginationFromHook
 *   pagination={pagination}
 *   totalItems={filteredCount}
 * />
 * ```
 */
export const TablePaginationFromHook: React.FC<TablePaginationFromHookProps> = ({
  pagination,
  totalItems,
  itemsPerPageOptions,
  ...rest
}) => {
  return (
    <TablePagination
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      itemsPerPage={pagination.itemsPerPage}
      pageNumbers={pagination.pageNumbers}
      onPageChange={pagination.setCurrentPage}
      onItemsPerPageChange={pagination.setItemsPerPage}
      onPrevious={pagination.handlePreviousPage}
      onNext={pagination.handleNextPage}
      totalItems={totalItems}
      itemsPerPageOptions={itemsPerPageOptions || [10, 25, 50, 100]}
      {...rest}
    />
  )
}

export default TablePagination