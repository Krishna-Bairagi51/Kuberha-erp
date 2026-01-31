/**
 * Unified Data Table Component
 *
 * A reusable table component that wraps the base Table UI with:
 * - Integrated pagination controls
 * - Built-in loading, empty, and error states
 * - Direct integration with useUnifiedTable hook
 * - Flexible column configuration
 * - Support for custom row rendering
 *
 * This component is part of the table refactorization effort (Stage 2)
 * and consolidates patterns from across the codebase.
 */

'use client'

import React, { useMemo } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TablePagination, TablePaginationFromHook } from './table-pagination'
import { TableSkeleton, TableEmptyState, TableErrorState, TableStateWrapper } from './table-states'
import type { PaginationState } from '@/hooks/table'

// ============================================================================
// Types
// ============================================================================

/**
 * Column definition for the data table
 */
export interface DataTableColumn<T> {
  /** Unique identifier for the column */
  id: string
  /** Header text or render function */
  header: React.ReactNode | (() => React.ReactNode)
  /** Accessor key for the data or render function */
  accessor?: keyof T
  /** Custom cell renderer */
  cell?: (item: T, index: number) => React.ReactNode
  /** Column width class (tailwind) */
  width?: string
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Whether the column is sortable (for future use) */
  sortable?: boolean
  /** Additional class name for the header cell */
  headerClassName?: string
  /** Additional class name for the body cells */
  cellClassName?: string
  /** Whether to hide this column */
  hidden?: boolean
}

/**
 * Props for the DataTable component
 */
export interface DataTableProps<T extends Record<string, any>> {
  /** Array of items to display */
  items: T[]
  /** Column definitions */
  columns: DataTableColumn<T>[]
  /** Unique key accessor for each row */
  getRowKey: (item: T, index: number) => string | number
  
  // Pagination (either provide pagination object or individual props)
  /** Pagination state from useUnifiedTable hook */
  pagination?: PaginationState
  /** Total items count (for pagination display) */
  totalItems?: number
  /** Items per page options */
  itemsPerPageOptions?: number[]
  /** Whether to show pagination */
  showPagination?: boolean
  
  // State props
  /** Whether data is loading */
  isLoading?: boolean
  /** Whether data is fetching (for subsequent loads, pagination, search, etc.) */
  isFetching?: boolean
  /** Error state */
  error?: string | Error | null
  /** Callback to retry on error */
  onRetry?: () => void
  
  // Empty state customization
  /** Current search term (for empty state messaging) */
  searchTerm?: string
  /** Callback to clear search */
  onClearSearch?: () => void
  /** Custom empty state title */
  emptyTitle?: string
  /** Custom empty state description */
  emptyDescription?: string
  /** Custom empty state icon */
  emptyIcon?: React.ReactNode
  /** Empty state action label */
  emptyActionLabel?: string
  /** Empty state action callback */
  onEmptyAction?: () => void
  
  // Styling
  /** Additional class name for the container */
  className?: string
  /** Additional class name for the table */
  tableClassName?: string
  /** Additional class name for the header */
  headerClassName?: string
  /** Additional class name for the body */
  bodyClassName?: string
  /** Whether to wrap in Card */
  withCard?: boolean
  /** Card title (when withCard is true) */
  cardTitle?: React.ReactNode
  /** Card header actions (when withCard is true) */
  cardHeaderActions?: React.ReactNode
  /** Custom content above the table (filters, search, etc.) */
  toolbar?: React.ReactNode
  
  // Row customization
  /** Custom row class name */
  rowClassName?: string | ((item: T, index: number) => string)
  /** Row click handler */
  onRowClick?: (item: T, index: number) => void
  /** Custom row renderer (overrides default column rendering) */
  renderRow?: (item: T, index: number) => React.ReactNode
  
  // Skeleton customization
  /** Number of skeleton rows during loading */
  skeletonRows?: number
  
  // Misc
  /** Caption for accessibility */
  caption?: string
  /** Whether the table is sticky header */
  stickyHeader?: boolean
}

/**
 * Props for DataTable with useUnifiedTable hook integration
 */
