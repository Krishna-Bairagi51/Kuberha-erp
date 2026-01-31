"use client"
import React, { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  ChevronDown,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminSaleOrderItem, AdminActivityLogItem } from '@/components/features/orders/types/orders.types'
import { formatIndianCurrency } from '@/lib/api/helpers/number'

interface OrderSummarySliderProps {
  isOpen: boolean
  onClose: () => void
  order: AdminSaleOrderItem | null
  onSliderStateChange?: (isOpen: boolean) => void
  onViewFullPage?: (orderId?: number | string) => void
}

interface OrderItem {
  id: string
  name: string
  image: string
  quantity: number
  unitPrice: number
  weight: string
  color: string
  subtotal: number
  status: string
  mfgQcStatus?: string
  packagingQcStatus?: string
  sellerName?: string
}

interface OrderData {
  trackingId: string
  customerName: string
  phone: string
  orderDate: string
  amountPaid: number
  orderStatus: string
  items: OrderItem[]
  progress: {
    manufacturing: 'completed' | 'in-progress' | 'pending'
    mfgQc: 'completed' | 'in-progress' | 'pending'
    packaging: 'completed' | 'in-progress' | 'pending'
    pkgQc: 'completed' | 'in-progress' | 'pending'
    shipped: 'completed' | 'in-progress' | 'pending'
  }
  summary: {
    totalItems: number
    totalWeight: string
    subtotalAmount: number
    taxAmount: number
    totalAmount: number
    discount: number
    shippingCost: number
  }
  activities: {
    date: string
    description: string
    status: 'completed' | 'in-progress' | 'pending'
    highlight?: string
    createdBy?: string
    approvedBy?: string
    images?: string[]
    qcStatus?: string
  }[]
}

