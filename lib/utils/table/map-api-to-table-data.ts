/**
 * Map API to Table Data Utility
 *
 * A utility that normalizes API responses for table consumption.
 * Handles various response formats and supports custom field mapping and transformation.
 *
 * This module is part of the table refactorization effort (Stage 3).
 *
 * Features:
 * - Extracts arrays from various response wrapper keys (record, result, data, etc.)
 * - Supports custom field mapping and transformation
 * - Handles nested data extraction
 * - Provides type conversion utilities
 * - Works with any API response structure
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Common API response wrapper keys found across the codebase
 */
export type CommonWrapperKey =
  | 'record'
  | 'result'
  | 'data'
  | 'products'
  | 'items'
  | 'orders'
  | 'ecomCategories'
  | 'categories'
  | 'list'
  | 'rows'
  | 'entries'
  | 'results'
  | 'records'

/**
 * Field transformer function type
 */
export type FieldTransformer<TInput, TOutput> = (
  value: TInput,
  item: Record<string, any>,
  index: number
) => TOutput

/**
 * Field mapping configuration
 */
export interface FieldMapping<TOutput = any> {
  /** Source field path (supports dot notation for nested fields) */
  from: string
  /** Optional transformer function */
  transform?: FieldTransformer<any, TOutput>
  /** Default value if source field is undefined/null */
  defaultValue?: TOutput
}

/**
 * Field mappings object - maps output field names to their configuration
 */
export type FieldMappings<TOutput> = {
  [K in keyof TOutput]?: string | FieldMapping<TOutput[K]>
}

/**
 * Options for extracting data from API response
 */
export interface ExtractDataOptions {
  /** Specific key to extract data from (overrides auto-detection) */
  dataKey?: string
  /** Additional keys to check when auto-detecting */
  additionalKeys?: string[]
  /** Whether to return empty array instead of throwing on invalid response */
  returnEmptyOnError?: boolean
}

/**
 * Options for mapping API data to table format
 */
export interface MapApiToTableDataOptions<TInput, TOutput> {
  /** Field mappings from API fields to table fields */
  mappings?: FieldMappings<TOutput>
  /** Transform function applied to each item after field mapping */
  transform?: (item: TInput, index: number) => TOutput
  /** Filter function to exclude items */
  filter?: (item: TInput, index: number) => boolean
  /** Sort function to order items */
  sort?: (a: TOutput, b: TOutput) => number
  /** Options for data extraction */
  extractOptions?: ExtractDataOptions
}

/**
 * Result of the mapApiToTableData function
 */
export interface MapApiToTableDataResult<T> {
  /** Extracted and transformed data array */
  data: T[]
  /** Total count from API response (if available) */
  totalCount?: number
  /** Whether extraction was successful */
  success: boolean
  /** Error message if extraction failed */
  error?: string
  /** Original response metadata */
  meta?: {
    statusCode?: number
    message?: string
    [key: string]: any
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Default wrapper keys to check when extracting data
 */
const DEFAULT_WRAPPER_KEYS: CommonWrapperKey[] = [
  'record',
  'records',
  'result',
  'results',
  'data',
  'products',
  'items',
  'orders',
  'list',
  'rows',
  'entries',
  'ecomCategories',
  'categories',
]

/**
 * Get a nested value from an object using dot notation
 *
 * @example
 * getNestedValue({ a: { b: { c: 1 } } }, 'a.b.c') // => 1
 * getNestedValue({ items: [{ name: 'test' }] }, 'items.0.name') // => 'test'
 */
export function getNestedValue<T = any>(
  obj: Record<string, any>,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }

  const keys = path.split('.')
  let current: any = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue
    }

    // Handle array index access
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      current = current[parseInt(key, 10)]
    } else {
      current = current[key]
    }
  }

  return current !== undefined ? current : defaultValue
}

/**
 * Set a nested value in an object using dot notation
 */
