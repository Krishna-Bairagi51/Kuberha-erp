"use client"

import { useState } from "react"

import { UseCategoriesManagement, CategoryType, ViewMode } from "@/components/features/website-setup/types/categories-management.types"

export function useCategoriesManagement(): UseCategoriesManagement {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  // Default to showing only parent categories
  const currentCategoryType: CategoryType = "parent"

  return {
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    filteredCategories: [], // No longer used - API data is used instead
    stats: {
      parentCount: 0,
      childCount: 0,
    },
    currentCategoryType,
    setCurrentCategoryType: () => {}, // No-op since we removed the filter
  }
}

