"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { UpcomingSettlement } from "../../../types/sales-overview.types"

interface SettlementsAlertsCardProps {
  settlements: UpcomingSettlement[]
  isLoading?: boolean
}

export const SettlementsAlertsCard: React.FC<SettlementsAlertsCardProps> = ({
  settlements,
  isLoading = false,
}) => {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-[12px] border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 label-1">Settlements & Alerts</h3>
            {/* <Info className="h-4 w-4 text-gray-400" /> */}
          </div>
        </div>

        <div className="px-3 py-3 space-y-4">
          <div className="space-y-2">
            {/* <div className="label-3 font-semibold text-gray-900">Upcoming Settlements</div> */}
            <div className="">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="py-2 flex items-center justify-between gap-2">
                      <div className="flex flex-col space-y-2">
                        <Skeleton className="h-4 w-16 bg-gray-200" />
                        <Skeleton className="h-4 w-24 bg-gray-200" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-20 bg-gray-200" />
                        <Skeleton className="h-5 w-16 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                  ))}
                </>
              ) : settlements.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">No settlements found</div>
              ) : (
                settlements.map((item, idx) => (
                  <div key={`${item.period}-${idx}`} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex flex-col text-gray-800">
                      <span className="body-3 font-medium">{item.dateLabel}</span>
                      <span className="body-3 font-semibold">{item.period}</span>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="body-3 font-semibold text-gray-900">{item.amount}</div>
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border",
                          item.tone === "green" && "bg-green-50 text-green-700 border-green-200",
                          item.tone === "blue" && "bg-blue-50 text-blue-700 border-blue-200"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* <div className="space-y-2">
            <div className="label-3 font-semibold text-gray-900">Alerts & Exceptions</div>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div key={`alert-${idx}`} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-[2px] inline-flex w-5 h-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      alert.severity === "high" && "bg-red-50 text-red-700",
                      alert.severity === "medium" && "bg-amber-50 text-amber-700"
                    )}
                  >
                    !
                  </span>
                  <p className="body-3 text-gray-800 leading-4">{alert.text}</p>
                </div>
              ))}
            </div> */}
          {/* </div> */}
        </div>
      </CardContent>
    </Card>
  )
}

