/**
 * Table Hooks Module
 * 
 * Unified table management hooks with built-in pagination and filtering.
 * Consolidates patterns from use-inventory-table.ts, usePagination.ts,
 * and various custom pagination/filtering implementations across the codebase.
 */

// Main unified table hook
export {
  useUnifiedTable,
  type UseUnifiedTableOptions,
  type UseUnifiedTableReturn,
  type CustomFilterConfig,
  type CustomFilterState,
  type PaginationState,
  type UrlPersistenceConfig,
} from './use-unified-table'

// Default export for convenience
export { default } from './use-unified-table'