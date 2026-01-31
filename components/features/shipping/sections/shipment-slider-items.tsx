// Shared items list component for shipment details slider
import React from 'react'
import { formatIndianCurrency } from '@/lib/api/helpers/number'
import type { ShipmentItem } from '../utils/data-mappers'

interface ShipmentSliderItemsProps {
  items: ShipmentItem[]
  showSupplierInfo?: boolean
}

export const ShipmentSliderItems: React.FC<ShipmentSliderItemsProps> = ({
  items,
  showSupplierInfo = false
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
        <h3 className="label-1 font-semibold text-gray-900 font-urbanist">
          Items in the Shipment
        </h3>
      </div>
      <div>
        {items.map((item, index) => (
          <div key={item.id}>
            <div className="flex items-start py-[8px] px-[8px]">
              {/* Left side - Image and details */}
              <div className="flex items-start space-x-[8px] flex-[4]">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-[50px] h-[50px] object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="body-2 text-gray-900 font-urbanist font-semibold flex items-center gap-2 flex-wrap">
                    <span>{item.name}</span>
                    <span className='text-secondary-900'>• </span>
                    <span className='body-4'>Qty: {item.quantity}</span>
                  </div>
                  <div className="body-3 text-gray-500 font-urbanist text-sm">
                    <span className='text-black font-urbanist'>
                      {formatIndianCurrency(item.unitPrice)}
                    </span>/unit  
                    <span className='text-secondary-900'> • </span> {item.weight}  
                  </div>
                  {/* Supplier and Customer Details */}
                  {showSupplierInfo && (item.supplierName || item.supplierPhone) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 font-urbanist">
                        {item.supplierName && (
                          <div>
                            <span className="font-semibold text-gray-700">Supplier: </span>
                            <span>{item.supplierName}</span>
                            {item.supplierPhone && (
                              <span className="text-gray-500"> • {item.supplierPhone}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right side - Price and subtotal */}
              <div className="text-right ml-4 flex-[1]">
                <div className="body-3 text-gray-900 font-urbanist font-bold">
                  {formatIndianCurrency(item.subtotal)}
                </div>
                <div className="body-3 text-gray-500 font-urbanist text-sm">Subtotal</div>
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="border-t border-gray-200 mt-2"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

