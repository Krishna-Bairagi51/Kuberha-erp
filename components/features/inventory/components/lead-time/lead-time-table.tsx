"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CircleX } from 'lucide-react'
import { sortLeadTimes } from './utils'
import type { LeadTimeEntry } from '../../types/inventory.types'

interface LeadTimeTableProps {
  leadTimes: LeadTimeEntry[]
  onUpdateLeadTime: (index: number, lead_time_value: number, lead_time_unit: string) => void
  onRemoveLeadTime: (index: number) => void
}

export const LeadTimeTable: React.FC<LeadTimeTableProps> = ({
  leadTimes,
  onUpdateLeadTime,
  onRemoveLeadTime,
}) => {
  const handleUpdateLeadTimeValue = (index: number, value: string) => {
    const leadTime = leadTimes[index]
    if (value === '') {
      onUpdateLeadTime(index, 0, leadTime.lead_time_unit)
    } else {
      const timeValue = parseFloat(value)
      if (!isNaN(timeValue) && timeValue > 0) {
        onUpdateLeadTime(index, timeValue, leadTime.lead_time_unit)
      }
    }
  }

  const handleUpdateLeadTimeUnit = (index: number, unit: string) => {
    const leadTime = leadTimes[index]
    onUpdateLeadTime(index, leadTime.lead_time_value, unit)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-4 gap-4 bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">Quantity</div>
        <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">Time</div>
        <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">Unit</div>
        <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">Action</div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortLeadTimes(leadTimes).map((item, displayIndex) => {
          const originalIndex = leadTimes.findIndex(
            lt =>
              lt.quantity_range === item.quantity_range &&
              lt.lead_time_value === item.lead_time_value &&
              lt.lead_time_unit === item.lead_time_unit
          )
          return (
            <div key={`${item.quantity_range}-${displayIndex}`} className="grid grid-cols-4 gap-4 px-4 py-3 items-center">
              <div className="text-sm text-gray-700 body-3 font-urbanist text-center">
                {item.quantity_range}
              </div>
              <div className="flex justify-center">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={item.lead_time_value === 0 ? '' : item.lead_time_value.toString()}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      handleUpdateLeadTimeValue(originalIndex, value)
                    }
                  }}
                  className="h-8 w-20 body-3 font-urbanist text-sm text-neutral-900 border-gray-300 text-center"
                />
              </div>
              <div className="flex justify-center">
                <Select
                  value={item.lead_time_unit}
                  onValueChange={(value) => handleUpdateLeadTimeUnit(originalIndex, value)}
                >
                  <SelectTrigger className="border-gray-300 h-8 w-24 body-3 font-urbanist text-sm text-neutral-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="month">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center gap-1">
                <button
                  type="button"
                  onClick={() => onRemoveLeadTime(originalIndex)}
                  className="text-red-600 hover:text-red-700 p-1 border border-gray-300 rounded-md"
                >
                  <CircleX className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LeadTimeTable

