// Shared customer info component for shipment details slider
import React from 'react'
import { User } from 'lucide-react'
import { formatIndianCurrency } from '@/lib/api/helpers/number'

interface ShipmentSliderCustomerInfoProps {
  customerName: string
  amountPaid: number
}

export const ShipmentSliderCustomerInfo: React.FC<ShipmentSliderCustomerInfoProps> = ({
  customerName,
  amountPaid
}) => {
  return (
    <div>
      <div className="flex items-center justify-between pb-[8px]">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-[8px]">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-gray-900 font-urbanist">{customerName}</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="body-2 text-gray-500 font-urbanist">Amount Paid</div>
          <div className="font-bold text-gray-900 font-urbanist text-lg">
            {formatIndianCurrency(amountPaid)}
          </div>
        </div>
      </div>
    </div>
  )
}

