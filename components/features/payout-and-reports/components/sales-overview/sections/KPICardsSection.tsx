"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { KPICard } from "../../../types/sales-overview.types"
import { TimePeriod, TimePicker } from "@/components/shared"
import { Skeleton } from "@/components/ui/skeleton"
import { useSalesOverviewQuery } from "../../../hooks/use-payout-query"

interface KPICardsSectionProps {}

export const KPICardsSection: React.FC<KPICardsSectionProps> = () => {
  // Load saved time period from localStorage or default to "month"
  const getSavedTimePeriod = (): TimePeriod => {
    if (typeof window === "undefined") return "month"
    const saved = localStorage.getItem("salesOverview_timePeriod")
    return (saved as TimePeriod) || "month"
  }

  const getSavedCustomDates = (): { startDate: string; endDate: string } | undefined => {
    if (typeof window === "undefined") return undefined
    const saved = localStorage.getItem("salesOverview_customDates")
    return saved ? JSON.parse(saved) : undefined
  }

  const [timePeriod, setTimePeriod] = useState<TimePeriod>(getSavedTimePeriod())
  const [customDates, setCustomDates] = useState<{ startDate: string; endDate: string } | undefined>(getSavedCustomDates())

  // Use TanStack Query hook for data fetching with caching
  const { data: kpiCards = [], isLoading, error: queryError } = useSalesOverviewQuery(timePeriod, customDates)
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch sales overview") : null

  const handlePeriodChange = (period: TimePeriod, customDatesParam?: { startDate: string; endDate: string }) => {
    setTimePeriod(period)
    if (period === "custom" && customDatesParam) {
      setCustomDates(customDatesParam)
      localStorage.setItem("salesOverview_customDates", JSON.stringify(customDatesParam))
    } else {
      setCustomDates(undefined)
      localStorage.removeItem("salesOverview_customDates")
    }
    localStorage.setItem("salesOverview_timePeriod", period)
  }


  return (
    <>
      <div className="flex justify-end my-6">
        <TimePicker
          selectedPeriod={timePeriod}
          onPeriodChange={handlePeriodChange}
          isLoading={isLoading}
          className="items-end"
        />
      </div>
      
      {error ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title} className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-800">{kpi.title}</div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-32 bg-gray-200" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900 font-spectral">{(kpi as KPICard).value}</div>
                )}
                <div className="text-xs text-gray-500">{kpi.subtitle}</div>
              </CardContent>
            </Card> 
          ))}
        </div>
      )}
    </>
  )
}
