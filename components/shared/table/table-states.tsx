/**
 * Unified Table States Components
 *
 * Reusable state components for tables:
 * - TableSkeleton: Loading skeleton during data fetch
 * - TableEmptyState: Empty state when no data matches filters
 * - TableErrorState: Error state when data fetch fails
 *
 * These components consolidate patterns from:
 * - components/features/orders/components/shared/table-empty-state.tsx
 * - components/features/orders/components/shared/table-skeleton.tsx
 */

'use client'

import React from 'react'
import { Search, AlertCircle, RefreshCw, FileX, Inbox } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface TableSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number
  /** Number of columns in the table */
  columns: number
  /** Custom cell widths (optional) - array of tailwind width classes */
  cellWidths?: string[]
  /** Additional class name for skeleton cells */
  className?: string
  /** Whether to show as table rows or standalone div */
  asTableRows?: boolean
}

export interface TableEmptyStateProps {
  /** Custom icon to display */
  icon?: React.ReactNode
  /** Main title text */
  title?: string
  /** Description text */
  description?: string
  /** Current search term (for contextual messaging) */
  searchTerm?: string
  /** Callback to clear search */
  onClearSearch?: () => void
  /** Label for primary action button */
  actionLabel?: string
  /** Callback for primary action */
  onAction?: () => void
  /** Number of columns to span (when used in table) */
  colSpan?: number
  /** Additional class name */
  className?: string
  /** Whether to render as table row */
  asTableRow?: boolean
}

export interface TableErrorStateProps {
  /** Error message to display */
  error: string | Error | null
  /** Custom icon to display */
  icon?: React.ReactNode
  /** Main title text */
  title?: string
  /** Callback to retry the failed operation */
  onRetry?: () => void
  /** Label for retry button */
  retryLabel?: string
  /** Number of columns to span (when used in table) */
  colSpan?: number
  /** Additional class name */
  className?: string
  /** Whether to render as table row */
  asTableRow?: boolean
}

export interface TableStateWrapperProps {
  /** Whether data is loading */
  isLoading?: boolean
  /** Whether data is fetching (for subsequent loads, pagination, search, etc.) */
  isFetching?: boolean
  /** Error state */
  error?: string | Error | null
  /** Whether there are items to display */
  hasItems: boolean
  /** Number of columns for skeleton/empty/error states */
  columns: number
  /** Children to render when there's data */
  children: React.ReactNode
  /** Props for skeleton state */
  skeletonProps?: Partial<TableSkeletonProps>
  /** Props for empty state */
  emptyProps?: Partial<TableEmptyStateProps>
  /** Props for error state */
  errorProps?: Partial<TableErrorStateProps>
  /** Callback to retry on error */
  onRetry?: () => void
  /** Current search term */
  searchTerm?: string
  /** Callback to clear search */
  onClearSearch?: () => void
}

// ============================================================================
// Skeleton Component
// ============================================================================

/**
 * Loading skeleton for tables during data fetch
 *
 * @example
 * ```tsx
 * // As table rows
 * <TableBody>
 *   {isLoading ? (
 *     <TableSkeleton rows={5} columns={4} />
 *   ) : (
 *     data.map(item => <TableRow key={item.id}>...</TableRow>)
 *   )}
 * </TableBody>
 *
 * // Standalone
 * <TableSkeleton rows={3} columns={4} asTableRows={false} />
 * ```
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns,
  cellWidths,
  className,
  asTableRows = true,
}) => {
  const skeletonRows = Array.from({ length: rows }, (_, rowIndex) => {
    const cells = Array.from({ length: columns }, (_, cellIndex) => {
      const width = cellWidths?.[cellIndex] || 'w-16'
      return (
        <TableCell key={cellIndex} className="px-[20px] py-2">
          <div
            className={cn(
              'h-4 bg-neutral-200 rounded animate-pulse',
              width,
              className
            )}
          />
        </TableCell>
      )
    })

    if (asTableRows) {
      return (
        <TableRow key={`skeleton-${rowIndex}`} className="bg-white hover:bg-white">
          {cells}
        </TableRow>
      )
    }

    return (
      <div key={`skeleton-${rowIndex}`} className="flex gap-4 py-2">
        {cells}
      </div>
    )
  })

  return <>{skeletonRows}</>
}

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * Empty state component for tables with no data
 *
 * @example
 * ```tsx
 * // As table row
 * <TableBody>
 *   {items.length === 0 ? (
 *     <TableEmptyState
 *       title="No products found"
 *       description="Try adjusting your search or filters"
 *       searchTerm={searchTerm}
 *       onClearSearch={() => setSearchTerm('')}
 *       colSpan={6}
 *     />
 *   ) : (
 *     items.map(...)
 *   )}
 * </TableBody>
 *
 * // Standalone
 * <TableEmptyState
 *   title="No data"
 *   asTableRow={false}
 * />
 * ```
 */