export interface DataTableWithHookProps<T extends Record<string, any>> 
  extends Omit<DataTableProps<T>, 'items' | 'pagination' | 'totalItems' | 'searchTerm' | 'onClearSearch'> {
  /** Paginated items from the hook */
  items: T[]
  /** Full pagination state from useUnifiedTable */
  pagination: PaginationState
  /** Filtered count from the hook */
  filteredCount: number
  /** Search term from the hook */
  searchTerm?: string
  /** Set search term from the hook */
  setSearchTerm?: (term: string) => void
  /** Whether there are active filters */
  hasActiveFilters?: boolean
  /** Reset filters function from the hook */
  resetFilters?: () => void
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Renders table header cell
 */
const HeaderCell: React.FC<{
  column: DataTableColumn<any>
}> = ({ column }) => {
  if (column.hidden) return null

  const headerContent = typeof column.header === 'function' 
    ? column.header() 
    : column.header

  return (
    <TableHead
      className={cn(
        'px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap',
        column.align === 'center' && 'text-center',
        column.align === 'right' && 'text-right',
        column.width,
        column.headerClassName
      )}
    >
      {headerContent}
    </TableHead>
  )
}

/**
 * Renders table body cell
 */
const BodyCell: React.FC<{
  column: DataTableColumn<any>
  item: any
  index: number
}> = ({ column, item, index }) => {
  if (column.hidden) return null

  let content: React.ReactNode

  if (column.cell) {
    content = column.cell(item, index)
  } else if (column.accessor) {
    const value = item[column.accessor]
    content = value !== undefined && value !== null ? String(value) : ''
  } else {
    content = null
  }

  return (
    <TableCell
      className={cn(
        'px-[20px] py-2',
        column.align === 'center' && 'text-center',
        column.align === 'right' && 'text-right',
        column.cellClassName
      )}
    >
      {content}
    </TableCell>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Unified Data Table Component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DataTable
 *   items={products}
 *   columns={[
 *     { id: 'name', header: 'Name', accessor: 'name' },
 *     { id: 'price', header: 'Price', cell: (item) => `$${item.price}` },
 *   ]}
 *   getRowKey={(item) => item.id}
 * />
 *
 * // With useUnifiedTable hook
 * const { paginatedItems, pagination, filteredCount, searchTerm, setSearchTerm } = useUnifiedTable({
 *   items: products,
 *   searchKeys: ['name'],
 * })
 *
 * <DataTable
 *   items={paginatedItems}
 *   columns={columns}
 *   getRowKey={(item) => item.id}
 *   pagination={pagination}
 *   totalItems={filteredCount}
 *   searchTerm={searchTerm}
 *   onClearSearch={() => setSearchTerm('')}
 *   isLoading={isLoading}
 *   error={error}
 * />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  items,
  columns,
  getRowKey,
  pagination,
  totalItems,
  itemsPerPageOptions = [10, 25, 50, 100],
  showPagination = true,
  isLoading = false,
  isFetching = false,
  error = null,
  onRetry,
  searchTerm,
  onClearSearch,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,
  className,
  tableClassName,
  headerClassName,
  bodyClassName,
  withCard = false,
  cardTitle,
  cardHeaderActions,
  toolbar,
  rowClassName,
  onRowClick,
  renderRow,
  skeletonRows = 5,
  caption,
  stickyHeader = false,
}: DataTableProps<T>) {
  // Filter out hidden columns for counting
  const visibleColumns = useMemo(
    () => columns.filter((col) => !col.hidden),
    [columns]
  )
  const columnCount = visibleColumns.length

  // Determine if we should show pagination
  const shouldShowPagination = showPagination && pagination && (totalItems ?? items.length) > 0

  // Build the table content
  const tableContent = (
    <>
      {/* Toolbar (filters, search, etc.) */}
      {toolbar && (
        <div className="px-[8px] py-[15px] border-b border-gray-200">
          {toolbar}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className={cn('w-full', tableClassName)}>
          {caption && <caption className="sr-only">{caption}</caption>}
          
          <TableHeader
            className={cn(
              'bg-gray-50 border-b border-gray-200',
              items.length > 0 && 'hover:bg-gray-50',
              stickyHeader && 'sticky top-0 z-10',
              headerClassName
            )}
          >
            <TableRow>
              {columns.map((column) => (
                <HeaderCell key={column.id} column={column} />
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className={cn('bg-white', bodyClassName)}>
            <TableStateWrapper
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
              hasItems={items.length > 0}
              columns={columnCount}
              searchTerm={searchTerm}
              onClearSearch={onClearSearch}
              onRetry={onRetry}
              skeletonProps={{ rows: skeletonRows }}
              emptyProps={{
                title: emptyTitle,
                description: emptyDescription,
                icon: emptyIcon,
                actionLabel: emptyActionLabel,
                onAction: onEmptyAction,
              }}
            >
              {items.map((item, index) => {
                const key = getRowKey(item, index)
                const computedRowClassName = typeof rowClassName === 'function'
                  ? rowClassName(item, index)
                  : rowClassName

                // Use custom row renderer if provided
                if (renderRow) {
                  return (
                    <TableRow
                      key={key}
                      className={cn(
                        'hover:bg-gray-50 bg-white',
                        onRowClick && 'cursor-pointer',
                        computedRowClassName
                      )}
                      onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                    >
                      {renderRow(item, index)}
                    </TableRow>
                  )
                }

                // Default column-based rendering
                return (
                  <TableRow
                    key={key}
                    className={cn(
                      'hover:bg-gray-50 bg-white',
                      onRowClick && 'cursor-pointer',
                      computedRowClassName
                    )}
                    onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                  >
                    {columns.map((column) => (
                      <BodyCell
                        key={column.id}
                        column={column}
                        item={item}
                        index={index}
                      />
                    ))}
                  </TableRow>
                )
              })}
            </TableStateWrapper>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {shouldShowPagination && pagination && (
        <TablePaginationFromHook
          pagination={pagination}
          totalItems={totalItems ?? items.length}
          itemsPerPageOptions={itemsPerPageOptions}
        />
      )}
    </>
  )

  // Wrap in card if requested
  if (withCard) {
    return (
      <Card className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
        <CardContent className="p-0">
          {/* Card Header */}
          {(cardTitle || cardHeaderActions) && (
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              {cardTitle && (
                <div className="flex items-center space-x-2">
                  {typeof cardTitle === 'string' ? (
                    <h2 className="font-semibold text-gray-900 label-1 font-urbanist">{cardTitle}</h2>
                  ) : (
                    cardTitle
                  )}
                </div>
              )}
              {cardHeaderActions && (
                <div className="flex items-center gap-3">
                  {cardHeaderActions}
                </div>
              )}
            </div>
          )}
          {tableContent}
        </CardContent>
      </Card>
    )
  }

  // Return without card wrapper
  return <div className={className}>{tableContent}</div>
}

// ============================================================================
// Convenience Wrapper for useUnifiedTable
// ============================================================================

/**
 * DataTable wrapper optimized for useUnifiedTable hook integration
 * 
 * @example
 * ```tsx
 * const table = useUnifiedTable({
 *   items: products,
 *   searchKeys: ['name', 'sku'],
 *   categoryKey: 'category',
 * })
 *
 * <DataTableWithHook
 *   items={table.paginatedItems}
 *   pagination={table.pagination}
 *   filteredCount={table.filteredCount}
 *   searchTerm={table.searchTerm}
 *   setSearchTerm={table.setSearchTerm}
 *   columns={columns}
 *   getRowKey={(item) => item.id}
 * />
 * ```
 */
export function DataTableWithHook<T extends Record<string, any>>({
  items,
  pagination,
  filteredCount,
  searchTerm,
  setSearchTerm,
  hasActiveFilters,
  resetFilters,
  ...rest
}: DataTableWithHookProps<T>) {
  return (
    <DataTable
      items={items}
      pagination={pagination}
      totalItems={filteredCount}
      searchTerm={searchTerm}
      onClearSearch={setSearchTerm ? () => setSearchTerm('') : undefined}
      {...rest}
    />
  )
}

// ============================================================================
// Exports
// ============================================================================

export default DataTable