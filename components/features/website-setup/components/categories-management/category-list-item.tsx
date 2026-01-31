"use client"

import React from "react"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Category } from "@/components/features/website-setup/types/categories-management.types"

interface CategoryListItemProps {
  category: Category
  onEdit?: (category: Category) => void
  parentName?: string
}

const categoryTypeLabels: Record<Category["type"], string> = {
  parent: "PARENT CATEGORY",
  child: "CHILD CATEGORY",
  subchild: "SUB CHILD CATEGORY",
}

export function CategoryListItem({ category, onEdit, parentName }: CategoryListItemProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(category)
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer group">
      {/* Category Image */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-xl font-bold text-gray-400">
              {category.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Category Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold text-gray-900 truncate">{category.name}</h3>
          <span className="inline-block px-2 py-0.5 text-xs font-semibold text-white bg-secondary-900 rounded">
            {categoryTypeLabels[category.type]}
          </span>
        </div>
        {parentName && (
          <p className="text-sm text-gray-500 mb-1">Parent: {parentName}</p>
        )}
        {/* {category.childrenCount !== undefined && category.childrenCount > 0 && (
          <p className="text-sm text-gray-600">
            {category.childrenCount} {category.childrenCount === 1 ? "child" : "children"}
          </p>
        )} */}
      </div>

      {/* Edit Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleEdit}
        className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  )
}

