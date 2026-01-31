"use client"
import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Bell, Sparkles, ChevronLeft, Plus, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotification } from '@/components/notification'
import { uploadAndTransform } from '@/lib/api/endpoints/ai'
import { toast } from '@/hooks/use-toast'
import { useUserType } from '@/hooks/use-user-type'
import { useExtractDetailModal } from '@/components/features/inventory/providers/extract-detail-modal-provider'

function PageHeader({ 
  title, 
  subTitle, 
  onTitleClick,
  onMenuClick,
  className,
  icon,
  menuIcon,
  onNewChat,
  action
}: { 
  title: string, 
  subTitle?: string,
  onTitleClick?: () => void,
  onMenuClick?: () => void,
  className?: string,
  icon?: React.ReactNode,
  menuIcon?: React.ReactNode,
  onNewChat?: () => void,
  action?: React.ReactNode
}) {
  const { openNotification } = useNotification()
  const [dynamicTitle, setDynamicTitle] = useState<string>(title)
  const { userType } = useUserType()
  const { openModal: openExtractDetailModal, isProcessing: isExtractProcessing } = useExtractDetailModal()
  const pathname = usePathname()

  useEffect(() => {
    // If there's a subtitle, determine the title from file-based routing or legacy query params
    if (subTitle) {
      if (typeof window !== 'undefined') {
        // Check if we're on a file-based route (for both admin-dashboard and seller-dashboard)
        // Admin dashboard routes
        const isAdminInventoryRoute = pathname?.startsWith('/admin-dashboard/inventory')
        const isAdminOrderHistoryRoute = pathname?.startsWith('/admin-dashboard/order-history')
        const isAdminQualityControlRoute = pathname?.startsWith('/admin-dashboard/quality-control')
        const isAdminShippingDeliveryRoute = pathname?.startsWith('/admin-dashboard/shipping-delivery')
        const isBrandManagementRoute = pathname?.startsWith('/admin-dashboard/brand-management')
        const isCategoriesManagementRoute = pathname?.startsWith('/admin-dashboard/categories-management')
        const isAllSupplierDetailsRoute = pathname?.startsWith('/admin-dashboard/all-supplier-details')
        
        // Seller dashboard routes
        const isSellerInventoryRoute = pathname?.startsWith('/seller-dashboard/inventory')
        const isSellerOrderHistoryRoute = pathname?.startsWith('/seller-dashboard/order-history')
        const isSellerQualityControlRoute = pathname?.startsWith('/seller-dashboard/quality-control')
        const isSellerShippingDeliveryRoute = pathname?.startsWith('/seller-dashboard/shipping-delivery')
        
        // Combined checks
        const isInventoryRoute = isAdminInventoryRoute || isSellerInventoryRoute
        const isOrderHistoryRoute = isAdminOrderHistoryRoute || isSellerOrderHistoryRoute
        const isQualityControlRoute = isAdminQualityControlRoute || isSellerQualityControlRoute
        const isShippingDeliveryRoute = isAdminShippingDeliveryRoute || isSellerShippingDeliveryRoute
        
        if (isInventoryRoute) {
          // File-based routing: derive title from pathname
          setDynamicTitle('Inventory')
        } else if (isOrderHistoryRoute) {
          // File-based routing: derive title from pathname
          setDynamicTitle('Order History')
        } else if (isQualityControlRoute) {
          // File-based routing: derive title from pathname
          setDynamicTitle('Quality Control')
        } else if (isShippingDeliveryRoute) {
          // File-based routing: derive title from pathname
          setDynamicTitle('Shipping & Delivery')
        } else if (isBrandManagementRoute) {
          // File-based routing: derive title from pathname
          setDynamicTitle('Brand Management')
        } else if (isCategoriesManagementRoute) {
          // File-based routing: derive title from pathname
          setDynamicTitle('Category Management')
        } else if (isAllSupplierDetailsRoute) {
          // File-based routing: derive title from pathname
          setDynamicTitle('All Supplier Details')
        } else {
          // Legacy query param logic for other routes
          const urlParams = new URLSearchParams(window.location.search)
          const tab = urlParams.get('tab')
          
          if (tab) {
            // Special mappings for specific tabs
            const tabToLabelMap: { [key: string]: string } = {
              'quality-control': 'Quality Control',
              'order-history': 'Order History',
              'shipping-delivery': 'Shipping & Delivery',
              'exceptions-rto': 'Exceptions & RTO',
              'finance-reconciliation': 'Finance & Reconciliation',
              'post-order-feedback': 'Post Order & Feedback',
              'insights-performance': 'Insights & Performance',
              'all-supplier-details': 'All Supplier Details',
            }
            
            // Check if there's a special mapping, otherwise format the tab name
            const formattedTitle = tabToLabelMap[tab] || tab
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            setDynamicTitle(formattedTitle)
          } else {
            setDynamicTitle(title)
          }
        }
      }
    }
  }, [subTitle, title, pathname])

  return (
    <div className={`w-full bg-white border-b border-gray-200 px-[28px] py-[19px] h-[79.5px] ${className || ''}`}>
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button onClick={onMenuClick} className="p-0 bg-transparent border-none outline-none cursor-pointer hover:opacity-80 transition-opacity">
              {menuIcon || <Menu className="h-6 w-6 text-gray-600" />}
            </button>
          )}
          {icon && (
            <div className="flex items-center">
              {icon}
            </div>
          )}
          <div className="flex flex-col gap-1">
            {subTitle ? (
              <>
              <div className="flex items-center gap-1">   
                <Button onClick={onTitleClick} className="h-[30px] w-[30px]">
                <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="body-3 font-semibold text-gray-500 text-urbanist">{dynamicTitle} /</div>
                <div className="h-6 font-semibold text-gray-800 text-urbanist">{subTitle}</div>
              </div>
              </>
            ) : (
              <>
                {/* When only title exists, it becomes h1 */}
                <h1 className="text-2xl font-semibold text-gray-800 text-urbanist">{title}</h1>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {action}
          {onNewChat && (
            <Button 
              onClick={onNewChat} 
              variant="outline"
              className="flex items-center gap-2 h-9 bg-primary-600 text-white hover:bg-primary-700 rounded-full hover:text-white"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-urbanist font-medium">New Chat</span>
            </Button>
          )}
          {(title === "Inventory" && (subTitle === "draft" || userType === "seller") && (subTitle !== "Add Item" && subTitle !== "Edit Item")) &&(
                      <Button
                        onClick={openExtractDetailModal}
                        disabled={isExtractProcessing}
                        className={`h-[30px] px-3 body-4 font-urbanist font-semibold hover:text-white ${
                          isExtractProcessing
                            ? "bg-gray-600 cursor-not-allowed opacity-60"
                            : "bg-secondary-900 hover:bg-secondary-800 hover:text-white"
                        }`}
                      >
                            Smart Excel Import
                        </Button>
                    )}

          {!subTitle && (
            <button 
              onClick={openNotification}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
            </button>
          )}

        </div>
      </div>
    </div>
  )
}

export default PageHeader


