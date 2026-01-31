"use client"
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  X, 
  Info, 
  User, 
  Phone, 
  Calendar,
  Package,
  CheckCircle,
  Check,
  AlertCircle,
  Clock,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  OrderDetailsSliderProps,
  OrderItem,
  OrderData,
} from '../types/dashboard.types'
import { formatIndianCurrency } from '@/lib/api/helpers'

const OrderDetailsSlider: React.FC<OrderDetailsSliderProps> = ({ 
  isOpen, 
  onClose, 
  trackingId 
}) => {
  // Sample data - in real app, this would be fetched based on trackingId
  const orderData: OrderData = {
    trackingId: trackingId,
    customerName: "Arjun Kumar",
    phone: "9876543210",
    orderDate: "14 Jan 2025",
    amountPaid: 8458,
    items: [
      {
        id: "1",
        name: "Dining Table Chair",
        image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quantity: 2,
        unitPrice: 8458,
        weight: "12 KG/unit",
        color: "White",
        subtotal: 16916
      },
      {
        id: "2", 
        name: "Teakwood Coffee Table",
        image: "https://images.unsplash.com/photo-1543936177-12e24c26776a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quantity: 1,
        unitPrice: 10000,
        weight: "12 KG/unit",
        color: "Caramel",
        subtotal: 10000
      }
    ],
    progress: {
      manufacturing: 'completed',
      mfgQc: 'in-progress',
      packaging: 'pending',
      pkgQc: 'pending',
      shipped: 'pending'
    },
     summary: {
       totalItems: 2,
       totalWeight: "10 Kg",
       subtotalAmount: 8458,
       taxAmount: 84,
       totalAmount: 8458 // Same as subtotal as shown in reference image
     },
    activities: [
      {
        date: "Tuesday, 5 June 2024",
        description: "3 items is sent for Packaging Remaining item is pending for MFG QC",
        status: 'in-progress',
        highlight: "Remaining item is pending for MFG QC"
      },
      {
        date: "Friday, 31 May 2024",
        description: "MFG QC approved by Admin",
        status: 'completed'
      },
      {
        date: "Friday, 31 May 2024", 
        description: "Item are sent for MFG QC by staff Raman Srivastav",
        status: 'completed'
      },
      {
        date: "Tuesday, 28 May 2024",
        description: "Both items have started manufacturing",
        status: 'completed'
      }
    ]
  }


  return (
    <div className={cn(
      "fixed inset-0 z-40 transition-all duration-300 ease-in-out",
      isOpen ? "opacity-100 visible" : "opacity-0 invisible"
    )}>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-white transition-all duration-300 ease-in-out",
          isOpen ? "bg-opacity-50" : "bg-opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-[606px] bg-gray-50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out rounded-l-lg",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-[16px] h-[56px] bg-white border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h2 className="label-1 font-semibold text-gray-900 font-urbanist">
                Order Details(#{orderData.trackingId})
              </h2>
              {/* <Info className="h-4 w-4 text-gray-400" /> */}
            </div>
            <div className="flex flex-col items-end space-y-1">
              <button className="text-gray-700 hover:text-gray-900 font-bold underline font-urbanist text-sm">
                View Full Page
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-[16px] space-y-4 bg-gray-50">
            {/* Customer Info */}
            <div >
              <div className="flex items-center justify-between pb-[8px]">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-[8px]">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col ml-1">
                  <h3 className="font-bold text-gray-900 font-urbanist">{orderData.customerName}</h3>
                  <div className="body-2 text-gray-500 font-urbanist">
                    {orderData.phone} • {orderData.orderDate}
                  </div>
                </div>
                <div className="text-right ml-auto">
                  <div className="body-2 text-gray-500 font-urbanist">Amount Paid</div>
                  <div className="font-bold text-gray-900 font-urbanist">{formatIndianCurrency(orderData.amountPaid)}</div>
                </div>
              </div>
              
            </div>

            {/* Item List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
                <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Item List</h3>
                {/* <Info className="h-4 w-4 text-gray-400" /> */}
              </div>
              <div>
                {orderData.items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-start py-[8px] px-[8px]">
                      {/* Left side - Image and details (2/3 of space) */}
                      <div className="flex items-start space-x-[8px] flex-[4]">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-[50px] h-[50px] object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="body-2 text-gray-900 font-urbanist font-semibold">{item.name} <span className='text-secondary-900'>• </span> <span className='body-4'>Qty: {item.quantity}</span></div>
                          <div className="body-3 text-gray-500 font-urbanist text-sm">
                              <span className='text-black font-spectral'>₹{item.unitPrice.toLocaleString()}</span>/unit  {/*<span className='text-secondary-900'>• </span> {item.weight}  <span className='text-secondary-900'>• </span> Color: {item.color}*/}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Price and subtotal (1/3 of space) */}
                      <div className="text-right ml-4 flex-[1]">
                        <div className="body-3 text-gray-900 font-spectral font-bold">₹{item.subtotal.toLocaleString()}</div>
                        <div className="body-3 text-gray-500 font-urbanist text-sm">Subtotal</div>
                      </div>
                    </div>
                    {index < orderData.items.length - 1 && (
                      <div className="border-t border-gray-200 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 p-[8px]">
                <div className="flex items-center space-x-2">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Progress</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
                <button className="flex items-center space-x-2 px-[8px] py-[4px] border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-600 font-urbanist">View Item Wise</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              
              <div className="flex items-center py-[16px] px-[16px]">
                {/* Step 1: Manufacturing */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    orderData.progress.manufacturing === 'completed' ? "border-green-500 bg-green-50" : 
                    orderData.progress.manufacturing === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 1</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Manufacturing</div>
                    <div className="mt-1">
                      {orderData.progress.manufacturing === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {orderData.progress.manufacturing === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {orderData.progress.manufacturing === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  orderData.progress.manufacturing === 'completed' ? "bg-green-500" : "bg-gray-300"
                )} />
                
                {/* Step 2: MFG QC */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    orderData.progress.mfgQc === 'completed' ? "border-green-500 bg-green-50" : 
                    orderData.progress.mfgQc === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 2</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">MFG QC</div>
                    <div className="mt-1">
                      {orderData.progress.mfgQc === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {orderData.progress.mfgQc === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {orderData.progress.mfgQc === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  orderData.progress.mfgQc === 'completed' ? "bg-green-500" : 
                  orderData.progress.mfgQc === 'in-progress' ? "bg-yellow-500" : "bg-gray-300"
                )} />
                
                {/* Step 3: Packaging */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    orderData.progress.packaging === 'completed' ? "border-green-500 bg-green-50" : 
                    orderData.progress.packaging === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 3</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Packaging</div>
                    <div className="mt-1">
                      {orderData.progress.packaging === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {orderData.progress.packaging === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {orderData.progress.packaging === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  orderData.progress.packaging === 'completed' ? "bg-green-500" : "bg-gray-300"
                )} />
                
                {/* Step 4: PKG QC */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    orderData.progress.pkgQc === 'completed' ? "border-green-500 bg-green-50" : 
                    orderData.progress.pkgQc === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 4</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">PKG QC</div>
                    <div className="mt-1">
                      {orderData.progress.pkgQc === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {orderData.progress.pkgQc === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {orderData.progress.pkgQc === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "h-0.5 w-8",
                  orderData.progress.pkgQc === 'completed' ? "bg-green-500" : "bg-gray-300"
                )} />
                
                {/* Step 5: Ready to ship */}
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-[98px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                    orderData.progress.shipped === 'completed' ? "border-green-500 bg-green-50" : 
                    orderData.progress.shipped === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 5</div>
                    <div className="text-xs font-semibold text-gray-700 font-urbanist">Ready to ship</div>
                    <div className="mt-1">
                      {orderData.progress.shipped === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {orderData.progress.shipped === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                      {orderData.progress.shipped === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

             {/* Order Summary */}
             <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
               <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
                 <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Order Summary</h3>
                 {/* <Info className="h-4 w-4 text-gray-400" /> */}
               </div>
               
               {/* Table Structure */}
               <div className="overflow-hidden">
                 {/* Header Row */}
                 <div className="grid grid-cols-5 border-gray-200 bg-white">
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                     <div className="text-xs body-4 font-semibold text-gray-700 font-urbanist">Total Items</div>
                   </div>
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                     <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Total Weight</div>
                   </div>
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                     <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Subtotal Amount</div>
                   </div>
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                     <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Tax Amount</div>
                   </div>
                   <div className="px-[8px] py-[4px]">
                     <div className="text-xs font-medium text-gray-700 font-urbanist whitespace-nowrap">Total Amount</div>
                   </div>
                 </div>
                 
                 {/* Data Row */}
                 <div className="grid grid-cols-5 bg-white">
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                     <div className="text-base font-semibold text-gray-900 font-urbanist whitespace-nowrap">{orderData.summary.totalItems}</div>
                   </div>
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                     <div className="text-base font-semibold text-gray-900 font-urbanist whitespace-nowrap">{orderData.summary.totalWeight}</div>
                   </div>
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                      <div className="text-base font-semibold text-gray-900 font-urbanist whitespace-nowrap">₹{orderData.summary.subtotalAmount.toLocaleString()}</div>
                   </div>
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                     <div className="text-base font-semibold text-red-600 font-urbanist whitespace-nowrap">₹{orderData.summary.taxAmount.toLocaleString()}</div>
                   </div>
                   <div className="px-[8px] py-[4px]">
                     <div className="text-base font-semibold text-green-600 font-urbanist whitespace-nowrap">₹{orderData.summary.totalAmount.toLocaleString()}</div>
                   </div>
                 </div>
               </div>
             </div>
            {/* Latest Activity */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 p-[8px] ">
                <div className="flex items-center space-x-2">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Latest Activity</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              {/* Vertical Timeline */}
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-green-500"></div>
                
                <div className="space-y-6">
                  {orderData.activities.map((activity, index) => (
                    <div key={index} className="relative flex items-start">
                      {/* Timeline Icon */}
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white">
                        {activity.status === 'completed' && (
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {activity.status === 'in-progress' && (
                          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        )}
                        {activity.status === 'pending' && (
                          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      
                      {/* Activity Content */}
                      <div className="ml-4 flex-1">
                        <div className="body-4 text-gray-900 font-urbanist leading-5">
                          {activity.highlight ? (
                            <span>
                              {activity.description.split(activity.highlight)[0]}
                              <span className="body-4 text-yellow-800 px-1 py-0.5 rounded text-xs font-medium">
                                {activity.highlight}
                              </span>
                              {activity.description.split(activity.highlight)[1]}
                            </span>
                          ) : (
                            activity.description
                          )}
                        </div>
                        <div className="body-4 text-gray-500 font-urbanist mt-1">
                          {activity.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsSlider
