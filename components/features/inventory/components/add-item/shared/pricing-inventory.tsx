"use client"
import React, { useState, memo } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Info, ChevronDown, ChevronUp, Bell, X, ChevronsUpDown, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { Tax } from '../../../types/inventory.types'
import type { InventoryFormValues } from '../schemas/inventory-form.schema'

interface PricingInventoryProps {
  taxList?: Tax[]
  isLoadingData: boolean
  taxesOpen: boolean 
  setTaxesOpen: (open: boolean) => void
  getHighlightStyles?: (fieldKey: string, baseClassName: string) => string
}

export const PricingInventory = memo(function PricingInventory({
  taxList,
  isLoadingData,
  taxesOpen,
  setTaxesOpen,
  getHighlightStyles
}: PricingInventoryProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { control, watch, setValue, formState: { errors } } = useFormContext<InventoryFormValues>()
  
  // Check if user is admin
  const isAdmin = localStorage.getItem('user_type') === 'admin'

  const mrp = watch('mrp')
  const discountValue = watch('discount_value')
  const discountType = watch('discount_type')

  const updatePriceAfterDiscount = (mrpVal: string | number, discountVal: string | number, type: string) => {
    const m = parseFloat(mrpVal.toString()) || 0
    const d = parseFloat(discountVal.toString()) || 0
    let price = m

    if (type === 'percentage') {
      if (d > 100) {
        return // Don't update if percentage is > 100
      }
      price = m - (m * d / 100)
    } else {
      price = m - d
    }
    setValue('price_after_discount', price > 0 ? price : 0, { shouldValidate: true })
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mx-[16px] mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* <CardHeader className="border-b border-gray-200 px-2 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 font-semibold text-gray-900 label-1 font-urbanist text-[16px]">
              <span>Pricing & Inventory</span>
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
            {/* 1st line: Quantity, MRP, Taxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="quantity" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Quantity</Label>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Input
                        id="quantity"
                        type="text"
                        inputMode="decimal"
                        value={field.value === 0 ? '' : (field.value?.toString() || '')}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            field.onChange(0)
                          } else {
                            const num = parseFloat(val)
                            if (!isNaN(num)) field.onChange(num)
                          }
                        }}
                        placeholder="100"
                        className={getHighlightStyles ? getHighlightStyles('is_qty_change', `h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`) : `h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      />
                      {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity.message}</p>}
                    </>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mrp" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">MRP *</Label>
                <Controller
                  name="mrp"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Input
                        id="mrp"
                        type="text"
                        inputMode="decimal"
                        value={field.value === 0 ? '' : (field.value?.toString() || '')}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            field.onChange(0)
                          } else {
                            const num = parseFloat(val)
                            if (!isNaN(num)) {
                              field.onChange(num)
                              updatePriceAfterDiscount(val, discountValue || 0, discountType || 'percentage')
                            }
                          }
                        }}
                        placeholder="999.99"
                        className={getHighlightStyles ? getHighlightStyles('is_mrp_change', `h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.mrp ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`) : `h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.mrp ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      />
                      {errors.mrp && <p className="text-xs text-red-600 mt-1">{errors.mrp.message}</p>}
                    </>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="taxes" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Taxes</Label>
                <Controller
                  name="taxes"
                  control={control}
                  render={({ field }) => {
                    const selectedTaxes = field.value || []
                    return (
                      <>
                        <Popover open={taxesOpen} onOpenChange={setTaxesOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={taxesOpen}
                              className={getHighlightStyles ? getHighlightStyles('is_tax_change', `w-full justify-between h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.taxes ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`) : `w-full justify-between h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.taxes ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                            >
                              {selectedTaxes.length > 0
                                ? `${selectedTaxes.length} tax(es) selected`
                                : isLoadingData ? "Loading..." : "Select taxes..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 body-3 font-urbanist text-sm text-neutral-900" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search taxes..." className="body-3 font-urbanist text-sm text-neutral-900" />
                              <CommandList>
                                <CommandEmpty>No tax found.</CommandEmpty>
                                <CommandGroup>
                                  {Array.isArray(taxList) && taxList.map((tax) => (
                                    <CommandItem
                                      key={tax.id}
                                      value={tax.name}
                                      onSelect={() => {
                                        const isSelected = selectedTaxes.includes(tax.id)
                                        if (isSelected) {
                                          field.onChange(selectedTaxes.filter(id => id !== tax.id))
                                        } else {
                                          field.onChange([...selectedTaxes, tax.id])
                                        }
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedTaxes.includes(tax.id) ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {tax.name} ({tax.amount}%)
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {selectedTaxes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedTaxes.map(id => {
                              const tax = taxList?.find(t => t.id === id)
                              return tax ? (
                                <Badge key={id} variant="secondary" className="text-xs">
                                  {tax.name} ({tax.amount}%)
                                  <X 
                                    className="ml-1 h-3 w-3 cursor-pointer" 
                                    onClick={() => field.onChange(selectedTaxes.filter(tId => tId !== id))}
                                  />
                                </Badge>
                              ) : null
                            })}
                          </div>
                        )}
                        {errors.taxes && <p className="text-xs text-red-600 mt-1">{errors.taxes.message}</p>}
                      </>
                    )
                  }}
                />
              </div>
            </div>

            {/* 2nd line: Discount Type, Discount Value, Price After Discount, Low Stock Value */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="discount_type" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Discount Type</Label>
                <Controller
                  name="discount_type"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value)
                        updatePriceAfterDiscount(mrp || 0, discountValue || 0, value)
                      }} 
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className={`border-gray-300 h-9 body-3 font-urbanist text-sm text-neutral-900 ${!isAdmin ? 'bg-gray-50' : ''}`}>
                        <SelectValue placeholder="Select Discount Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div> 
              <div className="space-y-1">
                <Label htmlFor="discount_value" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Discount Value</Label>
                <Controller
                  name="discount_value"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="discount_value"
                      type="text"
                      inputMode="decimal"
                      value={field.value === 0 ? '' : (typeof field.value === 'string' ? field.value : field.value?.toString() || '')}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '') {
                          field.onChange(0)
                        } else {
                          const num = parseFloat(val)
                          if (!isNaN(num)) {
                            field.onChange(num)
                            updatePriceAfterDiscount(mrp || 0, val, discountType || 'percentage')
                          }
                        }
                      }}
                      placeholder="0.00"
                      className={`border-gray-300 h-9 body-3 font-urbanist text-sm text-neutral-900 ${!isAdmin ? 'bg-gray-50' : ''}`}
                      disabled={!isAdmin}
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price_after_discount" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Price After Discount</Label>
                <Controller
                  name="price_after_discount"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Input
                        id="price_after_discount"
                        type="text"
                        inputMode="decimal"
                        value={field.value?.toString() || ''}
                        placeholder="899.99"
                        className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${!isAdmin ? 'bg-gray-50' : ''} ${errors.price_after_discount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        disabled={true}
                        readOnly
                      />
                      {errors.price_after_discount && <p className="text-xs text-red-600 mt-1">{errors.price_after_discount.message}</p>}
                    </>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="low_stock_value" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Low Stock Value</Label>
                <Controller
                  name="low_stock_value"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="low_stock_value"
                      type="text"
                      inputMode="decimal"
                      value={field.value === 0 ? '' : (field.value?.toString() || '')}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '') {
                          field.onChange(0)
                        } else {
                          const num = parseFloat(val)
                          if (!isNaN(num)) field.onChange(num)
                        }
                      }}
                      placeholder="10"
                      className="border-gray-300  h-9 body-3 font-urbanist text-sm text-neutral-900"
                    />
                  )}
                />
              </div>
            </div>

            {/* Low Stock Alert Switch */}
            <div className="flex items-center justify-between justify-self-end w-full">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-secondary-900" />
                <Label htmlFor="low_stock_alert" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                  Low Stock Alert
                </Label>
              </div>
              <Controller
                name="low_stock_alert"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="low_stock_alert"
                    checked={field.value === true}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
})

export default PricingInventory