export function setNestedValue(
  obj: Record<string, any>,
  path: string,
  value: any
): void {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current)) {
      // Create object or array based on next key
      current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

/**
 * Check if a value is a non-null object
 */
function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Check if a response has a successful status
 */
export function isSuccessResponse(response: any): boolean {
  if (!isObject(response)) return false

  // Check status_code field (common in this codebase)
  if ('status_code' in response) {
    return response.status_code === 200 || response.status_code === 201
  }

  // Check success field
  if ('success' in response) {
    return response.success === true
  }

  // Check status field
  if ('status' in response) {
    return response.status === 'success' || response.status === 200
  }

  // If no status indicators, assume success if we can find data
  return true
}

/**
 * Extract total count from API response
 */
export function extractTotalCount(response: any): number | undefined {
  if (!isObject(response)) return undefined

  // Common count field names
  const countFields = [
    'total_count',
    'totalCount',
    'total',
    'count',
    'total_items',
    'totalItems',
    'total_records',
    'totalRecords',
  ]

  for (const field of countFields) {
    if (field in response && typeof response[field] === 'number') {
      return response[field]
    }
  }

  return undefined
}

/**
 * Extract metadata from API response
 */
export function extractMeta(response: any): Record<string, any> | undefined {
  if (!isObject(response)) return undefined

  const meta: Record<string, any> = {}

  if ('status_code' in response) meta.statusCode = response.status_code
  if ('message' in response) meta.message = response.message
  if ('error' in response) meta.error = response.error
  if ('page' in response) meta.page = response.page
  if ('per_page' in response) meta.perPage = response.per_page
  if ('total_pages' in response) meta.totalPages = response.total_pages

  return Object.keys(meta).length > 0 ? meta : undefined
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Extract array data from an API response
 *
 * Handles various response formats by checking common wrapper keys.
 * Returns the first array found, or empty array if none found.
 *
 * @example
 * // All these return the array:
 * extractArrayFromResponse({ record: [1, 2, 3] }) // => [1, 2, 3]
 * extractArrayFromResponse({ data: [1, 2, 3] }) // => [1, 2, 3]
 * extractArrayFromResponse({ result: [1, 2, 3] }) // => [1, 2, 3]
 * extractArrayFromResponse([1, 2, 3]) // => [1, 2, 3]
 */
export function extractArrayFromResponse<T = any>(
  response: any,
  options: ExtractDataOptions = {}
): T[] {
  const { dataKey, additionalKeys = [], returnEmptyOnError = true } = options

  // If response is already an array, return it
  if (Array.isArray(response)) {
    return response as T[]
  }

  // If response is not an object, return empty or throw
  if (!isObject(response)) {
    if (returnEmptyOnError) return []
    throw new Error('Invalid API response: expected object or array')
  }

  // If specific key provided, use it
  if (dataKey) {
    const value = getNestedValue(response, dataKey)
    if (Array.isArray(value)) return value as T[]
    if (returnEmptyOnError) return []
    throw new Error(`Data key "${dataKey}" not found or not an array`)
  }

  // Build list of keys to check
  const keysToCheck = [...additionalKeys, ...DEFAULT_WRAPPER_KEYS]

  // Try each key
  for (const key of keysToCheck) {
    const value = response[key]
    if (Array.isArray(value)) {
      return value as T[]
    }
  }

  // Check for nested data (e.g., response.data.records)
  if (isObject(response.data)) {
    for (const key of DEFAULT_WRAPPER_KEYS) {
      const value = response.data[key]
      if (Array.isArray(value)) {
        return value as T[]
      }
    }
  }

  // No array found
  if (returnEmptyOnError) return []
  throw new Error('No array data found in API response')
}

/**
 * Map a single item using field mappings
 */
function mapItem<TInput extends Record<string, any>, TOutput>(
  item: TInput,
  index: number,
  mappings: FieldMappings<TOutput>
): Partial<TOutput> {
  const result: Record<string, any> = {}

  for (const [outputKey, mapping] of Object.entries(mappings)) {
    if (mapping === undefined) continue

    let value: any

    if (typeof mapping === 'string') {
      // Simple string mapping - just get the field
      value = getNestedValue(item, mapping)
    } else {
      // Full mapping config
      const { from, transform, defaultValue } = mapping as FieldMapping
      value = getNestedValue(item, from, defaultValue)

      if (transform && value !== undefined) {
        value = transform(value, item, index)
      } else if (value === undefined) {
        value = defaultValue
      }
    }

    result[outputKey] = value
  }

  return result as Partial<TOutput>
}

/**
 * Main utility function to map API response to table data
 *
 * @example
 * ```ts
 * // Simple extraction
 * const { data } = mapApiToTableData(response)
 *
 * // With field mappings
 * const { data } = mapApiToTableData<ApiProduct, TableProduct>(response, {
 *   mappings: {
 *     id: 'product_id',
 *     name: 'product_name',
 *     price: {
 *       from: 'unit_price',
 *       transform: (value) => `₹${value.toLocaleString('en-IN')}`
 *     },
 *     status: {
 *       from: 'is_active',
 *       transform: (value) => value ? 'Active' : 'Inactive'
 *     }
 *   }
 * })
 *
 * // With transform function
 * const { data } = mapApiToTableData(response, {
 *   transform: (item) => ({
 *     ...item,
 *     fullName: `${item.firstName} ${item.lastName}`
 *   })
 * })
 *
 * // With filter and sort
 * const { data } = mapApiToTableData(response, {
 *   filter: (item) => item.status === 'active',
 *   sort: (a, b) => b.date.localeCompare(a.date)
 * })
 * ```
 */
export function mapApiToTableData<
  TInput extends Record<string, any> = Record<string, any>,
  TOutput = TInput
>(
  response: any,
  options: MapApiToTableDataOptions<TInput, TOutput> = {}
): MapApiToTableDataResult<TOutput> {
  const { mappings, transform, filter, sort, extractOptions } = options

  try {
    // Check if response indicates an error
    if (isObject(response) && !isSuccessResponse(response)) {
      return {
        data: [],
        success: false,
        error: response.message || response.error || 'API request failed',
        meta: extractMeta(response),
      }
    }

    // Extract array data
    const rawData = extractArrayFromResponse<TInput>(response, {
      ...extractOptions,
      returnEmptyOnError: true,
    })

    // Process each item
    let processedData: TOutput[] = rawData.map((item, index) => {
      let result: any = item

      // Apply field mappings if provided
      if (mappings && Object.keys(mappings).length > 0) {
        const mappedFields = mapItem(item, index, mappings)
        // Merge mapped fields with original item (mapped fields take precedence)
        result = { ...item, ...mappedFields }
      }

      // Apply transform if provided
      if (transform) {
        result = transform(item, index)
      }

      return result as TOutput
    })

    // Apply filter if provided
    if (filter) {
      processedData = processedData.filter((item, index) =>
        filter(rawData[index], index)
      )
    }

    // Apply sort if provided
    if (sort) {
      processedData.sort(sort)
    }

    return {
      data: processedData,
      totalCount: extractTotalCount(response) ?? processedData.length,
      success: true,
      meta: extractMeta(response),
    }
  } catch (error) {
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// Type Conversion Utilities
// ============================================================================

/**
 * Convert a value to number, with fallback
 */
export function toNumber(value: any, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

/**
 * Convert a value to string, with fallback
 */
export function toString(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback
  return String(value)
}

/**
 * Convert a value to boolean
 */
export function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
  }
  return Boolean(value)
}

/**
 * Convert a value to Date
 */
export function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}

// ============================================================================
// Common Transformers
// ============================================================================

/**
 * Pre-built transformer functions for common use cases
 */
export const transformers = {
  /**
   * Format number as Indian currency
   */
  toIndianCurrency: (value: any): string => {
    const num = toNumber(value)
    return `₹${num.toLocaleString('en-IN')}`
  },

  /**
   * Format number with commas (Indian format)
   */
  toIndianNumber: (value: any): string => {
    return toNumber(value).toLocaleString('en-IN')
  },

  /**
   * Format date to locale string
   */
  toLocaleDateString: (value: any): string => {
    const date = toDate(value)
    return date ? date.toLocaleDateString('en-IN') : ''
  },

  /**
   * Format datetime to locale string
   */
  toLocaleDateTimeString: (value: any): string => {
    const date = toDate(value)
    return date ? date.toLocaleString('en-IN') : ''
  },

  /**
   * Create an order ID with prefix
   */
  toOrderId:
    (prefix: string = 'IDO') =>
    (value: any): string => {
      const num = toNumber(value)
      return `${prefix}${String(num).padStart(2, '0')}`
    },

  /**
   * Capitalize first letter
   */
  capitalize: (value: any): string => {
    const str = toString(value)
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  /**
   * Convert status code to display name
   */
  statusToDisplay:
    (statusMap: Record<string, string>) =>
    (value: any): string => {
      const status = toString(value).toLowerCase()
      return statusMap[status] || status
    },

  /**
   * Join array values with separator
   */
  joinArray:
    (separator: string = ', ') =>
    (value: any): string => {
      if (!Array.isArray(value)) return toString(value)
      return value.filter(Boolean).join(separator)
    },

  /**
   * Get first item from array or return value
   */
  firstOrValue: (value: any): any => {
    if (Array.isArray(value)) return value[0]
    return value
  },

  /**
   * Truncate string with ellipsis
   */
  truncate:
    (maxLength: number = 50) =>
    (value: any): string => {
      const str = toString(value)
      if (str.length <= maxLength) return str
      return str.slice(0, maxLength - 3) + '...'
    },
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Simple extraction without transformation
 */
export function extractTableData<T = any>(
  response: any,
  dataKey?: string
): T[] {
  return extractArrayFromResponse<T>(response, { dataKey })
}

/**
 * Extract data with simple field renaming
 */
export function extractAndRename<TOutput>(
  response: any,
  fieldMap: Record<keyof TOutput, string>
): TOutput[] {
  const mappings: FieldMappings<TOutput> = {}
  for (const [outputKey, sourceKey] of Object.entries(fieldMap)) {
    mappings[outputKey as keyof TOutput] = sourceKey as string
  }

  const result = mapApiToTableData<Record<string, any>, TOutput>(response, {
    mappings,
  })

  return result.data
}

// ============================================================================
// Export Default
// ============================================================================

export default mapApiToTableData