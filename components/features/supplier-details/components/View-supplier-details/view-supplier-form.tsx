"use client";

import PageHeader from "@/components/shared/layout/page-header";
import React, { useEffect, useRef, useState } from "react";
import {
  SupplierOverview,
  BrandIP,
  BusinessProfile,
  Declarations,
  RegistrationBank,
} from "./sections";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { SupplierSchema, sellerSchema } from "./sections/schema";
import type { SupplierFormData } from "./sections";
import { toast } from 'sonner';
import { Check, CircleCheck, X } from "lucide-react";
import { transformSellerInfoToFormData } from "@/lib/api/helpers/onboarding";
import { base64ToFile, detectMimeTypeFromBase64, normalizeBase64, isS3Link, getFileNameFromS3Url, detectMimeTypeFromS3Url } from "@/lib/api/helpers/base64";
import { SUPPLIER_DOCUMENT_CONFIG } from "@/lib/supplier-document-config";
import { useSupplierDetailQuery, useUpdateSupplierStateMutation } from "../../hooks/use-supplier-query";

const initialSellerFormData: SupplierFormData = {
  businessProfile: {
    legalEntityName: "",
    brandName: "",
    businessType: "llp", // enum required later
    regAddress1: "",
    regAddress2: "",
    regPin: "",
    regCity: "",
    regState: "",
    prinAddress1: "",
    prinAddress2: "",
    prinPin: "",
    prinCity: "",
    prinState: "",
    primaryContactName: "",
    primaryDesignation: "",
    primaryMobile: "",
    primaryEmail: "",
    altMobile: undefined, // optional should be undefined, not ""
    sameAsRegistered: false,
  },
  registrationBank: {
    cin: undefined,
    gstin: "", // must match /^[A-Z0-9]{15}$/ when filled
    pan: "", // must match PAN regex when filled
    shopsRegNo: undefined,
    incCertFile: null,
    gstCertFile: null,
    panCardFile: null,
    shopsCertFile: null,
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    accountType: "saving", // must be "saving" | "current"
    cancelledChequeFile: null,
  },
  brandIP: {
    hasTrademark: null,
    brandName: undefined,
    trademarkNumber: undefined,
    trademarkClass: undefined,
    trademarkOwner: undefined,
    trademarkCert: null,
    hasDesigns: null,
    designs: [],
    hasThirdPartyContent: null,
    thirdPartyDescription: undefined,
    nocFiles: [],
    confirmation: false,
  },
  declarations: {
    accepted: false,
    signatoryName: "",
    designation: "",
    place: "",
    date: "",
    signatoryMobile: "",
    signatoryEmail: "",
  },
};

const FORM_TABS = [
  { index: "business-profile", label: "Business Profile" },
  { index: "registration-bank", label: "Registration & Bank" },
  { index: "brand-ip", label: "Brand & IP" },
  { index: "declarations", label: "Declarations" },
] as const;

