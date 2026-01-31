"use client"

import React from "react"
import { CategoryStats } from "@/components/features/website-setup/types/categories-management.types"

interface CategoryStatsCardsProps {
  stats: CategoryStats
}

export function CategoryStatsCards({ stats }: CategoryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Total Parent Categories
        </div>
        <div className="text-3xl font-bold text-gray-900">{stats.parentCount}</div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Total Sub Categories
        </div>
        <div className="text-3xl font-bold text-gray-900">{stats.childCount}</div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Total Categories
        </div>
        <div className="text-3xl font-bold text-gray-900">{stats.parentCount + stats.childCount}</div>
      </div>
    </div>
  )
}

