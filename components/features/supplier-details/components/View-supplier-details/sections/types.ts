export interface BusinessProfileData {
  legalEntityName: string;
  brandName: string;
  businessType: string;
  regAddress1: string;
  regAddress2?: string;
  regPin: string;
  regCity: string;
  regState: string;
  prinAddress1?: string;
  prinAddress2?: string;
  prinPin: string;
  prinCity: string;
  prinState: string;
  primaryContactName: string;
  primaryDesignation: string;
  primaryMobile: string;
  primaryEmail: string;
  altMobile?: string;
  sameAsRegistered: boolean;
}

export interface DeclarationsData {
  accepted: boolean;
  signatoryName: string;
  designation: string;
  place: string;
  date: string;
  signatoryMobile: string;
  signatoryEmail: string;
}

export interface RegistrationBankData {
  cin?: string;
  gstin: string;
  pan: string;
  shopsRegNo?: string;

  incCertFile?: File | null;
  gstCertFile?: File | null;
  panCardFile?: File | null;
  shopsCertFile?: File | null;

  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType?: string;

  cancelledChequeFile?: File | null;
}

export interface DesignDetails {
  name: string;
  number: string;
  certFile?: File | null;
}

export interface BrandIPData {
  hasTrademark?: boolean | null;
  brandName?: string;
  trademarkNumber?: string;
  trademarkClass?: string;
  trademarkOwner?: string;
  trademarkCert?: File | null;

  hasDesigns: boolean | null;
  designs: DesignDetails[];

  hasThirdPartyContent: boolean | null;
  thirdPartyDescription?: string;
  nocFiles: (File | null)[];

  confirmation: boolean;
}

export interface SupplierFormData {
  businessProfile: BusinessProfileData;
  registrationBank: RegistrationBankData;
  brandIP: BrandIPData;
  declarations: DeclarationsData;
}