export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  icon,
  title = 'No results found',
  description,
  searchTerm,
  onClearSearch,
  actionLabel,
  onAction,
  colSpan = 1,
  className,
  asTableRow = true,
}) => {
  // Generate contextual description if not provided
  const displayDescription = description || (
    searchTerm
      ? `No results found for "${searchTerm}". Try adjusting your search terms or check for typos.`
      : 'No items available at the moment. Please check back later.'
  )

  // Select appropriate icon
  const displayIcon = icon || (
    searchTerm ? (
      <Search className="h-12 w-12 text-gray-300" />
    ) : (
      <Inbox className="h-12 w-12 text-gray-300" />
    )
  )

  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-3 py-12', className)}>
      {displayIcon}
      <div className="text-lg font-semibold text-gray-500 font-urbanist">
        {title}
      </div>
      <div className="text-sm text-gray-400 font-urbanist max-w-md text-center">
        {displayDescription}
      </div>
      <div className="flex items-center gap-3 mt-2">
        {searchTerm && onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 font-urbanist focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear search
          </button>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-3 py-1.5 text-sm font-medium text-white bg-secondary-900 rounded-md hover:bg-secondary-800 transition-colors duration-200 font-urbanist focus:outline-none focus:ring-2 focus:ring-secondary-500"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )

  if (asTableRow) {
    return (
      <TableRow className="hover:bg-white bg-white">
        <TableCell colSpan={colSpan} className="px-[20px] py-2">
          {content}
        </TableCell>
      </TableRow>
    )
  }

  return content
}

// ============================================================================
// Error State Component
// ============================================================================

/**
 * Error state component for tables when data fetch fails
 *
 * @example
 * ```tsx
 * // As table row
 * <TableBody>
 *   {error ? (
 *     <TableErrorState
 *       error={error}
 *       onRetry={() => refetch()}
 *       colSpan={6}
 *     />
 *   ) : (
 *     items.map(...)
 *   )}
 * </TableBody>
 * ```
 */
export const TableErrorState: React.FC<TableErrorStateProps> = ({
  error,
  icon,
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Try again',
  colSpan = 1,
  className,
  asTableRow = true,
}) => {
  const errorMessage = error instanceof Error ? error.message : error || 'An unexpected error occurred'

  const displayIcon = icon || <AlertCircle className="h-12 w-12 text-red-400" />

  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-3 py-12', className)}>
      {displayIcon}
      <div className="text-lg font-semibold text-gray-500 font-urbanist">
        {title}
      </div>
      <div className="text-sm text-red-500 font-urbanist max-w-md text-center">
        {errorMessage}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-secondary-900 rounded-md hover:bg-secondary-800 transition-colors duration-200 font-urbanist focus:outline-none focus:ring-2 focus:ring-secondary-500"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </button>
      )}
    </div>
  )

  if (asTableRow) {
    return (
      <TableRow className="hover:bg-white bg-white">
        <TableCell colSpan={colSpan} className="px-[20px] py-2">
          {content}
        </TableCell>
      </TableRow>
    )
  }

  return content
}

// ============================================================================
// Table State Wrapper Component
// ============================================================================

/**
 * Wrapper component that handles loading, error, and empty states automatically
 *
 * @example
 * ```tsx
 * <TableBody>
 *   <TableStateWrapper
 *     isLoading={isLoading}
 *     error={error}
 *     hasItems={items.length > 0}
 *     columns={6}
 *     searchTerm={searchTerm}
 *     onClearSearch={() => setSearchTerm('')}
 *     onRetry={() => refetch()}
 *   >
 *     {items.map(item => (
 *       <TableRow key={item.id}>...</TableRow>
 *     ))}
 *   </TableStateWrapper>
 * </TableBody>
 * ```
 */
export const TableStateWrapper: React.FC<TableStateWrapperProps> = ({
  isLoading,
  isFetching,
  error,
  hasItems,
  columns,
  children,
  skeletonProps,
  emptyProps,
  errorProps,
  onRetry,
  searchTerm,
  onClearSearch,
}) => {
  // Initial loading state (no data yet)
  if (isLoading && !hasItems) {
    return (
      <TableSkeleton
        columns={columns}
        rows={skeletonProps?.rows || 5}
        {...skeletonProps}
      />
    )
  }

  // Fetching state (pagination, search, etc. - show skeleton while keeping headers)
  if (isFetching) {
    return (
      <TableSkeleton
        columns={columns}
        rows={skeletonProps?.rows || 5}
        {...skeletonProps}
      />
    )
  }

  // Error state
  if (error) {
    return (
      <TableErrorState
        error={error}
        onRetry={onRetry}
        colSpan={columns}
        {...errorProps}
      />
    )
  }

  // Empty state
  if (!hasItems) {
    return (
      <TableEmptyState
        searchTerm={searchTerm}
        onClearSearch={onClearSearch}
        colSpan={columns}
        {...emptyProps}
      />
    )
  }

  // Render children when there's data
  return <>{children}</>
}

// ============================================================================
// Exports
// ============================================================================

export default {
  TableSkeleton,
  TableEmptyState,
  TableErrorState,
  TableStateWrapper,
}