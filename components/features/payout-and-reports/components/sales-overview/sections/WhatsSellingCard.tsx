"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Info } from "lucide-react"
import { useWhatsSellingQuery } from "../../../hooks/use-payout-query"

export type FilterType = "category" | "product"

interface WhatsSellingCardProps {
  onFilterChange?: (filter: FilterType) => void
}

export const WhatsSellingCard: React.FC<WhatsSellingCardProps> = ({ onFilterChange }) => {
  const [filter, setFilter] = useState<FilterType>("category")

  // Map filter to API filter type
  const apiFilter = useMemo(() => {
    return filter === "product" ? "by_product" : "by_categ"
  }, [filter])

  const { data: items = [], isLoading } = useWhatsSellingQuery(apiFilter)

  const handleFilterChange = (value: FilterType) => {
    setFilter(value)
    onFilterChange?.(value)
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center justify-between p-[12px] border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 label-1">What's Selling</h3>
            {/* <Info className="h-4 w-4 text-gray-400" /> */}
          </div>
        </div>
        <div className="px-[12px]">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange("product")}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                filter === "product"
                  ? "bg-secondary-900 text-white border-secondary-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              By Product
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("category")}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                filter === "category"
                  ? "bg-secondary-900 text-white border-secondary-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              By Category
            </button>
          </div>
        </div>
        <div className="space-y-4 px-[12px] pb-[12px]">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500 text-sm">No data found</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-gray-800">
                  <span className="font-semibold">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
                <div className="flex justify-end text-xs text-gray-600">
                  <span>{item.units}</span>
                </div>
                {/* <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-100">
                  <div
                    className="h-full bg-secondary-900 rounded-full"
                    style={{ width: `${Math.min(100, item.percent * 100)}%` }}
                  />
                </div> */}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

