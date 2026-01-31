// Shared order summary component for shipment details slider
import React from 'react'
import { formatIndianCurrency } from '@/lib/api/helpers/number'
import type { ShipmentSummary } from '../utils/data-mappers'

interface ShipmentSliderSummaryProps {
  summary: ShipmentSummary
}

export const ShipmentSliderSummary: React.FC<ShipmentSliderSummaryProps> = ({
  summary
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
        <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Order Summary</h3>
      </div>
      
      {/* Table Structure - First Row */}
      <div className="overflow-hidden">
        <div className="grid grid-cols-5 border-b border-gray-200 bg-white">
          <div className="px-[8px] py-[8px] border-r border-gray-200">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">AWB Number</div>
            <div className="text-base font-semibold text-gray-900 font-urbanist mt-1 break-words">
              {summary.awbNumber}
            </div>
          </div>
          <div className="px-[8px] py-[8px] border-r border-gray-200">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Courier</div>
            <div className="text-base font-semibold text-gray-900 font-urbanist mt-1">
              {summary.courier}
            </div>
          </div>
          <div className="px-[8px] py-[8px] border-r border-gray-200">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Invoice Number</div>
            <div className="text-base font-semibold text-gray-900 font-urbanist mt-1">
              {summary.invoiceNumber}
            </div>
          </div>
          <div className="px-[8px] py-[8px] border-r border-gray-200">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Estimated Days</div>
            <div className="text-base font-semibold text-gray-900 font-urbanist mt-1">
              {summary.estimatedDays}
            </div>
          </div>
          <div className="px-[8px] py-[8px]">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Box Type</div>
            <div className="text-base font-semibold text-gray-900 font-urbanist mt-1">
              {summary.boxType}
            </div>
          </div>
        </div>
        
        {/* Table Structure - Second Row */}
        <div className="grid grid-cols-5 bg-white">
          <div className="px-[8px] py-[8px] border-r border-gray-200">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Total Items</div>
            <div className="text-base font-semibold text-gray-900 font-urbanist mt-1">
              {summary.totalItems}
            </div>
          </div>
          <div className="px-[8px] py-[8px] border-r border-gray-200">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Total Weight</div>
            <div className="text-base font-semibold text-gray-900 font-urbanist mt-1">
              {summary.totalWeight}
            </div>
          </div>
          <div className="px-[8px] py-[8px] border-r border-gray-200">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Subtotal Amount</div>
            <div className="text-base font-semibold text-gray-900 font-urbanist mt-1">
              {formatIndianCurrency(summary.subtotalAmount)}
            </div>
          </div>
          <div className="px-[8px] py-[8px] border-r border-gray-200">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Tax Amount</div>
            <div className="text-base font-semibold text-red-600 font-urbanist mt-1">
              {formatIndianCurrency(summary.taxAmount)}
            </div>
          </div>
          <div className="px-[8px] py-[8px]">
            <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Total Amount</div>
            <div className="text-base font-semibold text-green-600 font-urbanist mt-1">
              {formatIndianCurrency(summary.totalAmount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

