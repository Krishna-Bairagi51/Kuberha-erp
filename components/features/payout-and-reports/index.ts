// Components
export { default as MainAccountingPage } from "./components/main-accounting-page"
export { SalesDetailsTable, default as SalesDetailsTableDefault } from "./components/sales-details-table"
export { default as SupplierPayout } from "./components/supplier-payout"
export { SalesOverview, default as SalesOverviewDefault } from "./components/sales-overview/sales-overview"

// Sales Overview Sections
export {
  KPICardsSection,
  ChartsSection,
  RevenueTrendChart,
  OrderStatusChart,
  TablesSection,
  TopCustomersTable,
  WhatsSellingCard,
  GSTAndSettlementsSection,
  GSTSnapshotCard,
  SettlementsAlertsCard,
} from "./components/sales-overview/sections"

// Hooks
export { usePagination } from "./hooks/usePagination"
export type { UsePaginationOptions, UsePaginationReturn } from "./hooks/usePagination"

// TanStack Query Hooks
export {
  useSalesOverviewQuery,
  useSalesDetailsQuery,
  useExportSalesReportQuery,
  useSupplierPayoutOverviewQuery,
  useCommissionDetailsQuery,
  useInvalidatePayoutQueries,
  queryKeys as payoutQueryKeys,
} from "./hooks/use-payout-query"

// Types - Sales Details
export type { SalesRow } from "./types/sales-details.types"
export type { TimePeriod } from "./types/sales-details.types"

// Types - Sales Overview
export type {
  KPICard,
  RevenueDataPoint,
  StatusBreakdown,
  TopCustomer,
  SellingItem,
  GSTSnapshot,
  UpcomingSettlement,
  Alert,
} from "./types/sales-overview.types"

// Types - Supplier Payout
export type { PayoutRow, PayoutKPI, StatusTone } from "./types/supplier-payout.types"


// Services - Sales Overview
export {
  getDateRange as getDateRangeOverview,
  fetchSalesOverview,
} from "./services/sales-overview.service"
export type { SalesOverviewResponse } from "./services/sales-overview.service"

// Services - Sales Details
export {
  formatCurrency as formatCurrencyDetails,
  getDateRange as getDateRangeDetails,
  fetchSalesDetails,
  exportSalesReportToExcel,
  downloadFile,
} from "./services/sales-details.service"
export type {
  OrderDetailRecord,
  SupplierCustomerOrderDetailsResponse,
  DetailedSaleOrderReportResponse,
} from "./services/sales-details.service"

// Services - Supplier Payout
export {
  formatCurrency as formatCurrencyPayout,
  getStatusTone,
  getDateRange as getDateRangePayout,
  fetchSupplierPayoutOverview,
  fetchCommissionDetails,
  getDefaultPayoutKPICards,
} from "./services/supplier-payout.service"
export type {
  SupplierPayoutResponse,
  CommissionDetailRecord,
  SupplierCommissionDetailsResponse,
} from "./services/supplier-payout.service"
