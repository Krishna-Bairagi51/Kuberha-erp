/**
 * Document configuration for supplier onboarding.
 * Maps API field names to default file names and metadata.
 * Uses API keys directly - no redundant key mapping.
 */

export interface DocumentConfig {
  /** API field name (used directly in forms and API) */
  apiKey: string
  /** Default file name when file is loaded from API */
  defaultFileName: string
  /** Default MIME type hint */
  defaultMimeType: string
  /** Whether this document is required */
  required: boolean
}

/**
 * Document field configuration mapping.
 * Uses API keys directly to avoid redundancy.
 */
export const SUPPLIER_DOCUMENT_CONFIG: Record<string, DocumentConfig> = {
  registration_certificate: {
    apiKey: "registration_certificate",
    defaultFileName: "certificate_of_incorporation.pdf",
    defaultMimeType: "application/pdf",
    required: true,
  },
  gst_certificate: {
    apiKey: "gst_certificate",
    defaultFileName: "gst_certificate.pdf",
    defaultMimeType: "application/pdf",
    required: true,
  },
  pan_image: {
    apiKey: "pan_image",
    defaultFileName: "pan_card.pdf",
    defaultMimeType: "image/jpeg",
    required: true,
  },
  shops_certificate: {
    apiKey: "shops_certificate",
    defaultFileName: "shops_certificate.pdf",
    defaultMimeType: "application/pdf",
    required: false,
  },
  cancelled_cheque_image: {
    apiKey: "cancelled_cheque_image",
    defaultFileName: "cancelled_cheque.pdf",
    defaultMimeType: "image/jpeg",
    required: true,
  },
  trademark_certificate: {
    apiKey: "trademark_certificate",
    defaultFileName: "trademark_certificate.pdf",
    defaultMimeType: "application/pdf",
    required: false,
  },
  firm_stamp: {
    apiKey: "firm_stamp",
    defaultFileName: "firm_stamp.pdf",
    defaultMimeType: "image/png",
    required: false,
  },
}

/**
 * Get document config by API key
 */
export function getDocumentConfig(apiKey: string): DocumentConfig | undefined {
  return SUPPLIER_DOCUMENT_CONFIG[apiKey]
}

/**
 * Get all document API keys
 */
export function getAllDocumentKeys(): string[] {
  return Object.keys(SUPPLIER_DOCUMENT_CONFIG)
}

/**
 * Get required document keys
 */
export function getRequiredDocumentKeys(): string[] {
  return Object.values(SUPPLIER_DOCUMENT_CONFIG)
    .filter((config) => config.required)
    .map((config) => config.apiKey)
}
