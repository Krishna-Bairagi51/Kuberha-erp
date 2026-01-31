// Inventory Feature Exports

// Components
export { default as GenerateDescriptionModal } from './components/generate-description-modal'
export { default as AddInventory } from './components/add-item/add-inventory'
export { DraftApprovedPage } from './components/draft-approved-page'

// Providers
export * from './providers'

// Hooks
export { useInventory } from './hooks/use-inventory'

// Services
export { inventoryService } from './services/inventory.service'

// Types are imported directly from the types file, not re-exported here
// Usage: import type { ProductListItem, InventoryFormData } from '@/components/features/inventory/types/inventory.types'
