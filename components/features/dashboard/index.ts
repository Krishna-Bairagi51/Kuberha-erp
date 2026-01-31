// Dashboard Feature Exports

// Components
export { DashboardContent } from './components/dashboard-content'
export { default as PickupsScheduledTable } from './components/pickups-scheduled-table'
export { default as RecentOrderDetails } from './components/recent-order-details'
export { default as SalePurchaseGraph } from './components/sale-purchase-graph'
export { default as OrderDetailsSlider } from './components/order-details-slider'
export { default as TopCustomers } from './components/Top-Customers'

// Hooks
export { useDashboard } from './hooks/use-dashboard'
export {
  useDashboardQuery,
  useSellerSummaryQuery,
  useSellerInsightsQuery,
  useRecentOrdersQuery,
  useGraphDataQuery,
  useTopCustomersQuery,
  useTopCategoriesQuery,
  useOrderCountSummaryQuery,
  queryKeys,
} from './hooks/use-dashboard-query'

// Services
export { dashboardService } from './services/dashboard.service'

// Types are imported directly from the types file, not re-exported here
// Usage: import type { SellerSummary, SellerInsights } from '@/components/features/dashboard/types/dashboard.types'
