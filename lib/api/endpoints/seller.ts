// src/lib/api/endpoints/seller.ts

import { get, post, postForm } from "../client"
import { ensureAuthSession } from "../helpers/auth"
import { wrapAndThrow } from "../error"

import type {
  InventoryItemRequest as AddItemInventoryRequest,
  InventoryItemResponse as AddItemInventoryResponse,
  InventoryFormData,
  ProductListResponse,
  ProductDetailsResponse,
  InventoryItemResponse as UpdateItemInventoryResponse,
} from "@/components/features/inventory/types/inventory.types"
import type {
  OrderSummaryResponse,
  OrderHistoryResponse,
  OrderDetailResponse,
} from "@/components/features/orders/types/orders.types"
import type {
  UpdateProcessStatusRequest,
  UpdateProcessStatusWithImagesRequest,
  UpdateProcessStatusResponse,
} from "@/components/features/qc/types/qc.types"
import type { ShipmentListResponse as ShiprocketSaleOrderResponse } from "@/components/features/shipping/types/shipping.types"
import type { FormData, UpdateSellerInfoResponse } from "@/types/domains/supplier"
import { mapOrgType } from "@/lib/constants/org-types"
import { hasBase64Value, normalizeBase64, base64ToFile, detectMimeTypeFromBase64 } from "../helpers/base64"
import { SUPPLIER_DOCUMENT_CONFIG } from "@/lib/supplier-document-config"

/* =====================================================================================
   ADD ITEM INVENTORY
   Legacy behavior preserved:
   - If API error: return { status_code, message, record: data }
   - If network error: return same legacy failure object
   ===================================================================================== */
export async function addItemInventory(
  data: AddItemInventoryRequest
): Promise<AddItemInventoryResponse> {
  try {
    ensureAuthSession()

    const res = await post<AddItemInventoryResponse>(
      "/create_product_record",
      data,
      { cookieSession: true }
    )

    return res
  } catch (err: unknown) {

    // Network friendly message handling
    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return {
        status_code: 500,
        message: "Network error. Please check your internet connection.",
        record: data
      }
    }

    // If server returned an ApiError-like object from client, try to surface message
    if (err instanceof Error) {
      return {
        status_code: 500,
        message: err.message,
        record: data
      }
    }

    // fallback
    return {
      status_code: 500,
      message: "Failed to add product to inventory. Please try again.",
      record: data
    }
  }
}

/* =====================================================================================
   FETCH INVENTORY FORM DATA
   Legacy behavior preserved exactly (legacy threw Error on auth/response issues).
   We now throw ApiError via wrapAndThrow so callers that expect thrown errors get ApiError.
   ===================================================================================== */
export async function fetchInventoryFormData(): Promise<InventoryFormData> {
  try {
    ensureAuthSession()

    // Call all endpoints in parallel using get()
    const [
      categories,
      uom,
      tax,
      variantOptions,
      packageType,
      collections,
      finish,
      boxType,
      usageType,
      productMaterial,
    ] = await Promise.all([
      get<any>("/get_category_list", undefined, { cookieSession: true }),
      get<any>("/get_uom_uom_list", undefined, { cookieSession: true }),
      get<any>("/get_tax_list", undefined, { cookieSession: true }),
      get<any>("/get_variant_options", undefined, { cookieSession: true }),
      get<any>("/get_shopify_package_type", undefined, { cookieSession: true }),
      get<any>("/get_ecom_category_list", undefined, { cookieSession: true }),
      get<any>("/get_product_finishing", undefined, { cookieSession: true }),
      get<any>("/get_shiprocket_box_dimension", undefined, { cookieSession: true }),
      get<any>("/get_shopify_usage_type", undefined, { cookieSession: true }),
      get<any>("/get_product_materials", undefined, { cookieSession: true }),
    ])

    const extractRecords = (response: any): any[] => {
      if (Array.isArray(response?.record)) return response.record
      if (Array.isArray(response?.result)) return response.result
      if (Array.isArray(response?.data)) return response.data
      if (Array.isArray(response)) return response
      return []
    }

    // categories also serve as ecommerce categories
    const ecomCategories = extractRecords(categories)

    const boxTypeRecords = extractRecords(boxType)
    const boxTypesMapped = boxTypeRecords.map((item: any) => ({
      id: item.id,
      name: item.box_type || item.name,
      box_volumetric_weight: item.box_volumetric_weight ?? 0
    }))

    return {
      categories: extractRecords(categories),
      ecomCategories,
      uomList: extractRecords(uom),
      taxList: extractRecords(tax),
      variantOptions: extractRecords(variantOptions),
      packageTypes: extractRecords(packageType),
      collections: extractRecords(collections),
      finishes: extractRecords(finish),
      boxTypes: boxTypesMapped,
      usageTypes: extractRecords(usageType),
      productMaterials: extractRecords(productMaterial)
    }
  } catch (err: unknown) {
    // legacy threw an Error; rethrow as ApiError for new-style callers
    wrapAndThrow(err)
  }
}

