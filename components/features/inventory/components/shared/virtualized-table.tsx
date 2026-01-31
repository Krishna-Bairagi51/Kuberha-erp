'use client'

/**
 * Virtualized Table Component
 * 
 * High-performance table using @tanstack/react-virtual for rendering
 * only visible rows. Dramatically improves performance for large datasets.
 */

import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Array<{
    key: string
    header: string
    render: (item: T, index: number) => React.ReactNode
    className?: string
  }>
  emptyMessage?: string
  emptySearchMessage?: string
  searchTerm?: string
  rowHeight?: number
  className?: string
}

export function VirtualizedTable<T extends { id?: number | string }>({
  data,
  columns,
  emptyMessage = 'No items found',
  emptySearchMessage,
  searchTerm = '',
  rowHeight = 50,
  className = '',
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5, // Render 5 extra items for smooth scrolling
  })

  const items = virtualizer.getVirtualItems()

  // Memoize empty state message
  const emptyStateMessage = useMemo(() => {
    if (searchTerm && emptySearchMessage) {
      return emptySearchMessage
    }
    return emptyMessage
  }, [searchTerm, emptySearchMessage, emptyMessage])

  if (data.length === 0) {
    return (
      <div className="px-[20px] py-12 text-center">
        <div className="text-lg font-semibold text-gray-500 font-urbanist">
          {emptyStateMessage}
        </div>
      </div>
    )
  }

  return (
    <div ref={parentRef} className={`overflow-auto ${className}`} style={{ height: '600px' }}>
      <Table className="w-full">
        <TableHeader className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap ${column.className || ''}`}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualRow) => {
            const item = data[virtualRow.index]
            return (
              <TableRow
                key={item.id || virtualRow.index}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="hover:bg-gray-50 bg-white absolute w-full"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist"
                  >
                    {column.render(item, virtualRow.index)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
