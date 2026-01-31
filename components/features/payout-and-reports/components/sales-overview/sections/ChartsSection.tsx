"use client"

import React from "react"
import { TimePicker, type TimePeriod } from "@/components/shared"
import { RevenueTrendChart } from "./RevenueTrendChart"
import { OrderStatusChart } from "./OrderStatusChart"
import { StatusBreakdown } from "../../../types/sales-overview.types"

interface ChartsSectionProps {
  statusBreakdown: StatusBreakdown[]
  timePeriod: TimePeriod
  customLabel: string | null
  onPeriodChange: (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => void
  isLoadingStatusBreakdown?: boolean
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  statusBreakdown,
  timePeriod,
  customLabel,
  onPeriodChange,
  isLoadingStatusBreakdown = false,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      <RevenueTrendChart
        customLabel={customLabel}
      />
      <OrderStatusChart
        data={statusBreakdown}
        timePeriod={timePeriod}
        customLabel={customLabel}
        onPeriodChange={onPeriodChange}
        isLoading={isLoadingStatusBreakdown}
      />
    </div>
  )
}

