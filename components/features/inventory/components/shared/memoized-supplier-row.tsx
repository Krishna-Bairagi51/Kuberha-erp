'use client'

import { memo } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { formatIndianCurrency, formatIndianNumber } from '@/lib/api/helpers/number'

interface MemoizedSupplierRowProps {
  item: {
    vendor_id?: number | string
    id?: number | string
    vendor_name?: string
    vendor_phone?: string
    total_sales?: number
    stock?: number
    stock_value?: number
    vendor_address?: string
    status?: string
  }
  onShowInfo: (id: number, name: string) => void
}

const getSupplierStatusDisplay = (status?: string) => {
  if (status === 'draft') return { text: 'Draft', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
  if (status === 'approve') return { text: 'Approved', color: 'bg-green-50 text-green-600 border-green-200' }
  if (status === 'pending') return { text: 'Pending', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
  if (status === 'rejected') return { text: 'Rejected', color: 'bg-red-50 text-red-600 border-red-200' }
  return { text: 'Pending', color: 'bg-[#FFEED0] text-[#E59213] border-[#FBE1B2]' }
}

export const MemoizedSupplierRow = memo(function MemoizedSupplierRow({
  item,
  onShowInfo,
}: MemoizedSupplierRowProps) {
  const statusDisplay = getSupplierStatusDisplay(item.status)
  const vendorId = typeof item.vendor_id === 'string' ? parseInt(item.vendor_id) : item.vendor_id

  return (
    <TableRow key={item.vendor_id || item.id} className="hover:bg-gray-50 bg-white">
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {item.vendor_id || '-'}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 body-3 font-urbanist">
            {item.vendor_name || '-'}
          </span>
          <span className="text-xs text-gray-500 font-urbanist">
            {item.vendor_phone || '-'}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {formatIndianCurrency(item.total_sales || 0)}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {formatIndianNumber(item.stock || 0)}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        {formatIndianCurrency(item.stock_value || 0)}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist max-w-xs truncate">
        {item.vendor_address || '-'}
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap">
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md border ${statusDisplay.color}`}>
          {statusDisplay.text}
        </span>
      </TableCell>
      <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist">
        <button 
          onClick={() => vendorId && item.vendor_name && onShowInfo(vendorId, item.vendor_name)}
          className="text-gray-400 w-6 h-6 hover:text-gray-600 border border-gray-200 rounded-md p-1 transition-colors"
        >
          <img src="/images/svg/Vector (1).svg" alt="Eye" className="h-4 w-4" />
        </button>
      </TableCell>
    </TableRow>
  )
}, (prev, next) => {
  return (
    prev.item.vendor_id === next.item.vendor_id &&
    prev.item.vendor_name === next.item.vendor_name &&
    prev.item.vendor_phone === next.item.vendor_phone &&
    prev.item.total_sales === next.item.total_sales &&
    prev.item.stock === next.item.stock &&
    prev.item.stock_value === next.item.stock_value &&
    prev.item.vendor_address === next.item.vendor_address &&
    prev.item.status === next.item.status &&
    prev.onShowInfo === next.onShowInfo
  )
})