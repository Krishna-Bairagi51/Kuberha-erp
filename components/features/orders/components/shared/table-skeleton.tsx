/**
 * Table Skeleton Component
 * 
 * Loading skeleton for tables during data fetch
 */

'use client'

import React from 'react'
import { TableRow, TableCell } from '@/components/ui/table'

export interface TableSkeletonProps {
  rows?: number
  columns: number
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`} className="bg-white">
          {Array.from({ length: columns }).map((_, cellIndex) => (
            <TableCell key={cellIndex} className="px-[20px] py-2">
              <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
