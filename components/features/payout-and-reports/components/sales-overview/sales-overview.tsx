"use client"

import React, { useState } from "react"
import { TimePeriod } from "@/components/shared"
import { ChartsSection, TablesSection, GSTAndSettlementsSection, KPICardsSection } from "./sections"
import { useOrderStatusBreakdownQuery, useTopCustomersQuery, useGSTSnapshotQuery, useSettlementDashboardQuery } from "../../hooks/use-payout-query"

export const SalesOverview: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month")
  const [customDates, setCustomDates] = useState<{ startDate: string; endDate: string } | undefined>(undefined)
  const [customLabel, setCustomLabel] = useState<string | null>(null)
  const [gstPeriod, setGstPeriod] = useState<TimePeriod>("month")
  const [gstCustomDates, setGstCustomDates] = useState<{ startDate: string; endDate: string } | undefined>(undefined)
  const [gstCustomLabel, setGstCustomLabel] = useState<string | null>(null)

  // Fetch order status breakdown data
  const { data: statusBreakdown = [], isLoading: isLoadingStatusBreakdown } = useOrderStatusBreakdownQuery(
    timePeriod,
    customDates
  )

  // Fetch top customers data
  const { data: topCustomers = [], isLoading: isLoadingTopCustomers } = useTopCustomersQuery(
    timePeriod,
    customDates
  )

  // Fetch GST snapshot data
  const { data: gstSnapshot = [], isLoading: isLoadingGSTSnapshot } = useGSTSnapshotQuery(
    gstPeriod,
    gstCustomDates
  )

  // Fetch settlement dashboard data (using same period as GST)
  const { data: upcomingSettlements = [], isLoading: isLoadingSettlements } = useSettlementDashboardQuery(
    gstPeriod,
    gstCustomDates
  )

  const handleTimePeriodChange = (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => {
    setTimePeriod(period)
    if (period === "custom" && customDates) {
      setCustomDates(customDates)
      setCustomLabel(`${customDates.startDate} - ${customDates.endDate}`)
    } else {
      setCustomDates(undefined)
      setCustomLabel(null)
    }
  }

  const handleGSTPeriodChange = (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => {
    setGstPeriod(period)
    if (period === "custom" && customDates) {
      setGstCustomDates(customDates)
      setGstCustomLabel(`${customDates.startDate} - ${customDates.endDate}`)
    } else {
      setGstCustomDates(undefined)
      setGstCustomLabel(null)
    }
  }

  return (
    <>
      

      <KPICardsSection />

      <ChartsSection
        statusBreakdown={statusBreakdown}
        timePeriod={timePeriod}
        customLabel={customLabel}
        onPeriodChange={handleTimePeriodChange}
        isLoadingStatusBreakdown={isLoadingStatusBreakdown}
      />

      <TablesSection
        topCustomers={topCustomers}
        isLoadingTopCustomers={isLoadingTopCustomers}
      />

      <GSTAndSettlementsSection
        gstSnapshot={gstSnapshot}
        settlements={upcomingSettlements}
        gstPeriod={gstPeriod}
        gstCustomLabel={gstCustomLabel}
        onGSTPeriodChange={handleGSTPeriodChange}
        isLoadingGSTSnapshot={isLoadingGSTSnapshot}
        isLoadingSettlements={isLoadingSettlements}
      />
    </>
  )
}

export default SalesOverview
