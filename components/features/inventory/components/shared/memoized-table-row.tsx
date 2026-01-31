'use client'

/**
 * Memoized Table Row Component
 * 
 * Prevents unnecessary re-renders of table rows when parent re-renders
 */

import { memo } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Edit, Trash2 } from 'lucide-react'
import { formatIndianCurrency, formatIndianNumber } from '@/lib/api/helpers/number'

interface MemoizedTableRowProps {
  item: {
    id: number
    name?: string
    status?: string
    category?: string
    stock?: number
    mrp?: number
    stock_value?: number
    vendor_name?: string
  }
  onEdit: (id: number) => void
  onDelete?: (id: number) => void
  showSupplier?: boolean
}

// Memoized status calculation
const getStatusDisplay = (status?: string) => {
  if (status === 'draft') return { text: 'Draft', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
  if (status === 'unarchive') return { text: 'Listed', color: 'bg-green-50 text-green-600 border-green-200' }
  if (status === 'archive') return { text: 'Delisted', color: 'bg-red-50 text-red-600 border-red-200' }
  if (status === 'rejected') return { text: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200' }
  return { text: 'Draft', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
}

export const MemoizedInventoryTableRow = memo(function MemoizedInventoryTableRow({
  item,
  onEdit,
  onDelete,
  showSupplier = false,
}: MemoizedTableRowProps) {
  const statusDisplay = getStatusDisplay(item.status)
  const isDraft = item.status === 'draft'

  return (
    <TableRow key={item.id} className="hover:bg-gray-50 bg-white">
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        <span className="font-semibold text-neutral-800 body-3 font-urbanist">{item.id}</span>
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap">
        <div className="font-semibold text-neutral-800 body-3 font-urbanist">{item.name || '-'}</div>
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap">
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${statusDisplay.color}`}>
          {statusDisplay.text}
        </span>
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {item.category || '-'}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {formatIndianNumber(item.stock || 0)}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {formatIndianCurrency(item.mrp || 0)}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {formatIndianCurrency(item.stock_value || 0)}
      </TableCell>
      {showSupplier && (
        <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
          {item.vendor_name || '-'}
        </TableCell>
      )}
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(item.id)}
            className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
            title="Edit product"
          >
            <Edit className="h-4 w-4" />
          </button>
          {isDraft && onDelete && (
            <button 
              onClick={() => onDelete(item.id)}
              className="text-gray-400 w-6 h-6 hover:text-red-600 border border-gray-200 rounded-md p-1 transition-colors"
              title="Delete draft product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}, (prev, next) => {
  // Custom comparison function - only re-render if item data actually changed
  return (
    prev.item.id === next.item.id &&
    prev.item.name === next.item.name &&
    prev.item.status === next.item.status &&
    prev.item.category === next.item.category &&
    prev.item.stock === next.item.stock &&
    prev.item.mrp === next.item.mrp &&
    prev.item.stock_value === next.item.stock_value &&
    prev.item.vendor_name === next.item.vendor_name &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.showSupplier === next.showSupplier
  )
})