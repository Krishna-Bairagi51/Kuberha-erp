/**
 * Miscellaneous utility functions
 */

/**
 * Safely parse JSON text. Returns parsed value or undefined if parse fails.
 * Use when the server sometimes returns non-JSON but you don't want throws everywhere.
 */
export function safeJsonParse<T = any>(text: string | null | undefined): T | undefined {
  if (text === undefined || text === null) return undefined
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined
  }
}

/**
 * Extract image URLs from a block of text and return cleaned text + array of image urls.
 * Matches common image extensions and preserves querystrings.
 */
export function extractImageUrls(text: string): { cleanText: string; imageUrls: string[] } {
  if (!text) return { cleanText: "", imageUrls: [] }
  const imageRegex = /https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s]*)?/gi
  const imageUrls = text.match(imageRegex) || []
  const cleanText = text.replace(imageRegex, "").trim()
  return { cleanText, imageUrls }
}

/**
 * Format date and time in standard concise format: DD/MM/YYYY HH:MM (24-hour format)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in format "DD/MM/YYYY HH:MM" or "N/A" if invalid
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "N/A"
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    
    if (isNaN(date.getTime())) {
      return "N/A"
    }
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return "N/A"
  }
}

/**
 * Format date only in standard concise format: DD/MM/YYYY
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in format "DD/MM/YYYY" or "N/A" if invalid
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "N/A"
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    
    if (isNaN(date.getTime())) {
      return "N/A"
    }
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch {
    return "N/A"
  }
}

/**
 * Format date in readable format: DD MMM YYYY (e.g., "29 Jan 2025")
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in format "DD MMM YYYY" or "N/A" if invalid
 */
export function formatOrderDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "N/A"
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    
    if (isNaN(date.getTime())) {
      return "N/A"
    }
    
    const day = date.getDate()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    
    return `${day} ${month} ${year}`
  } catch {
    return "N/A"
  }
}