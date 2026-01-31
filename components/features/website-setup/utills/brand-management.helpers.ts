// Brand Management Feature Helpers
// Utility functions for brand management

// ============================================================================
// Status Display Helpers
// ============================================================================

export interface StatusDisplay {
  text: string
  color: string
}

/**
 * Get status display configuration for product status
 * Maps API status values to display text and color classes
 * Matches inventory component styling
 */
export const getStatusDisplay = (status?: string): StatusDisplay => {
  if (status === 'draft') return { text: 'Draft', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
  if (status === 'unarchive') return { text: 'Listed', color: 'bg-green-50 text-green-600 border-green-200' }
  if (status === 'archive') return { text: 'Delisted', color: 'bg-red-50 text-red-600 border-red-200' }
  if (status === 'rejected') return { text: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200' }
  if (status === 'approved') return { text: 'Approved', color: 'bg-green-50 text-green-600 border-green-200' }
  if (status === 'pending') return { text: 'Pending', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
  return { text: 'Draft', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
}

// ============================================================================
// File Validation Helpers
// ============================================================================

/**
 * Validate image file for brand upload
 * Checks file type (JPG, PNG only) and size (max 20MB)
 */
export const validateBrandImageFile = (file: File): { valid: boolean; error?: string } => {
  // Validate file type - only allow JPG and PNG
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  const isValidType = allowedTypes.includes(file.type) || 
                     (fileExtension === "jpg" || fileExtension === "jpeg" || fileExtension === "png")
  
  if (!isValidType) {
    return { valid: false, error: "Only JPG and PNG formats are supported" }
  }

  // Validate file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: "Image size must be less than 20MB" }
  }

  return { valid: true }
}

// ============================================================================
// Format Helpers
// ============================================================================

/**
 * Format price in Indian currency format
 */
export const formatIndianPrice = (price?: number): string => {
  if (price === undefined || price === null) return '₹0'
  return `₹${price.toLocaleString('en-IN')}`
}

/**
 * Get initials from brand name (first character uppercase)
 */
export const getBrandInitial = (name: string): string => {
  return name?.charAt(0).toUpperCase() || '?'
}

