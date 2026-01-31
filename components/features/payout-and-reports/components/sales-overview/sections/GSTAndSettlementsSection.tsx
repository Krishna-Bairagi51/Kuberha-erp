"use client"

import React from "react"
import { TimePicker, TimePeriod } from "@/components/shared"
import { GSTSnapshotCard } from "./GSTSnapshotCard"
import { SettlementsAlertsCard } from "./SettlementsAlertsCard"
import { GSTSnapshot, UpcomingSettlement, Alert } from "../../../types/sales-overview.types"

interface GSTAndSettlementsSectionProps {
  gstSnapshot: GSTSnapshot[]
  settlements: UpcomingSettlement[]
  gstPeriod: TimePeriod
  gstCustomLabel: string | null
  onGSTPeriodChange: (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => void
  isLoadingGSTSnapshot?: boolean
  isLoadingSettlements?: boolean
}

export const GSTAndSettlementsSection: React.FC<GSTAndSettlementsSectionProps> = ({
  gstSnapshot,
  settlements,
  gstPeriod,
  gstCustomLabel,
  onGSTPeriodChange,
  isLoadingGSTSnapshot = false,
  isLoadingSettlements = false,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      <GSTSnapshotCard
        data={gstSnapshot}
        timePeriod={gstPeriod}
        customLabel={gstCustomLabel}
        onPeriodChange={onGSTPeriodChange}
        isLoading={isLoadingGSTSnapshot}
      />
      <SettlementsAlertsCard
        settlements={settlements}

        isLoading={isLoadingSettlements}
      />
    </div>
  )
}

