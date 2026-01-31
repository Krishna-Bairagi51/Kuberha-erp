"use client"

import React from "react"
import { Edit, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryTreeNode } from "@/components/features/website-setup/utills/categories-management.helpers"
import { Category } from "@/components/features/website-setup/types/categories-management.types"

interface HierarchicalCategoryItemProps {
  category: CategoryTreeNode
  level: number
  isExpanded: boolean
  onToggleExpand: (categoryId: string) => void
  onEdit?: (category: Category) => void
}

const categoryTypeLabels: Record<Category["type"], string> = {
  parent: "Parent Category",
  child: "Sub Category",
  subchild: "Sub Category",
}

export function HierarchicalCategoryItem({
  category,
  level,
  isExpanded,
  onToggleExpand,
  onEdit,
}: HierarchicalCategoryItemProps) {
  const hasChildren = category.children && category.children.length > 0
  const indentLevel = level * 24 // 24px per level

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      onToggleExpand(category.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(category)
  }

  const handleRowClick = () => {
    if (hasChildren) {
      onToggleExpand(category.id)
    }
  }

  return (
    <div
      className={`flex items-center gap-2 border-b border-gray-100 bg-white transition-colors py-[14px] ${
        hasChildren ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
      }`}
      style={{ paddingLeft: `${indentLevel + 12}px`, paddingRight: "12px" }}
      onClick={handleRowClick}
    >
      {/* Expand/Collapse Indicator */}
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded transition-colors cursor-pointer border border-gray-200"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-600" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        )}
      </div>

      {/* Thumbnail Image */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
            <span className="text-base font-bold text-gray-400">
              {category.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Category Info */}
      <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 font-urbanist truncate mb-0.5">
          {category.name}
        </h3>
        <p className="text-xs text-gray-500 font-urbanist uppercase">
          {categoryTypeLabels[category.type]}
        </p>
      </div>

      {/* Children Count Badge (for parents with children) */}
      {category.type === "parent" && category.childrenCount !== undefined && category.childrenCount > 0 && (
        <div className="px-2 py-0.5 bg-secondary-100/80 text-secondary-900 text-[12px] font-semibold rounded-md flex-shrink-0 font-urbanist">
          {category.childrenCount} {category.childrenCount === 1 ? "SUBCATEGORY" : "SUBCATEGORIES"}
        </div>
      )}

      {/* Edit Icon - Always visible */}
      <div className="pr-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          className="h-6 w-6 rounded-full hover:bg-gray-200 text-gray-600 hover:text-gray-900"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

