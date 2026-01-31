/**
 * Transform & infer utilities for seller onboarding
 */

import { SUPPLIER_DOCUMENT_CONFIG } from "../../supplier-document-config"
import type { FormData } from "@/types/domains/supplier"
import { hasBase64Value, normalizeBase64, isS3Link, hasDocumentValue } from "./base64"

export type SellerData = Record<string, any>

/**
 * Return step number (1..5) based on last non-empty field found in seller_data.
 * Order of keys is important: we list keys in the natural progression of the form.
 */
export function inferStepFromSellerData(sellerData: SellerData | null | undefined): number {
  if (!sellerData || typeof sellerData !== 'object') return 1

  // helper checks
  const isFilledString = (v: any) =>
    typeof v === 'string' && v.trim() !== '' && v.trim() !== '0'

  const isTruthyFlag = (v: any) =>
    v === true || v === '1' || v === 1 || v === 'true'

  const isArrayFilled = (v: any) => Array.isArray(v) && v.length > 0 && v.some((el) => {
    if (!el) return false
    // if element is object check for fileName or non-empty props
    if (typeof el === 'object') {
      return Object.values(el).some(val => isFilledString(val) || isTruthyFlag(val) || (Array.isArray(val) && val.length > 0))
    }
    if (typeof el === 'string') return isFilledString(el)
    return !!el
  })

  const docIsFilled = (key: string) => {
    const v = sellerData[key]
    if (!v) return false
    // backend may send base64 string or "0"
    if (isFilledString(v)) return true
    // maybe object with fileBase64
    if (typeof v === 'object') {
      if (isFilledString(v.fileBase64) || isFilledString(v.fileName)) return true
    }
    return false
  }

  // Order keys by step. Order matters: this array is scanned from first->last,
  // we keep index of last filled to decide step.
  const stepKeyMap: Array<{ step: number; keys: string[] }> = [
    // Step 1: Business Profile (basic info + addresses + contact)
    {
      step: 1,
      keys: [
        'legal_entity_name',
        'brand_name',
        'organisation_type',
        'registered_office_street',
        'registered_office_street2',
        'registered_office_pin',
        'registered_office_city',
        'registered_office_state_id',
        'principal_place_of_business_check', // "1"/"0"
        'principal_place_of_business_street',
        'principal_place_of_business_street2',
        'principal_place_of_business_zip',
        'principal_place_of_business_city',
        'principal_place_of_business_state_id',
        'authorised_person_name',
        'authorised_person_designation',
        'authorised_person_mobile',
        'authorised_person_alternate_mobile',
        'authorised_person_email',
      ],
    },

    // Step 2: Registrations & Bank
    {
      step: 2,
      keys: [
        'cin',
        'gst_certificate', // doc key
        'gst_certificate', // maybe doc or gst number: keep both checks below
        'gst_certificate',
        'gst_certificate',
        'gst_certificate',
        'gstin',
        'pan_image', // doc (also 'pan' or pan_card)
        'pan_card',
        'pan',
        'shops_registration_number',
        'registration_certificate',
        'shops_certificate',
        // bank details
        'account_holder_name',
        'account_number',
        'confirm_account_number',
        'ifsc_code',
        'bank_name',
        'branch_name',
        'account_type',
        'cancelled_cheque_image',
      ],
    },

    // Step 3: Brand & IP
    {
      step: 3,
      keys: [
        'registered_brand_trademark_check', // "1"/"0"
        'registered_brand_name',
        'trademark_registered_number',
        'trademark_class',
        'trademark_owner_name',
        'trademark_certificate',
        // design registration and arrays
        'design_registration_check', // "1"/"0"
        // designs might be an array -> multiple forms keys; backend may supply designs as designs: [{...}]
        'designs',
        'designs_list',
        'designs.*', // placeholder
        // third party content
        'third_party_content_check',
        'third_party_content_description',
        'noc_documents',
        'noc_documents_list',
        'trademark_cert',
      ],
    },

    // Step 4: Declarations (signatory, agreement)
    {
      step: 4,
      keys: [
        'brandIPConfirmation', // sometimes camelCase - defensive
        'brand_ip_confirmation',
        'declarationAgreed',
        'declaration_agreed',
        'signatoryName',
        'signatory_name',
        'signatoryDesignation',
        'signatory_designation',
        'signatoryPlace',
        'signatory_place',
        'signatoryDate',
        'signatory_date',
        'signatoryMobile',
        'signatory_mobile',
        'signatoryEmail',
        'signatory_email',
        'firm_stamp',
      ],
    },

    // Step 5: Review & Submit — consider this last if they reached review (no unique keys but treat submission-related keys)
    {
      step: 5,
      keys: [
        // marker fields for "completed review" or finalization: if you store submit timestamp or status
        'submitted_at',
        'submitted_timestamp',
        'submission_flag',
        'is_submitted',
      ],
    },
  ]

  // Flatten keys in the order above, but remember step boundaries
  let lastSeenStep = 1

  for (const block of stepKeyMap) {
    for (const key of block.keys) {
      // special wildcard handling for arrays / patterns
      if (key.endsWith('.*')) {
        const base = key.replace('.*', '')
        const arr = sellerData[base]
        if (isArrayFilled(arr)) lastSeenStep = block.step
        continue
      }

      // documents & base64 keys - check specially if doc is present as base64 or object
      if (
        key === 'registration_certificate' ||
        key === 'gst_certificate' ||
        key === 'pan_image' ||
        key === 'pan_card' ||
        key === 'shops_certificate' ||
        key === 'cancelled_cheque_image' ||
        key === 'trademark_certificate' ||
        key === 'firm_stamp' ||
        key === 'trademark_cert' ||
        key === 'bank_proof'
      ) {
        if (docIsFilled(key)) lastSeenStep = block.step
        continue
      }

      const val = sellerData[key]

      // flags
      if (
        key.endsWith('_check') ||
        key === 'principal_place_of_business_check' ||
        key === 'registered_brand_trademark_check' ||
        key === 'design_registration_check' ||
        key === 'third_party_content_check'
      ) {
        if (isTruthyFlag(val)) lastSeenStep = block.step
        continue
      }

      // arrays / objects
      if (Array.isArray(val)) {
        if (isArrayFilled(val)) lastSeenStep = block.step
        continue
      }

      // strings or numbers
      if (isFilledString(val) || (typeof val === 'number' && !Number.isNaN(val))) {
        lastSeenStep = block.step
      }
    }
  }

  // final clamp
  return Math.min(Math.max(1, lastSeenStep), 5)
}

