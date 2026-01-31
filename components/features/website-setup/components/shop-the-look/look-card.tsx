"use client"

import { Eye, Pencil, MoreVertical, Package, Calendar, Trash, RotateCcw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Look } from "../../types/shop-the-look.types"
import Image from "next/image"

interface LookCardProps {
  look: Look
  onView?: (look: Look) => void
  onEdit?: (look: Look) => void
  onDelete?: (look: Look) => void
  onRestore?: (look: Look) => void
  isDeleted?: boolean
  viewMode?: 'grid' | 'list'
  index?: number
  dragHandle?: React.ReactNode
}

export function LookCard({ 
  look, 
  onView, 
  onEdit, 
  onDelete,
  onRestore,
  isDeleted = false,
  viewMode = 'grid',
  index,
  dragHandle
}: LookCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const productCountText = look.max_products 
    ? `${look.product_count}/${look.max_products}`
    : `${look.product_count}`

  // Generate a description based on the look name if no description is available
  const getDescription = () => {
    // You can customize this based on your needs
    const descriptions: Record<string, string> = {
      'Modern Living Room': 'A curated selection of contemporary furniture pieces for stylish living spaces',
      'Cozy Bedroom': 'Create a relaxing sanctuary with this warm and inviting bedroom ensemble',
      'Minimalist Dining': 'Clean lines and functional design for the modern dining area',
      'Rustic Outdoor': 'Transform your outdoor space with natural materials and earthy tones',
    }
    
    for (const [key, value] of Object.entries(descriptions)) {
      if (look.name.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }
    
    // Fallback description
    return `Explore our curated collection of ${look.name.toLowerCase()} pieces`
  }

  // List View Layout
  if (viewMode === 'list') {
    return (
      <div className={`flex items-center gap-3 w-full ${isDeleted ? 'opacity-75' : ''}`}>
        {/* Number Label - shown next to drag handle in parent */}
        {index !== undefined && (
          <div className="flex-shrink-0 min-w-[28px]">
            <span className="text-xs font-medium text-gray-500">
              #{index + 1}
            </span>
          </div>
        )}

        {/* Thumbnail Image */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
          {look.image_url ? (
            <Image
              src={look.image_url}
              alt={look.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
          {/* Gray Overlay for Deleted Cards */}
          {isDeleted && (
            <div className="absolute inset-0 bg-gray-500/60 z-10 rounded-lg" />
          )}
          {/* Delete Tag */}
          {isDeleted && (
            <div className="absolute top-1 right-1 z-20 bg-red-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-md">
              Delete
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-0.5 line-clamp-1">
            {look.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1">
            {getDescription()}
          </p>
        </div>

        {/* Right: Info Icons */}
        <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4">
          {/* Products Count */}
          <div className="flex items-center gap-1 text-gray-600">
            <Package className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium">{productCountText}</span>
          </div>

          {/* Date */}
          {/* <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs">{formatDate(look.updated_at)}</span>
          </div> */}

          {/* Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(look)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => onEdit?.(look)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(look)}
                    className="text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
              {isDeleted && onRestore && (
                <>
                  <DropdownMenuItem 
                    onClick={() => onEdit?.(look)}
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onRestore?.(look)}
                    className="text-green-600"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(look)}
                    className="text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  // Grid View Layout (existing)
  return (
    <Card className={`group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 w-full h-auto ${
      isDeleted ? '' : 'hover:shadow-md hover:-translate-y-0.5'
    }`}>
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {look.image_url ? (
          <Image
            src={look.image_url}
            alt={look.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
        
        {/* Gray Overlay for Deleted Cards */}
        {isDeleted && (
          <div className="absolute inset-0 bg-gray-500/60 z-10" />
        )}
        
        {/* Delete Tag */}
        {isDeleted && (
          <div className="absolute top-2 right-2 z-20 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-md">
            Delete
          </div>
        )}
        
        {/* Action Buttons Overlay */}
        {!isDeleted && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 rounded-full p-0 bg-white/90 hover:bg-white"
              onClick={() => onView?.(look)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Eye className="h-3.5 w-3.5 text-gray-700" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 rounded-full p-0 bg-white/90 hover:bg-white"
              onClick={() => onEdit?.(look)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Pencil className="h-3.5 w-3.5 text-gray-700" />
            </Button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 px-2 sm:px-3 py-1 sm:py-2">
          {look.name}
        </h3>
        {/* <div className="flex items-center gap-1 text-gray-600 text-xs font-base mb-1 px-2 sm:px-3">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{formatDate(look.updated_at)}</span>
        </div> */}
        <div className="flex items-center gap-1.5 text-gray-600 text-xs font-base mb-1 px-2 sm:px-3">
              <Package className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Products: {productCountText}</span>
        </div>
        
        {/* Footer - Bottom aligned with product info, drag handle, date, and menu */}
        <div className="flex items-center justify-between text-xs text-gray-600 mt-auto pt-1.5 border-t border-gray-100 gap-2 bg-gray-100/50 px-2 sm:px-3 py-1 sm:py-2">
          {/* Left: Drag handle and Product info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {dragHandle && (
              <div className={`transition-opacity ${isDeleted ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                {dragHandle}
              </div>
            )}
          </div>

          {/* Right: Date and menu button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            
            {/* Menu Button - Bottom Right */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 flex-shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(look)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                {!isDeleted && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(look)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(look)}
                      className="text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {isDeleted && onRestore && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => onEdit?.(look)}
                      disabled
                      className="opacity-50 cursor-not-allowed"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onRestore?.(look)}
                      className="text-green-600"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(look)}
                      className="text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  )
}

