"use client"

import { Search, Grid3x3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ViewMode } from "../../types/shop-the-look.types"

interface SearchAndViewProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function SearchAndView({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: SearchAndViewProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="text-sm font-semibold text-gray-600">Search Looks</div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search looks by name..."
            className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`h-8 px-3 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-secondary-900 shadow-sm border border-gray-200 hover:bg-white hover:text-secondary-900'
                : 'bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-600'
            }`}
          >
            <Grid3x3 className={`h-4 w-4 mr-1 ${viewMode === 'grid' ? 'text-secondary-900' : 'text-gray-500'}`} />
            Grid
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`h-8 px-3 transition-all ${
              viewMode === 'list'
                ? 'bg-white text-secondary-900 shadow-sm border border-gray-200 hover:bg-white hover:text-secondary-900'
                : 'bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-600'
            }`}
          >
            <List className={`h-4 w-4 mr-1 ${viewMode === 'list' ? 'text-secondary-900' : 'text-gray-500'}`} />
            List
          </Button>
        </div>
      </div>
    </div>
  )
}

