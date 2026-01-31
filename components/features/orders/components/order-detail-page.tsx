"use client"
import React, { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Clock, Copy, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIndianCurrency } from '@/lib/api/helpers/number'
import { formatDateTime, formatOrderDate } from '@/lib/api/helpers/misc'
import { useOrderDetailQuery, useInvalidateOrdersQueries } from '../hooks/use-orders-query'
import { useOrderActions } from '../hooks/use-order-actions'
import type { 
  Order, 
  OrderDetailPageProps, 
  OrderItem,
  QCData 
} from '../types/orders.types'
import type { ActivityLog } from '@/types/shared'
import { toast } from 'sonner'
import StageUpdateActionSlider from './StageUpdate-action-slider'
import { StartPackagingQC } from './start-packaging-qc'
import PageHeader from '@/components/shared/layout/page-header'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { mapQcData } from '@/lib/api/helpers/types'
import { ShippingDetails } from './shipping-details'
import { OrderItemCard } from './order-item-card'
import { 
  normalizeQcDataToOrderItem, 
  toQcDataItems, 
  getProgressFromOrderLines,
  formatStatusDisplay,
  type StageQcDataItem 
} from '../utils/order-helpers'

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
  address: string
  paymentMode: string
  paymentReference: string
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

const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ order, onRefresh, onSliderStateChange, onBackToList }) => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
    const containers = document.querySelectorAll(".min-h-screen, .overflow-y-auto, .scrollable, .scrollbar-hide")
    containers.forEach((el) => {
      if (el instanceof HTMLElement) el.scrollTop = 0
    })
  }, [])

  // Get user type synchronously to prevent cache misses
  const userType = React.useMemo(() => {
    if (typeof window === 'undefined') return 'seller'
    return (localStorage.getItem('user_type') as 'seller' | 'admin') || 'seller'
  }, [])

  // TanStack Query for order details - cached and shared across components
  // Use the unified hook that automatically selects the correct API based on user type
  const { 
    data: orderDetailsData, 
    isLoading: isLoadingOrderDetails,
    isFetching: isFetchingOrderDetails,
    error: orderDetailsError 
  } = useOrderDetailQuery(
    order?.id ?? null, 
    userType,
    !!order?.id
  )
  
  const { invalidateOrder } = useInvalidateOrdersQueries()

  // Local state to track current order - allows optimistic updates
  // Query data is source of truth, but we can update locally for instant feedback
  const [currentOrder, setCurrentOrder] = React.useState<Order>(order)
  
  // Sync local state with query data when it changes
  React.useEffect(() => {
    if (orderDetailsData) {
      setCurrentOrder(orderDetailsData)
    } else if (order) {
      setCurrentOrder(order)
    }
  }, [orderDetailsData, order])

  // Combined loading state
  const isLoading = isLoadingOrderDetails || isFetchingOrderDetails
  const error = orderDetailsError ? (orderDetailsError instanceof Error ? orderDetailsError.message : "Failed to fetch order details. Please try again.") : null

  // State for stage update slider
  const [isStageSliderOpen, setIsStageSliderOpen] = React.useState(false)
  const [selectedStage, setSelectedStage] = React.useState<'manufacturing' | 'packaging'>('manufacturing')
  const [selectedItem, setSelectedItem] = React.useState<{
    id: string,
    name: string,
    orderLineId: number,
    quantity: number,
    unitPrice: number,
    weight: string,
    color: string,
    subtotal: number,
    image?: string,
    status: string,
    mfgQcStatus?: string,
    packagingQcStatus?: string,
    mfgQcData?: QCData[],
    packagingQcData?: QCData[]
  } | null>(null)

  // State for StartPackagingQC component
  const [showShippingContainer, setShowShippingContainer] = React.useState(false)

  // Use custom hook for order actions
  const {
    handleManufacturingFinalized,
    fetchShippingData,
    shippingData,
    isLoadingShipping,
    handlePrintReceipt,
    isPrintingReceipt,
    handleCopyDetails: copyDetailsToClipboard
  } = useOrderActions({ orderId: order?.id, userType })

  // Notify parent component when stage slider state changes
  React.useEffect(() => {
    onSliderStateChange?.(isStageSliderOpen)
  }, [isStageSliderOpen, onSliderStateChange])

  // Show error toast if query fails
  React.useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`)
    }
  }, [error])

  // Shipping data is automatically fetched by TanStack Query in useOrderActions
  // No manual useEffect needed


  // Handler for Submit for QC button (Manufacturing)
  const handleSubmitManufacturingQC = (item: OrderItem) => {
    setSelectedStage('manufacturing')
    setSelectedItem({
      id: item.id,
      name: item.name,
      orderLineId: item.orderLineId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      weight: item.weight,
      color: item.color,
      subtotal: item.subtotal,
      image: item.image,
      status: item.status,
      mfgQcStatus: item.mfgQcStatus,
      packagingQcStatus: item.packagingQcStatus,
      mfgQcData: item.mfgQcData,
      packagingQcData: item.packagingQcData
    })
    setIsStageSliderOpen(true)
    onSliderStateChange?.(true)
  }

  // Handler for Submit for QC button (Packing)
  const handleSubmitPackingQC = (item: OrderItem) => {
    setSelectedStage('packaging')
    setSelectedItem({
      id: item.id,
      name: item.name,
      orderLineId: item.orderLineId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      weight: item.weight,
      color: item.color,
      subtotal: item.subtotal,
      image: item.image,
      status: item.status,
      mfgQcStatus: item.mfgQcStatus,
      packagingQcStatus: item.packagingQcStatus,
      mfgQcData: item.mfgQcData,
      packagingQcData: item.packagingQcData
    })
    setIsStageSliderOpen(true)
    onSliderStateChange?.(true)
  }

  // Handler for Create Shipping Order button
  const handleStartShipping = (itemId: string, orderLineId: number) => {
    setShowShippingContainer(true)
  }

  // Handler for stage slider submission
  const handleStageSliderSubmit = async (data: { imagesBase64: string[], note?: string }) => {
    try {
      toast.success(`Images uploaded successfully for ${selectedStage} QC`)

      // Close the slider
      setIsStageSliderOpen(false)
      setSelectedItem(null)

      // Refresh the order data
      if (order?.id && userType) {
        invalidateOrder(order.id, userType)
      }

    } catch (error) {
      toast.error("Failed to upload files. Please try again.")
    }
  }

  // Transform order data to match the format
  const orderData: OrderData = {
    trackingId: currentOrder.name || "N/A",
    customerName: currentOrder.customer_name === "NA" ? "" : (currentOrder.customer_name || ""),
    phone: currentOrder.customer_mobile === "NA" ? "" : (currentOrder.customer_mobile || ""),
    orderDate: formatOrderDate(currentOrder.date),
    amountPaid: currentOrder.total_amount || 0,
    orderStatus: currentOrder.status || "new",
    items: currentOrder.order_line && currentOrder.order_line.length > 0 ? currentOrder.order_line.map((line) => ({
      id: line.product_id.toString(),
      orderLineId: line.order_line_id || 0, // order_line_id from the API
      name: line.product_name || "",
      image: line.product_image || "",
      quantity: line.product_uom_qty || 0,
      unitPrice: line.price_unit || 0,
      weight: line.weight && line.weight_unit ? `${line.weight} ${line.weight_unit}/unit` : "",
      color: line.sku_name || "",
      subtotal: line.price_subtotal || 0,
      status: line.status || "new",
      mfgQcStatus: line.mfg_qc_status || "",
      packagingQcStatus: line.packaging_qc_status || "",
      mfgQcData: normalizeQcDataToOrderItem(mapQcData(line.mfg_qc_data, 'mfg_qc')),
      packagingQcData: normalizeQcDataToOrderItem(mapQcData(line.packaging_qc_data, 'pkg_qc'))
    })) : [
    ],
    progress: getProgressFromOrderLines(currentOrder.order_line || []),
    summary: {
      totalItems: currentOrder.order_line ? currentOrder.order_line.reduce((sum, line) => sum + (line.product_uom_qty || 0), 0) : 0,
      totalWeight: currentOrder.order_line && currentOrder.order_line.length > 0
        ? `${currentOrder.order_line.reduce((sum, line) => sum + ((line.weight || 0) * (line.product_uom_qty || 0)), 0)} ${currentOrder.order_line[0]?.weight_unit || 'Kg'}`
        : "0 Kg",
      subtotalAmount: currentOrder.subtotal_amount || 0,
      taxAmount: currentOrder.tax_amount || 0,
      totalAmount: currentOrder.total_amount || 0,
      discount: currentOrder.discount || 0,
      shippingCost: currentOrder.shipping_cost || 0
    },
    address: currentOrder.customer_address || " ",
    paymentMode: currentOrder.x_shopify_payment_method || " ",
    paymentReference: currentOrder.x_shopify_payment_reference || "",
    activities: currentOrder.activity_log && currentOrder.activity_log.length > 0
      ? currentOrder.activity_log.map((activity: ActivityLog) => {
        const activityDate = formatDateTime(activity.created_on)

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

        const description = activity.note
          ? `${typeLabel} - ${activity.note}`
          : typeLabel

        const getActivityStatus = (type: string) => {
          const statusOrder = ['new', 'manufacture', 'mfg_qc', 'packaging', 'pkg_qc', 'ready_to_ship', 'shipped', 'delivered']
          const currentIndex = statusOrder.indexOf(type?.toLowerCase())
          const orderIndex = statusOrder.indexOf(currentOrder.status?.toLowerCase() || 'new')

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
  }

  const statusDisplay = formatStatusDisplay(orderData.orderStatus)

  const getQcStatusBadge = (qcStatus?: string) => {
    const normalized = (qcStatus || '').toLowerCase()
    if (!normalized) return null
    if (normalized === 'approved') return { label: 'Approved', style: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', color: '#059669' } }
    if (normalized === 'rejected') return { label: 'Rejected', style: { backgroundColor: '#FEE2E2', borderColor: '#FECACA', color: '#DC2626' } }
    return { label: 'Pending', style: { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' } }
  }

  // Wrapper for clipboard handler to match the expected signature
  const handleCopyDetails = () => {
    copyDetailsToClipboard(
      orderData.customerName,
      orderData.phone,
      orderData.address,
      orderData.paymentMode,
      orderData.paymentReference
    )
  }

  // Show StartPackagingQC as full-screen component if enabled
  if (showShippingContainer) {
    return (
      <StartPackagingQC onBack={() => setShowShippingContainer(false)} orderId={currentOrder.id} />
    )
  }

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Order History"
          subTitle="Order Details"
          onTitleClick={onBackToList}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </>
    )
  }

  // Show error message if fetch failed
  if (error) {
    return (
      <>
        <PageHeader
          title="Order History"
          subTitle="Order Details"
          onTitleClick={onBackToList}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="bg-white border border-red-200 shadow-sm p-8 max-w-md">
            <CardContent className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 font-urbanist mb-2">Failed to Load Order Details</h3>
                <p className="text-sm text-gray-600 font-urbanist mb-4">{error}</p>
                <button
                  onClick={() => {
                    // Retry fetching - invalidate query to trigger refetch
                    if (order?.id) {
                      invalidateOrder(order.id, userType)
                    }
                  }}
                  className="px-4 py-2 bg-secondary-900 text-white text-sm font-medium rounded-md hover:bg-secondary-800 transition-colors font-urbanist"
                >
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Order History"
        subTitle="Order Details"
        onTitleClick={onBackToList}
      />
      <div className="min-h-screen bg-gray-50 scrollbar-hide">
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 p-[8px]">
          {/* Left Column - Order Details and Products */}
          <div className="flex flex-col lg:w-2/3">
            {/* Header with Order ID and Status */}
            <div className="bg-white border border-gray-200 border-b-0 rounded-t-lg shadow-sm p-[8px] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="label-1 font-semibold text-gray-900 font-urbanist">Order ID #{orderData.trackingId}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="body-2 font-semibold text-gray-600 font-urbanist">
                      {formatOrderDate(currentOrder.date)}
                    </span>
                  </div>
                </div>
                <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist" style={{ backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }}>
                  {statusDisplay.label}
                </span>
              </div>
            </div>
            {/* Products Section */}
            <Card className="bg-white border border-gray-200 border-b-0 rounded-none shadow-sm flex-1 flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Product Header */}
                <div className="flex items-center justify-between px-[8px] py-[8px] flex-shrink-0">
                  <p className="label-1 font-semibold text-[16px] text-gray-900 font-urbanist">Product</p>
                  <button
                    onClick={handlePrintReceipt}
                    disabled={isPrintingReceipt}
                    className="text-white font-medium rounded-md  transition-colors font-urbanist text- body-4 border border-gray-200 px-[12px] !text-gray-600 h-[28px] hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPrintingReceipt ? "Opening..." : "Print Receipt"}
                  </button>
                </div>
                <div className="px-[8px] py-[8px] flex-1 overflow-y-auto scrollbar-hide max-h-[600px]">
                  {orderData.items.map((item, index) => (
                    <OrderItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      totalItems={orderData.items.length}
                      userType={userType || 'seller'}
                      onManufacturingFinalized={handleManufacturingFinalized}
                      onSubmitManufacturingQC={handleSubmitManufacturingQC}
                      onSubmitPackingQC={handleSubmitPackingQC}
                      onStartShipping={handleStartShipping}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className={cn(
              "bg-white border border-gray-200 shadow-sm flex-shrink-0",
              orderData.items.length === 1 ? "rounded-none border-b-0" : "rounded-b-lg rounded-t-none"
            )}>
              <CardContent className="p-0">
                <div className="space-y-[8px]">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center px-[8px] pt-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Subtotal</span>
                    <span className="font-bold text-gray-900 font-spectral body-3">{formatIndianCurrency(orderData.summary.subtotalAmount || 0)}</span>
                  </div>

                  {/* Discount */}
                  <div className="flex justify-between items-center px-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Discount</span>
                    <span className="font-bold text-gray-900 font-spectral body-3">
                      {orderData.summary.discount > 0 ? `-${formatIndianCurrency(orderData.summary.discount || 0).replace('₹', '')}` : '0'}
                    </span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between items-center px-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Tax</span>
                    <span className="font-bold text-gray-900 font-spectral body-3">{formatIndianCurrency(orderData.summary.taxAmount || 0)}</span>
                  </div>

                  {/* Shipment Cost */}
                  <div className="flex justify-between items-center px-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Shipment Cost</span>
                    <span className="font-bold text-green-200 font-spectral body-3">
                      {orderData.summary.shippingCost > 0 ? formatIndianCurrency(orderData.summary.shippingCost || 0) : 'FREE'}
                    </span>
                  </div>

                  {/* Grand Total with Border */}
                  <div className="border-t border-gray-300">
                    <div className="flex justify-between items-center py-[8px] px-[8px]">
                      <span className="body-2 font-semibold text-gray-900 font-urbanist">Grand Total:</span>
                      <span className="body-2 font-bold text-gray-900 font-spectral">{formatIndianCurrency(orderData.summary.totalAmount || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Log and Customer Info */}
          <div className="lg:w-1/3 space-y-6">
            {/* Order Timeline */}
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm h-[375px] flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="flex items-center space-x-2 px-[4px] py-[8px] border-b border-gray-200 flex-shrink-0">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Order Timeline</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide px-[4px] py-[8px]">
                  {orderData.activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-gray-400 mb-2">
                        <Clock className="h-12 w-12" />
                      </div>
                      <p className="text-gray-500 font-urbanist text-sm body-3">No data found</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-green-500"></div>
                      <div className="space-y-4">
                        {orderData.activities.map((activity, index) => (
                          <div key={index} className="relative flex items-start">
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

                            <div className="ml-4 flex-1">
                              <div className="text-sm text-gray-900 font-urbanist leading-5 body-3">
                                {activity.description}
                              </div>
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
                              {(activity.createdBy || activity.approvedBy) && (
                                <div className="mt-1 flex items-center gap-3 flex-wrap">
                                  {activity.createdBy && activity.createdBy !== 'N/A' && (
                                    <span className="text-xs text-gray-600 font-urbanist body-3">
                                      {activity.createdBy}
                                    </span>
                                  )}
                                  {activity.approvedBy && activity.approvedBy !== 'N/A' && (
                                    <span className="text-xs text-green-600 font-urbanist body-3">
                                      Approved by: {activity.approvedBy}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 font-urbanist mt-1 body-3">
                                {activity.date}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer/Payment Details */}
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm h-[400px] flex flex-col p-0">
              <CardContent className="flex flex-col h-full p-0">
                <div className="flex items-center justify-between flex-shrink-0 border-b border-300">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist m-[8px]">Customer/Payment Details</h3>
                  <button
                    onClick={handleCopyDetails}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-urbanist"
                  >
                    <Copy className="h-4 w-4 text-gray-700" />
                    <span className='text-grey-700'>Copy</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 p-[8px]">
                  {/* Customer Information */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <img src="/images/svg/Rectangle.png" alt="User" className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="font-semibold text-gray-900 font-urbanist body-2">{orderData.customerName}</h4>
                        {/* <div className="flex items-center text-gray-900 font-urbanist body-2 gap-1">
                        <span>{orderData.phone}</span>
                        <span className='text-secondary-900 font-urbanist body-2'>•</span>
                        <span className='text-gray-900 font-urbanist body-2'>xyz@gmail.com</span>
                      </div> */}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <div className="flex items-start gap-3">
                      <img src="/images/svg/Rectangle (1).png" alt="User" className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="font-semibold text-gray-900 font-urbanist mb-1 body-2">Shipping Address</h4>
                        <p className="text-gray-900 font-urbanist body-2">{orderData.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="border-t border-gray-200 pt-4 gap-1">
                    <div className="space-y-1 mt-[8px]">
                      <div className="flex justify-between font-urbanist body-2">
                        <span className="text-gray-600">Payment Mode:</span>
                        <span className="text-gray-700">{orderData.paymentMode}</span>
                      </div>
                      {/* <div className="flex justify-between font-urbanist body-2">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="text-green-700 font-semibold">Paid</span>
                    </div> */}
                      <div className="flex justify-between font-urbanist body-2">
                        <span className="text-gray-600">Payment Reference ID:</span>
                        <span className="text-gray-700">{orderData.paymentReference}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Shipping Details Section - Bottom */}
        <div className="bg-white border-t border-gray-200 mt-[24px] mb-[32px] mx-[8px] rounded-lg shadow-sm">
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 border-b border-gray-200 py-[8px] px-[8px]">
                <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Shipping Details</h3>
                {/* <Info className="h-4 w-4 text-gray-400" /> */}    
              </div>
              <ShippingDetails
                shippingData={shippingData}
                isLoadingShipping={isLoadingShipping}
              />
            </CardContent>
          </Card>
        </div>

        {/* Stage Update Action Slider */}
        {selectedItem && (
          <StageUpdateActionSlider
            isOpen={isStageSliderOpen}
            onClose={() => {
              setIsStageSliderOpen(false)
              setSelectedItem(null)
              onSliderStateChange?.(false)
            }}
            stageType={selectedStage}
            itemName={selectedItem.name}
            itemId={selectedItem.id}
            orderLineId={selectedItem.orderLineId}
            orderId={currentOrder.id}
            userType={userType}
            itemDetails={{
              quantity: selectedItem.quantity,
              unitPrice: selectedItem.unitPrice,
              weight: selectedItem.weight,
              color: selectedItem.color,
              subtotal: selectedItem.subtotal,
              image: selectedItem.image,
              status: selectedItem.status,
              mfgQcStatus: selectedItem.mfgQcStatus,
              packagingQcStatus: selectedItem.packagingQcStatus,
              mfgQcData: toQcDataItems(selectedItem.mfgQcData),
              packagingQcData: toQcDataItems(selectedItem.packagingQcData)
            }}
            onSubmit={handleStageSliderSubmit}
            onSliderStateChange={(isOpen) => {
              if (!isOpen) {
                setSelectedItem(null)
                onSliderStateChange?.(false)
              }
            }}
          />
        )}

      </div>
    </>
  )
}

export default OrderDetailPage
