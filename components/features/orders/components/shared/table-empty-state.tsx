/**
 * Table Empty State Component
 * 
 * Displays empty state message when table has no data
 * Includes optional search term and clear button
 */

'use client'

import React from 'react'
import { Search } from 'lucide-react'

export interface TableEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  searchTerm?: string
  onClearSearch?: () => void
  actionLabel?: string
  onAction?: () => void
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  icon,
  title,
  description,
  searchTerm,
  onClearSearch,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-12">
      {icon || <Search className="h-12 w-12 text-gray-300" />}
      <div className="text-lg font-semibold text-gray-500 font-urbanist">{title}</div>
      <div className="text-sm text-gray-400 font-urbanist max-w-md text-center">
        {description}
      </div>
      {searchTerm && onClearSearch && (
        <button
          onClick={onClearSearch}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 font-urbanist"
        >
          Clear search
        </button>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1.5 text-sm font-medium text-white bg-secondary-900 rounded-md hover:bg-secondary-800 transition-colors duration-200 font-urbanist"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