const OrderSummarySlider: React.FC<OrderSummarySliderProps> = ({ 
  isOpen, 
  onClose, 
  order,
  onSliderStateChange,
  onViewFullPage
}) => {
  // State for progress view toggle - default to combined if only 1 item
  const [progressView, setProgressView] = React.useState<'combined' | 'item-wise'>('item-wise')

  // Notify parent component when slider state changes
  useEffect(() => {
    onSliderStateChange?.(isOpen)
  }, [isOpen, onSliderStateChange])

  // Handle close with state notification
  const handleClose = () => {
    onClose()
    onSliderStateChange?.(false)
  }

  // Helper function to map order line statuses to progress stages
  const getProgressFromOrderLines = (orderLines: any[]): {
    manufacturing: 'completed' | 'in-progress' | 'pending'
    mfgQc: 'completed' | 'in-progress' | 'pending'
    packaging: 'completed' | 'in-progress' | 'pending'
    pkgQc: 'completed' | 'in-progress' | 'pending'
    shipped: 'completed' | 'in-progress' | 'pending'
  } => {
    type ProgressStage = 'completed' | 'in-progress' | 'pending'
    type ProgressType = {
      manufacturing: ProgressStage
      mfgQc: ProgressStage
      packaging: ProgressStage
      pkgQc: ProgressStage
      shipped: ProgressStage
    }
    
    // Define default progress
    const defaultProgress: ProgressType = {
      manufacturing: 'pending',
      mfgQc: 'pending',
      packaging: 'pending',
      pkgQc: 'pending',
      shipped: 'pending'
    }
    
    // If no order lines, return default
    if (!orderLines || orderLines.length === 0) {
      return defaultProgress
    }
    
    // Define status order for comparison
    const statusOrder = ['new', 'manufacture', 'mfg_qc', 'packaging', 'pkg_qc', 'shipping', 'shipped', 'delivered']
    
    // Find the minimum (earliest) status across all order lines
    let minStatusIndex = statusOrder.length - 1
    orderLines.forEach(line => {
      const lineStatus = (line.status || 'new').toLowerCase()
      const statusIndex = statusOrder.indexOf(lineStatus)
      if (statusIndex !== -1 && statusIndex < minStatusIndex) {
        minStatusIndex = statusIndex
      }
    })
    
    const currentStatus = statusOrder[minStatusIndex] || 'new'
    
    // Helper function to get progress for a single status
    const getProgressForStatus = (status: string): ProgressType => {
      const statusLower = status.toLowerCase()
      
      // Define progress stages based on status
      const statusMap: Record<string, ProgressType> = {
        'new': {
          manufacturing: 'in-progress',
          mfgQc: 'pending',
          packaging: 'pending',
          pkgQc: 'pending',
          shipped: 'pending'
        },
        // "manufacture" status: Manufacturing finalized, MFG QC is pending (grey) waiting for QC submission
        'manufacture': {
          manufacturing: 'completed',
          mfgQc: 'pending',
          packaging: 'pending',
          pkgQc: 'pending',
          shipped: 'pending'
        },
        'mfg_qc': {
          manufacturing: 'completed',
          mfgQc: 'completed',
          packaging: 'in-progress',
          pkgQc: 'pending',
          shipped: 'pending'
        },
        'packaging': {
          manufacturing: 'completed',
          mfgQc: 'completed',
          packaging: 'completed',
          pkgQc: 'pending',
          shipped: 'pending'
        },
        'pkg_qc': {
          manufacturing: 'completed',
          mfgQc: 'completed',
          packaging: 'completed',
          pkgQc: 'completed',
          shipped: 'pending'
        },
        'shipping': {
          manufacturing: 'completed',
          mfgQc: 'completed',
          packaging: 'completed',
          pkgQc: 'completed',
          shipped: 'completed'
        },
        // "shipped" status: Shipping completed
        'shipped': {
          manufacturing: 'completed',
          mfgQc: 'completed',
          packaging: 'completed',
          pkgQc: 'completed',
          shipped: 'completed'
        },
        // "delivered" status: All steps completed
        'delivered': {
          manufacturing: 'completed',
          mfgQc: 'completed',
          packaging: 'completed',
          pkgQc: 'completed',
          shipped: 'completed'
        }
      }

      return statusMap[statusLower] || defaultProgress
    }
    
    let progress = getProgressForStatus(currentStatus)
    
    // Check for QC rejections in order lines and adjust progress accordingly
    const hasMfgQcRejection = orderLines.some(line => {
      const mfgQcStatus = (line as any).mfg_qc_status
      return mfgQcStatus && mfgQcStatus.toLowerCase() === 'rejected'
    })
    
    const hasPkgQcRejection = orderLines.some(line => {
      const packagingQcStatus = (line as any).packaging_qc_status
      return packagingQcStatus && packagingQcStatus.toLowerCase() === 'rejected'
    })
    
    // If MFG QC is rejected, ensure packaging stays pending
    if (hasMfgQcRejection) {
      progress.packaging = 'pending'
    }
    
    // If PKG QC is rejected, ensure shipping stays pending
    if (hasPkgQcRejection) {
      progress.shipped = 'pending'
    }
    
    // If any order line has MFG QC pending, show Step 2 as in-progress and keep next step pending
    const hasMfgQcPending = orderLines.some(line => {
      const mfgQcStatus = (line as any).mfg_qc_status
      return mfgQcStatus && mfgQcStatus.toLowerCase() === 'pending'
    })
    if (hasMfgQcPending) {
      progress.mfgQc = 'in-progress'
      // Do not move to packaging until MFG QC is approved
      if (progress.packaging !== 'completed') {
        progress.packaging = 'pending'
      }
    }

    // If any order line has PKG QC pending, show Step 4 as in-progress and keep next step pending
    const hasPkgQcPending = orderLines.some(line => {
      const packagingQcStatus = (line as any).packaging_qc_status
      return packagingQcStatus && packagingQcStatus.toLowerCase() === 'pending'
    })
    if (hasPkgQcPending) {
      progress.pkgQc = 'in-progress'
      // Do not move to shipped until PKG QC is approved
      if (progress.shipped !== 'completed') {
        progress.shipped = 'pending'
      }
    }
    
    return progress
  }

  // Helper function to get progress for a single item
  const getProgressForSingleItem = (status: string, mfgQcStatus?: string, packagingQcStatus?: string): {
    manufacturing: 'completed' | 'in-progress' | 'pending'
    mfgQc: 'completed' | 'in-progress' | 'pending'
    packaging: 'completed' | 'in-progress' | 'pending'
    pkgQc: 'completed' | 'in-progress' | 'pending'
    shipped: 'completed' | 'in-progress' | 'pending'
  } => {
    const statusLower = status.toLowerCase()
    
    type ProgressStage = 'completed' | 'in-progress' | 'pending'
    type ProgressType = {
      manufacturing: ProgressStage
      mfgQc: ProgressStage
      packaging: ProgressStage
      pkgQc: ProgressStage
      shipped: ProgressStage
    }
    
    const defaultProgress: ProgressType = {
      manufacturing: 'pending',
      mfgQc: 'pending',
      packaging: 'pending',
      pkgQc: 'pending',
      shipped: 'pending'
    }
    
    const statusMap: Record<string, ProgressType> = {
      'new': {
        manufacturing: 'in-progress',
        mfgQc: 'pending',
        packaging: 'pending',
        pkgQc: 'pending',
        shipped: 'pending'
      },
      // "manufacture" status: Manufacturing finalized, MFG QC is pending (grey) waiting for QC submission
      'manufacture': {
        manufacturing: 'completed',
        mfgQc: 'pending',
        packaging: 'pending',
        pkgQc: 'pending',
        shipped: 'pending'
      },
      'mfg_qc': {
        manufacturing: 'completed',
        mfgQc: 'pending',
        packaging: 'pending',
        pkgQc: 'pending',
        shipped: 'pending'
      },
      // "packaging" status: Packing finished, PKG QC is pending (grey) waiting for QC submission
      'packaging': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'pending',
        pkgQc: 'pending',
        shipped: 'pending'
      },
      // "pkg_qc" status: Packing QC approved, PKG QC is completed (green), ready for shipping
      'pkg_qc': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'pending',
        shipped: 'pending'
      },
      // "shipping" status: Shipping completed
      'shipping': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'completed'
      },
      // "shipped" status: Shipping completed
      'shipped': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'completed'
      },
      // "delivered" status: All steps completed
      'delivered': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'completed'
      }
    }

    // Get base progress from status
    let progress = statusMap[statusLower] || defaultProgress

    // Override QC statuses if they have values
    if (mfgQcStatus && mfgQcStatus.trim() !== '') {
      const mfgQcStatusLower = mfgQcStatus.toLowerCase()
      if (mfgQcStatusLower === 'pending') {
        progress.mfgQc = 'in-progress' // Show as in-progress (yellow) when pending
        // Don't activate next step (packaging) until MFG QC is approved
        progress.packaging = 'pending'
      } else if (mfgQcStatusLower === 'approved' || mfgQcStatusLower === 'completed') {
        progress.mfgQc = 'completed'
        // Now activate the next step (packaging) when MFG QC is approved
        if (progress.packaging === 'pending') {
          progress.packaging = 'in-progress'
        }
      } else if (mfgQcStatusLower === 'in-progress' || mfgQcStatusLower === 'in_progress') {
        progress.mfgQc = 'in-progress'
        // Don't activate next step until approved
        progress.packaging = 'pending'
      } else if (mfgQcStatusLower === 'rejected') {
        // When MFG QC is rejected, ensure next step (packaging) is pending
        progress.packaging = 'pending'
      }
    }

    if (packagingQcStatus && packagingQcStatus.trim() !== '') {
      const packagingQcStatusLower = packagingQcStatus.toLowerCase()
      if (packagingQcStatusLower === 'pending') {
        progress.pkgQc = 'in-progress' // Show as in-progress (yellow) when pending
        // Don't activate next step (shipping) until PKG QC is approved
        progress.shipped = 'pending'
      } else if (packagingQcStatusLower === 'approved' || packagingQcStatusLower === 'completed') {
        progress.pkgQc = 'completed'
        // Now activate the next step (shipping) when PKG QC is approved
        if (progress.shipped === 'pending') {
          progress.shipped = 'in-progress'
        }
      } else if (packagingQcStatusLower === 'in-progress' || packagingQcStatusLower === 'in_progress') {
        progress.pkgQc = 'in-progress'
        // Don't activate next step until approved
        progress.shipped = 'pending'
      } else if (packagingQcStatusLower === 'rejected') {
        // When PKG QC is rejected, ensure next step (shipping) is pending
        progress.shipped = 'pending'
      }
    }

    return progress
  }

  // Helper function to format status for display
  const formatStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string, color: string, bgColor: string }> = {
      'new': { label: 'New Order', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
      'manufacturing': { label: 'In Manufacturing', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
      'mfg_qc': { label: 'MFG QC', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
      'packaging': { label: 'Packaging', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
      'pkg_qc': { label: 'PKG QC', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' },
      'ready_to_ship': { label: 'Ready to Ship', color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-200' },
      'shipped': { label: 'Ready to ship', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
      'delivered': { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
      'cancelled': { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' }
    }

    const statusLower = status.toLowerCase()
    return statusMap[statusLower] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' }
  }
  
  // Transform order data to match the slider format
  const orderData: OrderData = order ? {
    trackingId: order.name || "N/A",
    customerName: order.customer_name === "NA" ? "N/A" : (order.customer_name || "N/A"),
    phone: order.customer_mobile === "NA" ? "N/A" : (order.customer_mobile || "N/A"),
    orderDate: order.date ? new Date(order.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) : "N/A",
    amountPaid: order.total_amount || 0,
    orderStatus: order.status || "new",
    items: order.order_line && order.order_line.length > 0 ? order.order_line.map((line, index) => ({
      id: line.product_id.toString(),
      name: line.product_name || "N/A",
      image: line.product_image || "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      quantity: line.product_uom_qty || 0,
      unitPrice: line.price_unit || 0,
      weight: line.weight && line.weight_unit ? `${line.weight} ${line.weight_unit}/unit` : "N/A",
      color: line.sku_name || "N/A",
      subtotal: line.price_subtotal || 0,
      status: line.status || "new",
      mfgQcStatus: (line as any).mfg_qc_status || "",
      packagingQcStatus: (line as any).packaging_qc_status || "",
      sellerName: (line as any).seller_name || ""
    })) : [
      {
        id: order.id.toString(),
        name: "No products",
        image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        quantity: 0,
        unitPrice: 0,
        weight: "N/A",
        color: "N/A",
        subtotal: 0,
        status: "new"
      }
    ],
    progress: getProgressFromOrderLines(order.order_line || []),
    summary: {
      totalItems: order.order_line ? order.order_line.reduce((sum, line) => sum + (line.product_uom_qty || 0), 0) : 0,
      totalWeight: order.order_line && order.order_line.length > 0 
        ? `${order.order_line.reduce((sum, line) => sum + ((line.weight || 0) * (line.product_uom_qty || 0)), 0)} ${order.order_line[0]?.weight_unit || 'Kg'}` 
        : "0 Kg",
      subtotalAmount: order.subtotal_amount || 0,
      taxAmount: order.tax_amount || 0,
      totalAmount: order.total_amount || 0,
      discount: order.discount || 0,
      shippingCost: order.shipping_cost || 0
    },
    activities: order.activity_log && order.activity_log.length > 0 
      ? order.activity_log.map((activity: AdminActivityLogItem) => {
          // Format the created_on date
          const activityDate = activity.created_on 
            ? new Date(activity.created_on).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }) + ', ' + new Date(activity.created_on).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A"
          
          // Map activity type to readable label
          const typeMap: Record<string, string> = {
            'new': 'New Order',
            'manufacture': 'Manufacturing',
            'mfg_qc': 'MFG QC',
            'packaging': 'Packaging',
            'pkg_qc': 'PKG QC',
            'ready_to_ship': 'Ready to Ship',
            'shipped': 'Ready to ship',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
          }
          const activityType = activity.type?.toLowerCase() || ''
          const typeLabel = typeMap[activityType] || activity.type || 'Activity'
          
          // Build description with note
          const description = activity.note 
            ? `${typeLabel} - ${activity.note}` 
            : typeLabel
          
          // Determine status based on type progression
          const getActivityStatus = (type: string) => {
            const statusOrder = ['new', 'manufacture', 'mfg_qc', 'packaging', 'pkg_qc', 'ready_to_ship', 'shipped', 'delivered']
            const currentIndex = statusOrder.indexOf(type?.toLowerCase())
            const orderIndex = statusOrder.indexOf(order.status?.toLowerCase() || 'new')
            
            if (currentIndex <= orderIndex) return 'completed'
            if (currentIndex === orderIndex + 1) return 'in-progress'
            return 'pending'
          }
          
          return {
            date: activityDate,
            description: description,
            status: getActivityStatus(activity.type || ''),
            highlight: activity.approved_by ? `Approved by: ${activity.approved_by}` : undefined,
            createdBy: activity.created_by || 'N/A',
            approvedBy: activity.approved_by || 'N/A',
            images: activity.image || [],
            qcStatus: activity.qc_status
          }
        })
      : []
  } : {
    trackingId: "",
    customerName: "",
    phone: "",
    orderDate: "",
    amountPaid: 0,
    orderStatus: "new",
    items: [],
    progress: {
      manufacturing: 'pending',
      mfgQc: 'pending',
      packaging: 'pending',
      pkgQc: 'pending',
      shipped: 'pending'
    },
    summary: {
      totalItems: 0,
      totalWeight: "0 Kg",
      subtotalAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      discount: 0,
      shippingCost: 0
    },
    activities: []
  }

  const statusDisplay = formatStatusDisplay(orderData.orderStatus)

  // Helper function for QC status badge
  const getQcStatusBadge = (qcStatus?: string) => {
    const normalized = (qcStatus || '').toLowerCase()
    if (!normalized) return null
    if (normalized === 'approved') return { label: 'Approved', style: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', color: '#059669' } }
    if (normalized === 'rejected') return { label: 'Rejected', style: { backgroundColor: '#FEE2E2', borderColor: '#FECACA', color: '#DC2626' } }
    return { label: 'Pending', style: { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' } }
  }

  if (!order) return null

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
        onClick={handleClose}
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
              <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist" style={{ backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }}>
                {statusDisplay.label}
              </span>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <button 
                onClick={() => onViewFullPage?.(order?.id)}
                className="text-gray-700 hover:text-gray-900 font-bold underline font-urbanist text-sm"
              >
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
                  <div className="font-bold text-gray-900 font-urbanist">{formatIndianCurrency(orderData.amountPaid || 0)}</div>
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
                          <div className="body-2 text-gray-900 font-urbanist font-semibold flex items-center gap-2 flex-wrap">
                            <span>{item.name}</span>
                            <span className='text-secondary-900'>• </span>
                            <span className='body-4'>Qty: {item.quantity}</span>
                          </div>
                          <div className="body-3 text-gray-500 font-urbanist text-sm">
                              <span className='text-black font-urbanist'>{formatIndianCurrency(item.unitPrice || 0)}</span>/unit  {/*<span className='text-secondary-900'>• </span> {item.weight}  <span className='text-secondary-900'>• </span> Color: {item.color}*/}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Price and subtotal (1/3 of space) */}
                      <div className="text-right ml-4 flex-[1]">
                        <div className="body-3 text-gray-900 font-urbanist font-bold">{formatIndianCurrency(item.subtotal || 0)}</div>
                        <div className="body-3 text-gray-500 font-urbanist text-sm">Subtotal</div>
                      </div>
                    </div>
                    {/* Supplier Information */}
                    {item.sellerName && (
                      <div className="flex justify-between items-center px-[8px] pb-[8px] border-b border-gray-100">
                        <span className="text-gray-900 font-semibold font-urbanist body-4">
                          Assigned Supplier:
                        </span>
                        <span className="text-gray-600 font-urbanist body-3">
                          {item.sellerName}
                        </span>
                      </div>
                    )}
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
                {/* Only show dropdown if there are multiple items */}
                {orderData.items.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-2 px-[8px] py-[4px] border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="text-sm text-secondary-900 font-urbanist font-medium">
                        {progressView === 'combined' ? 'Combined' : 'Item Wise'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-secondary-900" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                      <DropdownMenuItem
                        onClick={() => setProgressView('combined')}
                        className={cn(
                          "cursor-pointer focus:bg-gray-100 focus:text-gray-900",
                          progressView === 'combined' && "bg-secondary-900 text-white font-semibold"
                        )}
                      >
                        Combined
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setProgressView('item-wise')}
                        className={cn(
                          "cursor-pointer focus:bg-gray-100 focus:text-gray-900",
                          progressView === 'item-wise' && "bg-secondary-900 text-white font-semibold"
                        )}
                      >
                        Item Wise
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Combined Progress View - Always show for single item, or when combined is selected */}
              {(progressView === 'combined' || orderData.items.length === 1) && (
                <div className="flex items-center py-[16px] px-[16px]">
                  {/* Step 1: Manufacturing */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className={cn(
                      "w-[110px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
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
                      "w-[110px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                      orderData.items.some(item => item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ? "border-red-500 bg-red-50" :
                      orderData.progress.mfgQc === 'completed' ? "border-green-500 bg-green-50" : 
                      orderData.progress.mfgQc === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                    )}>
                      <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 2</div>
                      <div className="text-xs font-semibold text-gray-700 font-urbanist">MFG QC</div>
                      <div className="mt-1">
                        {orderData.items.some(item => item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') && <AlertCircle className="h-6 w-6 text-red-500" />}
                        {!orderData.items.some(item => item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') && orderData.progress.mfgQc === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                        {!orderData.items.some(item => item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') && orderData.progress.mfgQc === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                        {!orderData.items.some(item => item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') && orderData.progress.mfgQc === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "h-0.5 w-8",
                    orderData.items.some(item => item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ? "bg-gray-300" :
                    orderData.progress.mfgQc === 'completed' ? "bg-green-500" : 
                    orderData.progress.mfgQc === 'in-progress' ? "bg-yellow-500" : "bg-gray-300"
                  )} />
                  
                  {/* Step 3: PKG QC */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className={cn(
                      "w-[110px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                      orderData.items.some(item => item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') ? "border-red-500 bg-red-50" :
                      orderData.progress.pkgQc === 'completed' ? "border-green-500 bg-green-50" : 
                      orderData.progress.pkgQc === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                    )}>
                      <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 3</div>
                      <div className="text-xs font-semibold text-gray-700 font-urbanist">PKG QC</div>
                      <div className="mt-1">
                        {orderData.items.some(item => item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') && <AlertCircle className="h-6 w-6 text-red-500" />}
                        {!orderData.items.some(item => item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') && orderData.progress.pkgQc === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                        {!orderData.items.some(item => item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') && orderData.progress.pkgQc === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                        {!orderData.items.some(item => item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') && orderData.progress.pkgQc === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "h-0.5 w-8",
                    orderData.items.some(item => item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') ? "bg-gray-300" :
                    orderData.progress.pkgQc === 'completed' ? "bg-green-500" : "bg-gray-300"
                  )} />
                  
                  {/* Step 4: Ready to ship */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className={cn(
                      "w-[110px] h-[80px] rounded-lg border-2 flex flex-col items-center justify-center p-2",
                      orderData.progress.shipped === 'completed' ? "border-green-500 bg-green-50" : 
                      orderData.progress.shipped === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                    )}>
                      <div className="text-xs font-semibold text-gray-700 font-urbanist">Step 4</div>
                      <div className="text-xs font-semibold text-gray-700 font-urbanist">Ready to ship</div>
                      <div className="mt-1">
                        {orderData.progress.shipped === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                        {orderData.progress.shipped === 'in-progress' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                        {orderData.progress.shipped === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Item Wise Progress View - Only show for multiple items when item-wise is selected */}
              {progressView === 'item-wise' && orderData.items.length > 1 && (
                <div className="py-[16px] px-[16px] space-y-6">
                  {orderData.items.map((item, itemIndex) => {
                    const itemProgress = getProgressForSingleItem(item.status, item.mfgQcStatus, item.packagingQcStatus)
                    
                    // Calculate completed steps (only 4 steps: Manufacturing, MFG QC, PKG QC, Ready to ship)
                    const completedSteps = [
                      itemProgress.manufacturing,
                      itemProgress.mfgQc,
                      itemProgress.pkgQc,
                      itemProgress.shipped
                    ].filter(status => status === 'completed').length
                    
                    // Get current status label
                    const getCurrentStatusLabel = () => {
                      // Check for rejected status first
                      if (item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') return 'MFG QC Rejected'
                      if (item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') return 'PKG QC Rejected'
                      
                      if (itemProgress.manufacturing === 'in-progress') return 'Pending Manufacturing'
                      if (itemProgress.mfgQc === 'in-progress') return 'Pending MFG QC'
                      if (itemProgress.pkgQc === 'in-progress') return 'Pending PKG QC'
                      if (itemProgress.shipped === 'in-progress') return 'Pending Shipment'
                      if (itemProgress.shipped === 'completed') return 'Completed'
                      return 'New Order'
                    }
                    
                    return (
                      <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        {/* Item Header with Image and Name */}
                        <div className="flex items-center gap-3 mb-4">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="body-2 font-semibold text-gray-900 font-urbanist">
                              {item.name} • Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                        
                        {/* Supplier Information */}
                        {item.sellerName && (
                          <div className="flex justify-between items-center mb-4 border-t border-gray-100 pt-3">
                            <span className="text-gray-900 font-semibold font-urbanist body-4">
                              Assigned Supplier:
                            </span>
                            <span className="text-gray-600 font-urbanist body-3">
                              {item.sellerName}
                            </span>
                          </div>
                        )}
                        
                        {/* Progress Header */}
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 font-urbanist">
                            {completedSteps} of 4 steps completed
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative mb-4">
                          {/* Progress Line */}
                          <div className={cn(
                            "absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2",
                            (item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ||
                            (item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected')
                              ? "bg-red-300" : "bg-gray-300"
                          )}></div>
                          
                          {/* Progress Fill */}
                          <div 
                            className={cn(
                              "absolute top-1/2 left-0 h-0.5 transform -translate-y-1/2 transition-all duration-300",
                              (item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ||
                              (item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected')
                                ? "bg-red-500" : "bg-green-500"
                            )}
                            style={{ width: `${(completedSteps / 4) * 100}%` }}
                          ></div>
                          
                          {/* Step Indicators */}
                          <div className="relative flex justify-between">
                            {/* Step 1: Manufacturing */}
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white",
                                itemProgress.manufacturing === 'completed' ? "border-green-500" : 
                                itemProgress.manufacturing === 'in-progress' ? "border-yellow-500" : "border-gray-300"
                              )}>
                                {itemProgress.manufacturing === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {itemProgress.manufacturing === 'in-progress' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                {itemProgress.manufacturing === 'pending' && <span className="text-xs font-semibold text-gray-400">1</span>}
                              </div>
                            </div>
                            
                            {/* Step 2: MFG QC */}
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white",
                                itemProgress.mfgQc === 'completed' ? "border-green-500" : 
                                itemProgress.mfgQc === 'in-progress' ? "border-yellow-500" : 
                                (item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') ? "border-red-500" : "border-gray-300"
                              )}>
                                {itemProgress.mfgQc === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {itemProgress.mfgQc === 'in-progress' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                {(item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') && <AlertCircle className="h-4 w-4 text-red-500" />}
                                {itemProgress.mfgQc === 'pending' && !(item.mfgQcStatus && item.mfgQcStatus.toLowerCase() === 'rejected') && <span className="text-xs font-semibold text-gray-400">2</span>}
                              </div>
                            </div>
                            
                            {/* Step 3: PKG QC */}
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white",
                                itemProgress.pkgQc === 'completed' ? "border-green-500" : 
                                itemProgress.pkgQc === 'in-progress' ? "border-yellow-500" : 
                                (item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') ? "border-red-500" : "border-gray-300"
                              )}>
                                {itemProgress.pkgQc === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {itemProgress.pkgQc === 'in-progress' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                {(item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') && <AlertCircle className="h-4 w-4 text-red-500" />}
                                {itemProgress.pkgQc === 'pending' && !(item.packagingQcStatus && item.packagingQcStatus.toLowerCase() === 'rejected') && <span className="text-xs font-semibold text-gray-400">3</span>}
                              </div>
                            </div>
                            
                            {/* Step 4: Shipping */}
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white",
                                itemProgress.shipped === 'completed' ? "border-green-500" : 
                                itemProgress.shipped === 'in-progress' ? "border-yellow-500" : "border-gray-300"
                              )}>
                                {itemProgress.shipped === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {itemProgress.shipped === 'in-progress' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                {itemProgress.shipped === 'pending' && <span className="text-xs font-semibold text-gray-400">4</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-urbanist">Status:</span>
                            <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full border font-urbanist" 
                                  style={(() => {
                                    const status = getCurrentStatusLabel()
                                    if (status === 'MFG QC Rejected' || status === 'PKG QC Rejected') {
                                      return { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#DC2626' }
                                    }
                                    return { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }
                                  })()}>
                              {getCurrentStatusLabel()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
                      <div className="text-base font-semibold text-gray-900 font-urbanist whitespace-nowrap">{formatIndianCurrency(orderData.summary.subtotalAmount || 0)}</div>
                   </div>
                   <div className="px-[8px] py-[4px] border-r border-gray-200">
                     <div className="text-base font-semibold text-red-600 font-urbanist whitespace-nowrap">{formatIndianCurrency(orderData.summary.taxAmount || 0)}</div>
                   </div>
                   <div className="px-[8px] py-[4px]">
                     <div className="text-base font-semibold text-green-600 font-urbanist whitespace-nowrap">{formatIndianCurrency(orderData.summary.totalAmount || 0)}</div>
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
              {/* Vertical Timeline - Fixed Height and Scroll */}
              <div className="relative h-90 overflow-y-auto scrollbar-hide">
                {orderData.activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <div className="text-gray-400 mb-2">
                      <Clock className="h-12 w-12" />
                    </div>
                    <p className="text-gray-500 font-urbanist text-sm">No data found</p>
                  </div>
                ) : (
                  <div className="relative pb-4 px-4">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-500"></div>
                    
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
                            <div className="body-3 text-gray-900 font-urbanist leading-5 font-semibold">
                              {activity.description}
                            </div>
                            
                            {/* QC Status Badge */}
                            {(() => {
                              const qcBadge = getQcStatusBadge(activity.qcStatus)
                              return qcBadge ? (
                                <div className="mt-1">
                                  <span
                                    className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-md border font-urbanist"
                                    style={qcBadge.style}
                                  >
                                    {qcBadge.label}
                                  </span>
                                </div>
                              ) : null
                            })()}
                            
                            {/* Created By and Approved By */}
                            {(activity.createdBy || activity.approvedBy) && (
                              <div className="mt-1 flex items-center gap-3 flex-wrap">
                                {activity.createdBy && activity.createdBy !== 'N/A' && (
                                  <span className="body-4 text-gray-600 font-urbanist">
                                    Created by: <span className="font-semibold text-gray-900">{activity.createdBy}</span>
                                  </span>
                                )}
                                {activity.approvedBy && activity.approvedBy !== 'N/A' && (
                                  <span className="body-4 text-green-600 font-urbanist">
                                    Approved by: <span className="font-semibold">{activity.approvedBy}</span>
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="body-4 text-gray-500 font-urbanist mt-1">
                              {activity.date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSummarySlider

