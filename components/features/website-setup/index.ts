// Website Setup Feature Exports
// Central export point for all website setup modules

// ============================================================================
// Components
// ============================================================================

// Brand Management
export { default as MainBrandManagement } from './components/brand-management/main-brand-management'
export { default as BrandDetailPage } from './components/brand-management/brand-detail-page'
export { default as EditBrandModal } from './components/brand-management/section-brand-detail/edit-modal'

// Categories Management
export { default as MainCategoriesManagement } from './components/categories-management/main-categories-management'
export { default as AddEditCategoryModal } from './components/categories-management/add-edit-category-modal'
export { CategoryCard } from './components/categories-management/category-card'
export { CategoryListItem } from './components/categories-management/category-list-item'
export { HierarchicalCategoryItem } from './components/categories-management/hierarchical-category-item'
export { CategoryStatsCards } from './components/categories-management/category-stats-cards'
export { CategoryToolbar } from './components/categories-management/category-toolbar'

// Color Management
export { default as MainColorManagement } from './components/color-management/main-color-management'
export { default as AddColorModal } from './components/color-management/add-color-modal'

// ============================================================================
// Hooks
// ============================================================================

// Brand Management
export {
  useBrandsQuery,
  useApprovedSellersQuery,
  useUpdateBrandImageMutation,
  useInvalidateApprovedSellers,
  mapSupplierToBrand,
} from './hooks/use-brand-management'

// Categories Management
export { useCategoriesManagement } from './hooks/use-categories-management'
export {
  useCategoryManagementQuery,
  useInvalidateCategoryManagement,
} from './hooks/use-categories-query'

// Color Management
export {
  useColorCodeDashboardQuery,
  useInvalidateColorCodeDashboard,
  useCreateColorCodeMutation,
} from './hooks/use-color-code-query'

// ============================================================================
// Services
// ============================================================================

// Brand Management
export {
  getApprovedSellerList,
  updateSellerBrandImage,
} from './services/brand-management.service'
export type { UpdateBrandImageResponse } from './services/brand-management.service'

// Color Management
export { colorManagementService } from './services/color-management.service'

// Categories Management
export { categoriesManagementService } from './services/categories-management.service'

// ============================================================================
// Types
// ============================================================================

// Brand Management
export type {
  Brand,
  SupplierListItemWithImage,
} from './types/brand-management.types'

// Categories Management
export type {
  CategoryType,
  Category,
  CategoryStats,
  ViewMode,
  UseCategoriesManagement,
  ApiCategoryItem,
  CategoryManagementResponse,
} from './types/categories-management.types'

// Color Management
export type {
  ColorItem,
  ColorCodeRecord,
  ColorCodeDashboardResponse,
  CreateColorCodeRequest,
  CreateColorCodeResponse,
  CreateColorCodeErrorResponse,
} from './types/color-management.types'

// ============================================================================
// Utils / Helpers
// ============================================================================

// Brand Management
export {
  getStatusDisplay,
  validateBrandImageFile,
  formatIndianPrice,
  getBrandInitial,
  type StatusDisplay,
} from './utills/brand-management.helpers'

// Categories Management
export {
  buildCategoryTree,
  flattenCategoryTree,
  findCategoryNode,
  transformApiResponseToCategories,
  transformApiResponseToStats,
  type CategoryTreeNode,
} from './utills/categories-management.helpers'
