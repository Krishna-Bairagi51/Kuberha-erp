/**
 * Normalize/inspect base64 document blobs
 */

/**
 * Raw base64 input from API - can be in various formats
 */
export type RawBase64Input =
  | string // Plain base64, Python byte string (b'...'), or data URL
  | { fileBase64?: string; filebase64?: string; base64?: string; data?: string } // Object with various keys
  | null
  | undefined

/**
 * Normalized base64 string - always a clean base64 string ready for use
 */
export type NormalizedBase64 = string

/**
 * Document metadata with normalized base64
 */
export interface DocumentWithBase64 {
  fileName?: string
  fileBase64: NormalizedBase64
  uploadedAt?: string
}

/**
 * Document metadata with File object (for admin forms)
 */
export interface DocumentWithFile {
  fileName?: string
  file: File
  uploadedAt?: string
}

/**
 * Normalize any base64 input format to a clean base64 string.
 * Handles:
 * - Python byte string format (b'...' or b"...")
 * - Data URL format (data:application/pdf;base64,...)
 * - Plain base64 strings
 * - Objects with base64 in various keys
 * - Empty/null/undefined values
 * - The string "0" (backend's way of saying "no file")
 */
export function normalizeBase64(input: RawBase64Input): NormalizedBase64 {
  if (!input) return ""

  let rawString: string

  // Handle object format
  if (typeof input === "object" && input !== null) {
    rawString =
      input.fileBase64 ||
      input.filebase64 ||
      input.base64 ||
      input.data ||
      ""
  } else {
    rawString = String(input)
  }

  // Handle empty or "0" (backend's no-file indicator)
  if (!rawString || rawString.trim() === "" || rawString.trim() === "0") {
    return ""
  }

  let cleaned = rawString.trim()

  // Handle Python byte string format: b'...' or b"..."
  if (cleaned.startsWith("b'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(2, -1) // Remove b' and trailing '
  } else if (cleaned.startsWith('b"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(2, -1) // Remove b" and trailing "
  }

  // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",")
    cleaned = parts[parts.length - 1] // Take the last part after the last comma
  }

  return cleaned.trim()
}

/**
 * Check if a base64 input has a valid value
 */
export function hasBase64Value(input: RawBase64Input): boolean {
  const normalized = normalizeBase64(input)
  return normalized !== "" && normalized !== "0"
}

/**
 * Detect MIME type from base64 string by examining the first few bytes.
 * Falls back to default if detection fails.
 */
export function detectMimeTypeFromBase64(
  base64: NormalizedBase64,
  defaultType: string = "application/pdf"
): string {
  if (!base64) return defaultType

  try {
    // Decode first 8 bytes to check file signature
    const binaryString = atob(base64.substring(0, Math.min(8, base64.length)))
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // PDF signature: %PDF (0x25 0x50 0x44 0x46)
    if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return "application/pdf"
    }

    // PNG signature: 89 50 4E 47
    if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return "image/png"
    }

    // JPEG signature: FF D8 FF
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg"
    }

    // GIF signature: GIF8
    if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return "image/gif"
    }
  } catch (e) {
    // If detection fails, use default
  }

  return defaultType
}

/**
 * Convert normalized base64 string to a File object.
 * Useful for admin forms that need File objects for react-hook-form.
 */
export function base64ToFile(
  base64: NormalizedBase64,
  fileName: string,
  mimeType?: string
): File | null {
  if (!base64 || base64 === "") return null

  try {
    // Use detected MIME type or provided default
    const detectedMime = mimeType || detectMimeTypeFromBase64(base64)

    // Decode base64 to binary
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Create File object
    const blob = new Blob([bytes], { type: detectedMime })
    return new File([blob], fileName, { type: detectedMime })
  } catch (error) {
    return null
  }
}

/**
 * Convert File object to normalized base64 string.
 * Used when user uploads a file in the form.
 */
export function fileToBase64(file: File): Promise<NormalizedBase64> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix to get just the base64 string
      const base64 = result.includes(",") ? result.split(",")[1] : result
      resolve(base64.trim())
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

/**
 * Create a data URL from normalized base64 for display/download.
 */
export function base64ToDataUrl(
  base64: NormalizedBase64,
  mimeType?: string
): string {
  if (!base64) return ""
  const detectedMime = mimeType || detectMimeTypeFromBase64(base64)
  return `data:${detectedMime};base64,${base64}`
}

/**
 * Check if a string is an S3/CloudFront URL
 */
export function isS3Link(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false
  const trimmed = value.trim()
  // Check for CloudFront URL pattern: https://d3pj3vhicpsp32.cloudfront.net/...
  return trimmed.startsWith("https://d3pj3vhicpsp32.cloudfront.net/") || 
         trimmed.startsWith("https://") && trimmed.includes("cloudfront.net/")
}

/**
 * Check if a value is either base64 or S3 link
 */
export function hasDocumentValue(input: RawBase64Input | string): boolean {
  if (!input) return false
  
  // Check if it's an S3 link
  if (typeof input === "string" && isS3Link(input)) {
    return true
  }
  
  // Check if it's base64
  return hasBase64Value(input)
}

/**
 * Extract file name from S3 URL
 */
export function getFileNameFromS3Url(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    return pathParts[pathParts.length - 1] || "document"
  } catch {
    return "document"
  }
}

/**
 * Detect MIME type from file extension in S3 URL
 */
export function detectMimeTypeFromS3Url(url: string, defaultType: string = "application/pdf"): string {
  try {
    const fileName = getFileNameFromS3Url(url).toLowerCase()
    if (fileName.endsWith(".pdf")) return "application/pdf"
    if (fileName.endsWith(".png")) return "image/png"
    if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg"
    if (fileName.endsWith(".gif")) return "image/gif"
    if (fileName.endsWith(".webp")) return "image/webp"
    return defaultType
  } catch {
    return defaultType
  }
}