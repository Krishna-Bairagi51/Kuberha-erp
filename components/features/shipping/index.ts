// Shipping Feature Exports

// Components
export { ShippingPage } from './components/shipping-page'
export { ShipmentDetailsSlider } from './components/shipment-details-slider'
export { ShipmentSupplierDetails } from './components/shipment-supplier-details'

// Hooks
export { useShipping } from './hooks/use-shipping'
export { useShipmentDetails } from './hooks/use-shipment-details'
export { useSupplierDetails } from './hooks/use-supplier-details'

// TanStack Query Hooks
// Note: useShipmentByOrderIdQuery, useBoxDimensionsQuery, useShippingItemsQuery, 
// and useCreateShiprocketOrderMutation are already exported from './orders' to avoid conflicts
export {
  useShipmentsQuery,
  useShipmentInsightsQuery,
  useShipmentDetailsQuery,
  useSupplierDetailsQuery,
  useInvalidateShippingQueries
} from './hooks/use-shipping-query'

// Services
export { shippingService } from './services/shipping.service'

// Types are imported directly from the types file, not re-exported here
// Usage: import type { ShipmentRecord, ShipmentInsights } from '@/components/features/shipping/types/shipping.types'
