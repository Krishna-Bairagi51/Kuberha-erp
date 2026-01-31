// Supplier Details Feature Exports (Admin Only)

// Components
export { default as SupplierDetailsPage } from './components/supplier-details-page'
export { ViewSupplierForm } from './components/View-supplier-details/view-supplier-form'

// Hooks - Legacy (useState-based)
export { useSupplier } from './hooks/use-supplier'

// Hooks - TanStack Query (Recommended)
export {
  useSupplierListQuery,
  useSupplierDetailQuery,
  useStatesQuery,
  useUpdateSupplierStateMutation,
  useGenerateVendorAgreementMutation,
  useCreateSellerMutation,
  useInvalidateSupplierQueries,
  useCachedSupplierData,
  usePrefetchSupplier,
} from './hooks/use-supplier-query'

// Services
export { supplierService } from './services/supplier.service'

// Types are imported directly from the types file, not re-exported here
// Usage: import type { SupplierListItem, SupplierDetail } from '@/components/features/supplier-details/types/supplier.types'
