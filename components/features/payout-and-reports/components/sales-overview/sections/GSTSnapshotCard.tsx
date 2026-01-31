"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Info, Calendar as CalendarIcon } from "lucide-react"
import { TimePicker, TimePeriod } from "@/components/shared"
import { GSTSnapshot } from "../../../types/sales-overview.types"

interface GSTSnapshotCardProps {
  data: GSTSnapshot[]
  timePeriod: TimePeriod
  customLabel: string | null
  onPeriodChange: (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => void
  isLoading?: boolean
}

export const GSTSnapshotCard: React.FC<GSTSnapshotCardProps> = ({
  data,
  timePeriod,
  customLabel,
  onPeriodChange,
  isLoading = false,
}) => {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-[8px] border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 label-1">GST Snapshot</h3>
            {/* <Info className="h-4 w-4 text-gray-400" /> */}
          </div>
          <TimePicker
            selectedPeriod={timePeriod}
            onPeriodChange={(period, customDates) => {
              onPeriodChange(period, customDates)
            }}
            className="min-w-[170px]"
          />
        </div>
        {customLabel && (
          <div className="flex items-center gap-2 text-xs text-gray-600 px-3 py-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>{customLabel}</span>
          </div>
        )}

        <div className="">
          {isLoading ? (
            <>
              {[1, 2, 3].map((index) => (
                <div key={index} className="px-4 py-6 space-y-3">
                  <Skeleton className="h-6 w-48 bg-gray-200" />
                  <Skeleton className="h-12 w-32 bg-gray-200" />
                  <Skeleton className="h-4 w-40 bg-gray-200" />
                </div>
              ))}
            </>
          ) : (
            data.map((item) => (
              <div key={item.title} className="px-4 py-6 space-y-3">
                <div className="text-lg font-semibold text-gray-800">{item.title}</div>
                <div className="text-4xl md:text-5xl font-spectral font-semibold text-gray-900">{item.amount}</div>
                <div className="text-sm text-gray-500">{item.subtitle}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

