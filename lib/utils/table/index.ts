/**
 * Table Utilities
 *
 * Utilities for normalizing API responses and mapping data for table consumption.
 * This module is part of the table refactorization effort (Stage 3).
 */

// Main utility function and types
export {
  mapApiToTableData,
  extractArrayFromResponse,
  extractTableData,
  extractAndRename,
  type MapApiToTableDataOptions,
  type MapApiToTableDataResult,
  type FieldMapping,
  type FieldMappings,
  type FieldTransformer,
  type ExtractDataOptions,
  type CommonWrapperKey,
} from './map-api-to-table-data'

// Helper functions
export {
  getNestedValue,
  setNestedValue,
  isSuccessResponse,
  extractTotalCount,
  extractMeta,
} from './map-api-to-table-data'

// Type conversion utilities
export {
  toNumber,
  toString,
  toBoolean,
  toDate,
} from './map-api-to-table-data'

// Pre-built transformers
export { transformers } from './map-api-to-table-data'

// Default export
export { default } from './map-api-to-table-data'