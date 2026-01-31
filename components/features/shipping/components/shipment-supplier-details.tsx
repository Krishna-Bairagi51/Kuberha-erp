"use client"

import React, { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  User,
  Check,
  AlertCircle,
  Clock,
  Copy,
  MapPin,
  Download,
  Truck,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useUserType } from '@/hooks/use-user-type'
import PageHeader from '@/components/shared/layout/page-header'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { getCustomerInvoiceReport } from '@/lib/api/endpoints/invoice'
import { formatIndianCurrency } from '@/lib/api/helpers/number'
import { ImagePreviewModal } from '@/components/shared'
import type { UserType } from '../types/shipping.types'
import { useSupplierDetails } from '../hooks/use-supplier-details'
import type { OrderItem, ShippingProgressStage, OrderTimelineActivity, TrackingActivity } from '../hooks/use-supplier-details-types'

interface ShipmentSupplierDetailsProps {
  orderId?: string
  shipmentId?: string
  onBack?: () => void
  onSliderStateChange?: (isOpen: boolean) => void
  userType?: UserType
}

/**
 * Unified Shipment Supplier Details Page
 * Handles both seller and admin views with a single component
 */
export function ShipmentSupplierDetails({
  orderId,
  shipmentId,
  onBack,
  onSliderStateChange,
  userType: propUserType
}: ShipmentSupplierDetailsProps) {
  const { userType: globalUserType } = useUserType()
  const userType = useMemo(() => {
    if (propUserType) return propUserType
    return (globalUserType as UserType) || 'seller'
  }, [propUserType, globalUserType])

  const [isPrintingReceipt, setIsPrintingReceipt] = React.useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const { data: orderData, isLoading, error } = useSupplierDetails({
    orderId,
    userType
  })

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = (open: boolean) => {
    setIsPreviewOpen(open)
    if (!open) {
      setPreviewImageUrl(null)
    }
  }

  // Handle copy customer/payment details
  const handleCopyDetails = async () => {
    if (!orderData) return

    const details = [
      `Customer Name: ${orderData.customer.name}`,
      `Phone: ${orderData.customer.phone}`,
      `Email: ${orderData.customer.email}`,
      `Payment Mode: ${orderData.payment.mode}`,
      `Payment Reference ID: ${orderData.payment.referenceId}`
    ].join('\n')

    try {
      await navigator.clipboard.writeText(details)
      toast.success("Copied! Customer and payment details copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy details. Please try again.")
    }
  }

  const handlePrintReceipt = async () => {
    const rawOrderId = orderId || orderData?.orderId

    if (!rawOrderId) {
      toast.error("Unable to fetch invoices: Missing order identifier. Please try refreshing the page.")
      return
    }

    setIsPrintingReceipt(true)

    try {
      const response = await getCustomerInvoiceReport(rawOrderId.toString())

      if (!response.success || !response.data) {
        toast.error(`Failed to load invoices: ${response.message || "Please try again in a moment."}`)
        return
      }

      const invoices = (response.data.record || []).filter(
        (invoice) => invoice.invoice_url && invoice.invoice_url.trim() !== ""
      )

      if (invoices.length === 0) {
        toast.info("No invoices available: This order does not have any printable invoices yet.")
        return
      }

      let isBlocked = false

      invoices.forEach((invoice) => {
        const opened = window.open(invoice.invoice_url, "_blank", "noopener,noreferrer")
        if (!opened) {
          isBlocked = true
        }
      })

      if (isBlocked) {
        toast.error("Pop-up blocked: Please allow pop-ups in your browser to view the invoices.")
      } else {
        toast.success(`Opening ${invoices.length} ${invoices.length > 1 ? "invoices" : "invoice"}: Invoice PDFs are opening in new tabs.`)
      }
    } catch (error) {
      toast.error(`Failed to open invoices: ${error instanceof Error ? error.message : "Please try again later."}`)
    } finally {
      setIsPrintingReceipt(false)
    }
  }

  // Handle download files
  const handleDownload = (url: string, filename: string) => {
    if (!url || url === '#') {
      toast.error("Not Available: This file is not available for download.")
      return
    }

    window.open(url, '_blank')
    toast.success(`Download Started: Downloading ${filename}...`)
  }

  // Get status badge color
  const getStatusBadgeStyle = (status: string) => {
    if (status === 'Cancelled') {
      return { backgroundColor: '#FEE2E2', borderColor: '#FECACA', color: '#DC2626' }
    }
    if (status === 'In Transit') {
      return { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }
    }
    if (status === 'Delivery in Progress') {
      return { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', color: '#059669' }
    }
    return { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', color: '#6B7280' }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Shipping & Delivery"
          subTitle="Shipment Details"
          onTitleClick={onBack}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Shipping & Delivery"
          subTitle="Shipment Details"
          onTitleClick={onBack}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="bg-white border border-red-200 shadow-sm p-8 max-w-md">
            <CardContent className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 font-urbanist mb-2">Failed to Load Shipment Details</h3>
                <p className="text-sm text-gray-600 font-urbanist">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!orderData) return null

  const showSupplierInfo = userType === 'admin'

  const getQcStatusBadge = (qcStatus?: string) => {
    const normalized = (qcStatus || '').toLowerCase()
    if (!normalized) return null
    if (normalized === 'approved') return { label: 'Approved', style: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', color: '#059669' } }
    if (normalized === 'rejected') return { label: 'Rejected', style: { backgroundColor: '#FEE2E2', borderColor: '#FECACA', color: '#DC2626' } }
    return { label: 'Pending', style: { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' } }
  }

  return (
    <>
      <PageHeader
        title="Shipping & Delivery"
        subTitle="Shipment Details"
        onTitleClick={onBack}
      />
      <div className="bg-gray-50 scrollbar-hide overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 p-[8px] items-stretch">
          {/* Left Column - Order Details and Products */}
          <div className="flex flex-col lg:w-2/3">
            <div className="bg-white border border-gray-200 border-b-0 rounded-t-lg shadow-sm p-[8px] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="label-1 font-semibold text-gray-900 font-urbanist">Order ID #{orderData.orderId}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="body-2 font-semibold text-gray-600 font-urbanist">
                      {orderData.orderDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <Card className="bg-white border border-gray-200 border-b-0 rounded-none shadow-sm flex flex-col" style={{ height: '500px' }}>
              <CardContent className="p-0 flex flex-col h-full">
                {/* Product Header */}
                <div className="flex items-center justify-between px-[8px] py-[8px] flex-shrink-0">
                  <p className="label-1 font-semibold text-[16px] text-gray-900 font-urbanist">Products</p>
                  {/* <button
                    onClick={handlePrintReceipt}
                    disabled={isPrintingReceipt}
                    className="text-white font-medium rounded-md transition-colors font-urbanist text- body-4 border border-gray-200 px-[12px] !text-gray-600 h-[28px] hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPrintingReceipt ? "Opening..." : "Print Receipt"}
                  </button> */}
                </div>
                <div className="px-[8px] py-[8px] overflow-y-auto scrollbar-hide max-h-[600px]">
                  {orderData.items.map((item: OrderItem, index: number) => (
                    <div key={item.id} className={index > 0 ? "mt-[16px]" : ""}>
                      {/* Product Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-[50px] h-[50px] object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(item.image)}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 font-urbanist body-2">{item.name} • Qty: {item.quantity}</h3>
                          <p className="text-sm text-gray-600 font-urbanist body-3 font-spectral">
                            <span className="text-gray-900 font-semibold font-spectral">{formatIndianCurrency(item.unitPrice || 0)}</span>/unit • {item.weight}
                          </p>
                          {/* Supplier Info (Admin only) */}
                          {showSupplierInfo && item.supplierName && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex flex-wrap gap-4 text-xs text-gray-600 font-urbanist">
                                <div>
                                  <span className="font-semibold text-gray-700">Supplier: </span>
                                  <span>{item.supplierName}</span>
                                  {item.supplierPhone && <span className="text-gray-500"> • {item.supplierPhone}</span>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 font-spectral">{formatIndianCurrency(item.subtotal || 0)}</div>
                          <div className="text-sm text-gray-500 font-urbanist body-3">Subtotal</div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist"
                          style={getStatusBadgeStyle(item.status)}
                        >
                          {item.status}
                        </span>
                      </div>

                      {index < orderData.items.length - 1 && (
                        <div className="border-t border-gray-200 mt-6"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="bg-white border border-gray-200 rounded-none shadow-sm flex-shrink-0">
              <CardContent className="p-0">
                <div className="space-y-[8px]">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center px-[8px] pt-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Subtotal</span>
                    <span className="font-bold text-gray-900 font-spectral body-3">{formatIndianCurrency(orderData.summary.subtotalAmount || 0)}</span>
                  </div>

                  {/* Discount */}
                  {orderData.summary.discount > 0 && (
                    <div className="flex justify-between items-center px-[8px]">
                      <span className="text-gray-900 font-urbanist body-2">Discount</span>
                      <span className="font-bold text-gray-900 font-spectral body-3">
                        <span className="text-orange-600">{orderData.summary.discountName}</span> -{formatIndianCurrency(orderData.summary.discount || 0)}
                      </span>
                    </div>
                  )}

                  {/* Tax */}
                  <div className="flex justify-between items-center px-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Tax</span>
                    <span className="font-bold text-gray-900 font-spectral body-3">{formatIndianCurrency(orderData.summary.taxAmount || 0)}</span>
                  </div>

                  {/* Shipment Cost */}
                  <div className="flex justify-between items-center px-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Shipment Cost</span>
                    <span className="font-bold text-green-600 font-spectral body-3">
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

            {/* Shipping Details Section */}
            <Card className="bg-white border border-gray-200 rounded-b-lg shadow-sm mt-6 flex-shrink-0" style={{ minHeight: '420px' }}>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b border-gray-200 py-[8px] px-[8px]">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Shipping Details</h3>
                  {/* Action Buttons */}
                  <div className="ml-auto flex items-center gap-2">
                    {(orderData.shippingData?.manifest_url && orderData.shippingData?.shipment_partner !== "shiprocket_cargo") && (
                      <button
                        onClick={() => handleDownload(orderData.shippingData.manifest_url, 'manifest.pdf')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Manifest
                      </button>
                    )}
                    {(orderData.shippingData?.label_url) && (
                      <button
                        onClick={() => handleDownload(orderData.shippingData.label_url, 'label.pdf')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Print All Labels
                      </button>
                    )}
                    {(orderData.shippingData?.invoice_url && orderData.shippingData?.shipment_partner !== "shiprocket_cargo") && (
                      <button
                        onClick={() => handleDownload(orderData.shippingData.invoice_url, 'invoice.pdf')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Print Invoices
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-[8px] space-y-4">
                  {/* Delivery Timeline Progress Bar */}
                  <div className="space-y-2">
                    {/* Status Badge */}
                    <div className="flex items-center justify-end">
                      <span
                        className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist"
                        style={getStatusBadgeStyle(orderData.currentStatus)}
                      >
                        {orderData.currentStatus}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                      {orderData.shippingProgress.map((stage: ShippingProgressStage, index: number) => {
                        const isCancelledStage = orderData.isCancelled && stage.label === 'Cancelled'
                        return (
                          <React.Fragment key={stage.step}>
                            <div className="flex flex-col items-center flex-1">
                              <div className={cn(
                                "w-full h-[62px] rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium font-urbanist",
                                isCancelledStage ? "border-red-500 bg-red-50" :
                                stage.status === 'completed' ? "border-green-500 bg-green-50" :
                                stage.status === 'in-progress' ? "border-yellow-500 bg-yellow-50" :
                                "border-gray-300 bg-gray-50"
                              )}>
                                <div className={cn("text-xs text-center", isCancelledStage && "text-red-600 font-semibold")}>{stage.label}</div>
                                <div className="mt-1">
                                  {isCancelledStage && <AlertCircle className="h-4 w-4 text-red-500" />}
                                  {!isCancelledStage && stage.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {!isCancelledStage && stage.status === 'in-progress' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                  {!isCancelledStage && stage.status === 'pending' && <span className="text-xs font-semibold text-gray-400">{stage.step}</span>}
                                </div>
                              </div>
                            </div>
                            {index < orderData.shippingProgress.length - 1 && (
                              <div className={cn(
                                "h-0.5 w-4",
                                isCancelledStage ? "bg-red-500" :
                                stage.status === 'completed' ? "bg-green-500" : "bg-gray-300"
                              )} />
                            )}
                          </React.Fragment>
                        )
                      })}
                    </div>

                    {/* Last Event Text Below Progress Bar */}
                    {orderData.lastEvent && (
                      <div className="flex items-center justify-start pt-2">
                        <p className="text-sm text-gray-700 font-urbanist body-3">{orderData.lastEvent}</p>
                      </div>
                    )}
                  </div>

                  {/* Shipping Information Grid */}
                  {orderData.shippingData && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">AWB Number:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.awb_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Ship rocket ID:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.shiprocket_order_id || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Tracking ID:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.tracking_id || 'N/A'}</span>
                      </div>
                      {orderData.shippingData.shipment_partner !== "shiprocket_cargo" && (
                        <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Courier Name:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.courier_name || 'N/A'}</span>
                      </div>
                      )}
                      <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Item Count:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.item_count || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Invoice Number:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.invoice_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Transporter:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.transporter_name || 'N/A'}</span>
                      </div>
                      {orderData.shippingData.shipment_partner !== "shiprocket_cargo" && (
                        <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Estimated Days:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.estimated_days || 'N/A'}</span>
                      </div>
                      )}
                      {orderData.shippingData.shipment_partner && (
                        <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Shipment Partner:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.shipment_partner || 'N/A'}</span>
                      </div>
                      )}
                      <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                        <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Box Type:</span>
                        <span className="text-neutral-800 text-xs font-urbanist font-semibold">{orderData.shippingData.box_type || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Log and Customer Info */}
          <div className="lg:w-1/3 flex flex-col gap-6 pb-6">
            {/* Order Timeline */}
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col flex-shrink-0">
              <CardContent className="p-0 flex flex-col">
                <div className="flex items-center space-x-2 px-[4px] py-[8px] border-b border-gray-200 flex-shrink-0">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Order Timeline</h3>
                </div>
                <div className="px-[4px] py-[8px] min-h-[300px]">
                  {orderData.orderTimeline.length === 0 ? (
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
                        {orderData.orderTimeline.map((activity: OrderTimelineActivity, index: number) => (
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
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col p-0 flex-shrink-0">
              <CardContent className="flex flex-col p-0">
                 <div className="flex items-center justify-between flex-shrink-0 border-b border-gray-200">
                   <h3 className="label-1 font-semibold text-gray-900 font-urbanist m-[8px]">Customer/Payment Details</h3>
                   <button
                     onClick={handleCopyDetails}
                     className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-urbanist mr-2"
                   >
                     <Copy className="h-4 w-4 text-gray-700"/>
                     <span className='text-gray-700'>Copy</span>
                   </button>
                 </div>

                <div className="space-y-4 p-[8px]">
                {/* Customer Information */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 font-urbanist body-2">{orderData.customer.name}</h4>
                      <div className="flex items-center text-gray-900 font-urbanist body-2 gap-1">
                        <span>{orderData.customer.phone}</span>
                        <span className='text-secondary-900 font-urbanist body-2'>•</span>
                        <span className='text-gray-900 font-urbanist body-2'>{orderData.customer.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="border-t border-gray-200 pt-4 gap-1">
                  <div className="space-y-1 mt-[8px]">
                    <div className="flex justify-between font-urbanist body-2">
                      <span className="text-gray-600">Payment Mode:</span>
                      <span className="text-gray-700">{orderData.payment.mode}</span>
                    </div>
                    <div className="flex justify-between font-urbanist body-2">
                      <span className="text-gray-600">Payment Reference ID:</span>
                      <span className="text-gray-700">{orderData.payment.referenceId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Tracking Activity Log */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col flex-shrink-0">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="flex items-center space-x-2 px-[4px] py-[8px] border-b border-gray-200 flex-shrink-0">
                <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Order Tracking Activity Log</h3>
              </div>
              <div className="px-[4px] py-[8px] h-[300px] overflow-y-auto scrollbar-hide">
                {orderData.trackingActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                    <div className="text-gray-400 mb-2">
                      <Clock className="h-12 w-12" />
                    </div>
                    <p className="text-gray-500 font-urbanist text-sm body-3">No data found</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-green-500"></div>
                    <div className="space-y-4">
                      {orderData.trackingActivities.map((activity: TrackingActivity, index: number) => (
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
                              {activity.title}
                            </div>
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

          {/* Pickup/Destination Locations */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col flex-shrink-0">
            <CardContent className="p-0 flex flex-col">
              <div className="flex items-center space-x-2 px-[8px] py-[8px] border-b border-gray-200 flex-shrink-0">
                <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Pickup/Destination Locations</h3>
              </div>

              <div className="p-[8px]">
                {/* Pickup Location */}
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="body-2 text-gray-900 font-urbanist font-semibold">
                      {orderData.locations.pickup.address}
                    </div>
                    <div className="body-3 text-gray-500 font-urbanist mt-1">
                      {orderData.locations.pickup.label}
                    </div>
                  </div>
                </div>

                {/* Destination Location */}
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="body-2 text-gray-900 font-urbanist font-semibold">
                      {orderData.locations.destination.address}
                    </div>
                    <div className="body-3 text-gray-500 font-urbanist mt-1">
                      {orderData.locations.destination.label}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <ImagePreviewModal
      open={isPreviewOpen}
      onOpenChange={handleClosePreview}
      imageUrl={previewImageUrl}
      alt="Product image preview"
    />
    </>
  )
}

export default ShipmentSupplierDetails

