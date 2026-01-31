"use client"

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Info, ArrowRight } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

import PageHeader from '@/components/shared/layout/page-header'
import { useDashboardQuery } from '../hooks/use-dashboard-query'
import type { DashboardContentProps } from '../types/dashboard.types'
import type { Order } from '@/components/features/orders/types/orders.types'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'

// Import dashboard sub-components
import PickupsScheduledTable from './pickups-scheduled-table'
import SalePurchaseGraph from './sale-purchase-graph'
import RecentOrderDetails from './recent-order-details'
import OrderDetailsSlider from './order-details-slider'
import TopCustomers from './Top-Customers'
// Import from other features
import { formatIndianNumberWithUnits } from '@/lib/api/helpers/number'

// SVG Icons
const PriceTagIcon = ({ className = "h-5 w-5", color = "#06AED4" }: { className?: string; color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g clipPath="url(#clip0_151_5135)">
      <path d="M18.9042 1.5H13.1419C12.9627 1.49987 12.7909 1.57065 12.6638 1.69688L1.14375 13.2141C0.891571 13.4675 0.75 13.8105 0.75 14.168C0.75 14.5255 0.891571 14.8685 1.14375 15.1219L6.62813 20.6063C6.88163 20.8585 7.22468 21 7.58227 21C7.93986 21 8.28291 20.8585 8.53641 20.6063L20.0531 9.09375C20.1794 8.96665 20.2501 8.79476 20.25 8.61563V2.85C20.2509 2.67283 20.2167 2.49724 20.1494 2.33333C20.0821 2.16943 19.9831 2.02045 19.858 1.89497C19.7329 1.76949 19.5843 1.67 19.4206 1.60221C19.2569 1.53443 19.0814 1.49969 18.9042 1.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5 6.75C16.2033 6.75 15.9133 6.66203 15.6666 6.49721C15.42 6.33238 15.2277 6.09812 15.1142 5.82403C15.0006 5.54994 14.9709 5.24834 15.0288 4.95737C15.0867 4.66639 15.2296 4.39912 15.4393 4.18934C15.6491 3.97956 15.9164 3.8367 16.2074 3.77882C16.4983 3.72094 16.7999 3.75065 17.074 3.86418C17.3481 3.97771 17.5824 4.16997 17.7472 4.41665C17.912 4.66332 18 4.95333 18 5.25C18 5.64783 17.842 6.02936 17.5607 6.31066C17.2794 6.59197 16.8978 6.75 16.5 6.75Z" fill={color}/>
      <path d="M10.7812 22.5L23.0625 10.2188C23.1236 10.1572 23.1717 10.0839 23.2039 10.0034C23.2361 9.9229 23.2518 9.83671 23.25 9.75V3.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip0_151_5135">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
)

const CalendarIcon = ({ className = "h-5 w-5", color = "#0E9384" }: { className?: string; color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16.5 5V3M7.5 5V3M3.25 8H20.75M10.5 12.5L13.5 15.5M13.5 12.5L10.5 15.5M3 10.044C3 7.929 3 6.871 3.436 6.063C3.83025 5.34231 4.44199 4.7645 5.184 4.412C6.04 4 7.16 4 9.4 4H14.6C16.84 4 17.96 4 18.816 4.412C19.569 4.774 20.18 5.352 20.564 6.062C21 6.872 21 7.93 21 10.045V14.957C21 17.072 21 18.13 20.564 18.938C20.1698 19.6587 19.558 20.2365 18.816 20.589C17.96 21 16.84 21 14.6 21H9.4C7.16 21 6.04 21 5.184 20.588C4.44214 20.2358 3.83041 19.6583 3.436 18.938C3 18.128 3 17.07 3 14.955V10.044Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/**
 * Unified Dashboard Content Component
 * Works for both seller and admin dashboards
 */
export function DashboardContent({ 
  onSliderStateChange, 
  onNavigateToTab,
  userType: propUserType,
  section,
  sectionId,
  onSectionChange,
}: DashboardContentProps) {
  const router = useRouter()
  
  // Get user type from props or localStorage
  const userType = useMemo(() => {
    if (propUserType) return propUserType
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_type') as 'seller' | 'admin' || 'seller'
    }
    return 'seller'
  }, [propUserType])

  // Use dashboard query hook for data fetching
  const {
    summary,
    insights,
    hasError,
    errorMessage,
    summaryLoading,
    insightsLoading,
    refreshAll,
    formatINR,
  } = useDashboardQuery()

  // Local state for UI interactions
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>("")
  const [isErrorOpen, setIsErrorOpen] = useState(false)

  // Navigation handlers
  const goToOrderHistory = () => onNavigateToTab?.("order-history")
  const goToShippingDelivery = () => onNavigateToTab?.("shipping-delivery")

  // Order details handlers
  const handleViewOrderDetails = (trackingId: string) => {
    setSelectedTrackingId(trackingId)
    setIsOrderDetailsOpen(true)
    onSliderStateChange?.(true)
  }

  const handleCloseOrderDetails = () => {
    setIsOrderDetailsOpen(false)
    setSelectedTrackingId("")
    onSliderStateChange?.(false)
  }

  const handleOrderClick = (order: Order) => {
    // Navigate to the order-history detail page using file-based routing
    const basePath = userType === 'admin' ? '/admin-dashboard' : '/seller-dashboard'
    router.push(`${basePath}/order-history/${order.id}`)
  }

  const handleViewSupplierDetails = (orderId: string) => {
    // Navigate to the shipping-delivery detail page using file-based routing
    const basePath = userType === 'admin' ? '/admin-dashboard' : '/seller-dashboard'
    router.push(`${basePath}/shipping-delivery/${orderId}`)
  }

  // Show spinner only for initial summary and insights loading (not for table loading)
  // Tables handle their own loading states with skeleton loaders
  const isInitialLoading = summaryLoading || insightsLoading

  return (
    <div className={`bg-gray-50 scrollbar-hide relative ${isInitialLoading ? 'h-screen' : 'min-h-screen'}`}>
      {isInitialLoading && (
        <div className="absolute top-0 left-0 right-0 bottom-0 z-50 bg-white flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <PageHeader title="Home" />

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Top Section - Summary Metrics */}
        <div className="grid grid-cols-4 gap-0">
          {/* Total Earnings Card */}
          <Card className="bg-white border border-gray-200 rounded-l-lg rounded-r-none shadow-sm">
            <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
              <div className="mb-2 px-5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-800 body-3 font-urbanist">Total Earnings</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
                <div className="text-xs text-gray-500 body-3 font-urbanist">(As of today)</div>
              </div>
              <div className="flex items-center justify-between mb-4 px-5">
                <div>
                  <div className="text-2xl font-bold text-gray-900 font-spectral">
                    {summary ? formatIndianNumberWithUnits(summary.total_earning) : '₹0'}
                  </div>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <PriceTagIcon className="h-5 w-5" color="#06AED4" />
                </div>
              </div>
              <div className="mt-auto">
                <button onClick={goToOrderHistory} className="flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <span className="label-2 font-urbanist">See Details</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Orders Shipped Card */}
          <Card className="bg-white border border-gray-200 border-l-0 rounded-none shadow-sm">
            <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
              <div className="mb-2 px-5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-800 body-3 font-urbanist">Orders Shipped</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 px-5 mt-[13px]">
                <div>
                  <div className="text-2xl font-bold text-gray-900 font-spectral">
                    {summary ? summary.order_shipped : 0}
                  </div>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5" color="#0E9384" />
                </div>
              </div>
              <div className="mt-auto">
                <button onClick={goToShippingDelivery} className="label-2 font-urbanist flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <span>See Details</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Orders Delivered Card */}
          <Card className="bg-white border border-gray-200 border-l-0 rounded-none shadow-sm">
            <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
              <div className="mb-2 px-5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-800 body-3 font-urbanist">Orders Delivered</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 px-5 mt-[13px]">
                <div>
                  <div className="text-2xl font-bold text-gray-900 font-spectral">
                    {summary ? summary.order_delivered : 0}
                  </div>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <PriceTagIcon className="h-5 w-5" color="#06AED4" />
                </div>
              </div>
              <div className="mt-auto">
                <button onClick={goToShippingDelivery} className="flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <span className="label-2 font-urbanist">See Details</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* New Orders Card */}
          <Card className="bg-white border border-gray-200 border-l-0 rounded-r-lg rounded-l-none shadow-sm">
            <CardContent className="pt-6 pb-0 px-0 flex flex-col h-full">
              <div className="mb-2 px-5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-800 body-3 font-urbanist">New Orders</h3>
                  {/* <Info className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 px-5 mt-[13px]">
                <div>
                  <div className="text-2xl font-bold text-gray-900 font-spectral">
                    {summary ? summary.new_orders : 0}
                  </div>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <PriceTagIcon className="h-5 w-5" color="#06AED4" />
                </div>
              </div>
              <div className="mt-auto">
                <button onClick={goToOrderHistory} className="flex items-center justify-center w-full h-10 pt-2 pb-2 border-t border-gray-100 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <span className="label-2 font-urbanist">See Details</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights & Performance Section */}
        <div className="space-y-4">
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardContent className="p-0">
              {/* Card Header */}
              <div className="flex items-center justify-between p-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Insights & Performance</h2>
                  {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}  
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-5 divide-x divide-gray-200">
                {/* Pending Quality Control */}
                <div className="py-4 px-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">Pending Quality Control</div>
                    {/* <Info className="h-4 w-4 text-gray-400" /> */}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 font-bold text-gray-900 font-spectral">
                        {insights ? insights.pending_mfg_pkg_qc : 0}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <img src="/images/svg/tabler_clock-filled.svg" alt="Clock" className="h-5 w-5"/>
                    </div>
                  </div>
                </div>

                {/* Quality Control Rejected */}
                <div className="py-4 px-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">Quality Control Rejected</div>
                    {/* <Info className="h-4 w-4 text-gray-400" /> */}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 font-bold text-gray-900 font-spectral">
                        {insights ? insights.rejected_mfg_pkg_qc : 0}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <img src="/images/svg/material-symbols_cancel-rounded.svg" alt="Cancel" className="h-5 w-5"/>
                    </div>
                  </div>
                </div>

                {/* Timelines At-Risk */}
                <div className="py-4 px-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">Timelines At-Risk</div>
                    {/* <Info className="h-4 w-4 text-gray-400" /> */}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 font-bold text-gray-900 font-spectral">
                        {insights ? insights.timelines_at_risk : 0}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <img src="/images/svg/material-symbols_timelapse-rounded.svg" alt="Timeline" className="h-5 w-5"/>
                    </div>
                  </div>
                </div>

                {/* Ready to Ship */}
                <div className="py-4 px-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">Ready to Ship</div>
                    {/* <Info className="h-4 w-4 text-gray-400" /> */}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 font-bold text-gray-900 font-spectral">
                        {insights ? insights.ready_to_ship : 0}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <img src="/images/svg/solar_delivery-bold.svg" alt="Delivery" className="h-5 w-5"/>
                    </div>
                  </div>
                </div>

                {/* Pickup Schedule */}
                <div className="py-4 px-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="font-semibold text-neutral-800 body-3 font-urbanist text-sm">Pickup Schedule</div>
                    {/* <Info className="h-4 w-4 text-gray-400" /> */}  
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 font-bold text-gray-900 font-spectral">
                        {insights ? insights.pickup_today : 0}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <img src="/images/svg/material-symbols_delivery-truck-speed-rounded (1).svg" alt="Truck" className="h-5 w-5"/>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Tables and Graphs */}
      <div className="ml-6 mr-6">
        <PickupsScheduledTable
          onViewOrderDetails={handleViewOrderDetails}
          onNavigateToShippingDelivery={() => onNavigateToTab?.("shipping-delivery")}
          onViewSupplierDetails={handleViewSupplierDetails}
        />
        <RecentOrderDetails onOrderClick={handleOrderClick} />
        <SalePurchaseGraph />
        
        {/* Admin-only: Top Customers */}
        {userType === 'admin' && <TopCustomers />}
      </div>

      {/* Order Details Slider */}
      <OrderDetailsSlider
        isOpen={isOrderDetailsOpen}
        onClose={handleCloseOrderDetails}
        trackingId={selectedTrackingId}
      />

      {/* Error Modal */}
      <AlertDialog open={hasError && isErrorOpen} onOpenChange={setIsErrorOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Failed to fetch data</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage || 'Something went wrong while fetching data.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={summaryLoading || insightsLoading} onClick={() => setIsErrorOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={summaryLoading || insightsLoading} onClick={refreshAll}>
              {summaryLoading || insightsLoading ? 'Retrying…' : 'Retry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DashboardContent

