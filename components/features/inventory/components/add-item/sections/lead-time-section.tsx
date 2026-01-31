"use client"

import React, { memo } from 'react'
import { useFormContext } from 'react-hook-form'
import { LeadTimeManagement } from '../../lead-time-management'
import type { LeadTimeEntry } from '../../../types/inventory.types'
import type { InventoryFormValues } from '../schemas/inventory-form.schema'

interface LeadTimeSectionProps {
  onQuantityRangeChange: (value: string) => void
  onLeadTimeValueChange: (value: string) => void
  onLeadTimeUnitChange: (value: string) => void
  onAddLeadTime: () => void
  onRemoveLeadTime: (index: number) => void
  onUpdateLeadTime: (index: number, lead_time_value: number, lead_time_unit: string) => void
  onApplyTemplate: (leadTimes: LeadTimeEntry[]) => void
}

export const LeadTimeSection: React.FC<LeadTimeSectionProps> = memo(function LeadTimeSection({
  onQuantityRangeChange,
  onLeadTimeValueChange,
  onLeadTimeUnitChange,
  onAddLeadTime,
  onRemoveLeadTime,
  onUpdateLeadTime,
  onApplyTemplate,
}) {
  const { watch, formState: { errors } } = useFormContext<InventoryFormValues>()
  const quantity_range = watch('quantity_range')
  const lead_time_value = watch('lead_time_value')
  const lead_time_unit = watch('lead_time_unit')
  const manufacture_lead_times = watch('manufacture_lead_times')

  return (
    <LeadTimeManagement
      quantity_range={quantity_range || ''}
      lead_time_value={lead_time_value || 0}
      lead_time_unit={lead_time_unit || 'days'}
      manufacture_lead_times={manufacture_lead_times || []}
      errors={{
        quantity_range: errors.quantity_range?.message,
        lead_time_value: errors.lead_time_value?.message,
        manufacture_lead_times: errors.manufacture_lead_times?.message,
      }}
      onQuantityRangeChange={onQuantityRangeChange}
      onLeadTimeValueChange={onLeadTimeValueChange}
      onLeadTimeUnitChange={onLeadTimeUnitChange}
      onAddLeadTime={onAddLeadTime}
      onRemoveLeadTime={onRemoveLeadTime}
      onUpdateLeadTime={onUpdateLeadTime}
      onApplyTemplate={onApplyTemplate}
      required={false}
    />
  )
})

export default LeadTimeSection