/**
 * Transform API seller info response to FormData format for supplier onboarding form.
 * Maps snake_case API keys to camelCase FormData structure.
 * Handles base64 document strings, boolean flags, and nested address objects.
 */
export function transformSellerInfoToFormData(apiData: any): Partial<FormData> {
  const transformed: Partial<FormData> = {}

  // Helper to safely get string value (handle null, undefined, empty string)
  const getString = (value: any, defaultValue: string = ""): string => {
    if (value === null || value === undefined) return defaultValue
    return String(value)
  }

  // Basic fields - always set, even if empty
  transformed.legalEntityName = getString(apiData.legal_entity_name)
  transformed.brandName = getString(apiData.brand_name)
  transformed.businessType = getString(apiData.organisation_type)

  // Registered office address - always set, even if empty
  transformed.regAddress = {
    line1: getString(apiData.registered_office_street),
    line2: getString(apiData.registered_office_street2),
    city: getString(apiData.registered_office_city),
    state: getString(apiData.registered_office_state_name) || getString(apiData.registered_office_state_id),
    pinCode: getString(apiData.registered_office_pin),
    country: "India",
  }

  // Principal place of business address - always set, even if empty
  transformed.principalAddress = {
    line1: getString(apiData.principal_place_of_business_street),
    line2: getString(apiData.principal_place_of_business_street2),
    city: getString(apiData.principal_place_of_business_city),
    state: getString(apiData.principal_place_of_business_state_name) || getString(apiData.principal_place_of_business_state_id),
    pinCode: getString(apiData.principal_place_of_business_zip),
    country: "India",
  }

  // Same as registered flag - default to true if not explicitly false
  transformed.sameAsRegistered =
    apiData.principal_place_of_business_check === "1" ||
    apiData.principal_place_of_business_check === 1 ||
    apiData.principal_place_of_business_check === true ||
    (apiData.principal_place_of_business_check !== false && apiData.principal_place_of_business_check !== "0" && apiData.principal_place_of_business_check !== 0)

  // Contact person details - always set, even if empty
  transformed.contactPersonName = getString(apiData.authorised_person_name)
  transformed.designation = getString(apiData.authorised_person_designation)
  transformed.mobileNumber = getString(apiData.authorised_person_mobile)
  transformed.email = getString(apiData.authorised_person_email)
  transformed.alternateContact = getString(apiData.authorised_person_alternate_mobile)

  // Registration & shop details - always set, even if empty
  transformed.cin = getString(apiData.cin)
  transformed.gstin = getString(apiData.gstin)
  transformed.pan = getString(apiData.pan)
  transformed.shopsEstablishment = getString(apiData.shops_registration_number)

  // Bank details - always set, even if empty
  transformed.accountHolderName = getString(apiData.account_holder_name)
  transformed.accountNumber = getString(apiData.account_number)
  transformed.confirmAccountNumber = getString(apiData.account_number) // Use same value for confirmation
  transformed.ifscCode = getString(apiData.ifsc_code)
  transformed.bankName = getString(apiData.bank_name)
  transformed.branchName = getString(apiData.branch_name)
  transformed.accountType = getString(apiData.account_type)

  // Documents - use API keys directly, normalize base64 or store S3 links using unified utility
  const documents: Record<string, { fileName?: string; fileBase64?: string; fileUrl?: string; uploadedAt?: string }> = {}
  
  // Process all configured documents
  for (const [apiKey, config] of Object.entries(SUPPLIER_DOCUMENT_CONFIG)) {
    const rawValue = apiData[apiKey]
    if (hasDocumentValue(rawValue)) {
      const stringValue = typeof rawValue === "string" ? rawValue : String(rawValue)
      
      // Check if it's an S3 link
      if (isS3Link(stringValue)) {
        documents[apiKey] = {
          fileName: config.defaultFileName,
          fileUrl: stringValue.trim(),
          uploadedAt: new Date().toISOString(),
        }
      } else if (hasBase64Value(rawValue)) {
        // Handle base64
        const normalized = normalizeBase64(rawValue)
        if (normalized) {
          documents[apiKey] = {
            fileName: config.defaultFileName,
            fileBase64: normalized,
            uploadedAt: new Date().toISOString(),
          }
        }
      }
    }
  }
  
  if (Object.keys(documents).length > 0) {
    transformed.documents = documents
  }

  // Trademark information - always set boolean, strings even if empty
  transformed.hasTrademark =
    apiData.registered_brand_trademark_check === "1" ||
    apiData.registered_brand_trademark_check === 1 ||
    apiData.registered_brand_trademark_check === true
  transformed.trademarkBrandName = getString(apiData.registered_brand_name)
  transformed.trademarkNumber = getString(apiData.trademark_registered_number)
  transformed.trademarkClass = getString(apiData.trademark_class)
  transformed.trademarkOwner = getString(apiData.trademark_owner_name)

  // Design registration - always set boolean and array
  transformed.hasDesignRegistration =
    apiData.design_registration_check === "1" ||
    apiData.design_registration_check === 1 ||
    apiData.design_registration_check === true
  
  // Handle design_line array - always set, even if empty
  if (Array.isArray(apiData.design_line) && apiData.design_line.length > 0) {
    // Filter out invalid/empty designs to prevent hundreds of items issue
    // Only include designs that have at least a non-empty name OR non-empty registration number
    const validDesigns = apiData.design_line
      .filter((d: any) => {
        // Handle both object format and string format
        if (typeof d === 'string') {
          return d.trim().length > 0
        }
        const hasName = d?.design_name && typeof d.design_name === 'string' && d.design_name.trim().length > 0;
        const hasRegNumber = d?.design_registration_name && typeof d.design_registration_name === 'string' && d.design_registration_name.trim().length > 0;
        return hasName || hasRegNumber;
      })
      .map((d: any) => {
        // Handle string format
        if (typeof d === 'string') {
          return {
            name: d.trim(),
            registrationNumber: "",
            fileName: "",
            fileBase64: "",
          }
        }
        // Handle object format
        const designCert = d?.design_certificate
        let fileBase64 = ""
        let fileUrl = ""
        
        if (designCert) {
          const certString = typeof designCert === "string" ? designCert : String(designCert)
          if (isS3Link(certString)) {
            fileUrl = certString.trim()
          } else if (hasBase64Value(designCert)) {
            fileBase64 = normalizeBase64(designCert)
          }
        }
        
        return {
          name: (d?.design_name && typeof d.design_name === 'string') ? d.design_name.trim() : "",
          registrationNumber: (d?.design_registration_name && typeof d.design_registration_name === 'string') ? d.design_registration_name.trim() : "",
          fileName: d?.fileName || "",
          fileBase64: fileBase64,
          fileUrl: fileUrl,
        }
      });
    
    // Only set designs if there are valid ones after filtering
    transformed.designs = validDesigns.length > 0 ? validDesigns : [];
  } else {
    // If design_line is empty or not an array, set empty array
    transformed.designs = [];
  }

  // Third party content - always set boolean and string
  transformed.hasThirdPartyContent =
    apiData.third_party_content_check === "1" ||
    apiData.third_party_content_check === 1 ||
    apiData.third_party_content_check === true
  transformed.thirdPartyDescription = getString(apiData.third_party_content_description)

  // NOC documents
  const nocDocuments: Array<{ fileName?: string; fileBase64?: string; fileUrl?: string; uploadedAt: string }> = []
  
  // Handle noc_doc1
  if (hasDocumentValue(apiData.noc_doc1)) {
    const doc1Value = typeof apiData.noc_doc1 === "string" ? apiData.noc_doc1 : String(apiData.noc_doc1)
    if (isS3Link(doc1Value)) {
      nocDocuments.push({
        fileName: "noc_document_1.pdf",
        fileUrl: doc1Value.trim(),
        uploadedAt: new Date().toISOString(),
      })
    } else if (hasBase64Value(apiData.noc_doc1)) {
      const normalized = normalizeBase64(apiData.noc_doc1)
      if (normalized) {
        nocDocuments.push({
          fileName: "noc_document_1.pdf",
          fileBase64: normalized,
          uploadedAt: new Date().toISOString(),
        })
      }
    }
  }
  
  // Handle noc_doc2
  if (hasDocumentValue(apiData.noc_doc2)) {
    const doc2Value = typeof apiData.noc_doc2 === "string" ? apiData.noc_doc2 : String(apiData.noc_doc2)
    if (isS3Link(doc2Value)) {
      nocDocuments.push({
        fileName: "noc_document_2.pdf",
        fileUrl: doc2Value.trim(),
        uploadedAt: new Date().toISOString(),
      })
    } else if (hasBase64Value(apiData.noc_doc2)) {
      const normalized = normalizeBase64(apiData.noc_doc2)
      if (normalized) {
        nocDocuments.push({
          fileName: "noc_document_2.pdf",
          fileBase64: normalized,
          uploadedAt: new Date().toISOString(),
        })
      }
    }
  }
  
  if (nocDocuments.length > 0) {
    transformed.nocDocuments = nocDocuments
  }

  // Brand IP confirmation - always set boolean
  transformed.brandIPConfirmation =
    apiData.brand_ip_check === "1" ||
    apiData.brand_ip_check === 1 ||
    apiData.brand_ip_check === true

  // Declaration - always set boolean and strings
  transformed.declarationAgreed =
    apiData.declaration_check === "1" ||
    apiData.declaration_check === 1 ||
    apiData.declaration_check === true
  transformed.signatoryName = getString(apiData.authorised_signatory_name)
  transformed.signatoryDesignation = getString(apiData.authorised_signatory_designation || apiData.designation)
  transformed.signatoryPlace = getString(apiData.authorised_signatory_place)
  transformed.signatoryDate = getString(apiData.authorised_signatory_date)
  transformed.signatoryMobile = getString(apiData.authorised_signatory_mobile)
  transformed.signatoryEmail = getString(apiData.authorised_signatory_email)

  return transformed
}
