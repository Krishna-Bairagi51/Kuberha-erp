"use client"
import React, { useState, memo } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Info, ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryFormValues } from '../schemas/inventory-form.schema'

interface LogisticsHandlingProps {
  packageTypes?: Array<{ id: number; name: string }>
  boxTypes?: Array<{ id: number; name: string; box_volumetric_weight: number }>
  onWeightExceeded?: (isExceeded: boolean) => void
}

export const LogisticsHandling = memo(function LogisticsHandling({
  packageTypes,
  boxTypes,
  onWeightExceeded
}: LogisticsHandlingProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { control, watch, setValue, formState: { errors }, clearErrors } = useFormContext<InventoryFormValues>()
  
  // Reusable MultiSelectInput component with tags
  const MultiSelectInput = ({ 
    field, 
    label, 
    placeholder, 
    data, 
    error,
    required = false
  }: {
    field: keyof InventoryFormValues
    label: string
    placeholder: string
    data: Array<{ id: number; name: string }> | undefined
    error?: string
    required?: boolean
  }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [localValue, setLocalValue] = useState('')
    const selectedValues = watch(field) as string[] || []
    
    // Filter data based on local input value and exclude already selected
    const filteredData = data?.filter(item => 
      item.name.toLowerCase().includes(localValue.toLowerCase()) &&
      !selectedValues.includes(item.name)
    ) || []

    const handleSelect = (value: string) => {
      if (!selectedValues.includes(value)) {
        setValue(field, [...selectedValues, value] as any, { shouldValidate: true })
        clearErrors(field)
      }
      setLocalValue('')
      setIsDropdownOpen(false)
    }

    const handleRemove = (valueToRemove: string) => {
      setValue(field, selectedValues.filter(v => v !== valueToRemove) as any, { shouldValidate: true })
    }

    const handleInputChangeLocal = (value: string) => {
      setLocalValue(value)
      if (value.length > 0) {
        setIsDropdownOpen(true)
      } else {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Add value on Enter key if it doesn't exist in suggestions
      if (e.key === 'Enter' && localValue.trim() && filteredData.length === 0) {
        e.preventDefault()
        handleSelect(localValue.trim())
      }
    }

    return (
      <div className="space-y-1">
        <Label htmlFor={field} className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
          {label} {required && '*'}
        </Label>
        <div className="relative">
          <Input
            id={field}
            type="text"
            value={localValue}
            onChange={(e) => handleInputChangeLocal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            onFocus={() => {
              if (localValue.length > 0) {
                setIsDropdownOpen(true)
              }
            }}
            placeholder={placeholder}
            className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
          />
          
          {/* Dropdown with suggestions */}
          {isDropdownOpen && filteredData.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onMouseDown={() => handleSelect(item.name)}
                >
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Show "Press Enter to add" hint when typing custom value */}
          {isDropdownOpen && localValue.trim() && filteredData.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="px-3 py-2 text-sm text-gray-500 italic">
                Press Enter to add "{localValue}"
              </div>
            </div>
          )}
        </div>
        
        {/* Selected values as badges - below input */}
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedValues.map((value, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-secondary-100 text-secondary-900 hover:bg-secondary-200 px-2 py-1 text-xs flex items-center gap-1"
              >
                {value}
                <button
                  type="button"
                  onClick={() => handleRemove(value)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    )
  }


  return (
    <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mx-[16px] mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* <CardHeader className="border-b border-gray-200 px-2 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 font-semibold text-gray-900 label-1 font-urbanist text-[16px]">
              <span>Logistics & Handling</span>
              <Info className="h-4 w-4 text-gray-500" />
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-gray-100 border-gray-600 hover:text-gray-600 rounded-full"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader> */}
        
        <CollapsibleContent>
          <CardContent className="p-0 space-y-3 px-2 py-5">
            {/* 1st line: Dimensions with unit dropdown and Inner Packaging */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Dimensions</Label>
                  <div className="w-20 flex gap-2">
                    <Controller
                      name="package_height_unit"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="border-gray-300 h-8 body-3 font-urbanist text-sm text-neutral-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mm">mm</SelectItem>
                            <SelectItem value="cm">cm</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="in">in</SelectItem>
                            <SelectItem value="ft">ft</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Controller
                      name="package_length"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="package_length"
                          type="text"
                          inputMode="decimal"
                          value={field.value === 0 ? '' : field.value?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '') {
                              field.onChange(0)
                            } else {
                              const num = parseFloat(val)
                              if (!isNaN(num) && num >= 0) {
                                field.onChange(num)
                              }
                            }
                          }}
                          placeholder="Length"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.package_length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Controller
                      name="package_width"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="package_width"
                          type="text"
                          inputMode="decimal"
                          value={field.value === 0 ? '' : field.value?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '') {
                              field.onChange(0)
                            } else {
                              const num = parseFloat(val)
                              if (!isNaN(num) && num >= 0) {
                                field.onChange(num)
                              }
                            }
                          }}
                          placeholder="Width"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.package_width ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Controller
                      name="package_height"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="package_height"
                          type="text"
                          inputMode="decimal"
                          value={field.value === 0 ? '' : field.value?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '') {
                              field.onChange(0)
                            } else {
                              const num = parseFloat(val)
                              if (!isNaN(num) && num >= 0) {
                                field.onChange(num)
                              }
                            }
                          }}
                          placeholder="Height"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.package_height ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      )}
                    />
                  </div>
                </div>
                {(errors.package_length || errors.package_width || errors.package_height) && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.package_length?.message || errors.package_width?.message || errors.package_height?.message}
                  </p>
                )}
              </div>
              <div className="space-y-[10px]">
                <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Volumetric Weight (net/gross)</Label>
                <div className={`flex gap-2 border rounded-md items-center mt-3 ${errors.package_weight ? 'border-red-500' : 'border-gray-300'}`}>
                  <Controller
                    name="package_weight"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="volumetric_weight"
                        type="text"
                        inputMode="decimal"
                        value={field.value === 0 ? '' : field.value?.toString() || ''}
                        placeholder="149.98"
                        className="border-none h-9 flex-1 body-3 font-urbanist text-sm text-neutral-900 focus:ring-0 focus:border-none"
                        disabled={true}
                      />
                    )}
                  />
                  <Controller
                    name="package_weight_unit"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || 'kg'} onValueChange={field.onChange} disabled={true}>
                        <SelectTrigger className="border-gray-300 h-6 mr-2 w-24 body-3 font-urbanist text-sm text-neutral-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Gram</SelectItem>
                          <SelectItem value="kg">Kilogram</SelectItem>
                          <SelectItem value="lb">Pound</SelectItem>
                          <SelectItem value="oz">Ounce</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                {errors.package_weight && <p className="text-xs text-red-600 mt-1">{errors.package_weight.message}</p>}
              </div>
              <MultiSelectInput
                field="package_type"
                label="Inner Packaging"
                placeholder="Enter Inner Packaging"
                data={packageTypes}
                error={errors.package_type?.message}
                required={false}
              />
            </div>

            {/* 2nd line: Volumetric Weight, Box Type, Courier Feasibility, Fragility Indicator */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="box_type" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Box Type</Label>
                <Controller
                  name="box_type"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={
                        field.value 
                          ? (typeof field.value === 'string' 
                              ? field.value 
                              : typeof field.value === 'number' 
                                ? String(field.value)
                                : undefined)
                          : undefined
                      } 
                      onValueChange={field.onChange} 
                    >
                      <SelectTrigger
                        id="box_type"
                        aria-invalid={!!errors.box_type}
                        className={cn(
                          "h-9 body-3 font-urbanist text-sm text-neutral-900",
                          errors.box_type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                        )}
                      >
                        <SelectValue placeholder="Select box type" />
                      </SelectTrigger>
                      <SelectContent>
                        {boxTypes?.map((boxType) => (
                          <SelectItem key={boxType.id} value={boxType.id.toString()}>
                            {boxType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.box_type && <p className="text-xs text-red-600 mt-1">{errors.box_type.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="courier_feasibility" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Courier Feasibility</Label>
                <Controller
                  name="courier_feasibility"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="border-gray-300  h-9 body-3 font-urbanist text-sm text-neutral-900">
                        <SelectValue placeholder="Select feasibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                        <SelectItem value="overnight">Overnight</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fragility_indicator" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Fragility Indicator (Yes/No)</Label>
                <Controller
                  name="fragility_indicator"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ? 'yes' : 'no'} onValueChange={(value) => field.onChange(value === 'yes')}>
                      <SelectTrigger className="border-gray-300  h-9 body-3 font-urbanist text-sm text-neutral-900">
                        <SelectValue placeholder="Select fragility level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="handling_instructions" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Handling Instructions</Label>
                <Controller
                  name="handling_instructions"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="handling_instructions"
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Enter handling instructions"
                      className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.handling_instructions ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                    />
                  )}
                />
                {errors.handling_instructions && <p className="text-xs text-red-600 mt-1">{errors.handling_instructions.message}</p>}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

    </Card>
  )
})

export default LogisticsHandling

