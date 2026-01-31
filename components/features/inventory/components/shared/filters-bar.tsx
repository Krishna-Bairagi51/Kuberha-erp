"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface FiltersBarProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  categories?: string[]
  selectedCategory?: string
  onCategoryChange?: (value: string) => void
  statuses?: string[]
  selectedStatus?: string
  onStatusChange?: (value: string) => void
  isCategoryLoading?: boolean
  className?: string
  showCategory?: boolean
  showStatus?: boolean
  searchPlaceholder?: string
  categoryPlaceholder?: string
  statusPlaceholder?: string
  statusDisplayMap?: Record<string, string>
}

// Default status mapping function
const getStatusDisplayName = (status: string, statusDisplayMap?: Record<string, string>): string => {
  if (status === 'All') return 'All'
  if (statusDisplayMap && statusDisplayMap[status]) {
    return statusDisplayMap[status]
  }
  // Default mappings
  const defaultMap: Record<string, string> = {
    'unarchive': 'Listed',
    'archive': 'Delisted',
    'draft': 'Draft',
    'pending': 'Pending',
    'rejected': 'Rejected',
    'approve': 'Approved'
  }
  return defaultMap[status] || status
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchTerm,
  onSearchTermChange,
  categories = [],
  selectedCategory = 'All',
  onCategoryChange,
  statuses = [],
  selectedStatus = 'All',
  onStatusChange,
  isCategoryLoading = false,
  className,
  showCategory = true,
  showStatus = true,
  searchPlaceholder = 'Search',
  categoryPlaceholder = 'Category',
  statusPlaceholder = 'Status',
  statusDisplayMap,
}) => {
  return (
    <div className={`flex items-center gap-3 flex-nowrap w-full ${className ?? ''}`}>
      <div className="relative flex-shrink-0" style={{ width: '300px' }}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full pl-10 pr-3 body-3 font-urbanist text-sm border-gray-300"
        />
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 ml-auto overflow-x-auto">
        {showStatus && onStatusChange && statuses && statuses.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStatusChange('All')}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors body-4 font-urbanist ${
                selectedStatus === 'All'
                  ? 'bg-secondary-900 text-white border-secondary-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {statuses
              .filter((status) => status !== 'All')
              .map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors body-4 font-urbanist ${
                    selectedStatus === status
                      ? 'bg-secondary-900 text-white border-secondary-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {getStatusDisplayName(status, statusDisplayMap)}
                </button>
              ))}
          </div>
        )}

        {/* {showCategory && onCategoryChange && (
          <Select
            value={selectedCategory}
            onValueChange={onCategoryChange}
            disabled={isCategoryLoading}
          >
            <SelectTrigger className="w-[160px] body-4 font-urbanist h-9 text-sm border-gray-300">
              <SelectValue placeholder={isCategoryLoading ? 'Loading...' : categoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {isCategoryLoading ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : (
                categories
                  .filter((category) => category !== 'All')
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        )} */}
      </div>
    </div>
  )
}

export default FiltersBar

