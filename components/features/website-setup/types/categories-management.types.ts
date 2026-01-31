export type CategoryType = "parent" | "child" | "subchild"

export type Category = {
  id: string
  name: string
  type: CategoryType
  parentId?: string
  imageUrl?: string
  childrenCount?: number
  description?: string
}

export type CategoryStats = {
  parentCount: number
  childCount: number
}

export type ViewMode = "grid" | "list"

export type UseCategoriesManagement = {
  searchTerm: string
  setSearchTerm: (value: string) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  filteredCategories: Category[]
  stats: CategoryStats
  currentCategoryType: CategoryType
  setCurrentCategoryType: (type: CategoryType) => void
}

// API Response Types
export interface ApiCategoryItem {
  id: number
  name: string
  image_url: string
  child_category: ApiCategoryItem[]
}

export interface CategoryManagementResponse {
  message: string
  errors: any[]
  parent_category_count: number
  child_category_count: number
  total_categories: number
  record: ApiCategoryItem[]
  status_code: number
}

