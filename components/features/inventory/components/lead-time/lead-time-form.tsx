"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { LeadTimeEntry } from '../../types/inventory.types'

interface LeadTimeFormProps {
  localTemplateName: string
  onTemplateNameChange: (value: string) => void
  duplicateError?: string | null
  errors: {
    quantity_range?: string
    lead_time_value?: string
    manufacture_lead_times?: string
    leadTimeName?: string
  }
  quantity_range: string
  lead_time_value: number
  lead_time_unit: string
  manufacture_lead_times: LeadTimeEntry[]
  onQuantityRangeChange: (value: string) => void
  onLeadTimeValueChange: (value: string) => void
  onLeadTimeUnitChange: (value: string) => void
  onAddLeadTime: () => void
  onLeadTimeNameChange?: (value: string) => void
}

export const LeadTimeForm: React.FC<LeadTimeFormProps> = ({
  localTemplateName,
  onTemplateNameChange,
  duplicateError,
  errors,
  quantity_range,
  lead_time_value,
  lead_time_unit,
  manufacture_lead_times,
  onQuantityRangeChange,
  onLeadTimeValueChange,
  onLeadTimeUnitChange,
  onAddLeadTime,
  onLeadTimeNameChange,
}) => {
  return (
    <>
      <div className="mt-3">
        <Input
          id="lead_time_name"
          type="text"
          value={localTemplateName}
          onChange={(e) => {
            const value = e.target.value
            onTemplateNameChange(value)
            if (onLeadTimeNameChange) {
              onLeadTimeNameChange(value)
            }
          }}
          placeholder="Enter Template Name"
          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${
            errors.leadTimeName || duplicateError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
          }`}
        />
        {errors.leadTimeName && <p className="text-xs text-red-600 mt-1">{errors.leadTimeName}</p>}
        {duplicateError && !errors.leadTimeName && <p className="text-xs text-red-600 mt-1">{duplicateError}</p>}
      </div>

      <div className="grid grid-cols-10 gap-3 items-end mb-4">
        <div className="col-span-2">
          <Select value={quantity_range || ''} onValueChange={onQuantityRangeChange}>
            <SelectTrigger className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.quantity_range ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}>
              <SelectValue placeholder="Select Quantity Range" />
            </SelectTrigger>
            <SelectContent> 
              {!manufacture_lead_times.some(lt => lt.quantity_range === '0-1') && (
                <SelectItem value="0-1">0-1</SelectItem>
              )}
              {!manufacture_lead_times.some(lt => lt.quantity_range === '2-5') && (
                <SelectItem value="2-5">2-5</SelectItem>
              )}
              {!manufacture_lead_times.some(lt => lt.quantity_range === '6-9') && (
                <SelectItem value="6-9">6-9</SelectItem>
              )}
              {!manufacture_lead_times.some(lt => lt.quantity_range === '10+') && (
                <SelectItem value="10+">10+</SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.quantity_range && <p className="text-xs text-red-600 mt-1">{errors.quantity_range}</p>}
        </div>
        
        <div className="col-span-7">
          <div className="flex gap-2">
            <Input
              id="lead_time_value"
              type="text"
              inputMode="decimal"
              value={lead_time_value === 0 ? '' : lead_time_value.toString()}
              onChange={(e) => onLeadTimeValueChange(e.target.value)}
              placeholder="Enter Lead Time"
              className={`h-9 flex-1 body-3 font-urbanist text-sm text-neutral-900 ${errors.lead_time_value ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
            />
            <Select value={lead_time_unit} onValueChange={onLeadTimeUnitChange}>
              <SelectTrigger className="border-gray-300 h-9 w-20 body-3 font-urbanist text-sm text-neutral-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="month">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors.lead_time_value && <p className="text-xs text-red-600 mt-1">{errors.lead_time_value}</p>}
        </div>
        
        <div className="col-span-1">
          <Label className="font-semibold text-gray-600 body-3 font-urbanist text-xs opacity-0">Add</Label>
          <Button 
            type="button" 
            disabled={!quantity_range || !lead_time_value || lead_time_value === 0 || !lead_time_unit}
            className={`w-full h-9 body-3 font-urbanist text-sm ${
              !quantity_range || !lead_time_value || lead_time_value === 0 || !lead_time_unit
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-secondary-900 text-white hover:bg-secondary-800'
            }`}
            onClick={onAddLeadTime}
          >
            Add
          </Button>
        </div>
      </div>
    </>
  )
}

export default LeadTimeForm

