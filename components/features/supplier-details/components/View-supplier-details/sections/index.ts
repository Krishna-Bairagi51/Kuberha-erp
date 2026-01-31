import SupplierOverview from "./SupplierOverview";
import BusinessProfile from "./BusinessProfile";
import RegistrationBank from "./RegistrationBank";
import BrandIP from "./BrandIP";
import Declarations from "./Declarations";

export {
  SupplierOverview,
  BusinessProfile,
  RegistrationBank,
  BrandIP,
  Declarations,
};

import {
  BusinessProfileData,
  RegistrationBankData,
  BrandIPData,
  DeclarationsData,
  DesignDetails,
  SupplierFormData,
} from "./types";

export type {
  BusinessProfileData,
  RegistrationBankData,
  BrandIPData,
  DeclarationsData,
  DesignDetails,
  SupplierFormData,
};

import { SupplierSchema, sellerSchema } from "./schema";
export { sellerSchema };
export type { SupplierSchema };