export const ViewSupplierForm = ({
  supplierId,
  onClose,
}: {
  supplierId: string;
  onClose: () => void;
}) => {
  // TanStack Query hooks
  const { data: supplierDetailData, isLoading } = useSupplierDetailQuery(supplierId)
  const updateStateMutation = useUpdateSupplierStateMutation()

  // Local UI state
  const [activeTab, setActiveTab] =
    useState<(typeof FORM_TABS)[number]["index"]>("business-profile");
  const formTopRef = useRef<HTMLFormElement>(null);
  const [supplierState, setSupplierState] = useState<"approved" | "rejected" | "pending" | "draft" | "">("");
  const [vendorId, setVendorId] = useState<number | string | null>(null);
  const [supplierData, setSupplierData] = useState<{
    name: string;
    companyType: string;
    phone: string;
    city: string;
    state: string;
    agreementStatus: "initial" | "unsigned" | "signed";
    agreement_url?: string;
  }>({
    name: "",
    companyType: "",
    phone: "",
    city: "",
    state: "",
    agreementStatus: "initial",
    agreement_url: undefined,
  });

  const methods = useForm<SupplierSchema>({
    resolver: zodResolver(sellerSchema),
    defaultValues: initialSellerFormData as unknown as SupplierSchema,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!supplierDetailData?.supplier) return;

    const rec = supplierDetailData.supplier;

        // Extract vendor_id from the record (id field)
        const extractedVendorId = rec.id || supplierId;
        if (extractedVendorId) {
          setVendorId(extractedVendorId);
        }

        // Use the shared transformation function to get base FormData
        const formData = transformSellerInfoToFormData(rec);

        // Helper functions for admin-specific transformations
        const toStr = (v: unknown) => (v == null ? "" : String(v));
        const toMaybeStr = (v: unknown) => (v == null ? undefined : String(v));
        const toBool = (v: unknown) => {
          if (v === "1" || v === 1 || v === true) return true;
          if (v === "0" || v === 0 || v === false) return false;
          return null;
        };

        // businessType mapping - map API values to form values
        const mapBusinessType = (orgType: string): string => {
          const normalized = (orgType || "").toString().toLowerCase().trim();
          if (normalized.includes("private") || normalized.includes("pvt")) return "private";
          if (normalized.includes("llp")) return "llp";
          if (normalized.includes("partnership")) return "partnership";
          if (normalized.includes("sole") || normalized.includes("proprietorship")) return "sole";
          if (normalized.includes("other") || normalized === "") return "other";
          return normalized || "other";
        };

        const normalizedBusinessType = mapBusinessType(
          rec.organisation_type ||
          (rec as any).organisation_type_label ||
          formData.businessType ||
          ""
        );

        // Convert FormData to SupplierFormData structure
        // Extract base64 or S3 URL from documents and convert to Files using unified utilities
        const getDocValue = (apiKey: string): { base64: string | null; url: string | null } => {
          const doc = formData.documents?.[apiKey];
          return {
            base64: doc?.fileBase64 || null,
            url: doc?.fileUrl || null,
          };
        };

        // Map design_line array - convert to File objects or store S3 URLs
        const designLine = (formData.designs || []).map((d, index) => {
          let certFile: File | null = null;
          if (d.fileBase64) {
            certFile = base64ToFile(
              normalizeBase64(d.fileBase64),
              `design_certificate_${index + 1}.pdf`,
              detectMimeTypeFromBase64(normalizeBase64(d.fileBase64))
            );
          } else if (d.fileUrl && isS3Link(d.fileUrl)) {
            // For S3 links, create a File-like object with the URL stored in a custom property
            // We'll handle this in the preview modal
            const fileName = getFileNameFromS3Url(d.fileUrl) || `design_certificate_${index + 1}.pdf`;
            const mimeType = detectMimeTypeFromS3Url(d.fileUrl);
            // Create a minimal File object - the DocumentPreviewModal will handle the URL
            const blob = new Blob([], { type: mimeType });
            certFile = new File([blob], fileName, { type: mimeType });
            // Store the URL in a custom property
            (certFile as any).__s3Url = d.fileUrl;
          }
          
          return {
            name: d.name || "",
            number: d.registrationNumber || "",
            certFile: certFile,
          };
        });

        // Map NOC files - convert base64 strings to File objects or handle S3 URLs
        const nocFiles: (File | null)[] = [];
        if (formData.nocDocuments && formData.nocDocuments.length > 0) {
          formData.nocDocuments.forEach((doc, index) => {
            if (doc.fileBase64) {
              const normalized = normalizeBase64(doc.fileBase64);
              nocFiles.push(
                base64ToFile(
                  normalized,
                  `noc_document_${index + 1}.pdf`,
                  detectMimeTypeFromBase64(normalized)
                )
              );
            } else if (doc.fileUrl && isS3Link(doc.fileUrl)) {
              // For S3 links, create a File-like object with the URL stored in a custom property
              const fileName = getFileNameFromS3Url(doc.fileUrl) || `noc_document_${index + 1}.pdf`;
              const mimeType = detectMimeTypeFromS3Url(doc.fileUrl);
              const blob = new Blob([], { type: mimeType });
              const file = new File([blob], fileName, { type: mimeType });
              (file as any).__s3Url = doc.fileUrl;
              nocFiles.push(file);
            } else {
              nocFiles.push(null);
            }
          });
        }

        // Build normalized object compatible with SupplierSchema
        const normalized = {
          businessProfile: {
            legalEntityName: formData.legalEntityName || "",
            brandName: formData.brandName || "",
            businessType: normalizedBusinessType || "",
            regAddress1: formData.regAddress?.line1 || "",
            regAddress2: formData.regAddress?.line2 || "",
            regPin: formData.regAddress?.pinCode || "",
            regCity: formData.regAddress?.city || "",
            regState: formData.regAddress?.state || "",
            prinAddress1: formData.sameAsRegistered 
              ? (formData.regAddress?.line1 || "")
              : (formData.principalAddress?.line1 || ""),
            prinAddress2: formData.sameAsRegistered
              ? (formData.regAddress?.line2 || "")
              : (formData.principalAddress?.line2 || ""),
            prinPin: formData.sameAsRegistered
              ? (formData.regAddress?.pinCode || "")
              : (formData.principalAddress?.pinCode || ""),
            prinCity: formData.sameAsRegistered
              ? (formData.regAddress?.city || "")
              : (formData.principalAddress?.city || ""),
            prinState: formData.sameAsRegistered
              ? (formData.regAddress?.state || "")
              : (formData.principalAddress?.state || ""),
            primaryContactName: formData.contactPersonName || "",
            primaryDesignation: formData.designation || "",
            primaryMobile: formData.mobileNumber || "",
            primaryEmail: formData.email || "",
            altMobile: formData.alternateContact ? String(formData.alternateContact) : undefined,
            sameAsRegistered: formData.sameAsRegistered ?? false,
          },

          registrationBank: {
            cin: formData.cin || undefined,
            gstin: formData.gstin || "",
            pan: formData.pan || "",
            shopsRegNo: formData.shopsEstablishment || undefined,
            incCertFile: (() => {
              const doc = getDocValue("registration_certificate");
              if (doc.url && isS3Link(doc.url)) {
                const fileName = getFileNameFromS3Url(doc.url) || SUPPLIER_DOCUMENT_CONFIG.registration_certificate.defaultFileName;
                const mimeType = detectMimeTypeFromS3Url(doc.url, SUPPLIER_DOCUMENT_CONFIG.registration_certificate.defaultMimeType);
                const blob = new Blob([], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                (file as any).__s3Url = doc.url;
                return file;
              } else if (doc.base64) {
                return base64ToFile(
                  normalizeBase64(doc.base64),
                  SUPPLIER_DOCUMENT_CONFIG.registration_certificate.defaultFileName,
                  detectMimeTypeFromBase64(normalizeBase64(doc.base64), SUPPLIER_DOCUMENT_CONFIG.registration_certificate.defaultMimeType)
                );
              }
              return null;
            })(),
            gstCertFile: (() => {
              const doc = getDocValue("gst_certificate");
              if (doc.url && isS3Link(doc.url)) {
                const fileName = getFileNameFromS3Url(doc.url) || SUPPLIER_DOCUMENT_CONFIG.gst_certificate.defaultFileName;
                const mimeType = detectMimeTypeFromS3Url(doc.url, SUPPLIER_DOCUMENT_CONFIG.gst_certificate.defaultMimeType);
                const blob = new Blob([], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                (file as any).__s3Url = doc.url;
                return file;
              } else if (doc.base64) {
                return base64ToFile(
                  normalizeBase64(doc.base64),
                  SUPPLIER_DOCUMENT_CONFIG.gst_certificate.defaultFileName,
                  detectMimeTypeFromBase64(normalizeBase64(doc.base64), SUPPLIER_DOCUMENT_CONFIG.gst_certificate.defaultMimeType)
                );
              }
              return null;
            })(),
            panCardFile: (() => {
              const doc = getDocValue("pan_image");
              if (doc.url && isS3Link(doc.url)) {
                const fileName = getFileNameFromS3Url(doc.url) || SUPPLIER_DOCUMENT_CONFIG.pan_image.defaultFileName;
                const mimeType = detectMimeTypeFromS3Url(doc.url, SUPPLIER_DOCUMENT_CONFIG.pan_image.defaultMimeType);
                const blob = new Blob([], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                (file as any).__s3Url = doc.url;
                return file;
              } else if (doc.base64) {
                return base64ToFile(
                  normalizeBase64(doc.base64),
                  SUPPLIER_DOCUMENT_CONFIG.pan_image.defaultFileName,
                  detectMimeTypeFromBase64(normalizeBase64(doc.base64), SUPPLIER_DOCUMENT_CONFIG.pan_image.defaultMimeType)
                );
              }
              return null;
            })(),
            shopsCertFile: (() => {
              const doc = getDocValue("shops_certificate");
              if (doc.url && isS3Link(doc.url)) {
                const fileName = getFileNameFromS3Url(doc.url) || SUPPLIER_DOCUMENT_CONFIG.shops_certificate.defaultFileName;
                const mimeType = detectMimeTypeFromS3Url(doc.url, SUPPLIER_DOCUMENT_CONFIG.shops_certificate.defaultMimeType);
                const blob = new Blob([], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                (file as any).__s3Url = doc.url;
                return file;
              } else if (doc.base64) {
                return base64ToFile(
                  normalizeBase64(doc.base64),
                  SUPPLIER_DOCUMENT_CONFIG.shops_certificate.defaultFileName,
                  detectMimeTypeFromBase64(normalizeBase64(doc.base64), SUPPLIER_DOCUMENT_CONFIG.shops_certificate.defaultMimeType)
                );
              }
              return null;
            })(),
            accountHolderName: formData.accountHolderName || "",
            accountNumber: formData.accountNumber || "",
            confirmAccountNumber: formData.confirmAccountNumber || formData.accountNumber || "",
            ifscCode: formData.ifscCode || "",
            bankName: formData.bankName || "",
            branchName: formData.branchName || "",
            accountType: (formData.accountType || "saving").toLowerCase() === "current" ? "current" : "saving",
            cancelledChequeFile: (() => {
              const doc = getDocValue("cancelled_cheque_image");
              if (doc.url && isS3Link(doc.url)) {
                const fileName = getFileNameFromS3Url(doc.url) || SUPPLIER_DOCUMENT_CONFIG.cancelled_cheque_image.defaultFileName;
                const mimeType = detectMimeTypeFromS3Url(doc.url, SUPPLIER_DOCUMENT_CONFIG.cancelled_cheque_image.defaultMimeType);
                const blob = new Blob([], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                (file as any).__s3Url = doc.url;
                return file;
              } else if (doc.base64) {
                return base64ToFile(
                  normalizeBase64(doc.base64),
                  SUPPLIER_DOCUMENT_CONFIG.cancelled_cheque_image.defaultFileName,
                  detectMimeTypeFromBase64(normalizeBase64(doc.base64), SUPPLIER_DOCUMENT_CONFIG.cancelled_cheque_image.defaultMimeType)
                );
              }
              return null;
            })(),
          },

          brandIP: {
            hasTrademark: formData.hasTrademark !== undefined ? formData.hasTrademark : null,
            brandName: formData.trademarkBrandName || undefined,
            trademarkNumber: formData.trademarkNumber || undefined,
            trademarkClass: formData.trademarkClass || undefined,
            trademarkOwner: formData.trademarkOwner || undefined,
            trademarkCert: (() => {
              const doc = getDocValue("trademark_certificate");
              if (doc.url && isS3Link(doc.url)) {
                const fileName = getFileNameFromS3Url(doc.url) || SUPPLIER_DOCUMENT_CONFIG.trademark_certificate.defaultFileName;
                const mimeType = detectMimeTypeFromS3Url(doc.url, SUPPLIER_DOCUMENT_CONFIG.trademark_certificate.defaultMimeType);
                const blob = new Blob([], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });
                (file as any).__s3Url = doc.url;
                return file;
              } else if (doc.base64) {
                return base64ToFile(
                  normalizeBase64(doc.base64),
                  SUPPLIER_DOCUMENT_CONFIG.trademark_certificate.defaultFileName,
                  detectMimeTypeFromBase64(normalizeBase64(doc.base64), SUPPLIER_DOCUMENT_CONFIG.trademark_certificate.defaultMimeType)
                );
              }
              return null;
            })(),
            hasDesigns: formData.hasDesignRegistration !== undefined ? formData.hasDesignRegistration : null,
            designs: designLine,
            hasThirdPartyContent: formData.hasThirdPartyContent !== undefined ? formData.hasThirdPartyContent : null,
            thirdPartyDescription: formData.thirdPartyDescription || undefined,
            nocFiles: nocFiles,
            confirmation: formData.brandIPConfirmation ?? false,
          },

          declarations: {
            accepted: formData.declarationAgreed ?? false,
            signatoryName: formData.signatoryName || "",
            designation: formData.signatoryDesignation || "",
            place: formData.signatoryPlace || "",
            date: formData.signatoryDate || "",
            signatoryMobile: formData.signatoryMobile || "",
            signatoryEmail: formData.signatoryEmail || "",
          },
        } as SupplierSchema;

        // Update supplier status - extract seller_state and normalize to expected values
        const rawSellerState = ((rec as any).seller_state || "").toString().toLowerCase().trim();
        const normalizedSellerState: "approved" | "rejected" | "pending" | "draft" | "" = 
          rawSellerState === "approved" ? "approved" :
          rawSellerState === "rejected" ? "rejected" :
          rawSellerState === "pending" ? "pending" :
          rawSellerState === "draft" ? "draft" : "";
        setSupplierState(normalizedSellerState);

        // Update supplier data for SupplierOverview
        setSupplierData({
          name:
            formData.brandName ||
            formData.legalEntityName ||
            "",
          companyType: normalizedBusinessType || "",
          phone: formData.mobileNumber || "",
          city:
            formData.regAddress?.city ||
            formData.principalAddress?.city ||
            "",
          state:
            formData.regAddress?.state ||
            formData.principalAddress?.state ||
            "",
          agreementStatus:
            (rec as any).signed_agreement_url
              ? "signed"
              : (rec as any).unsigned_agreement_url
              ? "unsigned"
              : "initial",
          agreement_url: (rec as any).agreement_url || undefined,
        });


        // Merge with initial defaults to ensure required fields are present for zod
        const finalData = {
          ...initialSellerFormData,
          ...normalized,
        };
        
        
        // Reset the form with the merged data
        methods.reset(finalData, { keepDefaultValues: false });
        
        // Immediately set values using setValue to ensure they're populated
        // This is more reliable than relying solely on reset
        if (normalized.businessProfile) {
          Object.entries(normalized.businessProfile).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              const fieldPath = `businessProfile.${key}` as any;
              methods.setValue(fieldPath, value, { shouldValidate: false, shouldDirty: false });
            }
          });
        }
        
        if (normalized.registrationBank) {
          Object.entries(normalized.registrationBank).forEach(([key, value]) => {
            // Handle File objects separately - they can be null or File instances
            if (key.endsWith('File') || key.endsWith('Cert')) {
              const fieldPath = `registrationBank.${key}` as any;
              methods.setValue(fieldPath, value, { shouldValidate: false, shouldDirty: false });
            } else if (value !== undefined && value !== null && value !== "") {
              const fieldPath = `registrationBank.${key}` as any;
              methods.setValue(fieldPath, value, { shouldValidate: false, shouldDirty: false });
            }
          });
        }
        
        if (normalized.brandIP) {
          Object.entries(normalized.brandIP).forEach(([key, value]) => {
            // Handle File objects and arrays separately
            if (key === 'trademarkCert' || key === 'nocFiles' || key === 'designs') {
              const fieldPath = `brandIP.${key}` as any;
              methods.setValue(fieldPath, value, { shouldValidate: false, shouldDirty: false });
            } else if (value !== undefined && value !== null) {
              const fieldPath = `brandIP.${key}` as any;
              methods.setValue(fieldPath, value, { shouldValidate: false, shouldDirty: false });
            }
          });
        }
        
        if (normalized.declarations) {
          Object.entries(normalized.declarations).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              const fieldPath = `declarations.${key}` as any;
              methods.setValue(fieldPath, value, { shouldValidate: false, shouldDirty: false });
            }
          });
        }
        
        // Verify the values were set
        setTimeout(() => {
          const currentValues = methods.getValues();
        }, 50);
  }, [supplierDetailData, methods]);

  // Check if seller_state is "pending" - buttons only show when status is "pending"
  const isPending = supplierState === "pending";

  // Handle approve supplier using mutation
  const handleApproveSupplier = async () => {
    try {
      await updateStateMutation.mutateAsync({
        supplierId,
        state: "approved"
      });
      setSupplierState("approved");
      toast.success("Supplier approved successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to approve supplier. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Handle reject supplier using mutation
  const handleRejectSupplier = async () => {
    try {
      await updateStateMutation.mutateAsync({
        supplierId,
        state: "rejected"
      });
      setSupplierState("rejected");
      toast.success("Supplier rejected successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reject supplier. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-urbanist">
      <PageHeader
        title="Supplier Details"
        subTitle="Supplier Details"
        onTitleClick={onClose}
      />

      {/* Approve/Reject Buttons - Only show when seller_state is "pending" */}
      {isPending && (
        <div className="px-4 md:px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleRejectSupplier}
              disabled={updateStateMutation.isPending}
               className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-600 bg-white text-red-700 text-sm font-medium shadow-sm
                  hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reject Supplier"

            >
              {updateStateMutation.isPending ? 'Rejecting...' : 'Reject Supplier'}
            </Button>
            <Button
              onClick={handleApproveSupplier}
              disabled={updateStateMutation.isPending}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium shadow-sm
                  hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Approve Supplier"

            >
              <CircleCheck className="h-6 w-6" />
              {updateStateMutation.isPending ? 'Approving...' : 'Approve Supplier'}
            </Button>
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 py-6 space-y-6">
        <FormProvider {...methods}>
          <SupplierOverview supplier={supplierData} vendorId={vendorId || undefined} />

          <div className="max-w-full mx-auto pt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex pl-2 -mb-px overflow-x-auto">
                  {FORM_TABS.map((tab) => (
                    <button
                      type="button"
                      key={tab.index}
                      className={`px-1 py-2 mr-8 text-sm font-medium whitespace-nowrap 
                        ${
                          activeTab === tab.index
                            ? "text-secondary-900 border-b-4 border-secondary-900"
                            : "text-gray-500 hover:text-secondary-900"
                        }`}
                      onClick={() => {
                        setActiveTab(tab.index);
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Form */}
              {/* <form
                ref={formTopRef}
                onSubmit={methods.handleSubmit(onSubmit)}
                className="p-6 space-y-6"
              > */}
              <div className="p-6 space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-500">Loading supplier data...</p>
                  </div>
                ) : (
                  <>
                    {activeTab === "business-profile" && <BusinessProfile />}
                    {activeTab === "registration-bank" && <RegistrationBank />}
                    {activeTab === "brand-ip" && <BrandIP />}
                    {activeTab === "declarations" && <Declarations />}
                  </>
                )}
              </div>
              {/* </form> */}
            </div>
          </div>
        </FormProvider>
      </div>
    </div>
  );
};
