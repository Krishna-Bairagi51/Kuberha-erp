/**
 * Table Pagination Component
 * 
 * Reusable pagination controls for tables with:
 * - Items per page selector
 * - Page navigation buttons
 * - Page number buttons with ellipsis
 */

'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { getPageNumbers } from '../../utils/order-helpers'

export interface TablePaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  itemsPerPageOptions?: number[]
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100]
}) => {
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div className="px-5 py-[15px] border-t border-gray-200 flex items-center justify-between rounded-br-[5px] rounded-bl-[5px]">
      {/* Items Per Page Selector */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">Row Per Page</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors duration-200 min-w-[60px]">
            {itemsPerPage}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[60px] min-w-[60px]">
            {itemsPerPageOptions.map((value) => (
              <DropdownMenuItem
                key={value}
                onClick={() => onItemsPerPageChange(value)}
                disabled={totalItems < value}
                className={itemsPerPage === value ? 'bg-secondary-900 text-white' : ''}
              >
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-sm text-gray-600">Entries</span>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={index} className="px-2 text-sm text-gray-500">...</span>
            ) : (
              <button
                key={index}
                onClick={() => onPageChange(page as number)}
                className={`w-8 h-8 text-sm rounded-full border flex items-center justify-center ${
                  currentPage === page
                    ? 'text-white bg-secondary-900'
                    : 'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
