// src/types.ts
export interface FormData {
  // Step 1 - Business Profile
  legalEntityName: string;
  brandName: string;
  businessType: string;
  businessTypeOther: string;
  regAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
  };
  sameAsRegistered: boolean;
  principalAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
  };
  contactPersonName: string;
  designation: string;
  mobileNumber: string;
  email: string;
  alternateContact: string;

  // Step 2 - Registrations & Bank
  cin: string;
  gstin: string;
  pan: string;
  shopsEstablishment: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: string;

  // Step 3 - Brand & IP
  hasTrademark: boolean;
  trademarkBrandName: string;
  trademarkNumber: string;
  trademarkClass: string;
  trademarkOwner: string;
  hasDesignRegistration: boolean;
  designs: Array<{
    name: string;
    registrationNumber: string;
    fileName?: string;
    fileBase64?: string;
    fileUrl?: string;
  }>;
  hasThirdPartyContent: boolean;
  thirdPartyDescription: string;
  nocDocuments: Array<{
    fileName?: string;
    fileBase64?: string;
    fileUrl?: string;
    uploadedAt: string;
  }>;
  brandIPConfirmation: boolean;

  // Step 4 - Declarations
  declarationAgreed: boolean;
  signatoryName: string;
  signatoryDesignation: string;
  signatoryPlace: string;
  signatoryDate: string;
  signatoryMobile: string;
  signatoryEmail: string;

  // Documents (generic map) — storing fileName + base64/url + uploadedAt
  documents: Record<string, { fileName?: string; fileBase64?: string; fileUrl?: string; uploadedAt?: string }>;
}

export interface UpdateSellerInfoResponse {
  status_code: number;
  message: string;
  record?: any;
}

export type AuthStatus = 'login' | 'onboarding' | 'pending';

export interface Step1Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onSaveDraft: (currentFormValues?: Partial<FormData>) => void;
}

export interface Step2Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: (currentFormValues?: Partial<FormData>) => void;
}

export interface Step3Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: (currentFormValues?: Partial<FormData>) => void;
}

export interface FormPanelProps {
  currentStep: number;
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  goToStep: (step: number) => void;
}

export interface FileUploaderProps {
 label?: string;
 subLabel?: string;
 fileName?: string;
 fileBase64?: string;
 required?: boolean;
 onUpload?: (base64: string, fileName: string) => void;
 onDelete?: () => void;
 showAddMore?: boolean;
 onAddMore?: () => void;
 accept?: 'any' | 'pdf' | 'image' | 'pdf-or-image'; 
}

export interface Step4Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: (currentFormValues?: Partial<FormData>) => void;
}

export interface Step5Props {
  formData: FormData;
  onBack: () => void;
  onEdit: (step: number) => void;
  onSubmit: () => void;
}

export interface LoginProps {
  onLoginSuccess: (status: 'new' | 'incomplete' | 'pending', savedData?: any) => void;
}

export interface Step {
  id: number;
  label: string;
}

export interface TopPanelProps {
  steps: Step[];
  currentStep: number;
  onLogout?: () => void;
}

export interface PendingApprovalProps {
  onLogout: () => void;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// GET SELLER INFO LIST API
export interface SellerInfoRecord {
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

export interface SellerInfoResponse {
  status_code: number
  message: string
  count: number
  record: SellerInfoRecord[]
}

// GET SUPPLIER BY SELLER ID API
export interface SupplierData {
  id: number;
  legal_entity_name: string;
  brand_name: string;
  organisation_type: string;

  registered_office_street: string;
  registered_office_street2: string;
  registered_office_pin: string;
  registered_office_city: string;
  registered_office_state_id: number;
  registered_office_state_name: string;

  principal_place_of_business_check: boolean;
  principal_place_of_business_street: string;
  principal_place_of_business_street2: string;
  principal_place_of_business_zip: string;
  principal_place_of_business_city: string;
  principal_place_of_business_state_id: number;
  principal_place_of_business_state_name: string;

  authorised_person_name: string;
  authorised_person_designation: string;
  authorised_person_mobile: string;
  authorised_person_alternate_mobile: string;
  authorised_person_email: string;

  cin: string;
  shops_registration_number: string;

  registration_certificate: boolean;
  gst_certificate: boolean;
  pan_image: boolean;
  shops_certificate: boolean;

  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  account_type: string;
  cancelled_cheque_image: boolean;

  registered_brand_trademark_check: boolean;
  registered_brand_name: string;
  trademark_registered_number: string;
  trademark_class: string;
  trademark_owner_name: string;
  trademark_certificate: boolean;

  design_registration_check: boolean;
  design_line: string[];

  third_party_content_check: boolean;
  third_party_content_description: string;
  noc_doc1: boolean;
  noc_doc2: boolean;

  brand_ip_check: boolean;
  declaration_check: boolean;

  authorised_signatory_name: string;
  designation: string;
  authorised_signatory_place: string;
  authorised_signatory_date: string;
  authorised_signatory_mobile: string;
  authorised_signatory_email: string;

  unsigned_agreement_url: string;
  signed_agreement_url: string;
  agreement_url: string;
}

export interface SupplierResponse {
  status_code: number
  message: string
  count: number
  record: SupplierData[]
}