/* =====================================================================================
   GET PRODUCT LIST
   ===================================================================================== */
export async function getProductList(): Promise<ProductListResponse> {
  try {
    ensureAuthSession()
    const res = await get<ProductListResponse>("/get_product_list", undefined, { cookieSession: true })
    return res
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}

/* =====================================================================================
   GET PRODUCT DETAILS
   ===================================================================================== */
export async function getProductDetails(productId: number): Promise<ProductDetailsResponse> {
  try {
    ensureAuthSession()
    const res = await get<ProductDetailsResponse>(
      "/get_product_record",
      { id: productId },
      { cookieSession: true }
    )
    return res
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}

/* =====================================================================================
   UPDATE ITEM INVENTORY
   Legacy preserved: returns either real result or
   { status_code, message, record: data } on failed HTTP
   ===================================================================================== */
export async function updateItemInventory(
  productId: number,
  data: AddItemInventoryRequest
): Promise<UpdateItemInventoryResponse> {
  try {
    ensureAuthSession()

    const res = await post<UpdateItemInventoryResponse>(
      `/update_product_record?id=${productId}`,
      data,
      { cookieSession: true }
    )

    return res
  } catch (err: unknown) {

    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return {
        status_code: 500,
        message: "Network error. Please check your internet connection.",
        record: data
      }
    }

    if (err instanceof Error) {
      return {
        status_code: 500,
        message: err.message,
        record: data
      }
    }

    return {
      status_code: 500,
      message: "Failed to update product. Please try again.",
      record: data
    }
  }
}

/* =====================================================================================
   ORDER SUMMARY
   ===================================================================================== */
export async function getOrderSummary(): Promise<OrderSummaryResponse> {
  try {
    ensureAuthSession()
    const res = await get<OrderSummaryResponse>("/get_order_summary", undefined, { cookieSession: true })
    return res
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}

/* =====================================================================================
   ORDER HISTORY
   ===================================================================================== */
export async function getOrderHistory(): Promise<OrderHistoryResponse> {
  try {
    ensureAuthSession()
    const res = await get<OrderHistoryResponse>("/get_seller_sale_order_list", undefined, { cookieSession: true })
    return res
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}

/* =====================================================================================
   ORDER DETAILS
   ===================================================================================== */
export async function getOrderDetails(orderId: number): Promise<OrderDetailResponse> {
  try {
    ensureAuthSession()
    const res = await get<OrderDetailResponse>(
      "/get_seller_sale_order_list",
      { order_id: orderId },
      { cookieSession: true }
    )
    return res
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}

/* =====================================================================================
   UPDATE PROCESS STATUS (no images)
   Legacy behavior: return fail object on non-ok
   ===================================================================================== */
export async function updateProcessStatus(
  data: UpdateProcessStatusRequest
): Promise<UpdateProcessStatusResponse> {
  try {
    ensureAuthSession()

    const res = await post<UpdateProcessStatusResponse>(
      "/update_process_status",
      data,
      {
        cookieSession: true,
        contentType: "text" // legacy used text/plain
      }
    )

    return res
  } catch (err: unknown) {

    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return { status_code: 500, message: "Network error. Please check your internet connection." }
    }
    if (err instanceof Error) {
      return { status_code: 500, message: err.message }
    }
    return { status_code: 500, message: "Failed to update process status. Please try again." }
  }
}

/* =====================================================================================
   UPDATE PROCESS STATUS (with images)
   Uses FormData to send files instead of base64
   ===================================================================================== */
export async function updateProcessStatusWithImages(
  data: UpdateProcessStatusWithImagesRequest
): Promise<UpdateProcessStatusResponse> {
  try {
    ensureAuthSession()

    // Create FormData for multipart/form-data request
    const formData = new FormData()
    formData.append('order_line_id', data.order_line_id.toString())
    formData.append('type', data.type)
    
    // Append each image file
    data.images.forEach((file) => {
      formData.append('images', file)
    })
    
    // Append note if provided
    if (data.note) {
      formData.append('note', data.note)
    }

    const res = await postForm<UpdateProcessStatusResponse>(
      "/update_process_status",
      formData,
      {
        cookieSession: true
      }
    )

    return res
  } catch (err: unknown) {

    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return { status_code: 500, message: "Network error. Please check your internet connection." }
    }
    if (err instanceof Error) {
      return { status_code: 500, message: err.message }
    }
    return { status_code: 500, message: "Failed to update process status with images. Please try again." }
  }
}

/* =====================================================================================
   SELLER SHIPROCKET SALE ORDER LIST
   ===================================================================================== */
export async function getSellerShiprocketSaleOrderData(): Promise<ShiprocketSaleOrderResponse> {
  try {
    ensureAuthSession()
    const res = await get<ShiprocketSaleOrderResponse>(
      "/get_seller_shiprocket_sale_order_data",
      undefined,
      { cookieSession: true }
    )
    return res
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}

/* =====================================================================================
   SELLER SHIPROCKET SALE ORDER BY ORDER ID
   ===================================================================================== */
export async function getSellerShiprocketSaleOrderDataByOrderId(
  orderId: number
): Promise<ShiprocketSaleOrderResponse> {
  try {
    ensureAuthSession()
    const res = await get<ShiprocketSaleOrderResponse>(
      "/get_shiprocket_sale_order_data",
      { order_id: orderId },
      { cookieSession: true }
    )
    return res
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}




/* =======================================================================================
    SUPPLIER ONBOARDING
   ======================================================================================= */

export interface GetSellerInfoResponse {
  status_code: number;
  message?: any;
  data?: any; // The seller info record
  record?: any; // Alternative response structure
}

/**
 * Get seller info by seller_id
 * Used to fetch draft data for populating the onboarding form
 */
export async function getSellerInfo(sellerId: string | number): Promise<GetSellerInfoResponse> {
  try {
    ensureAuthSession();

    const res = await get<GetSellerInfoResponse>("/get_seller_info", { id: String(sellerId) }, { cookieSession: true });

    return res;
  } catch (err) {
    wrapAndThrow(err);
  }
}

export interface UpdateSellerStateResponse {
  status_code: number;
  message?: string;
  record?: any;
}

/**
 * Update seller state
 * Used to change seller_state (e.g., from 'rejected' to 'draft' for retry)
 */
export async function updateSellerState(
  sellerId: string | number,
  sellerState: string
): Promise<UpdateSellerStateResponse> {
  try {
    ensureAuthSession();

    const res = await post<UpdateSellerStateResponse>(
      "/update_seller_state",
      {
        seller_id: String(sellerId),
        seller_state: sellerState,
      },
      { cookieSession: true }
    );

    return res;
  } catch (err) {
    wrapAndThrow(err);
  }
}

export async function updateSellerInfo(
  data: FormData,
  options?: { isSubmission?: boolean }
): Promise<UpdateSellerInfoResponse> {
  try {
    ensureAuthSession();

    // Create FormData for multipart/form-data request
    const formData = new FormData();

    // Helper function to check if a string value is non-empty
    const hasValue = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed !== '' && trimmed !== '0';
      }
      return true;
    };

    // Helper function to conditionally append field to FormData
    const appendIfHasValue = (key: string, value: any) => {
      if (hasValue(value)) {
        formData.append(key, String(value));
      }
    };

    // Helper to get File object from document base64
    const getDocumentFile = (apiKey: string): File | null => {
      const doc = data.documents?.[apiKey];
      if (!doc) return null;
      const rawValue = typeof doc === 'object' ? doc.fileBase64 : doc;
      if (hasBase64Value(rawValue)) {
        const normalized = normalizeBase64(rawValue);
        if (normalized) {
          const config = SUPPLIER_DOCUMENT_CONFIG[apiKey];
          const fileName = (typeof doc === 'object' && doc.fileName) 
            ? doc.fileName 
            : (config?.defaultFileName || `${apiKey}.pdf`);
          const mimeType = config?.defaultMimeType || 'application/pdf';
          return base64ToFile(normalized, fileName, mimeType);
        }
      }
      return null;
    };

    // basic fields - only include if they have values
    appendIfHasValue('legal_entity_name', data.legalEntityName);
    appendIfHasValue('brand_name', data.brandName);
    if (data.businessType) {
      const mappedType = mapOrgType(data.businessType);
      if (hasValue(mappedType)) {
        formData.append('organisation_type', mappedType);
      }
    }
    appendIfHasValue('registered_office_street', data.regAddress?.line1);
    appendIfHasValue('registered_office_street2', data.regAddress?.line2);
    appendIfHasValue('registered_office_pin', data.regAddress?.pinCode);
    appendIfHasValue('registered_office_city', data.regAddress?.city);
    if (data.regAddress?.state && data.regAddress.state !== '0' && hasValue(data.regAddress.state)) {
      formData.append('registered_office_state_id', data.regAddress.state);
    }

    // principal place - always include check field, but only include address fields if they have values
    formData.append('principal_place_of_business_check', data.sameAsRegistered ? "1" : "0");
    appendIfHasValue('principal_place_of_business_street', data.principalAddress?.line1);
    appendIfHasValue('principal_place_of_business_street2', data.principalAddress?.line2);
    appendIfHasValue('principal_place_of_business_zip', data.principalAddress?.pinCode);
    appendIfHasValue('principal_place_of_business_city', data.principalAddress?.city);
    if (data.principalAddress?.state && data.principalAddress.state !== '0' && hasValue(data.principalAddress.state)) {
      formData.append('principal_place_of_business_state_id', data.principalAddress.state);
    }

    // authorised person - only include if they have values
    appendIfHasValue('authorised_person_name', data.contactPersonName);
    appendIfHasValue('authorised_person_designation', data.designation);
    appendIfHasValue('authorised_person_mobile', data.mobileNumber);
    appendIfHasValue('authorised_person_alternate_mobile', data.alternateContact);
    appendIfHasValue('authorised_person_email', data.email);

    // registration & shop - only include if they have values
    appendIfHasValue('cin', data.cin);
    appendIfHasValue('gstin', data.gstin);
    appendIfHasValue('pan', data.pan);
    appendIfHasValue('shops_registration_number', data.shopsEstablishment);

    // bank - only include if they have values
    appendIfHasValue('account_holder_name', data.accountHolderName);
    appendIfHasValue('account_number', data.accountNumber);
    appendIfHasValue('ifsc_code', data.ifscCode);
    appendIfHasValue('bank_name', data.bankName);
    appendIfHasValue('branch_name', data.branchName);
    appendIfHasValue('account_type', data.accountType);

    // trademark and brand — always include check flag, but only include other fields if they have values
    formData.append('registered_brand_trademark_check', data.hasTrademark ? "1" : "0");
    appendIfHasValue('registered_brand_name', data.trademarkBrandName);
    appendIfHasValue('trademark_registered_number', data.trademarkNumber);
    appendIfHasValue('trademark_class', data.trademarkClass);
    appendIfHasValue('trademark_owner_name', data.trademarkOwner);

    // design registration flag - always include
    formData.append('design_registration_check', data.hasDesignRegistration ? "1" : "0");

    // third party content flag - always include
    formData.append('third_party_content_check', data.hasThirdPartyContent ? "1" : "0");
    appendIfHasValue('third_party_content_description', data.thirdPartyDescription);

    // Append document files instead of base64
    // Use API keys directly from configuration
    for (const [apiKey] of Object.entries(SUPPLIER_DOCUMENT_CONFIG)) {
      const file = getDocumentFile(apiKey);
      if (file) {
        formData.append(apiKey, file);
      }
    }

    // Map design_line preserving expected keys and placing files into design_certificate
    // Only process designs if hasDesignRegistration is true AND there are valid designs
    // When hasDesignRegistration is false, design_line should be empty array or not included
    if (data.hasDesignRegistration && Array.isArray(data.designs) && data.designs.length > 0) {
      const designLine = data.designs
        .filter((i) => {
          // Strictly filter: must have at least a non-empty name OR non-empty registration number
          const hasName = i.name && typeof i.name === 'string' && i.name.trim().length > 0;
          const hasRegNumber = i.registrationNumber && typeof i.registrationNumber === 'string' && i.registrationNumber.trim().length > 0;
          return hasName || hasRegNumber;
        })
        .map((i, index) => {
          const designItem: any = {
            design_name: (i.name && typeof i.name === 'string') ? i.name.trim() : "",
            design_registration_name: (i.registrationNumber && typeof i.registrationNumber === 'string') ? i.registrationNumber.trim() : "",
          };
          // Convert base64 to File and append separately
          // We'll append files with indexed keys like design_certificate_0, design_certificate_1, etc.
          if (hasBase64Value(i.fileBase64)) {
            const normalized = normalizeBase64(i.fileBase64);
            if (normalized) {
              const fileName = i.fileName || `design_certificate_${index + 1}.pdf`;
              const file = base64ToFile(normalized, fileName, detectMimeTypeFromBase64(normalized));
              if (file) {
                formData.append(`design_certificate_${index}`, file);
              }
            }
          }
          return designItem;
        });
      
      // Only include design_line if there are valid designs after filtering
      if (designLine.length > 0) {
        // Send design_line as JSON string since it's an array
        formData.append('design_line', JSON.stringify(designLine));
      } else {
        // If hasDesignRegistration is true but no valid designs, set empty array
        formData.append('design_line', JSON.stringify([]));
      }
    } else {
      // When hasDesignRegistration is false, explicitly set empty array to clear any existing data
      formData.append('design_line', JSON.stringify([]));
    }

    // NOC docs: map first two to noc_doc1 / noc_doc2 (backend reads these)
    // Convert base64 to File objects
    const noc0 = data.nocDocuments?.[0];
    const noc1 = data.nocDocuments?.[1];
    if (noc0 && hasBase64Value(noc0.fileBase64)) {
      const normalized = normalizeBase64(noc0.fileBase64);
      if (normalized) {
        const fileName = noc0.fileName || 'noc_document_1.pdf';
        const file = base64ToFile(normalized, fileName, detectMimeTypeFromBase64(normalized));
        if (file) {
          formData.append('noc_doc1', file);
        }
      }
    }
    if (noc1 && hasBase64Value(noc1.fileBase64)) {
      const normalized = normalizeBase64(noc1.fileBase64);
      if (normalized) {
        const fileName = noc1.fileName || 'noc_document_2.pdf';
        const file = base64ToFile(normalized, fileName, detectMimeTypeFromBase64(normalized));
        if (file) {
          formData.append('noc_doc2', file);
        }
      }
    }

    // Brand IP, declaration and signatory — flags always included, but other fields only if they have values
    formData.append('brand_ip_check', data.brandIPConfirmation ? "1" : "0");
    formData.append('declaration_check', data.declarationAgreed ? "1" : "0");

    appendIfHasValue('authorised_signatory_name', data.signatoryName);
    appendIfHasValue('designation', data.signatoryDesignation);
    appendIfHasValue('authorised_signatory_place', data.signatoryPlace);
    appendIfHasValue('authorised_signatory_date', data.signatoryDate);
    appendIfHasValue('authorised_signatory_mobile', data.signatoryMobile);
    appendIfHasValue('authorised_signatory_email', data.signatoryEmail);

    // Add seller_status when submitting (not when saving draft)
    if (options?.isSubmission) {
      formData.append('seller_status', "pending");
    }

    const res = await postForm<UpdateSellerInfoResponse>("/update_seller_info", formData, { cookieSession: true });

    return res;
  } catch (err) {
    wrapAndThrow(err);
  }
}

/* =====================================================================================
   UPLOAD SIGNED AGREEMENT
   Uploads the signed agreement PDF document
   ===================================================================================== */
export interface UploadSignedDocumentResponse {
  status_code: number;
  message?: string;
  data?: any;
}

export async function uploadSignedDocument(
  file: File
): Promise<UploadSignedDocumentResponse> {
  try {
    ensureAuthSession();

    const form = new FormData();
    form.append("file", file, file.name);

    const res = await postForm<UploadSignedDocumentResponse>(
      "/upload_signed_agreement",
      form,
      { cookieSession: true }
    );

    return res;
  } catch (err) {
    wrapAndThrow(err);
  }
}

