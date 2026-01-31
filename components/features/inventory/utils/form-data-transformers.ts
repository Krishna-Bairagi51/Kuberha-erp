/**
 * Optimized form data transformation utilities
 * Memoized functions for transforming API data to form data
 */

import type { LeadTimeEntry } from '../types/inventory.types'

/**
 * Get quantity range string from start and end quantities
 */
export const getQuantityRangeString = (start: number, end: number): string => {
  if (start === 0 && end === 1) return '0-1'
  if (start === 2 && end === 5) return '2-5'
  if (start === 6 && end === 9) return '6-9'
  if (start === 10) return '10+'
  return `${start}-${end}`
}

/**
 * Extract names from array of objects or strings
 * Memoized helper to avoid recreating on every render
 */
export const extractNames = (arr: any[]): string[] => {
  if (!Array.isArray(arr)) return []
  return arr.map(item => typeof item === 'string' ? item : item?.name).filter(Boolean)
}

/**
 * Extract IDs from array of objects or numbers
 * Memoized helper to avoid recreating on every render
 */
export const extractIds = (arr: any[]): number[] => {
  if (!Array.isArray(arr)) return []
  return arr.map(item => typeof item === 'number' ? item : item?.id).filter(Boolean)
}

/**
 * Transform manufacture lead times from API format to form format
 */
export const transformLeadTimes = (leadTimes: any[]): LeadTimeEntry[] => {
  if (!Array.isArray(leadTimes)) return []
  return leadTimes.map((lt: any) => ({
    quantity_range: getQuantityRangeString(lt.start_qty, lt.end_qty),
    lead_time_value: lt.lead_time,
    lead_time_unit: lt.lead_time_unit,
    start_qty: lt.start_qty,
    end_qty: lt.end_qty
  }))
}

/**
 * Normalize category name for comparison (case-insensitive)
 */
export const normalizeCategoryName = (name: string): string => {
  return name.trim().toLowerCase()
}

/**
 * Check if category name is duplicate
 */
export const isDuplicateCategory = (
  name: string,
  categories: Array<{ name: string }> | undefined
): boolean => {
  if (!categories || !name) return false
  const normalized = normalizeCategoryName(name)
  return categories.some(cat => normalizeCategoryName(cat.name) === normalized)
}
