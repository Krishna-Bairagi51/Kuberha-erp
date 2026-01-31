// Orders Feature Exports

// Components
export {
  OrderHistoryTable,
  OrderHistoryTableAdmin,
} from './components/order-history-table'

// Hooks
export { useOrderHistory } from './hooks/use-order-history'
export * from './hooks/use-orders-query'

// Services
export { ordersService } from './services/orders.service'

// Types are imported directly from the types file, not re-exported here
// Usage: import type { Order, OrderLine } from '@/components/features/orders/types/orders.types'
