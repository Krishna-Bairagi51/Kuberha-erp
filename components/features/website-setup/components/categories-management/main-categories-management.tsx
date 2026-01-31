"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import PageHeader from "@/components/shared/layout/page-header"
import { useCategoriesManagement } from "@/components/features/website-setup/hooks/use-categories-management"
import { CategoryStatsCards } from "./category-stats-cards"
import { CategoryToolbar } from "./category-toolbar"
import { CategoryCard } from "./category-card"
import { CategoryListItem } from "./category-list-item"
import { HierarchicalCategoryItem } from "./hierarchical-category-item"
import AddEditCategoryModal from "./add-edit-category-modal"
import { Category, CategoryType } from "@/components/features/website-setup/types/categories-management.types"
import {
  buildCategoryTree,
  flattenCategoryTree,
  findCategoryNode,
  transformApiResponseToCategories,
  transformApiResponseToStats,
  CategoryTreeNode,
} from "@/components/features/website-setup/utills/categories-management.helpers"
import {
  useCategoryManagementQuery,
  useInvalidateCategoryManagement,
} from "@/components/features/website-setup/hooks/use-categories-query"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"

function MainCategoriesManagement() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const {
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    filteredCategories: mockFilteredCategories,
    stats: mockStats,
    currentCategoryType,
    setCurrentCategoryType,
  } = useCategoriesManagement()

  // Fetch categories from API
  const {
    data: categoryApiResponse,
    isLoading: isLoadingCategories,
    error: categoryError,
  } = useCategoryManagementQuery()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())
  
  // Get navigation path from route params (file-based routing)
  const navigationPath = useMemo(() => {
    // Check if we're on a path route (has path param)
    if (params.path && Array.isArray(params.path)) {
      return params.path.filter((id) => id && id.trim() !== "")
    }
    // Check if path is a single string (shouldn't happen with catch-all, but handle it)
    if (params.path && typeof params.path === 'string') {
      return [params.path].filter((id) => id && id.trim() !== "")
    }
    // Root route - no path
    return []
  }, [params.path])

  // Transform API response to categories
  const categories = useMemo(() => {
    if (categoryApiResponse) {
      return transformApiResponseToCategories(categoryApiResponse)
    }
    return [] // Return empty array if no API data
  }, [categoryApiResponse])

  // Validate navigation path from route params against loaded categories
  useEffect(() => {
    if (categories.length === 0) return

    // Validate that all category IDs in the path exist
    const validPath = navigationPath.filter((id) => 
      categories.some((cat) => cat.id === id.trim())
    )
    
    // If path was invalid, navigate to valid path
    if (validPath.length !== navigationPath.length) {
      if (validPath.length > 0) {
        router.replace(`/admin-dashboard/categories-management/${validPath.join('/')}`)
      } else {
        router.replace('/admin-dashboard/categories-management')
      }
    }
  }, [categories, navigationPath, router])

  // Get stats from API
  const stats = useMemo(() => {
    if (categoryApiResponse) {
      return transformApiResponseToStats(categoryApiResponse)
    }
    return {
      parentCount: 0,
      childCount: 0,
      totalCount: 0,
    }
  }, [categoryApiResponse])

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsAddModalOpen(true)
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setIsAddModalOpen(true)
  }

  const handleModalClose = () => {
    setIsAddModalOpen(false)
    setEditingCategory(null)
  }

  const handleCategorySubmit = async (data: {
    name: string
    imageFile: File | null
    parentId?: string
  }) => {
    // TODO: Implement API call to create/update category
    console.log("Category data:", data)
    console.log("Is edit mode:", !!editingCategory)
    console.log("Editing category:", editingCategory)
    
    // For now, just close the modal
    // In a real implementation, you would:
    // 1. Upload the image file if provided
    // 2. Call the API to create/update the category
    // 3. Refresh the category list
    // 4. Show success/error toast
  }

  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategoryIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const getParentName = (category: Category): string | undefined => {
    if (category.parentId) {
      const parent = categories.find((c) => c.id === category.parentId)
      return parent?.name
    }
    return undefined
  }

  // Build hierarchical tree structure
  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories)
  }, [categories])

  // Get current categories to display based on navigation path
  const currentCategories = useMemo(() => {
    if (navigationPath.length === 0) {
      // Show root categories
      return categoryTree
    }
    
    // Find the current category node
    const currentCategoryId = navigationPath[navigationPath.length - 1]
    const currentCategory = findCategoryNode(categoryTree, currentCategoryId)
    
    if (currentCategory && currentCategory.children) {
      return currentCategory.children
    }
    
    return []
  }, [categoryTree, navigationPath])

  // Handle category click to navigate to children
  const handleCategoryClick = (category: Category) => {
    const categoryNode = findCategoryNode(categoryTree, category.id)
    if (categoryNode && categoryNode.children && categoryNode.children.length > 0) {
      const newPath = [...navigationPath, category.id]
      // Clear search when navigating
      setSearchTerm("")
      
      // Navigate using file-based routing
      router.push(`/admin-dashboard/categories-management/${newPath.join('/')}`)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    const newPath = navigationPath.slice(0, -1)
    // Clear search when going back
    setSearchTerm("")
    
    // Navigate using file-based routing
    if (newPath.length > 0) {
      router.push(`/admin-dashboard/categories-management/${newPath.join('/')}`)
    } else {
      router.push('/admin-dashboard/categories-management')
    }
  }

  // Get breadcrumb path for display
  const breadcrumbPath = useMemo(() => {
    const path: Category[] = []
    navigationPath.forEach((categoryId) => {
      const category = categories.find((c) => c.id === categoryId)
      if (category) {
        path.push(category)
      }
    })
    return path
  }, [navigationPath, categories])

  // Flatten tree for hierarchical list view (only show current level)
  const flattenedCategories = useMemo(() => {
    const categoriesToFlatten = navigationPath.length === 0 
      ? categoryTree 
      : currentCategories
    return flattenCategoryTree(categoriesToFlatten, expandedCategoryIds)
  }, [categoryTree, currentCategories, expandedCategoryIds, navigationPath])

  // Filter flattened categories based on search term
  const filteredHierarchicalCategories = useMemo(() => {
    if (!searchTerm.trim()) return flattenedCategories

    const term = searchTerm.toLowerCase().trim()
    return flattenedCategories.filter((category) =>
      category.name.toLowerCase().includes(term)
    )
  }, [flattenedCategories, searchTerm])

  // Filter current categories for grid view
  const filteredCurrentCategories = useMemo(() => {
    if (!searchTerm.trim()) return currentCategories

    const term = searchTerm.toLowerCase().trim()
    return currentCategories.filter((category) =>
      category.name.toLowerCase().includes(term)
    )
  }, [currentCategories, searchTerm])

  // Show loading state
  if (isLoadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Category Management" className="" />
        <div className="m-[24px]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // Show error state
  if (categoryError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Category Management" className="" />
        <div className="m-[24px]">
          <div className="flex items-center justify-center p-8">
            <span className="font-urbanist text-base text-red-500">
              Error loading categories. Please try again.
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Category Management" className="" />
      <div className="m-[24px]">
        {/* Summary Statistics */}
        <CategoryStatsCards stats={stats} />

        {/* Toolbar */}
        <CategoryToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddCategory={handleAddCategory}
        />

        {/* Category Display */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Breadcrumb Navigation - Inside the card */}
          {(navigationPath.length > 0 || breadcrumbPath.length > 0) && (
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="font-urbanist">Back</span>
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600 font-urbanist">
                {breadcrumbPath.map((category, index) => (
                  <React.Fragment key={category.id}>
                    {index > 0 && <span>/</span>}
                    <button
                      onClick={() => {
                        const newPath = navigationPath.slice(0, index + 1)
                        setSearchTerm("")
                        
                        // Navigate using file-based routing
                        if (newPath.length > 0) {
                          router.push(`/admin-dashboard/categories-management/${newPath.join('/')}`)
                        } else {
                          router.push('/admin-dashboard/categories-management')
                        }
                      }}
                      className="hover:text-gray-900 transition-colors cursor-default"
                    >
                      {category.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          {viewMode === "list" && (
            /* Header - Only show in list view */
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900 font-urbanist">Categories Hierarchy</h2>
              <h3 className="text-base font-semibold text-gray-900 font-urbanist">Action</h3>
            </div>
          )}

          {/* Category List */}
          {(filteredHierarchicalCategories.length > 0 || filteredCurrentCategories.length > 0) ? (
            viewMode === "grid" ? (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredCurrentCategories.map((category) => {
                    const hasChildren = category.children && category.children.length > 0
                    return (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        onEdit={handleEdit}
                        onClick={handleCategoryClick}
                        hasChildren={hasChildren}
                      />
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredHierarchicalCategories.map((category) => (
                  <HierarchicalCategoryItem
                    key={category.id}
                    category={category}
                    level={category.level}
                    isExpanded={expandedCategoryIds.has(category.id)}
                    onToggleExpand={handleToggleExpand}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="rounded-lg border-none bg-white p-8 text-center text-sm text-gray-500 text-muted-foreground">
              <span className="font-urbanist text-base">
                No categories found
                {searchTerm && ` for "${searchTerm}"`}.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      <AddEditCategoryModal
        open={isAddModalOpen}
        onOpenChange={handleModalClose}
        category={editingCategory}
        categories={categories}
        onSubmit={handleCategorySubmit}
      />
    </div>
  )
}

export default MainCategoriesManagement
