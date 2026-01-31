// Supplier Details Feature Types
// Admin-only feature for managing suppliers

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

// ============================================================================
// Supplier Form Data Types
// ============================================================================

export interface AddressData {
  line1: string
  line2: string
  city: string
  state: string
  pinCode: string
  country: string
}

export interface DesignRegistration {
  name: string
  registrationNumber: string
  fileName?: string
  fileBase64?: string
  fileUrl?: string
}

export interface NOCDocument {
  fileName?: string
  fileBase64?: string
  fileUrl?: string
  uploadedAt: string
}

export interface DocumentRecord {
  fileName?: string
  fileBase64?: string
  fileUrl?: string
  uploadedAt?: string
}

export interface SupplierFormData {
  // Step 1 - Business Profile
  legalEntityName: string
  brandName: string
  businessType: string
  businessTypeOther: string
  regAddress: AddressData
  sameAsRegistered: boolean
  principalAddress: AddressData
  contactPersonName: string
  designation: string
  mobileNumber: string
  email: string
  alternateContact: string

  // Step 2 - Registrations & Bank
  cin: string
  gstin: string
  pan: string
  shopsEstablishment: string
  accountHolderName: string
  accountNumber: string
  confirmAccountNumber: string
  ifscCode: string
  bankName: string
  branchName: string
  accountType: string

  // Step 3 - Brand & IP
  hasTrademark: boolean
  trademarkBrandName: string
  trademarkNumber: string
  trademarkClass: string
  trademarkOwner: string
  hasDesignRegistration: boolean
  designs: DesignRegistration[]
  hasThirdPartyContent: boolean
  thirdPartyDescription: string
  nocDocuments: NOCDocument[]
  brandIPConfirmation: boolean

  // Step 4 - Declarations
  declarationAgreed: boolean
  signatoryName: string
  signatoryDesignation: string
  signatoryPlace: string
  signatoryDate: string
  signatoryMobile: string
  signatoryEmail: string

  // Documents (generic map)
  documents: Record<string, DocumentRecord>
}

// ============================================================================
// Supplier List Types
// ============================================================================

export interface SupplierListItem {
  id: number
  name: string
  phone: string
  address: string
  email: string
  supplier_name: string
  designation: string
  organisation_type: string
  unsigned_agreement_url: string
  signed_agreement_url: string
  gst: string
  docs_status?: string
  created_status?: string
  status?: string
  seller_state?: string
}

export interface SupplierListResponse {
  status_code: number
  message: string
  count: number
  record: SupplierListItem[]
  total_record_count?: number
  record_total_count?: number
}

// ============================================================================
// Supplier Detail Types
// ============================================================================

export interface SupplierDetail {
  id: number
  legal_entity_name: string
  brand_name: string
  organisation_type: string

  registered_office_street: string
  registered_office_street2: string
  registered_office_pin: string
  registered_office_city: string
  registered_office_state_id: number
  registered_office_state_name: string

  principal_place_of_business_check: boolean
  principal_place_of_business_street: string
  principal_place_of_business_street2: string
  principal_place_of_business_zip: string
  principal_place_of_business_city: string
  principal_place_of_business_state_id: number
  principal_place_of_business_state_name: string

  authorised_person_name: string
  authorised_person_designation: string
  authorised_person_mobile: string
  authorised_person_alternate_mobile: string
  authorised_person_email: string

  cin: string
  shops_registration_number: string

  registration_certificate: boolean
  gst_certificate: boolean
  pan_image: boolean
  shops_certificate: boolean

  account_holder_name: string
  account_number: string
  ifsc_code: string
  bank_name: string
  branch_name: string
  account_type: string
  cancelled_cheque_image: boolean

  registered_brand_trademark_check: boolean
  registered_brand_name: string
  trademark_registered_number: string
  trademark_class: string
  trademark_owner_name: string
  trademark_certificate: boolean

  design_registration_check: boolean
  design_line: string[]

  third_party_content_check: boolean
  third_party_content_description: string
  noc_doc1: boolean
  noc_doc2: boolean

  brand_ip_check: boolean
  declaration_check: boolean

  authorised_signatory_name: string
  designation: string
  authorised_signatory_place: string
  authorised_signatory_date: string
  authorised_signatory_mobile: string
  authorised_signatory_email: string

  unsigned_agreement_url: string
  signed_agreement_url: string
  agreement_url: string
}

export interface SupplierDetailResponse {
  status_code: number
  message: string
  count: number
  record: SupplierDetail[]
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface UpdateSupplierResponse {
  status_code: number
  message: string
  record?: any
}

export interface UpdateSupplierStateResponse {
  status_code: number
  message?: string
  record?: any
}

export interface UploadSignedDocumentResponse {
  status_code: number
  message?: string
  data?: any
}

// ============================================================================
// State Types
// ============================================================================

export interface StateRecord {
  id: number
  name: string
}

export interface StatesResponse {
  status_code: number
  message: string
  count: number
  record: StateRecord[]
  errors?: string[]
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface SupplierDetailsPageProps {
  onSliderStateChange?: (isOpen: boolean) => void
}

export interface ViewSupplierFormProps {
  supplierId: string
  onBack: () => void
}

export type SupplierStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

// ============================================================================
// Hook Types
// ============================================================================

export interface UseSupplierOptions {
  autoFetch?: boolean
}

export interface UseSupplierReturn {
  // List data
  suppliers: SupplierListItem[]
  isLoading: boolean
  error: string | null
  
  // Single supplier data
  selectedSupplier: SupplierDetail | null
  isLoadingDetails: boolean
  
  // Actions
  fetchSuppliers: () => Promise<void>
  fetchSupplierById: (supplierId: string) => Promise<SupplierDetail | null>
  updateSupplierState: (supplierId: string, state: string) => Promise<boolean>
  refresh: () => Promise<void>
  
  // Search & Filter
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  filteredSuppliers: SupplierListItem[]
  
  // Pagination
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  setItemsPerPage: (count: number) => void
  totalPages: number
  paginatedSuppliers: SupplierListItem[]
  
  // Utilities
  getStatusInfo: (status: string) => { label: string; color: string; bgColor: string; borderColor: string }
  formatOrganisationType: (type: string) => string
}

