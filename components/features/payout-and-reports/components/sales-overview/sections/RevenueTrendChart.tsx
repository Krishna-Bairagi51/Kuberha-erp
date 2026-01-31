"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Info, Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { useRevenueTrendQuery } from "../../../hooks/use-payout-query"
import { formatIndianCurrency } from "@/lib/api/helpers/number"

interface RevenueTrendChartProps {
  customLabel?: string | null
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  customLabel,
}) => {
  const [filterType, setFilterType] = useState<"week" | "month">("month")
  
  const { data = [], isLoading } = useRevenueTrendQuery(filterType)
  return (
    <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2 p-[8px] border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 label-1">Revenue & Payout Trend</h3>
            {/* <Info className="h-4 w-4 text-gray-400" /> */}
          </div>
          <div className="flex items-center">
            <ToggleGroup 
              type="single" 
              value={filterType}
              onValueChange={(value) => {
                if (value === "week" || value === "month") {
                  setFilterType(value)
                }
              }}
              className="bg-gray-50 rounded-md p-1"
            >
              <ToggleGroupItem 
                value="week" 
                aria-label="Week"
                className="px-3 py-1.5 text-sm font-medium data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-secondary-900 text-gray-600 hover:bg-gray-100 hover:text-secondary-900"
              >
                Week
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="month" 
                aria-label="Month"
                className="px-3 py-1.5 text-sm font-medium data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-secondary-900 text-gray-600 hover:bg-gray-100 hover:text-secondary-900"
              >
                Month
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        {customLabel && (
          <div className="flex items-center gap-2 text-xs text-gray-600 p-[8px]">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>{customLabel}</span>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-[340px] px-4">
            <Skeleton className="w-full h-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[340px] px-4">
            <p className="text-gray-500 text-sm">No data found</p>
          </div>
        ) : (
          <div className="[&_svg]:outline-none [&_svg]:border-none [&_svg]:focus:outline-none [&_svg]:focus-visible:outline-none [&_svg]:focus-visible:ring-0 [&_.recharts-cartesian-axis-tick-value]:fill-gray-700 [&_.recharts-cartesian-axis-tick-value]:no-select [&_*]:outline-none [&_*]:border-none">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 8 }} style={{ outline: 'none', border: 'none' }}>
              <CartesianGrid stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#374151", fontSize: 12, style: { userSelect: 'none', WebkitUserSelect: 'none', msUserSelect: 'none' } }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#374151", fontSize: 12, style: { userSelect: 'none', WebkitUserSelect: 'none', msUserSelect: 'none' } }} tickFormatter={(v) => {
                if (v >= 10000000) {
                  return `${(v / 10000000).toFixed(1)}Cr`
                } else if (v >= 100000) {
                  return `${(v / 100000).toFixed(1)}L`
                } else if (v >= 1000) {
                  return `${(v / 1000).toFixed(1)}K`
                }
                return v.toString()
              }} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, outline: 'none' }}
                formatter={(value: number) => formatIndianCurrency(value)}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  // Define the desired order: gross, commission, payout
                  const orderMap: Record<string, number> = {
                    gross: 0,
                    commission: 1,
                    payout: 2,
                  };
                  
                  // Sort payload by the defined order
                  const sortedPayload = [...payload].sort((a, b) => {
                    const aOrder = orderMap[a.dataKey as string] ?? 999;
                    const bOrder = orderMap[b.dataKey as string] ?? 999;
                    return aOrder - bOrder;
                  });
                  
                  return (
                    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", outline: 'none' }}>
                      {sortedPayload.map((entry: any, index: number) => (
                        <div key={index} style={{ marginBottom: index < sortedPayload.length - 1 ? "6px" : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: entry.color || "#000",
                              }}
                            />
                            <span style={{ color: "#374151", fontSize: "12px", marginRight: "8px" }}>
                              {entry.dataKey === "gross" ? "Gross Sales" : 
                               entry.dataKey === "commission" ? "Casacarigar Commission" : 
                               "Supplier Payout"}
                            </span>
                            <span style={{ color: "#111827", fontSize: "12px", fontWeight: 500 }}>
                              {formatIndianCurrency(entry.value)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="gross" stroke="#00B5D8" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="commission" stroke="#FF9900" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="payout" stroke="#F97316" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600 justify-center p-[8px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00B5D8] border-none outline-none" />
            <span>Gross Sales</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF9900] border-none outline-none" />
            <span>Casacarigar Commission</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316] border-none outline-none" />
            <span>Supplier Payout</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

