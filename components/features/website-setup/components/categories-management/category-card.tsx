"use client"

import React from "react"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Category } from "@/components/features/website-setup/types/categories-management.types"

interface CategoryCardProps {
  category: Category
  onEdit?: (category: Category) => void
  onClick?: (category: Category) => void
  hasChildren?: boolean
}

const categoryTypeLabels: Record<Category["type"], string> = {
  parent: "PARENT CATEGORY",
  child: "CHILD CATEGORY",
  subchild: "SUB CHILD CATEGORY",
}

export function CategoryCard({ category, onEdit, onClick, hasChildren = false }: CategoryCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(category)
  }

  const handleClick = () => {
    if (hasChildren && onClick) {
      onClick(category)
    }
  }

  return (
    <div 
      className={`relative group rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm transition-all h-[249px] w-full ${
        hasChildren ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
      }`}
      onClick={handleClick}
    >
      {/* Category Image */}
      <div className="relative w-full h-full bg-gray-100 overflow-hidden">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl font-bold text-gray-400">
              {category.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Category Name */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
          <div className="flex flex-col gap-2">
            {category.childrenCount !== undefined && category.childrenCount > 0 && (
              <div className="text-sm text-gray-700 bg-[#E1E1E1] rounded w-fit px-2 py-1 text-center font-bold">
                {category.childrenCount} {category.childrenCount === 1 ? "SUBCATEGORY" : "SUBCATEGORIES"}
              </div>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-gray-50/20 hover:bg-secondary-900 text-white hover:text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

