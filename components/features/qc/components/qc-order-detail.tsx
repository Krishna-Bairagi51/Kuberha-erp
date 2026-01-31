"use client"
import React from 'react'
import { useEffect, useState } from 'react'
import { ImagePreviewModal } from '@/components/shared'

import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Info, 
  User, 
  CheckCircle,
  Check,
  AlertCircle,
  ChevronDown,
  Clock,
  Copy,
  MapPin,
  Phone,
  Mail,
  Package,
  Truck,
  Calendar,
  ExternalLink,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/shared/layout/page-header'
import type { AdminSaleOrderItem } from '@/components/features/orders/types/orders.types'
import ApprovedRejectedSlider from './approval-status-slider'
import { getCustomerInvoiceReport } from '@/lib/api/endpoints/invoice'
import { toast } from 'sonner'
import { formatIndianCurrency } from '@/lib/api/helpers/number'
import { formatOrderDate } from '@/lib/api/helpers/misc'
import { useOrderDetailQuery, useApproveQCMutation, useRejectQCMutation } from '@/components/features/orders/hooks/use-orders-query'
import { useShipmentByOrderIdQuery } from '@/components/features/orders/hooks/use-orders-query'
import { useUserType } from '@/hooks/use-user-type'

interface MfgQcOrderDetailProps {
  onBack: () => void
  orderId: number
  /** Title for the PageHeader breadcrumb (default: "Quality Control") */
  pageHeaderTitle?: string
}

interface OrderItem {
  id: string
  orderLineId: number
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
  orderTime: string
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

const MfgQcOrderDetail: React.FC<MfgQcOrderDetailProps> = ({ onBack, orderId, pageHeaderTitle = "Quality Control" }) => {
  // Get user type to determine if admin or seller
  const { userType: globalUserType } = useUserType()
  const userType = (globalUserType || 'seller') as 'seller' | 'admin'
  const isAdmin = userType === 'admin'
  
  // State for slider
  const [isSliderOpen, setIsSliderOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  // Use TanStack Query for order detail - SINGLE SOURCE OF TRUTH
  const { 
    data: apiOrderData, 
    isLoading, 
    error: queryError 
  } = useOrderDetailQuery(orderId, userType, true)
  
  const error = queryError ? 'Failed to fetch order details' : null

  // Use TanStack Query for shipping data - NO MANUAL REFETCH
  const { 
    data: shippingQueryData, 
    isLoading: isLoadingShipping 
  } = useShipmentByOrderIdQuery(orderId, userType, !!orderId)
  
  const shippingData = shippingQueryData?.success && shippingQueryData?.data 
    ? shippingQueryData.data 
    : null

  // Initialize mutation hooks for QC actions
  const approveQCMutation = useApproveQCMutation()
  const rejectQCMutation = useRejectQCMutation()
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
    const containers = document.querySelectorAll(".min-h-screen, .overflow-y-auto, .scrollable, .scrollbar-hide")
    containers.forEach((el) => {
      if (el instanceof HTMLElement) el.scrollTop = 0
    })
  }, [])

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
    
