"use client"

import React, { memo } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import MultiSelectInput from './multi-select-input'
import type { InventoryFormData } from '../../../types/inventory.types'
import type { InventoryFormValues } from '../schemas/inventory-form.schema'

interface BasicInfoSectionProps {
  inventoryData: InventoryFormData | null
  onGenerateDescription: () => void
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = memo(function BasicInfoSection({
  inventoryData,
  onGenerateDescription,
}) {
  const { control, watch, formState: { errors }, setError, clearErrors } = useFormContext<InventoryFormValues>()
  const description = watch('description')

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="sku_item_code" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">SKU/Item Code</Label>
            <Controller
              name="sku_item_code"
              control={control}
              render={({ field }) => (
                <>
                  <Input
                    id="sku_item_code"
                    {...field}
                    placeholder="Enter SKU/Item code"
                    className={`h-9 flex-1 body-3 font-urbanist text-sm text-neutral-900 ${errors.sku_item_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  />
                  {errors.sku_item_code && <p className="text-xs text-red-600 mt-1">{errors.sku_item_code.message}</p>}
                </>
              )}
            />
          </div>
          <Controller
            name="collections"
            control={control}
            render={({ field }) => (
              <MultiSelectInput
                label="Collection Name"
                placeholder="Enter collection name"
                data={inventoryData?.collections}
                values={field.value || []}
                error={errors.collections?.message}
                required={false}
                onChange={(vals) => {
                  field.onChange(vals)
                  clearErrors('collections')
                }}
                onError={(msg) => {
                  if (msg) {
                    setError('collections', { type: 'manual', message: msg })
                  } else {
                    clearErrors('collections')
                  }
                }}
              />
            )}
          />
          <div className="space-y-1">
            <Label htmlFor="cad_3d_files" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">CAD/3D File</Label>
            <Controller
              name="cad_3d_files"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? '0'}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="cad_3d_files" className="h-9 body-3 font-urbanist text-sm text-neutral-900 border-gray-300">
                    <SelectValue placeholder="yes/no" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Yes</SelectItem>
                    <SelectItem value="0">No</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Description</Label>
            <Button
              type="button"
              className="h-7 px-3 text-xs text-white hover:text-black bg-secondary-900 hover:bg-secondary-800 hover:text-white"
              onClick={onGenerateDescription}
            >
              {(description && description.trim().length > 1) ? 'Regenerate Description' : 'Generate Description'}
            </Button>
          </div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <>
                <Textarea
                  id="description"
                  {...field}
                  placeholder="Enter the Product Description here."
                  className={`min-h-[120px] body-3 font-urbanist text-sm text-neutral-900 rounded-none border rounded-lg ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
              </>
            )}
          />
        </div>
    </div>
  )
})

export default BasicInfoSection

