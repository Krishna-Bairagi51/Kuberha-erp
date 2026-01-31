"use client"

import type { LeadTimeEntry } from '../../types/inventory.types'

export const REQUIRED_QUANTITY_RANGES = ['0-1', '2-5', '6-9', '10+']

export const getQuantityRangeString = (start_qty: number, end_qty: number): string => {
  if (start_qty === 0 && end_qty === 1) return '0-1'
  if (start_qty === 2 && end_qty === 5) return '2-5'
  if (start_qty === 6 && end_qty === 9) return '6-9'
  if (start_qty >= 10 && end_qty >= 10) return '10+'
  if (start_qty === end_qty) return start_qty.toString()
  return `${start_qty}-${end_qty}`
}

export const getQuantityRangeSortOrder = (range: string): number => {
  switch (range) {
    case '0-1': return 1
    case '2-5': return 2
    case '6-9': return 3
    case '10+': return 4
    default: return 999
  }
}

export const sortLeadTimes = (leadTimes: LeadTimeEntry[]): LeadTimeEntry[] => {
  return [...leadTimes].sort((a, b) => {
    return getQuantityRangeSortOrder(a.quantity_range) - getQuantityRangeSortOrder(b.quantity_range)
  })
}

// Helper function to validate lead times before submission
// Set requireAllRanges to true only for template saving
// For product operations (add, submit, save as draft), set it to false
export const validateLeadTimes = (
  manufacture_lead_times: LeadTimeEntry[],
  requireAllRanges: boolean = false,
  options?: { allowEmpty?: boolean }
): { isValid: boolean; error?: string } => {
  const allowEmpty = options?.allowEmpty ?? false

  // Check if there are any lead times
  if (!manufacture_lead_times || manufacture_lead_times.length === 0) {
    if (allowEmpty) {
      return { isValid: true }
    }
    return { isValid: false, error: 'Please add at least one lead time entry' }
  }

  // Check if all time fields are filled (not blank or 0)
  const blankEntry = manufacture_lead_times.find(lt => !lt.lead_time_value || lt.lead_time_value <= 0)
  if (blankEntry) {
    const rangeLabel = blankEntry.quantity_range || `${blankEntry.start_qty}-${blankEntry.end_qty}`
    return { 
      isValid: false, 
      error: `Lead time for range "${rangeLabel}" must be greater than 0` 
    }
  }

  // Check if all 4 required quantity ranges are present (only for template saving)
  if (requireAllRanges) {
    const presentRanges = manufacture_lead_times.map(lt => lt.quantity_range)
    const hasAllRequiredRanges = REQUIRED_QUANTITY_RANGES.every(range => presentRanges.includes(range))
    
    if (!hasAllRequiredRanges) {
      const missingRanges = REQUIRED_QUANTITY_RANGES.filter(range => !presentRanges.includes(range))
      return { isValid: false, error: `Please add lead times for all required quantity ranges. Missing: ${missingRanges.join(', ')}` }
    }
  }

  return { isValid: true }
}

export type { LeadTimeEntry }