  const handlePrintReceipt = async () => {
    const rawOrderId = orderId || apiOrderData?.id || apiOrderData?.x_shopify_order_id

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
      'shipped': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'completed'
      },
      'delivered': {
        manufacturing: 'completed',
        mfgQc: 'completed',
        packaging: 'completed',
        pkgQc: 'completed',
        shipped: 'completed'
      }
    }

    let progress = statusMap[statusLower] || defaultProgress

    if (mfgQcStatus && mfgQcStatus.trim() !== '') {
      const mfgQcStatusLower = mfgQcStatus.toLowerCase()
      if (mfgQcStatusLower === 'pending') {
        progress.mfgQc = 'in-progress'
        progress.packaging = 'pending'
      } else if (mfgQcStatusLower === 'approved' || mfgQcStatusLower === 'completed') {
        progress.mfgQc = 'completed'
        if (progress.packaging === 'pending') {
          progress.packaging = 'in-progress'
        }
      } else if (mfgQcStatusLower === 'in-progress' || mfgQcStatusLower === 'in_progress') {
        progress.mfgQc = 'in-progress'
        progress.packaging = 'pending'
      }
    }

    if (packagingQcStatus && packagingQcStatus.trim() !== '') {
      const packagingQcStatusLower = packagingQcStatus.toLowerCase()
      if (packagingQcStatusLower === 'pending') {
        progress.pkgQc = 'in-progress'
        progress.shipped = 'pending'
      } else if (packagingQcStatusLower === 'approved' || packagingQcStatusLower === 'completed') {
        progress.pkgQc = 'completed'
        if (progress.shipped === 'pending') {
          progress.shipped = 'in-progress'
        }
      } else if (packagingQcStatusLower === 'in-progress' || packagingQcStatusLower === 'in_progress') {
        progress.pkgQc = 'in-progress'
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

  // Transform API order data to match the format
  const transformedOrderData: OrderData = {
    trackingId: apiOrderData?.name || "N/A",
    customerName: apiOrderData?.customer_name || "",
    phone: apiOrderData?.customer_mobile || "",
    orderDate: apiOrderData?.date ? formatOrderDate(apiOrderData.date) : "",
    orderTime: (() => {
      const dateValue = apiOrderData?.date
      if (!dateValue) {
        return ""
      }
      const parsed = new Date(dateValue)
      // Show accurate time from API date string; includes seconds for clarity
      return parsed.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    })(),
    amountPaid: apiOrderData?.total_amount || 0,
    orderStatus: apiOrderData?.status || "new",
    items: apiOrderData?.order_line ? apiOrderData.order_line.map((lineItem, index) => ({
      id: lineItem.order_line_id.toString(),
      orderLineId: lineItem.order_line_id,
      name: lineItem.product_name,
      image: lineItem.product_image || "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      quantity: lineItem.product_uom_qty,
      unitPrice: lineItem.price_unit,
      weight: `${lineItem.weight || 0} ${lineItem.weight_unit || 'kg'}`,
      color: "", // Default color as not provided in API
      subtotal: lineItem.price_subtotal,
      status: lineItem.status,
      mfgQcStatus: lineItem.mfg_qc_status,
      packagingQcStatus: lineItem.packaging_qc_status,
      sellerName: lineItem.seller_name
    })) : [],
    progress: {
      manufacturing: 'completed',
      mfgQc: 'completed',
      packaging: 'in-progress',
      pkgQc: 'pending',
      shipped: 'pending'
    },
    summary: {
      totalItems: apiOrderData?.order_line?.length || 1,
      totalWeight: `${apiOrderData?.order_line?.reduce((sum, item) => sum + (item.weight || 0), 0) || 2.5} Kg`,
      subtotalAmount: apiOrderData?.subtotal_amount || 0,
      taxAmount: apiOrderData?.tax_amount || 0,
      totalAmount: apiOrderData?.total_amount || 0,
      discount: apiOrderData?.discount || 0,
      shippingCost: apiOrderData?.shipping_cost || 0
    },
    address: apiOrderData?.customer_address || "123 Main Street, City, State 12345",
    paymentMode: apiOrderData?.x_shopify_payment_method || "Credit Card",
    paymentReference: apiOrderData?.x_shopify_payment_reference || "REF123456789",
    activities: apiOrderData?.activity_log ? apiOrderData.activity_log.map(activity => {
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

      // Determine status based on type progression
      const getActivityStatus = (type: string) => {
        const statusOrder = ['new', 'manufacture', 'mfg_qc', 'packaging', 'pkg_qc', 'ready_to_ship', 'shipped', 'delivered']
        const currentIndex = statusOrder.indexOf(type?.toLowerCase())
        const orderIndex = statusOrder.indexOf(apiOrderData?.status?.toLowerCase() || 'new')

        if (currentIndex <= orderIndex) return 'completed'
        if (currentIndex === orderIndex + 1) return 'in-progress'
        return 'pending'
      }

      return {
        date: new Date(activity.created_on).toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        description: description,
        status: getActivityStatus(activity.type || ''),
        createdBy: activity.created_by || 'N/A',
        approvedBy: activity.approved_by || 'N/A',
        images: activity.image || [],
        qcStatus: activity.qc_status
      }
    }) : [
    ]
  }

  const statusDisplay = formatStatusDisplay(transformedOrderData.orderStatus)

  // Helper function for QC status badge
  const getQcStatusBadge = (qcStatus?: string) => {
    const normalized = (qcStatus || '').toLowerCase()
    if (!normalized) return null
    if (normalized === 'approved') return { label: 'Approved', style: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', color: '#059669' } }
    if (normalized === 'rejected') return { label: 'Rejected', style: { backgroundColor: '#FEE2E2', borderColor: '#FECACA', color: '#DC2626' } }
    return { label: 'Pending', style: { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' } }
  }

  // Handle copy customer/payment details
  const handleCopyDetails = async () => {
    const details = [
      `Customer Name: ${transformedOrderData.customerName}`,
      `Phone: ${transformedOrderData.phone}`,
      `Email: xyz@gmail.com`,
      `Shipping Address: ${transformedOrderData.address}`,
      `Payment Mode: ${transformedOrderData.paymentMode}`,
      //`Payment Status: Paid`,
      `Payment Reference ID: ${transformedOrderData.paymentReference}`
    ].join('\n')

    try {
      await navigator.clipboard.writeText(details)
      toast.success("Copied! Customer and payment details copied to clipboard")
    } catch (err) {
      toast.error("Error: Failed to copy details. Please try again.")
    }
  }

  // Helper function to render shipping details
  const renderShippingDetails = () => {
    if (isLoadingShipping) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-[8px] py-[8px] mb-[16px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-urbanist body-3">Loading shipping details...</p>
        </div>
      )
    }

    if (!shippingData || !shippingData.record || shippingData.record.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-[8px] py-[8px] mb-[16px]">
          <img src="/images/svg/image 4.png" alt="Shipping illustration" className="w-[200px] h-[120px] rounded-lg" />
          <div className="text-center">
            <div className="font-bold text-gray-800 font-urbanist mb-2 heading-6">No shipping detail yet</div>
            <p className="text-gray-700 font-urbanist body-3">One or more items in the order are not packaging QC approved yet.</p>
            <p className="text-gray-700 font-urbanist body-3">Kindly update status and start shipping.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4 mx-[8px] my-[4px]">
        {shippingData.record.map((shipData: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Download Buttons */}
            {(shipData.label_url || shipData.manifest_url || shipData.invoice_url) && (
              <div className="flex items-center gap-2 flex-wrap">
                {shipData.label_url && (
                  <a
                    href={shipData.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Label
                  </a>
                )}
                
                {shipData.manifest_url && (
                  <a
                    href={shipData.manifest_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Manifest
                  </a>
                )}
                
                {shipData.invoice_url && (
                  <a
                    href={shipData.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Invoice
                  </a>
                )}
              </div>
            )}

            {/* Field Rows */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">AWB Number:</span>
                <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.awb_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Shiprocket Order ID:</span>
                <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.shiprocket_order_id || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Tracking ID:</span>
                <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.tracking_id || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Courier Name:</span>
                <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.courier_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Item Count:</span>
                <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.item_count || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Invoice No:</span>
                <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.invoice_no || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Transporter:</span>
                <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.transporter_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Estimated Days:</span>
                <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.estimated_days || 'N/A'}</span>
              </div>
            </div>
            
            {/* Address rows take full width */}
            <div className="flex items-start gap-3 py-1.5 border-b border-gray-100">
              <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Pickup Address:</span>
              <span className="text-neutral-800 text-xs font-urbanist font-semibold whitespace-pre-wrap">{shipData.pickup_address || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
              <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Pickup Date:</span>
              <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.pickup_date || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-3 py-1.5 border-b border-gray-100">
              <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Delivery Address:</span>
              <span className="text-neutral-800 text-xs font-urbanist font-semibold whitespace-pre-wrap">{shipData.delivery_address || 'N/A'}</span>
            </div>

            {/* Product details sub-table */}
            {Array.isArray(shipData.product_details) && shipData.product_details.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 font-semibold text-gray-900 font-urbanist text-xs">Products</div>
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                  <Table className="w-full">
                    <TableHeader className="bg-gray-50 border-b border-gray-200">
                      <TableRow>
                        <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Product ID</TableHead>
                        <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Name</TableHead>
                        <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Qty</TableHead>
                        <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Unit Price</TableHead>
                        <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {shipData.product_details.map((p: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-gray-50 bg-white">
                          <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800 font-semibold">{p.product_id}</TableCell>
                          <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800">{p.product_name}</TableCell>
                          <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800">{p.qty}</TableCell>
                          <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800">{p.unit_price}</TableCell>
                          <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800">{p.price_total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Handle slider open
  const handleOpenSlider = (item: OrderItem) => {
    setSelectedItem(item)
    setIsSliderOpen(true)
  }

  // Handle slider close
  const handleCloseSlider = () => {
    setIsSliderOpen(false)
    setSelectedItem(null)
  }

  // Handle approve action - uses mutation with automatic cache invalidation
  const handleApprove = async (orderLineId: number, qcType: string) => {
    try {
      // Find the QC data for this order line
      const orderLine = apiOrderData?.order_line?.find(line => line.order_line_id === orderLineId)
      const qcData = qcType === 'mfg_qc' ? orderLine?.mfg_qc_data : orderLine?.packaging_qc_data
      
      if (!qcData || qcData.length === 0) {
        toast.error('No QC data found for this order line')
        return
      }
      
      // Extract the QC ID
      const qcId = qcData[0].id
      
      // Use mutation - it will automatically invalidate cache and update optimistically
      const response = await approveQCMutation.mutateAsync({ 
        qcId, 
        qcType,
        userType,
        orderId,
        orderLineId
      })
      
      if (response.status_code === 200) {
        toast.success('QC approved successfully')
        // No manual refetch needed - mutation handles cache invalidation and optimistic updates
      } else {
        toast.error('Failed to approve QC. Please try again.')
      }
    } catch (error) {
      toast.error('Failed to approve QC. Please try again.')
    }
  }

  // Handle reject action - uses mutation with automatic cache invalidation
  const handleReject = async (orderLineId: number, qcType: string, reason?: string) => {
    try {
      // Find the QC data for this order line
      const orderLine = apiOrderData?.order_line?.find(line => line.order_line_id === orderLineId)
      const qcData = qcType === 'mfg_qc' ? orderLine?.mfg_qc_data : orderLine?.packaging_qc_data
      
      if (!qcData || qcData.length === 0) {
        toast.error('No QC data found for this order line')
        return
      }
      
      // Extract the QC ID
      const qcId = qcData[0].id
      
      if (!reason) {
        toast.error('Please provide a reason for rejection')
        return
      }
      
      // Use mutation - it will automatically invalidate cache and update optimistically
      const response = await rejectQCMutation.mutateAsync({ 
        qcId, 
        qcType, 
        rejectionReason: reason,
        userType,
        orderId,
        orderLineId
      })
      
      if (response.status_code === 200) {
        toast.success('QC rejected successfully')
        // No manual refetch needed - mutation handles cache invalidation
      } else {
        toast.error('Failed to reject QC. Please try again.')
      }
    } catch (error) {
      toast.error('Failed to reject QC. Please try again.')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <PageHeader 
          title={pageHeaderTitle}
          subTitle="Order Details"
          onTitleClick={onBack}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 font-urbanist">Loading Order Details...</p>
              <p className="text-sm text-gray-600 font-urbanist">Please wait while we fetch the order information</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Error state
  if (error) {
    return (
      <>
        <PageHeader 
          title={pageHeaderTitle}
          subTitle="Order Details"
          onTitleClick={onBack}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-urbanist mb-2">Error Loading Order Details</h3>
            <p className="text-gray-600 font-urbanist mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-urbanist"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader 
        title={pageHeaderTitle}
        subTitle="Order Details"
        onTitleClick={onBack}
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
                  <h1 className="label-1 font-semibold text-gray-900 font-urbanist">Order ID #{transformedOrderData.trackingId}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="body-2 font-semibold text-gray-600 font-urbanist">
                      {transformedOrderData.orderDate} • {transformedOrderData.orderTime}
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
                    className="text-white font-medium rounded-md transition-colors font-urbanist text- body-4 border border-gray-200 px-[12px] !text-gray-600 h-[28px] hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPrintingReceipt ? "Opening..." : "Print Receipt"}
                  </button>
                </div>
                <div className="px-[8px] py-[8px] flex-1 overflow-y-auto scrollbar-hide max-h-[600px]">
                  {transformedOrderData.items.map((item, index) => {
                    const itemProgress = getProgressForSingleItem(item.status, item.mfgQcStatus, item.packagingQcStatus)
                    const completedSteps = [
                      itemProgress.manufacturing,
                      itemProgress.mfgQc,
                      itemProgress.packaging,
                      itemProgress.pkgQc,
                      itemProgress.shipped
                    ].filter(status => status === 'completed').length
                    
                    const getCurrentStatusLabel = () => {
                      // Check for rejected status first
                      if (item.mfgQcStatus?.toLowerCase() === 'rejected') return 'MFG QC Rejected'
                      if (item.packagingQcStatus?.toLowerCase() === 'rejected') return 'PKG QC Rejected'
                      
                      // Check progress states in order of workflow
                      if (itemProgress.shipped === 'completed') return 'Completed'
                      if (itemProgress.shipped === 'in-progress') return 'Shipping in Progress'
                      if (itemProgress.pkgQc === 'completed' && itemProgress.shipped === 'pending') return 'Ready to Ship'
                      if (itemProgress.pkgQc === 'in-progress') return 'PKG QC Pending'
                      if (itemProgress.packaging === 'completed' && itemProgress.pkgQc === 'pending') return 'Pending PKG QC'
                      if (itemProgress.packaging === 'in-progress') return 'Packing in Progress'
                      if (itemProgress.mfgQc === 'completed' && itemProgress.packaging === 'pending') return 'MFG QC Approved'
                      if (itemProgress.mfgQc === 'in-progress') return 'MFG QC Pending'
                      if (itemProgress.manufacturing === 'completed' && itemProgress.mfgQc === 'pending') return 'Pending MFG QC'
                      if (itemProgress.manufacturing === 'in-progress') return 'Manufacturing in Progress'
                      return 'New Order'
                    }
                    
                    // Check if item is rejected
                    const isMfgQcRejected = item.mfgQcStatus?.toLowerCase() === 'rejected'
                    const isPkgQcRejected = item.packagingQcStatus?.toLowerCase() === 'rejected'
                    const isRejected = isMfgQcRejected || isPkgQcRejected
                    
                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                          index > 0 ? "mt-[16px]" : "",
                        )}
                      >
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
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 font-spectral">{formatIndianCurrency(item.subtotal || 0)}</div>
                            <div className="text-sm text-gray-500 font-urbanist body-3">Subtotal</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-[4px] border-t border-gray-200 pt-[8px] pb-[8px]">
                            <span className="text-gray-900 font-semibold font-spectral label-1 font-urbanist">
                              Assigned Supplier:
                            </span>
                            <span className="text-gray-600 font-urbanist body-3">
                              {item.sellerName}
                            </span>
                        </div>


                        <div className="flex items-center gap-2 mb-[4px]">
                          <div className="flex items-center gap-2">
                            <span className="body-3 font-medium text-gray-600 font-urbanist">
                              {completedSteps} of 5 steps completed
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress Flow */}
                        <div className="flex items-center gap-2 mb-[16px] flex-nowrap">
                          {[
                            { label: 'Manufacturing', progress: itemProgress.manufacturing, step: 1, qcType: null },
                            { label: 'MFG QC', progress: itemProgress.mfgQc, step: 2, qcType: 'mfg_qc' },
                            // { label: 'Packaging', progress: itemProgress.packaging, step: 3 },
                            { label: 'PKG QC', progress: itemProgress.pkgQc, step: 3, qcType: 'pkg_qc' },
                            { label: 'Ready to ship', progress: itemProgress.shipped, step: 4, qcType: null }
                          ].map(({ label, progress, step, qcType }, stepIndex) => {
                            // Check if this specific QC step is rejected
                            const isThisStepRejected = (qcType === 'mfg_qc' && isMfgQcRejected) || 
                                                      (qcType === 'pkg_qc' && isPkgQcRejected)
                            
                            return (
                              <React.Fragment key={step}>
                                <div className="flex flex-col items-center flex-1 min-w-0">
                                  <div className={cn(
                                    "w-full h-[62px] rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium font-urbanist",
                                    isThisStepRejected ? "border-red-500 bg-red-50" :
                                    progress === 'completed' ? "border-green-500 bg-green-50" : 
                                    progress === 'in-progress' ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50"
                                  )}>
                                    <div className="text-xs whitespace-nowrap">{label}</div>
                                    <div className="mt-1">
                                      {isThisStepRejected && <AlertCircle className="h-4 w-4 text-red-500" />}
                                      {!isThisStepRejected && progress === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                      {!isThisStepRejected && progress === 'in-progress' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                      {!isThisStepRejected && progress === 'pending' && <span className="text-xs font-semibold text-gray-400">{step}</span>}
                                    </div>
                                  </div>
                                </div>
                                {stepIndex < 4 && (
                                  <div className={cn(
                                    "h-0.5 w-4 flex-shrink-0",
                                    isThisStepRejected ? "bg-red-500" :
                                    progress === 'completed' ? "bg-green-500" : "bg-gray-300"
                                  )} />
                                )}
                              </React.Fragment>
                            )
                          })}
                        </div>
                        
                        {/* Status and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-urbanist body-3">Status:</span>
                            <span className="inline-flex px-3 py-1 text-xs font-medium rounded-md border font-urbanist" 
                              style={{ backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }}>
                              {getCurrentStatusLabel()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {/* Conditional rendering based on status and QC approval state */}
                            {(() => {
                              const statusLower = item.status.toLowerCase()
                              
                              // Don't show any button for shipping, shipped, or delivered statuses
                              if (['shipping', 'shipped', 'delivered'].includes(statusLower)) {
                                return null
                              }
                              
                              // Check if QC is pending and needs admin approval
                              const isMfgQcPending = item.status === 'mfg_qc' && 
                                (!item.mfgQcStatus || item.mfgQcStatus.toLowerCase() === 'pending' || item.mfgQcStatus.toLowerCase() === 'in-progress' || item.mfgQcStatus.toLowerCase() === 'in_progress')
                              
                              const isPkgQcPending = item.status === 'pkg_qc' && 
                                (!item.packagingQcStatus || item.packagingQcStatus.toLowerCase() === 'pending' || item.packagingQcStatus.toLowerCase() === 'in-progress' || item.packagingQcStatus.toLowerCase() === 'in_progress')
                              
                              // Show approve button only when QC is pending for admin review
                              if (isMfgQcPending || isPkgQcPending) {
                                return (
                                  <button 
                                    onClick={() => handleOpenSlider(item)}
                                    className="px-4 py-2 bg-secondary-900 text-white text-sm font-medium rounded-md hover:bg-secondary-800 transition-colors font-urbanist label-2"
                                  >
                                    Approve for QC
                                  </button>
                                )
                              }
                              
                              // Show waiting message only for admin users
                              // For seller users, don't show this message as it doesn't make sense
                              if (isAdmin) {
                                return (
                                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                                    <Clock className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700 font-urbanist">
                                      Waiting for Seller Action
                                    </span>
                                  </div>
                                )
                              }
                              
                              // For seller users, return null (no message shown)
                              return null
                            })()}
                          </div>
                        </div>
                        
                        {index < transformedOrderData.items.length - 1 && (
                          <div className="border-t border-gray-200 mt-6"></div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className={cn(
              "bg-white border border-gray-200 shadow-sm flex-shrink-0",
              transformedOrderData.items.length === 1 ? "rounded-none border-b-0" : "rounded-b-lg rounded-t-none"
            )}>
              <CardContent className="p-0">
                <div className="space-y-[8px]">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center px-[8px] pt-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Subtotal</span>
                    <span className="font-bold text-gray-900 font-spectral body-3">{formatIndianCurrency(transformedOrderData.summary.subtotalAmount || 0)}</span>
                  </div>
                  
                  {/* Discount */}
                  <div className="flex justify-between items-center px-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Discount</span>
                    <span className="font-bold text-gray-900 font-spectral body-3">
                      {transformedOrderData.summary.discount > 0 ? `-${formatIndianCurrency(transformedOrderData.summary.discount || 0).replace('₹', '')}` : '0'}
                    </span>
                  </div>
                  
                  {/* Tax */}
                  <div className="flex justify-between items-center px-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Tax</span>
                    <span className="font-bold text-gray-900 font-spectral body-3">{formatIndianCurrency(transformedOrderData.summary.taxAmount || 0)}</span>
                  </div>
                  
                  {/* Shipment Cost */}
                  <div className="flex justify-between items-center px-[8px]">
                    <span className="text-gray-900 font-urbanist body-2">Shipment Cost</span>
                    <span className="font-bold text-green-200 font-spectral body-3">
                      {transformedOrderData.summary.shippingCost > 0 ? formatIndianCurrency(transformedOrderData.summary.shippingCost || 0) : 'FREE'}
                    </span>
                  </div>
                  
                  {/* Grand Total with Border */}
                  <div className="border-t border-gray-300">
                    <div className="flex justify-between items-center py-[8px] px-[8px]">
                      <span className="body-2 font-semibold text-gray-900 font-urbanist">Grand Total:</span>
                      <span className="body-2 font-bold text-gray-900 font-spectral">{formatIndianCurrency(transformedOrderData.summary.totalAmount || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Log and Customer Info */}
          <div className="lg:w-1/3 space-y-6">
            {/* Order Timeline */}
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm h-[300px] flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="flex items-center space-x-2 px-[4px] py-[8px] border-b border-gray-200 flex-shrink-0">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Order Timeline</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}  
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide px-[4px] py-[8px]">
                  {transformedOrderData.activities.length === 0 ? (
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
                        {transformedOrderData.activities.map((activity, index) => (
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
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm h-[350px] flex flex-col p-0">
              <CardContent className="flex flex-col h-full p-0">
                <div className="flex items-center justify-between flex-shrink-0 border-b border-300">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist m-[8px]">Customer/Payment Details</h3>
                  <button 
                    onClick={handleCopyDetails}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-urbanist"
                  >
                    <Copy className="h-4 w-4 text-gray-700"/>
                    <span className='text-grey-700'>Copy</span>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 p-[8px]">
                  {/* Customer Information */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <img src="/images/svg/Rectangle.png" alt="User" className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="font-semibold text-gray-900 font-urbanist body-2">{transformedOrderData.customerName}</h4>
                        <div className="flex items-center text-gray-900 font-urbanist body-2 gap-1">
                          <span>{transformedOrderData.phone}</span>
                          {/* <span className='text-secondary-900 font-urbanist body-2'>•</span> */}
                          {/* <span className='text-gray-900 font-urbanist body-2'>xyz@gmail.com</span> */}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shipping Address */}
                  <div>
                    <div className="flex items-start gap-3">
                      <img src="/images/svg/Rectangle (1).png" alt="User" className="w-10 h-10 rounded-full" />
                      <div>
                        <h4 className="font-semibold text-gray-900 font-urbanist mb-1 body-2">Shipping Address</h4>
                        <p className="text-gray-900 font-urbanist body-2">{transformedOrderData.address}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Information */}
                  <div className="border-t border-gray-200 pt-4 gap-1">
                    <div className="space-y-1 mt-[8px]">
                      <div className="flex justify-between font-urbanist body-2">
                        <span className="text-gray-600">Payment Mode:</span>
                        <span className="text-gray-700">{transformedOrderData.paymentMode}</span>
                      </div>
                      {/* <div className="flex justify-between font-urbanist body-2">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className="text-green-700 font-semibold">Paid</span>
                      </div> */}
                      <div className="flex justify-between font-urbanist body-2">
                        <span className="text-gray-600">Payment Reference ID:</span>
                        <span className="text-gray-700">{transformedOrderData.paymentReference}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          
            {/* Assigned Supplier */}
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm h-[180px] flex flex-col p-0">
              <CardContent className="flex flex-col h-full p-0">
                <div className="flex items-center space-x-2 px-[4px] py-[8px] border-b border-gray-200 flex-shrink-0">
                  <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Assigned Supplier</h3>
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide px-[8px] py-[8px]">
                  {(() => {
                    // Get unique suppliers from order items
                    const suppliers = transformedOrderData.items
                      .filter(item => item.sellerName)
                      .map(item => ({
                        name: item.sellerName!,
                        id: item.orderLineId
                      }))
                    
                    // Get unique suppliers by name
                    const uniqueSuppliers = Array.from(
                      new Map(suppliers.map(s => [s.name, s])).values()
                    )

                    if (uniqueSuppliers.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                          <div className="text-gray-400 mb-2">
                            <User className="h-12 w-12" />
                          </div>
                          <p className="text-gray-500 font-urbanist text-sm body-3">No supplier assigned</p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        {uniqueSuppliers.map((supplier, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <img src="/images/svg/Rectangle.png" alt="User" className="w-10 h-10 rounded-full" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 font-urbanist body-2">
                                {supplier.name}
                              </h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
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
              {renderShippingDetails()}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Approved/Rejected Slider */}
      {selectedItem && (() => {
        const orderLine = apiOrderData?.order_line?.find(line => line.order_line_id === selectedItem.orderLineId)
        const mfgRejectionCount = (orderLine as any)?.mfg_rejection_count || 0
        const pkgRejectionCount = (orderLine as any)?.pkg_rejection_count || 0
        return (
          <ApprovedRejectedSlider
            isOpen={isSliderOpen}
            onClose={handleCloseSlider}
            stageType={selectedItem.status === 'mfg_qc' ? 'mfg_qc' : 'pkg_qc'}
            itemName={selectedItem.name}
            itemId={selectedItem.id}
            orderLineId={selectedItem.orderLineId}
            itemDetails={{
              quantity: selectedItem.quantity,
              unitPrice: selectedItem.unitPrice,
              weight: selectedItem.weight,
              color: selectedItem.color,
              subtotal: selectedItem.subtotal,
              image: selectedItem.image,
              status: selectedItem.status,
              mfgQcStatus: selectedItem.mfgQcStatus,
              packagingQcStatus: selectedItem.packagingQcStatus
            }}
            qcData={selectedItem.status === 'mfg_qc' 
              ? orderLine?.mfg_qc_data || []
              : orderLine?.packaging_qc_data || []
            }
            onApprove={handleApprove}
            onReject={handleReject}
            onSliderStateChange={(isOpen) => setIsSliderOpen(isOpen)}
            mfgRejectionCount={mfgRejectionCount}
            pkgRejectionCount={pkgRejectionCount}
            allMfgQcData={orderLine?.mfg_qc_data || []}
            allPkgQcData={orderLine?.packaging_qc_data || []}
          />
        )
      })()}

      <ImagePreviewModal
        open={isPreviewOpen}
        onOpenChange={handleClosePreview}
        imageUrl={previewImageUrl}
        alt="Product image preview"
      />
    </>
  )
}

export default MfgQcOrderDetail