// types/domains/index.ts
// Shared utility types - NOT feature-specific
//
// For feature-specific types, import directly from feature type files:
// - import type { ProductListItem } from '@/components/features/inventory/types/inventory.types'
// - import type { Order, OrderLine } from '@/components/features/orders/types/orders.types'
// - import type { ShipmentRecord } from '@/components/features/shipping/types/shipping.types'
// - import type { QCStatus } from '@/components/features/qc/types/qc.types'
// - import type { SupplierListItem } from '@/components/features/supplier-details/types/supplier.types'

// Authentication types
export * from "./auth";

// AI types (shared utility)
export * from "./ai";

// Chatbot types (shared utility)
export * from "./chatbot";

// Invoice types (shared utility)
export * from "./invoice";

// Supplier onboarding types (for partner-onboarding flow)
export * from "./supplier";

/**
 * @deprecated Use feature-specific types instead
 * 
 * MIGRATION GUIDE:
 * - Inventory types: import from '@/components/features/inventory/types/inventory.types'
 * - Order types: import from '@/components/features/orders/types/orders.types'
 * - Shipping types: import from '@/components/features/shipping/types/shipping.types'
 * - QC types: import from '@/components/features/qc/types/qc.types'
 * - Dashboard types: import from '@/components/features/dashboard/types/dashboard.types'
 */

// Legacy re-exports for backwards compatibility (will be removed)
// export * from "./shiprocket";
// export * from "./admin";
// export * from "./qc";
// export * from "./inventory";
// export * from "./orders";
