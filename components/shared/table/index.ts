/**
 * Shared Table Components
 *
 * Unified table components with built-in pagination and state handling.
 * This module is part of the table refactorization effort (Stage 2).
 *
 * Components:
 * - DataTable: Main table component with integrated pagination and states
 * - TablePagination: Standalone pagination controls
 * - TableSkeleton: Loading skeleton for tables
 * - TableEmptyState: Empty state display
 * - TableErrorState: Error state display
 * - TableStateWrapper: Wrapper that handles loading/empty/error states
 */

// Main Data Table Component
export {
  DataTable,
  DataTableWithHook,
  type DataTableProps,
  type DataTableColumn,
  type DataTableWithHookProps,
} from './data-table'

// Pagination Components
export {
  TablePagination,
  TablePaginationFromHook,
  type TablePaginationProps,
  type TablePaginationFromHookProps,
} from './table-pagination'

// State Components
export {
  TableSkeleton,
  TableEmptyState,
  TableErrorState,
  TableStateWrapper,
  type TableSkeletonProps,
  type TableEmptyStateProps,
  type TableErrorStateProps,
  type TableStateWrapperProps,
} from './table-states'

// Default export
export { DataTable as default } from './data-table'