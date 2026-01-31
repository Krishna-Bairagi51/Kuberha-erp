import { z } from "zod";

/**
 * Business Profile Validation
 */
export const businessProfileSchema = z.object({
  legalEntityName: z.string().min(2, "Required"),
  brandName: z.string().min(2, "Required"),
  businessType: z.string().min(2, "Required"),
  regAddress1: z.string().min(2, "Required"),
  regAddress2: z.string().optional(),
  regPin: z.string().regex(/^\d{6}$/, "6-digit PIN required"),
  regCity: z.string().min(2, "Required"),
  regState: z.string().min(2, "Required"),

  prinAddress1: z.string().min(2, "Required"),
  prinAddress2: z.string().optional(),
  prinPin: z.string().regex(/^\d{6}$/, "6-digit PIN required"),
  prinCity: z.string().min(2, "Required"),
  prinState: z.string().min(2, "Required"),

  primaryContactName: z.string().min(2, "Required"),
  primaryDesignation: z.string().min(2, "Required"),

  primaryMobile: z.string().regex(/^\d{10}$/, "10-digit mobile required"),
  primaryEmail: z.string().email("Invalid email format"),

  altMobile: z
    .string()
    .regex(/^\d{10}$/, "Invalid alternate number")
    .optional(),

  sameAsRegistered: z.boolean(),
});

/**
 * Registration & Bank Section Validation
 */
export const registrationBankSchema = z.object({
  cin: z.string().optional(),
  gstin: z
    .string()
    .regex(/^[A-Z0-9]{15}$/, "Invalid GSTIN format"),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  shopsRegNo: z.string().optional(),

  incCertFile: z.any().nullable(),
  gstCertFile: z.any().nullable(),
  panCardFile: z.any().nullable(),
  shopsCertFile: z.any().nullable(),

  accountHolderName: z.string().min(2, "Required"),
  accountNumber: z.string().min(6, "Required"),
  confirmAccountNumber: z.string().min(6, "Required"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code"),
  bankName: z.string().min(2, "Required"),
  branchName: z.string().min(2, "Required"),
  accountType: z.enum(["saving", "current"], {
    errorMap: () => ({ message: "Select account type" }),
  }),

  cancelledChequeFile: z.any().nullable(),
}).refine(
  (data) => data.accountNumber === data.confirmAccountNumber,
  {
    message: "Account numbers do not match",
    path: ["confirmAccountNumber"],
  }
);

/**
 * Brand & IP Validation
 */
export const designSchema = z.object({
  name: z.string().min(2, "Required"),
  number: z.string().optional(),
  certFile: z.any().nullable(),
});

export const brandIPSchema = z.object({
  hasTrademark: z.boolean().nullable(),
  brandName: z.string().min(2, "Required").optional(),
  trademarkNumber: z.string().optional(),
  trademarkClass: z.string().optional(),
  trademarkOwner: z.string().optional(),
  trademarkCert: z.any().nullable(),

  hasDesigns: z.boolean().nullable(),
  designs: z.array(designSchema),

  hasThirdPartyContent: z.boolean().nullable(),
  thirdPartyDescription: z.string().optional(),
  nocFiles: z.array(z.any().nullable()),

  confirmation: z.boolean(),
})
  // Condition: Trademark fields required if answered Yes
  .refine((data) => {
    if (!data.hasTrademark) return true;
    return (
      data.trademarkNumber &&
      data.trademarkClass &&
      data.trademarkOwner &&
      data.trademarkCert
    );
  }, {
    message: "Trademark fields required",
    path: ["trademarkNumber"],
  })
  // If designs selected, require at least 1 form
  .refine((d) => !d.hasDesigns || d.designs.length > 0, {
    message: "Add at least one design",
    path: ["designs"],
  });

/**
 * Declarations Validation
 */
export const declarationsSchema = z.object({
  accepted: z.boolean().refine((v) => v === true, "Must accept declarations"),
  signatoryName: z.string().min(2, "Required"),
  designation: z.string().min(2, "Required"),
  place: z.string().min(2, "Required"),
  date: z.string().min(2, "Required"),
  signatoryMobile: z.string().regex(/^\d{10}$/, "Invalid number"),
  signatoryEmail: z.string().email("Invalid email"),
});

/**
 * Final Master Schema
 */
export const sellerSchema = z.object({
  businessProfile: businessProfileSchema,
  registrationBank: registrationBankSchema,
  brandIP: brandIPSchema,
  declarations: declarationsSchema,
});

export type SupplierSchema = z.infer<typeof sellerSchema>;
