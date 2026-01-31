'use client'

import { memo } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { formatIndianCurrency, formatIndianNumber } from '@/lib/api/helpers/number'

interface MemoizedDraftRowProps {
  item: {
    id?: number
    name?: string
    vendor_name?: string
    category?: string
    stock?: number
    mrp?: number
    stock_value?: number
  }
  onEdit: (id: number) => void
  onDelete?: (id: number) => void
}

export const MemoizedDraftRow = memo(function MemoizedDraftRow({
  item,
  onEdit,
  onDelete,
}: MemoizedDraftRowProps) {
  if (!item.id) return null

  return (
    <TableRow className="hover:bg-gray-50 bg-white">
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {item.id || '-'}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {item.name || '-'}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {item.vendor_name || '-'}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap">
        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]">
          Draft
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
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(item.id!)}
            className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
            title="Edit product"
          >
            <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
          </button>
          {onDelete && (
            <button 
              onClick={() => onDelete(item.id!)}
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
  return (
    prev.item.id === next.item.id &&
    prev.item.name === next.item.name &&
    prev.item.vendor_name === next.item.vendor_name &&
    prev.item.category === next.item.category &&
    prev.item.stock === next.item.stock &&
    prev.item.mrp === next.item.mrp &&
    prev.item.stock_value === next.item.stock_value &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete
  )
})