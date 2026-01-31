"use client"

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageNumbers: Array<number | string>
  onPageChange: (page: number) => void
  onPrevious: () => void
  onNext: () => void
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
  itemsPerPageOptions?: number[]
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  onPrevious,
  onNext,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <span>Rows per page</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors duration-200 min-w-[60px]">
            {itemsPerPage}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[80px] min-w-[80px]">
            {itemsPerPageOptions.map((value) => (
              <DropdownMenuItem key={value} onClick={() => onItemsPerPageChange(value)}>
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`w-8 h-8 text-sm rounded-full border flex items-center justify-center ${
                  currentPage === page
                    ? 'text-white bg-secondary-900 border-secondary-900'
                    : 'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed "
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default PaginationControls

