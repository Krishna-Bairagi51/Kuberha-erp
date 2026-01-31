// Feature Module Exports
// Main entry point for all feature modules

// Dashboard Feature
export * from './dashboard'

// Orders Feature
export * from './orders'

// Inventory Feature
export * from './inventory'

// Shipping Feature
export * from './shipping'

// QC Feature
export * from './qc'

// Supplier Details Feature (Admin Only)
export * from './supplier-details'

// Chat Feature
export * from './chat'

/**
 * USAGE GUIDE:
 * 
 * Import components/hooks/services from this file:
 *   import { InventoryPage, useInventory, inventoryService } from '@/components/features'
 *   import { ChatFullscreen, ChatbotWidget, chatService } from '@/components/features'
 *   import { MainAccountingPage, accountingService } from '@/components/features'
 * 
 * Import types DIRECTLY from feature type files:
 *   import type { ProductListItem } from '@/components/features/inventory/types/inventory.types'
 *   import type { Order, OrderLine } from '@/components/features/orders/types/orders.types'
 *   import type { ShipmentRecord } from '@/components/features/shipping/types/shipping.types'
 *   import type { ChatMessage, ChatThread } from '@/components/features/chat/types/chat.types'
 *   import type { TimePeriod, KPICard } from '@/components/features/accounting/types/accounting.types'
 */
