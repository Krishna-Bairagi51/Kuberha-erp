import { z } from 'zod';

/**
 * Central schema definitions for Partner Onboarding forms
 * Following industry best practices with comprehensive validation
 */

// Address schema - reusable across steps
// Only line1 is required, all other fields are optional
const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  country: z.string().optional().default('India'),
});

// Mobile number validation - Indian format
const mobileNumberSchema = z
  .string()
  .min(10, 'Mobile number must be 10 digits')
  .max(10, 'Mobile number must be 10 digits')
  .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits');

// Optional mobile number validation
const optionalMobileNumberSchema = z
  .string()
  .optional()
  .refine((val) => !val || (val.length <= 10 && /^\d+$/.test(val)), {
    message: 'Mobile number must be 10 digits or less',
  });

// Email validation
const emailSchema = z.string().email('Invalid email address');

// Optional email validation
const optionalEmailSchema = z.string().email('Invalid email address').optional();

/**
 * Step 1: Business Profile Schema
 */
export const step1BusinessProfileSchema = z
  .object({
    legalEntityName: z.string().min(1, 'Legal entity name is required'),
    brandName: z.string().min(1, 'Brand/trading name is required'),
    businessType: z.string().min(1, 'Business type is required'),
    businessTypeOther: z.string().optional(),
    regAddress: addressSchema,
    sameAsRegistered: z.boolean().optional().default(true),
    principalAddress: addressSchema.partial(),
    contactPersonName: z.string().min(1, 'Contact person name is required'),
    designation: z.string().min(1, 'Designation is required'),
    mobileNumber: mobileNumberSchema,
    email: emailSchema,
    alternateContact: optionalMobileNumberSchema,
  })
  .superRefine((val, ctx) => {
    // Conditional validation: businessTypeOther required when businessType is "Other"
    if (val.businessType === 'Other' && (!val.businessTypeOther || val.businessTypeOther.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['businessTypeOther'],
        message: 'Please specify the business type',
      });
    }

    // Conditional validation: principalAddress line1 required ONLY when sameAsRegistered is false
    // When sameAsRegistered is true, principalAddress is not required (it will be same as registered address)
    // Only line1 is required, all other fields (city, state, pinCode) are optional
    if (val.sameAsRegistered === false) {
      const pa = val.principalAddress;
      if (!pa || !pa.line1 || pa.line1.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['principalAddress', 'line1'],
          message: 'Principal address line 1 is required',
        });
      }
      // Note: city, state, and pinCode are optional per the form design
    }
    // When sameAsRegistered is true, no validation needed for principalAddress
  });

export type Step1BusinessProfileSchema = z.infer<typeof step1BusinessProfileSchema>;

/**
 * Step 2: Registrations & Bank Schema
 */
export const step2RegistrationsBankSchema = z
  .object({
    cin: z.string().optional(),
    gstin: z.string().min(1, 'GSTIN is required'),
    pan: z.string().min(1, 'PAN is required'),
    shopsEstablishment: z.string().optional(),
    accountHolderName: z.string().min(1, 'Account holder name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    confirmAccountNumber: z.string().min(1, 'Please confirm account number'),
    ifscCode: z.string().min(1, 'IFSC code is required'),
    bankName: z.string().min(1, 'Bank name is required'),
    branchName: z.string().min(1, 'Branch name is required'),
    accountType: z.string().min(1, 'Account type is required'),
  })
  .refine((data) => data.accountNumber === data.confirmAccountNumber, {
    path: ['confirmAccountNumber'],
    message: 'Account numbers must match',
  });

export type Step2RegistrationsBankSchema = z.infer<typeof step2RegistrationsBankSchema>;

/**
 * Step 3: Brand & IP Schema
 */
export const step3BrandIPSchema = z
  .object({
    hasTrademark: z.boolean().optional().default(false),
    trademarkBrandName: z.string().optional(),
    trademarkNumber: z.string().optional(),
    trademarkClass: z.string().optional(),
    trademarkOwner: z.string().optional(),
    hasDesignRegistration: z.boolean().optional().default(false),
    designs: z
      .array(
        z.object({
          name: z.string().optional(),
          registrationNumber: z.string().optional(),
          fileName: z.string().optional(),
          fileBase64: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    hasThirdPartyContent: z.boolean().optional().default(false),
    thirdPartyDescription: z.string().optional(),
    nocDocuments: z
      .array(
        z.object({
          fileName: z.string().optional(),
          fileBase64: z.string().optional(),
          uploadedAt: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    brandIPConfirmation: z.boolean().optional().default(false),
  })
  .superRefine((val, ctx) => {
    // Conditional validation: trademark fields required when hasTrademark is true
    if (val.hasTrademark) {
      if (!val.trademarkBrandName || val.trademarkBrandName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['trademarkBrandName'],
          message: 'Trademark brand name is required',
        });
      }
      if (!val.trademarkNumber || val.trademarkNumber.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['trademarkNumber'],
          message: 'Trademark registration number is required',
        });
      }
      if (!val.trademarkClass || val.trademarkClass.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['trademarkClass'],
          message: 'Trademark class is required',
        });
      }
      if (!val.trademarkOwner || val.trademarkOwner.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['trademarkOwner'],
          message: 'Trademark owner name is required',
        });
      }
    }

    // Brand IP confirmation is always required
    if (!val.brandIPConfirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['brandIPConfirmation'],
        message: 'Please confirm brand and IP ownership',
      });
    }
  });

export type Step3BrandIPSchema = z.infer<typeof step3BrandIPSchema>;

/**
 * Step 4: Declarations Schema
 */
export const step4DeclarationsSchema = z.object({
  declarationAgreed: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the declarations to proceed',
  }),
  signatoryName: z.string().min(1, 'Signatory name is required'),
  signatoryDesignation: z.string().min(1, 'Signatory designation is required'),
  signatoryPlace: z.string().optional(),
  signatoryDate: z.string().optional(),
  signatoryMobile: optionalMobileNumberSchema,
  signatoryEmail: optionalEmailSchema,
});

export type Step4DeclarationsSchema = z.infer<typeof step4DeclarationsSchema>;

/**
 * Combined schema for full form validation (optional, for final submission)
 */
export const partnerOnboardingFullSchema = z.object({
  step1: step1BusinessProfileSchema,
  step2: step2RegistrationsBankSchema,
  step3: step3BrandIPSchema,
  step4: step4DeclarationsSchema,
});

export type PartnerOnboardingFullSchema = z.infer<typeof partnerOnboardingFullSchema>;

