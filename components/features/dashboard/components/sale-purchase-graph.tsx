"use client"

import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Info, ChevronDown, Calendar, CalendarDays, Loader2 } from 'lucide-react'
import React, { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CalendarModal } from '@/components/ui/calendar-modal'
import { Button } from '@/components/ui/button'
import type { TimePeriod } from '../types/dashboard.types'
import { useGraphDataQuery } from '../hooks/use-dashboard-query'
import { formatIndianCurrency, formatIndianNumberWithUnits } from '@/lib/api/helpers/number'

// Custom Tooltip Component to reorder items (Sales first, then Earnings)
const CustomTooltip = ({ active, payload, label, labelFormatter }: any) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  // Reorder payload: Sales first, then Earnings
  const reorderedPayload = [...payload].sort((a, b) => {
    if (a.dataKey === 'sales') return -1
    if (b.dataKey === 'sales') return 1
    return 0
  })

  const formattedLabel = labelFormatter && label && payload ? labelFormatter(label, payload) : label

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '12px',
        outline: 'none',
      }}
    >
      <p style={{ marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
        {formattedLabel}
      </p>
      {reorderedPayload.map((entry, index) => {
        const label = entry.dataKey === 'sales' ? 'Sales' : 'Earnings'
        const color = entry.dataKey === 'sales' ? '#1E3A5F' : '#00CED1'
        return (
          <p
            key={index}
            style={{
              margin: '4px 0',
              color: entry.dataKey === 'sales' ? '#111827' : '#111827',
              fontSize: '14px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: color,
                marginRight: '8px',
                borderRadius: '2px',
              }}
            />
            <span style={{ fontWeight: 500 }}>{label}: </span>
            <span style={{ color: entry.dataKey === 'sales' ? '#1E3A5F' : '#00CED1', fontWeight: 600 }}>
              {formatIndianCurrency(Number(entry.value))}
            </span>
          </p>
        )
      })}
    </div>
  )
}

// Generate sample data for different time periods
const generateData = (period: TimePeriod) => {
  const dataPoints = {
    '1D': 24, // 24 hours
    '1W': 7,  // 7 days
    '1M': 30, // 30 days
    '3M': 12, // 12 weeks
    '6M': 24, // 24 weeks
    '1Y': 24, // 24 months (2 years)
  }

  const count = dataPoints[period]
  return Array.from({ length: count }, (_, i) => {
    // Generate sales first (base value)
    const sales = Math.floor(Math.random() * 40000) + 30000
    
    // Generate earnings that is always <= sales
    // Earnings will be between 40% to 90% of sales to ensure realistic ratios
    const earningsRatio = Math.random() * 0.5 + 0.4 // 0.4 to 0.9
    const earnings = Math.floor(sales * earningsRatio)
    
    return {
      name: (i + 1).toString(),
      sales: sales,
      earnings: earnings,
      total: sales + earnings, // Combined total for single bar
    }
  })
}


