"use client"

import React, { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Info, Calendar as CalendarIcon } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TimePicker, TimePeriod } from "@/components/shared"
import { StatusBreakdown } from "../../../types/sales-overview.types"

interface OrderStatusChartProps {
  data: StatusBreakdown[]
  timePeriod: TimePeriod
  customLabel: string | null
  onPeriodChange: (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => void
  isLoading?: boolean
}

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
  data,
  timePeriod,
  customLabel,
  onPeriodChange,
  isLoading = false,
}) => {
  const totalOrders = useMemo(
    () => data.reduce((acc, item) => acc + item.value, 0),
    [data]
  )

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-[8px] border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 label-1">Order Status Breakdown</h3>
            {/* <Info className="h-4 w-4 text-gray-400" /> */}
          </div>
          <div className="flex items-center gap-2">
            <TimePicker
              selectedPeriod={timePeriod}
              onPeriodChange={(period, customDates) => {
                onPeriodChange(period, customDates)
              }}
              className=""
            />
          </div>
        </div>
        {customLabel && (
          <div className="flex items-center gap-2 text-xs text-gray-600 px-[12px] py-[4px]">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>{customLabel}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-4 px-4">
            <div className="w-full h-56 max-w-xs flex items-center justify-center">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
            <div className="w-full max-w-sm space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        ) : totalOrders === 0 || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-gray-500 text-sm">No data found</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 px-4">
            <div className="w-full h-56 max-w-xs [&_svg]:outline-none [&_svg]:border-none [&_svg]:focus:outline-none [&_svg]:focus-visible:outline-none [&_svg]:focus-visible:ring-0 [&_*]:outline-none [&_*]:border-none">
              <ResponsiveContainer>
                <PieChart style={{ outline: 'none', border: 'none' }}>
                  <Pie data={data.map((item) => ({ name: item.name, value: item.value }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={2} style={{ outline: 'none', border: 'none' }}>
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full max-w-sm space-y-3">
              {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border-none outline-none" style={{ background: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-gray-900 font-semibold">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



