/**
 * Field label mappings for user-friendly error messages
 * Maps form field keys to their display labels
 */

export const fieldLabels: Record<string, string> = {
  // Step 1: Business Profile
  legalEntityName: 'Legal Entity Name',
  brandName: 'Brand / Trading Name',
  businessType: 'Business Type',
  businessTypeOther: 'Business Type (Other)',
  regAddress: 'Registered Office Address',
  'regAddress.line1': 'Registered Office Address Line 1',
  'regAddress.line2': 'Registered Office Address Line 2',
  'regAddress.city': 'Registered Office City',
  'regAddress.state': 'Registered Office State',
  'regAddress.pinCode': 'Registered Office Pin Code',
  sameAsRegistered: 'Principal place of business',
  principalAddress: 'Principal Place of Business',
  'principalAddress.line1': 'Principal Place of Business Address Line 1',
  'principalAddress.line2': 'Principal Place of Business Address Line 2',
  'principalAddress.city': 'Principal Place of Business City',
  'principalAddress.state': 'Principal Place of Business State',
  'principalAddress.pinCode': 'Principal Place of Business Pin Code',
  contactPersonName: 'Authorised Contact Person Name',
  designation: 'Designation',
  mobileNumber: 'Mobile Number',
  email: 'Email Address',
  alternateContact: 'Alternate Contact Number',

  // Step 2: Registrations & Bank
  cin: 'CIN / Registration Number',
  gstin: 'GSTIN',
  pan: 'PAN',
  shopsEstablishment: 'Shops & Establishments Registration No.',
  accountHolderName: 'Account Holder Name',
  accountNumber: 'Account Number',
  confirmAccountNumber: 'Confirm Account Number',
  ifscCode: 'IFSC Code',
  bankName: 'Bank Name',
  branchName: 'Branch Name',
  accountType: 'Account Type',

  // Step 3: Brand & IP
  hasTrademark: 'Trademark',
  trademarkBrandName: 'Trademark Brand Name',
  trademarkNumber: 'Trademark Registration Number',
  trademarkClass: 'Trademark Class',
  trademarkOwner: 'Trademark Owner Name',
  hasDesignRegistration: 'Design Registration',
  designs: 'Designs',
  'designs.name': 'Design Name',
  'designs.registrationNumber': 'Design Registration Number',
  hasThirdPartyContent: 'Third-party Content',
  thirdPartyDescription: 'Third-party Content Description',
  nocDocuments: 'NOC Documents',
  brandIPConfirmation: 'Brand & IP Confirmation',

  // Step 4: Declarations
  declarationAgreed: 'Declarations Agreement',
  signatoryName: 'Authorised Signatory Name',
  signatoryDesignation: 'Signatory Designation',
  signatoryPlace: 'Signatory Place',
  signatoryDate: 'Signatory Date',
  signatoryMobile: 'Signatory Mobile Number',
  signatoryEmail: 'Signatory Email',
};

/**
 * Get user-friendly label for a field key
 * Falls back to a formatted version of the key if no label is found
 */
export function getFieldLabel(fieldKey: string): string {
  // Handle nested paths like "principalAddress.line1"
  if (fieldLabels[fieldKey]) {
    return fieldLabels[fieldKey];
  }

  // Try to find parent field label
  const parts = fieldKey.split('.');
  if (parts.length > 1) {
    const parentKey = parts[0];
    const childKey = parts[1];
    if (fieldLabels[`${parentKey}.${childKey}`]) {
      return fieldLabels[`${parentKey}.${childKey}`];
    }
    if (fieldLabels[parentKey]) {
      return `${fieldLabels[parentKey]} - ${childKey}`;
    }
  }

  // Fallback: format the key nicely
  return fieldKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Extract field labels from validation errors object
 * Returns an array of user-friendly field labels
 */
export function getErrorFieldLabels(errors: any): string[] {
  const labels: string[] = [];
  const visited = new Set<string>();

  function extractErrors(obj: any, path: string = ''): void {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (value && typeof value === 'object') {
        // Check if it's an error object with a message
        if ('message' in value && typeof value.message === 'string' && value.message) {
          const label = getFieldLabel(currentPath);
          if (!visited.has(currentPath)) {
            labels.push(label);
            visited.add(currentPath);
          }
        } else if (Array.isArray(value)) {
          // Handle array errors (like for field arrays)
          value.forEach((item, index) => {
            if (item && typeof item === 'object') {
              extractErrors(item, `${currentPath}[${index}]`);
            }
          });
        } else {
          // Recursively check nested objects (like principalAddress.line1)
          extractErrors(value, currentPath);
        }
      }
    }
  }

  extractErrors(errors);
  return labels;
}

