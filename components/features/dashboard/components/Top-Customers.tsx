"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info } from 'lucide-react'
import { TimePicker, TimePeriod } from '@/components/shared/ui/time-picker'
import type { TopCategoryRecord, OrderCountRecord, TopCustomerRecord } from '../types/dashboard.types'
import {
  useTopCustomersQuery,
  useTopCategoriesQuery,
  useOrderCountSummaryQuery,
} from '../hooks/use-dashboard-query'

// Helper function to calculate dates based on period
function getDateRange(period: TimePeriod, customDates?: { startDate: string; endDate: string }): { startDate: string; endDate: string } {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  
  let startDate: Date
  let endDate: Date = new Date(today)
  
  if (period === "custom" && customDates) {
    return {
      startDate: customDates.startDate,
      endDate: customDates.endDate
    }
  }
  
  switch (period) {
    case "today":
      startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)
      break
    case "week":
      startDate = new Date(today)
      const dayOfWeek = today.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday is day 0
      startDate.setDate(today.getDate() - diff)
      startDate.setHours(0, 0, 0, 0)
      break
    case "month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)
      break
    default:
      startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)
  }
  
  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  }
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Top Customers Card Component
function TopCustomersCard() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month")
  const [customDates, setCustomDates] = useState<{ startDate: string; endDate: string } | undefined>()
  
  // Get date range for current period
  const dateRange = useMemo(() => getDateRange(selectedPeriod, customDates), [selectedPeriod, customDates])
  
  // Use TanStack Query hook for fetching top customers
  const { data: customers = [], isLoading, error } = useTopCustomersQuery(
    dateRange.startDate,
    dateRange.endDate
  )
  
  const handlePeriodChange = async (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => {
    setSelectedPeriod(period)
    setCustomDates(customDates)
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Card Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-100 h-[55px]">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Top Customers</h2>
            {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}    
          </div>
          <TimePicker
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            isLoading={isLoading}
          />
        </div>

        {/* Customers List */}
        <div className="py-[16px] px-[8px] flex-1">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-red-500 body-3 font-urbanist">
                {error instanceof Error ? error.message : 'Failed to load customers'}
              </div>
            </div>
          ) : isLoading && customers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-gray-500 body-3 font-urbanist">Loading...</div>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-gray-500 body-3 font-urbanist">No customers found</div>
            </div>
          ) : (
            customers.map((customer, index) => {
              // Get initials from name
              const initials = customer.customer_name
                .split(' ')
                .map((word: string) => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              
              // Format phone number - show "N/A" if empty
              const phoneDisplay = customer.customer_mobile || "N/A"
              
              // Format address - use as branch/location
              const addressDisplay = customer.address || "N/A"

              return (
                <div key={`${customer.customer_name}-${index}`} className={`flex items-center justify-between h-[50px] px-[8px] ${index !== customers.length - 1 ? 'mb-[20px]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm body-3 font-urbanist">{customer.customer_name}</p>
                      <p className="text-xs text-gray-500 body-3 font-urbanist">
                        {phoneDisplay} • {customer.order_count} {customer.order_count === 1 ? 'order' : 'orders'} placed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900 font-urbanist">
                      {formatCurrency(customer.amount)}
                    </p>
                    <p className="text-xs text-gray-500 body-3 font-urbanist">
                      {addressDisplay}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* View Details Button */}
        {/* <div className="p-2 border-t border-gray-100 mt-auto h-[44px]">
          <button className="w-full flex items-center justify-center gap-2 text-gray-700 font-semibold hover:text-gray-900 transition-colors label-2 font-urbanist">
            <span>View Details</span>
            <span>→</span>
          </button>
        </div> */}
      </CardContent>
    </Card>
  )
}

// Top Categories Card Component
function TopCategoriesCard() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month")
  const [customDates, setCustomDates] = useState<{ startDate: string; endDate: string } | undefined>()
  
  // Get date range for current period
  const dateRange = useMemo(() => getDateRange(selectedPeriod, customDates), [selectedPeriod, customDates])
  
  // Use TanStack Query hook for fetching top categories
  const { data: categories = [], isLoading, error } = useTopCategoriesQuery(
    dateRange.startDate,
    dateRange.endDate
  )
  
  const handlePeriodChange = async (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => {
    setSelectedPeriod(period)
    setCustomDates(customDates)
  }
  
  // Calculate total categories and products from the data
  const totalCategories = categories.length
  const totalProducts = categories.reduce((sum, cat) => sum + Math.round(cat.total_qty), 0)
  
  // Calculate percentages for the donut chart (using total_amount as the metric)
  const totalAmount = categories.reduce((sum, cat) => sum + cat.total_amount, 0)
  const categoryPercentages = categories.slice(0, 3).map(cat => ({
    name: cat.category_name,
    percentage: totalAmount > 0 ? (cat.total_amount / totalAmount) * 100 : 0,
    amount: cat.total_amount,
    qty: cat.total_qty
  }))
  
  // Colors for the chart segments
  const chartColors = ["#fb923c", "#f97316", "#1e3a8a"]
  
  // Calculate stroke-dasharray for donut chart
  const circumference = 2 * Math.PI * 70 // radius is 70
  
  // Calculate offsets for each segment
  const segmentsWithOffsets = categoryPercentages.map((cat, index) => {
    const previousOffset = index === 0 ? 0 : categoryPercentages.slice(0, index).reduce((sum, c) => sum + (c.percentage / 100) * circumference, 0)
    const dashLength = (cat.percentage / 100) * circumference
    return {
      ...cat,
      dashArray: `${dashLength} ${circumference}`,
      offset: -previousOffset
    }
  })
  
  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Card Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-100 h-[55px]">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Top Categories</h2>
            {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}    
          </div>
          <TimePicker
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            isLoading={isLoading}
          />
        </div>

        {/* Chart and Stats */}
        <div className="py-[16px] px-[8px] flex-1">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-red-500 body-3 font-urbanist">
                {error instanceof Error ? error.message : 'Failed to load categories'}
              </div>
            </div>
          ) : isLoading && categories.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-gray-500 body-3 font-urbanist">Loading...</div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-gray-500 body-3 font-urbanist">No categories found</div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-[200px] h-[200px] flex-shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    <defs>
                      {/* Shadow filter */}
                      <filter id="shadow-categories" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    
                    {/* Background circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="30"
                    />
                    
                    {/* Render all chart segments first */}
                    {segmentsWithOffsets.map((segment, index) => (
                      <circle
                        key={`segment-${index}`}
                        cx="100"
                        cy="100"
                        r="70"
                        fill="none"
                        stroke={chartColors[index % chartColors.length]}
                        strokeWidth="30"
                        strokeDasharray={segment.dashArray}
                        strokeDashoffset={segment.offset}
                        transform="rotate(-90 100 100)"
                        filter="url(#shadow-categories)"
                      />
                    ))}
                    
                    {/* Render all percentage labels on top of segments */}
                    {segmentsWithOffsets.map((segment, index) => {
                      // Calculate label position (simplified - positions on the arc)
                      const segmentStartAngle = (segment.offset / circumference) * 360 - 90
                      const segmentMiddleAngle = segmentStartAngle + (segment.percentage / 2 / 100) * 360
                      const radian = (segmentMiddleAngle * Math.PI) / 180
                      const labelRadius = 85
                      const labelX = 100 + labelRadius * Math.cos(radian)
                      const labelY = 100 + labelRadius * Math.sin(radian)
                      
                      return (
                        <g key={`label-${index}`}>
                          <circle cx={labelX} cy={labelY} r="18" fill="white" filter="url(#shadow-categories)"/>
                          <text 
                            x={labelX} 
                            y={labelY + 5} 
                            textAnchor="middle" 
                            className="text-sm font-semibold" 
                            fill={chartColors[index % chartColors.length]}
                          >
                            {Math.round(segment.percentage)}%
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Category Legend */}
                <div className="flex-1 space-y-4">
                  {categoryPercentages.map((cat, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm mt-1 flex-shrink-0" 
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      ></div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm body-3 font-urbanist">{cat.name}</p>
                        <p className="text-gray-900 text-sm font-semibold body-3 font-urbanist">{Math.round(cat.qty)}</p>
                      </div>
                    </div>
                  ))}
                  {categoryPercentages.length === 0 && (
                    <div className="text-sm text-gray-500 body-3 font-urbanist">No category data available</div>
                  )}
                </div>
              </div>

              {/* Category Statistics Section */}
              <div className="mt-[17px]">
                <p className="text-gray-900 font-semibold text-sm mb-3 label-1 font-urbanist">Category Statistics</p>
                <div className="space-y-2 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between border-b border-gray-200 p-[8px]">
                    <p className="text-gray-900 text-sm body-3 font-urbanist">Total Number Of Categories</p>
                    <p className="text-gray-900 text-sm font-semibold body-3 font-urbanist">{totalCategories}</p>
                  </div>
                  <div className="flex items-center justify-between px-[8px] pb-[8px]">
                    <p className="text-gray-900 text-sm body-3 font-urbanist">Total Number Of Products</p>
                    <p className="text-gray-900 text-sm font-semibold body-3 font-urbanist">{totalProducts}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* View Details Button */}
        {/* <div className="p-2 border-t border-gray-100 mt-auto h-[44px]">
          <button className="w-full flex items-center justify-center gap-2 text-gray-700 font-semibold hover:text-gray-900 transition-colors label-2 font-urbanist">
            <span>View Details</span>
            <span>→</span>
          </button>
        </div> */}
      </CardContent>
    </Card>
  )
}

// Order Statistics Weekly Card Component
function OrderStatisticsCard() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week")
  const [customDates, setCustomDates] = useState<{ startDate: string; endDate: string } | undefined>()
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null)
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const timeSlots = ["12 am", "03 am", "06 am", "09 am", "12 pm", "03 pm", "06 pm", "09 pm"]
  
  // Get date range for current period
  const dateRange = useMemo(() => getDateRange(selectedPeriod, customDates), [selectedPeriod, customDates])
  
  // Use TanStack Query hook for fetching order count summary
  const { data: orderCounts = [], isLoading, error } = useOrderCountSummaryQuery(
    dateRange.startDate,
    dateRange.endDate
  )
  
  const handlePeriodChange = async (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => {
    setSelectedPeriod(period)
    setCustomDates(customDates)
  }
  
  // Transform API data (daily counts) into heatmap format (time slots x days of week)
  // Since API only provides daily counts, we'll map them to days of the week
  // and show the same count for all time slots of that day
  const getHeatmapData = (): { time: string; days: number[] }[] => {
    // Get the date range for the selected period
    const dateRange = getDateRange(selectedPeriod)
    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)
    
    // Create a map of date to count
    const dateCountMap = new Map<string, number>()
    orderCounts.forEach(record => {
      dateCountMap.set(record.date, record.count)
    })
    
    // Calculate which days of the week are in the range
    // For weekly view, we want to show the 7 days of the week
    const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0] // Mon-Sun
    
    // Iterate through the date range and map to days of week
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
      const count = dateCountMap.get(dateStr) || 0
      
      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = currentDate.getDay()
      // Convert to our array index (0 = Monday, 6 = Sunday)
      const arrayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      
      // Add to the day count (accumulate if multiple dates map to same day)
      dayCounts[arrayIndex] += count
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Create heatmap data - same count for all time slots of each day
    return timeSlots.map(time => ({
      time,
      days: [...dayCounts]
    }))
  }
  
  const heatmapData = getHeatmapData()

  const getIntensityColor = (value: number) => {
    if (value === 0) return "bg-[#E8E9F3]" // Light purple/gray for empty cells
    if (value < 5) return "bg-primary-300" // Light primary color
    if (value < 10) return "bg-primary-400" // Medium-light primary color
    if (value < 20) return "bg-primary-500" // Medium primary color
    return "bg-primary-600" // Darkest primary color for highest values
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Card Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Order Statistics Weekly</h2>
            {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}    
          </div>
          <div className="flex items-center gap-2">
            <TimePicker
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Heatmap Content */}
        <div className="py-[16px] px-[8px] flex-1">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-red-500 body-3 font-urbanist">
                {error instanceof Error ? error.message : 'Failed to load order statistics'}
              </div>
            </div>
          ) : isLoading && orderCounts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-gray-500 body-3 font-urbanist">Loading...</div>
            </div>
          ) : (
            <div className="space-y-[6px]">
              {heatmapData.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-8 gap-[6px]">
                  {/* Time label */}
                  <div className="text-[10px] text-gray-600 font-normal flex items-center justify-start w-10 body-3 font-urbanist">
                    {row.time}
                  </div>
                  {/* Data cells */}
                  {row.days.map((value, colIndex) => (
                    <div
                      key={colIndex}
                      className="relative flex items-center justify-center"
                      onMouseEnter={() => setHoveredCell({row: rowIndex, col: colIndex})}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={`w-full h-[33px] rounded ${getIntensityColor(value)} cursor-pointer transition-all duration-200 hover:opacity-80 ${value > 0 ? 'hover:scale-105' : ''}`}
                      />
                      {/* Show tooltip on hover with order count */}
                      {hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex && value > 0 && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 body-3 font-urbanist">
                          {value} Orders
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {/* Day labels at the bottom */}
              <div className="grid grid-cols-8 gap-[6px] mt-2">
                {/* Empty space for time label column */}
                <div className="w-10"></div>
                {/* Day labels */}
                {days.map((day, index) => (
                  <div key={index} className="text-[10px] text-gray-600 font-medium flex items-center justify-center body-3 font-urbanist">
                    {day}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Details Button */}
        {/* <div className="p-2 border-t border-gray-100 mt-auto h-[44px]">
          <button className="w-full flex items-center justify-center gap-2 text-gray-700 font-semibold hover:text-gray-900 transition-colors label-2 font-urbanist">
            <span>View Details</span>
            <span>→</span>
          </button>
        </div> */}
      </CardContent>
    </Card>
  )
}

// Main component that renders all three cards
function TopCustomers() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <TopCustomersCard />
      <TopCategoriesCard />
      <OrderStatisticsCard />
    </div>
  )
}

export default TopCustomers