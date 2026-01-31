"use client"

import React from "react"
import { Search, Grid3x3, List, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ViewMode } from "@/components/features/website-setup/types/categories-management.types"

interface CategoryToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onAddCategory?: () => void
}

export function CategoryToolbar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onAddCategory,
}: CategoryToolbarProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-secondary-900">
            Parent Categories
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className={`h-8 px-3 transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-secondary-900 shadow-sm border border-gray-200 hover:bg-white hover:text-secondary-900"
                    : "bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-600"
                }`}
              >
                <Grid3x3 className={`h-4 w-4 mr-1 ${viewMode === "grid" ? "text-secondary-900" : "text-gray-500"}`} />
                Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("list")}
                className={`h-8 px-3 transition-all ${
                  viewMode === "list"
                    ? "bg-white text-secondary-900 shadow-sm border border-gray-200 hover:bg-white hover:text-secondary-900"
                    : "bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-600"
                }`}
              >
                <List className={`h-4 w-4 mr-1 ${viewMode === "list" ? "text-secondary-900" : "text-gray-500"}`} />
                List
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
            <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold text-gray-600">
                Search Categories
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    
                    placeholder={viewMode === "list" 
                      ? "Search by parent category name and sub category name... " 
                      : "Search by parent category name... "}

                    className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
                </div>
            </div>
            {/* <Button
                onClick={onAddCategory}
                className="h-10 flex items-center justify-center gap-2 rounded-lg bg-secondary-900 px-5 text-sm font-semibold text-white hover:bg-secondary-800 whitespace-nowrap"
            >
                <Plus className="h-4 w-4" />
                Add Category
            </Button> */}
            </div>

      </div>
    </div>
  )
}

