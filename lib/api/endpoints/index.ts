// src/lib/api/endpoints/index.ts
// Shared utility APIs - NOT feature-specific
// 
// For feature-specific APIs, use the feature services:
// - import { inventoryService } from '@/components/features/inventory'
// - import { ordersService } from '@/components/features/orders'
// - import { shippingService } from '@/components/features/shipping'
// - import { qcService } from '@/components/features/qc'
// - import { supplierService } from '@/components/features/supplier-details'
// - import { dashboardService } from '@/components/features/dashboard'

// Authentication APIs
export { sendOTP, verifyOTP, login } from "./auth"

// Invoice APIs (shared utility)
export { getCustomerInvoiceReport } from "./invoice"

// Chatbot APIs (shared utility)
export { sendMessage, startConversation, getChatList, getChatMessages } from "./chatbot"

// AI APIs (shared utility)
export { uploadAndTransform, getTaskStatus, generateProductDescription } from "./ai"
export type { GenerateDescriptionRequest, GenerateDescriptionResponse } from "./ai"

// Seller Onboarding APIs (for partner-onboarding flow)
export {
  getSellerInfo,
  updateSellerState,
  updateSellerInfo,
  uploadSignedDocument,
} from "./seller"

/**
 * @deprecated Use feature-specific services instead
 * 
 * MIGRATION GUIDE:
 * - Inventory: import { inventoryService } from '@/components/features/inventory'
 * - Orders: import { ordersService } from '@/components/features/orders'
 * - Shipping: import { shippingService } from '@/components/features/shipping'
 * - QC: import { qcService } from '@/components/features/qc'
 * - Suppliers: import { supplierService } from '@/components/features/supplier-details'
 * - Dashboard: import { dashboardService } from '@/components/features/dashboard'
 */
