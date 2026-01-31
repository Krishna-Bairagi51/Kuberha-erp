import { Category } from "@/components/features/website-setup/types/categories-management.types"
import type { ApiCategoryItem, CategoryManagementResponse } from "@/components/features/website-setup/types/categories-management.types"

// Build hierarchical tree structure from flat category list
export interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[]
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>()
  const rootCategories: CategoryTreeNode[] = []

  // First pass: create all nodes
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // Second pass: build tree structure
  categories.forEach((category) => {
    const node = categoryMap.get(category.id)!
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(node)
      }
    } else {
      rootCategories.push(node)
    }
  })

  // Third pass: calculate childrenCount dynamically
  const calculateChildrenCount = (node: CategoryTreeNode): number => {
    if (!node.children || node.children.length === 0) {
      return 0
    }
    return node.children.length
  }

  const updateChildrenCount = (nodes: CategoryTreeNode[]) => {
    nodes.forEach((node) => {
      node.childrenCount = calculateChildrenCount(node)
      if (node.children && node.children.length > 0) {
        updateChildrenCount(node.children)
      }
    })
  }

  updateChildrenCount(rootCategories)

  // Sort root categories and recursively sort children
  const sortCategories = (cats: CategoryTreeNode[]) => {
    cats.sort((a, b) => a.name.localeCompare(b.name))
    cats.forEach((cat) => {
      if (cat.children && cat.children.length > 0) {
        sortCategories(cat.children)
      }
    })
  }

  sortCategories(rootCategories)
  return rootCategories
}

// Flatten tree structure for display with proper hierarchy
export function flattenCategoryTree(
  tree: CategoryTreeNode[],
  expandedIds: Set<string> = new Set(),
  level: number = 0
): Array<CategoryTreeNode & { level: number; isVisible: boolean }> {
  const result: Array<CategoryTreeNode & { level: number; isVisible: boolean }> = []

  tree.forEach((node) => {
    const isExpanded = expandedIds.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    result.push({
      ...node,
      level,
      isVisible: true,
    })

    if (hasChildren && isExpanded) {
      const children = flattenCategoryTree(node.children!, expandedIds, level + 1)
      result.push(...children)
    }
  })

  return result
}

// Find a category node by ID in the tree
export function findCategoryNode(
  tree: CategoryTreeNode[],
  categoryId: string
): CategoryTreeNode | null {
  for (const node of tree) {
    if (node.id === categoryId) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const found = findCategoryNode(node.children, categoryId)
      if (found) return found
    }
  }
  return null
}

// Transform API response to flat Category array
export function transformApiResponseToCategories(
  apiResponse: CategoryManagementResponse
): Category[] {
  const categories: Category[] = []

  const processCategory = (
    apiCategory: ApiCategoryItem,
    parentId?: string,
    level: number = 0
  ) => {
    // Determine category type based on level
    let type: Category["type"] = "parent"
    if (level === 1) {
      type = "child"
    } else if (level >= 2) {
      type = "subchild"
    }

    // Count children
    const childrenCount = apiCategory.child_category?.length || 0

    // Create category object
    const category: Category = {
      id: String(apiCategory.id),
      name: apiCategory.name,
      type,
      parentId: parentId,
      imageUrl: apiCategory.image_url || undefined,
      childrenCount: childrenCount > 0 ? childrenCount : undefined,
    }

    categories.push(category)

    // Process children recursively
    if (apiCategory.child_category && apiCategory.child_category.length > 0) {
      apiCategory.child_category.forEach((child) => {
        processCategory(child, String(apiCategory.id), level + 1)
      })
    }
  }

  // Process all root categories
  if (apiResponse.record) {
    apiResponse.record.forEach((rootCategory) => {
      processCategory(rootCategory, undefined, 0)
    })
  }

  return categories
}

// Transform API response to CategoryStats
export function transformApiResponseToStats(
  apiResponse: CategoryManagementResponse
) {
  return {
    parentCount: apiResponse.parent_category_count || 0,
    childCount: apiResponse.child_category_count || 0,
    subChildCount: 0, // API doesn't provide this, would need to calculate
  }
}