function SalePurchaseGraph() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1Y')
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [isCustomActive, setIsCustomActive] = useState(false)
  const [currentRange, setCurrentRange] = useState<{ start: string; end: string } | null>(null)

  // Custom date range state (same UX as TimePicker)
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [isApplying, setIsApplying] = useState(false)
  const [dateError, setDateError] = useState<string>("")

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const timePeriods: TimePeriod[] = ['1D', '1W', '1M', '3M', '6M', '1Y']

  // Staff Members Data Dictionary
  // const staffMembersData: StaffMember[] = [
  //   {
  //     id: "SM001",
  //     name: "Arjun Kumar",
  //     avatar: "/placeholder-user.jpg",
  //     phone: "9876543210",
  //     date: "14 Jan 2025",
  //     count: 24,
  //     status: "QC Done",
  //     statusColor: "green"
  //   },
  //   {
  //     id: "SM002",
  //     name: "Ravi Singh",
  //     avatar: "/placeholder-user.jpg",
  //     phone: "1234567890",
  //     date: "10 Jan 2025",
  //     count: 2,
  //     status: "Pending",
  //     statusColor: "yellow"
  //   },
  //   {
  //     id: "SM003",
  //     name: "Vikram Sharma",
  //     initials: "VS",
  //     phone: "5551234567",
  //     date: "08 Jan 2025",
  //     count: 2,
  //     status: "QC Done",
  //     statusColor: "green"
  //   },
  //   {
  //     id: "SM004",
  //     name: "Rajesh Patel",
  //     initials: "RP",
  //     phone: "8765432109",
  //     date: "06 Jan 2025",
  //     count: 1,
  //     status: "Rejected",
  //     statusColor: "red"
  //   },
  //   {
  //     id: "SM005",
  //     name: "Suresh Verma",
  //     initials: "SV",
  //     phone: "2345678901",
  //     date: "03 Jan 2025",
  //     count: 8,
  //     status: "QC Done",
  //     statusColor: "green"
  //   }
  // ]

  // Compute start/end dates from selected period
  const getDateRangeForPeriod = (period: TimePeriod): { start: string; end: string } => {
    const endDate = new Date()
    const startDate = new Date()
    switch (period) {
      case '1D':
        // today only
        break
      case '1W':
        startDate.setDate(endDate.getDate() - 6)
        break
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        break
    }
    const toIsoDate = (d: Date) => d.toISOString().slice(0, 10)
    return { start: toIsoDate(startDate), end: toIsoDate(endDate) }
  }

  // Get date range for current period
  const { start, end } = useMemo(() => getDateRangeForPeriod(selectedPeriod), [selectedPeriod])
  
  // Determine which date range to use
  const effectiveStartDate = currentRange?.start || start
  const effectiveEndDate = currentRange?.end || end
  
  // Use TanStack Query hook for fetching graph data
  const { data: graphData = [], isLoading: loading, error } = useGraphDataQuery(
    effectiveStartDate,
    effectiveEndDate,
    {
      enabled: !isCustomActive || !!currentRange,
    }
  )

  // Map API data to chart format
  const chartData = useMemo(() => {
    if (!graphData || graphData.length === 0) {
      // Fallback to generated demo data if no data
      return generateData(selectedPeriod)
    }
    return graphData.map((d) => ({
      name: d.date,
      sales: Number(d.sale_amt || 0),
      earnings: Number(d.earn_amt || 0),
      total: Number(d.sale_amt || 0) + Number(d.earn_amt || 0),
    }))
  }, [graphData, selectedPeriod])

  // Update current range when period changes
  useEffect(() => {
    if (!isCustomActive) {
      const { start, end } = getDateRangeForPeriod(selectedPeriod)
      setCurrentRange({ start, end })
    }
  }, [selectedPeriod, isCustomActive])

  // Calculate totals
  // For display and totals, we may bucket by month for long ranges
  const { start: rangeStart, end: rangeEnd } = useMemo(() => getDateRangeForPeriod(selectedPeriod), [selectedPeriod])

  const isMonthlyBucket = !isCustomActive && (selectedPeriod === '3M' || selectedPeriod === '6M' || selectedPeriod === '1Y')

  const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const getMonthsRange = (startIso: string, endIso: string): Date[] => {
    const start = new Date(startIso)
    const end = new Date(endIso)
    start.setDate(1)
    end.setDate(1)
    const months: Date[] = []
    const cur = new Date(start)
    while (cur <= end) {
      months.push(new Date(cur))
      cur.setMonth(cur.getMonth() + 1)
    }
    return months
  }

  const displayData = useMemo(() => {
    if (!isMonthlyBucket) return chartData
    // Build month buckets covering the full range
    const months = getMonthsRange(rangeStart, rangeEnd)
    const byMonth: Record<string, { name: string; sales: number; earnings: number; total: number }> = {}
    months.forEach((m) => {
      const key = getMonthKey(m)
      byMonth[key] = {
        name: m.toISOString().slice(0, 10),
        sales: 0,
        earnings: 0,
        total: 0,
      }
    })
    // Sum incoming data into month buckets (assuming item.name is ISO date)
    chartData.forEach((item) => {
      const isoMatch = /\d{4}-\d{2}-\d{2}/.test(item.name)
      if (!isoMatch) return
      const d = new Date(item.name)
      const key = getMonthKey(d)
      if (!byMonth[key]) return
      byMonth[key].sales += item.sales
      byMonth[key].earnings += item.earnings
      byMonth[key].total += item.total
    })
    // Return in chronological order
    return getMonthsRange(rangeStart, rangeEnd).map((m) => byMonth[getMonthKey(m)])
  }, [chartData, isMonthlyBucket, rangeStart, rangeEnd])

  const totalSales = useMemo(() => {
    const data = displayData
    const sum = data.reduce((acc, item) => acc + item.sales, 0)
    return formatIndianNumberWithUnits(sum)
  }, [displayData])

  const totalEarnings = useMemo(() => {
    const data = displayData
    const sum = data.reduce((acc, item) => acc + item.earnings, 0)
    return formatIndianNumberWithUnits(sum)
  }, [displayData])

  // Calculate dynamic Y-axis values
  const yAxisConfig = useMemo(() => {
    // Find the maximum total value in the data actually being displayed
    const maxValue = Math.max(...displayData.map(item => item.total), 0)
    
    // Round up to the nearest 1000 for cleaner display
    const roundedMax = Math.ceil(maxValue / 1000) * 1000
    
    // Generate 10 evenly spaced ticks from 0 to roundedMax
    const tickStep = roundedMax / 10
    const ticks = Array.from({ length: 11 }, (_, i) => Math.round(i * tickStep))
    
    return {
      domain: [0, roundedMax],
      ticks: ticks
    }
  }, [displayData])

  // Calculate dynamic X-axis interval based on data length
  const xAxisInterval = useMemo(() => {
    const dataLength = displayData.length
    if (dataLength <= 7) return 0 // Show all labels for 7 or fewer items
    if (dataLength <= 14) return 1 // Show every other label for 8-14 items
    if (dataLength <= 30) return 2 // Show every 3rd label for 15-30 items
    return Math.floor(dataLength / 12) // Show approximately 12 labels for larger datasets
  }, [displayData.length])

  // Consistent X-axis label formatter by selected period
  const formatXAxisLabel = (raw: string) => {
    // Try parse known date formats (ISO yyyy-mm-dd)
    const asDate = /\d{4}-\d{2}-\d{2}/.test(raw) ? new Date(raw) : null
    const intlDayMonth = (d: Date) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
    const intlMonth = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' })
    if (asDate) {
      if (isMonthlyBucket) return intlMonth(asDate)
      return intlDayMonth(asDate)
    }
    // Fallback for synthetic numeric labels
    return raw
  }

  // Tooltip label formatter aligned with X-axis
  const formatTooltipLabel = (raw: any) => {
    const str = String(raw)
    return formatXAxisLabel(str)
  }
  

  return (
    <div className="gap-[16px] my-[24px]">
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardContent className="p-0">
        {/* Card Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Sales & Purchase</h2>
            {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}  
          </div>
          
          {/* Time Period Selector */}
          <div className="flex items-center">
            {timePeriods.map((period, index) => (
              <button
                key={period}
                onClick={() => {
                  setSelectedPeriod(period)
                  setIsCustomActive(false)
                  // Clear any previously selected custom dates when switching to preset tabs
                  setCustomStartDate(undefined)
                  setCustomEndDate(undefined)
                  setDateError("")
                }}
                className={cn(
                  "px-4 py-1.5 body-3 font-semibold transition-all duration-200 border border-gray-200",
                  // First button - rounded left
                  index === 0 && "rounded-l-lg",
                  // Last button - rounded right
                  index === timePeriods.length - 1 && "rounded-r-lg",
                  // Middle buttons - no border radius, remove left border to avoid double borders
                  index > 0 && "-ml-[1px]",
                  // Only show as active if this period is selected AND custom is NOT active
                  selectedPeriod === period && !isCustomActive
                    ? "bg-secondary-900 text-white border-secondary-900 z-10"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                )}
              >
                {period}
              </button>
            ))}
            
            {/* Custom Dropdown Button */}
            <div className="relative ml-4">
              <button
                onClick={() => {
                  // Opening custom: ensure preset selection is visually separate; don't clear if user returning while still custom-active
                  setIsCustomOpen(true)
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium border transition-all duration-200",
                  isCustomActive
                    ? "bg-secondary-900 text-white border-secondary-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                )}
              >
                <Calendar className="h-4 w-4" />
                <span>Custom</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isCustomOpen && "rotate-180"
                )} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Legend Cards */}
        <div className="flex items-center gap-4 px-6 pt-6">
          {/* Total Sales Card */}
          <div className="bg-white border border-gray-200 rounded-[8px] p-[8px] w:min-[120px] h-[64px] flex flex-col justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#1E3A5F] border-none outline-none" />
              <span className="text-xs text-gray-600 font-medium leading-tight font-urbanist ">Total Sales</span>
            </div>
            <div className="text-lg font-bold text-gray-900 leading-none">{totalSales}</div>
          </div>
          
          {/* Total Earnings Card */}
          <div className="bg-white border border-gray-200 rounded-[8px] p-[8px] w:min-[120px] h-[64px] flex flex-col justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#00CED1] border-none outline-none" />
              <span className="text-xs text-gray-600 font-medium leading-tight font-urbanist">Total Earnings</span>
            </div>
            <div className="text-lg font-bold text-gray-900 leading-none ">{totalEarnings}</div>
          </div>
        </div>

        {/* Graph Content Area */}
        <div className="p-6 pt-4 [&_svg]:outline-none [&_svg]:border-none [&_svg]:focus:outline-none [&_svg]:focus-visible:outline-none [&_svg]:focus-visible:ring-0 [&_*]:outline-none [&_*]:border-none">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={displayData}
              margin={{ top: 20, right: 10, left: 0, bottom: 60 }}
              barGap={0}
              barCategoryGap="30%"
              style={{ outline: 'none', border: 'none' }}
            >
              <CartesianGrid 
                strokeDasharray="0" 
                vertical={false} 
                stroke="#E5E7EB"
              />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dy={10}
                type="category"
                interval={xAxisInterval}
                minTickGap={8}
                tickMargin={14}
                angle={-45}
                tickFormatter={formatXAxisLabel}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 10000000) {
                    return `${(value / 10000000).toFixed(1)}Cr`
                  } else if (value >= 100000) {
                    return `${(value / 100000).toFixed(1)}L`
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`
                  }
                  return value.toString()
                }}
                ticks={yAxisConfig.ticks}
                domain={yAxisConfig.domain}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                content={(props) => <CustomTooltip {...props} labelFormatter={formatTooltipLabel} />}
              />
              <Bar 
                dataKey="earnings" 
                stackId="total"
                fill="#00CED1" 
                radius={[0, 0, 0, 0]}
                maxBarSize={18}
              />
              <Bar 
                dataKey="sales" 
                stackId="total"
                fill="#1E3A5F" 
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>

    {/* Custom Date Range Dialog (same UX as TimePicker) */}
    <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-secondary-900" />
            <span>Select Custom Date Range</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <CalendarModal
                value={customStartDate}
                onSelect={(d) => {
                  setCustomStartDate(d)
                  setDateError("")
                  if (d && customEndDate && d > customEndDate) {
                    setCustomEndDate(undefined)
                  }
                }}
                placeholder="Select start date"
                maxDate={customEndDate || new Date()}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <CalendarModal
                value={customEndDate}
                onSelect={(d) => {
                  setCustomEndDate(d)
                  setDateError("")
                  if (d && customStartDate && d < customStartDate) {
                    setDateError("End date cannot be before start date")
                  }
                }}
                placeholder="Select end date"
                minDate={customStartDate}
                maxDate={new Date()}
                className="w-full"
              />
            </div>
          </div>

          {dateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{dateError}</p>
            </div>
          )}
          {customStartDate && customEndDate && !dateError && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 font-medium">
                Selected range: {customStartDate.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })} - {customEndDate.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 ">
          <Button
            variant="outline"
            onClick={() => {
              setCustomStartDate(undefined)
              setCustomEndDate(undefined)
              setDateError("")
              setIsCustomOpen(false)
            }}
            disabled={isApplying}
            className="px-6 py-2 bg-white text-secondary-900 hover:text-secondary-900 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!customStartDate || !customEndDate) {
                setDateError("Please select both start and end dates")
                return
              }
              if (customStartDate > customEndDate) {
                setDateError("Start date cannot be after end date")
                return
              }
              setIsApplying(true)
              try {
                const start = formatDateForAPI(customStartDate)
                const end = formatDateForAPI(customEndDate)
                setCurrentRange({ start, end })
                setIsCustomActive(true)
                setIsCustomOpen(false)
                // Clear the modal state after apply so reopening starts clean
                setCustomStartDate(undefined)
                setCustomEndDate(undefined)
                setDateError("")
              } catch (e) {
              } finally {
                setIsApplying(false)
              }
            }}
            disabled={isApplying}
            className="px-6 py-2 bg-secondary-900 text-white hover:bg-secondary-800"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Applying...
              </>
            ) : (
              'Apply Range'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Staff Members Card */}
    {/* <Card className="bg-white border border-gray-200 rounded-lg shadow-sm col-span-3 flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="flex items-center justify-between p-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Staff Members</h2>
            <Info className="h-[14px] w-[14px] text-gray-400" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors duration-200 min-w-[90px] font-semibold text-gray-700">
              {selectedDepartment}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[90px] min-w-[90px]">
              {['MFG QC', 'Sales', 'Marketing'].map((department) => (
                <DropdownMenuItem
                  key={department}
                  onClick={() => setSelectedDepartment(department)}
                  className={`cursor-pointer focus:bg-gray-100 focus:text-gray-900 ${
                    selectedDepartment === department ? 'bg-secondary-900 text-white' : ''
                  }`}
                >
                  {department}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="py-[16px] px-[8px] flex-1">
          {staffMembersData.map((member, index) => (
            <div key={member.id} className={`flex items-center justify-between h-[50px] px-[8px] ${index !== staffMembersData.length - 1 ? 'mb-[20px]' : ''}`}>
            <div className="flex items-center gap-3">
                {member.avatar ? (
              <img 
                    src={member.avatar} 
                    alt={member.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
                ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {member.initials}
              </div>
                )}
              <div>
                  <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.phone} • {member.date}</p>
              </div>
            </div>
            <div className="text-right">
                <p className={`font-bold text-lg ${getCountTextColor(member.statusColor)}`}>
                  {member.count}
                </p>
                <p className={`text-xs ${getStatusTextColor(member.statusColor)}`}>
                  {member.status}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-gray-100 mt-auto h-[44px]">
          <button className="w-full flex items-center justify-center gap-2 text-gray-700 font-semibold hover:text-gray-900 transition-colors">
            <span>Add Member</span>
            <span>→</span>
          </button>
        </div>
      </CardContent>
    </Card> */}
    </div>
  )
}

export default SalePurchaseGraph