"use client"

import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, Check, CirclePlus, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import MultiSelectInput from './multi-select-input'
import type { InventoryFormData } from '../../../types/inventory.types'
import type { EditInventoryFormValues } from '../schemas/edit-inventory-form.schema'

const LeadTimeManagement = dynamic(() => import('../../lead-time-management').then(m => ({ default: m.LeadTimeManagement })), {
  loading: () => <div className="p-4 text-center text-gray-500">Loading lead time section...</div>,
  ssr: false
})

interface ProductInformationSectionProps {
  inventoryData: InventoryFormData | null
  isLoadingData: boolean
  categoryOpen: boolean
  onCategoryOpenChange: (open: boolean) => void
  subCategoryOpen: boolean
  onSubCategoryOpenChange: (open: boolean) => void
  isCategoryModalOpen: boolean
  onCategoryModalChange: (open: boolean) => void
  isSubCategoryModalOpen: boolean
  onSubCategoryModalChange: (open: boolean) => void
  newCategoryName: string
  onNewCategoryNameChange: (value: string) => void
  categoryNameError: string
  onAddCategory: () => void
  onDeleteCategory: (id: number) => void
  newSubCategoryName: string
  onNewSubCategoryNameChange: (value: string) => void
  subCategoryNameError: string
  onAddSubCategory: () => void
  onDeleteSubCategory: (id: number) => void
  validateCategoryName: (name: string) => string
  validateSubCategoryName: (name: string) => string
  onNumberInputChange?: (field: keyof EditInventoryFormValues, value: string) => void
  onInputChange?: <K extends keyof EditInventoryFormValues>(field: K, value: EditInventoryFormValues[K]) => void
  onArrayChange?: (field: keyof EditInventoryFormValues, value: any[]) => void
  onGenerateDescriptionClick?: () => void
  // Optional highlighting function for admin version
  getHighlightStyles?: (fieldKey: string, baseClassName: string) => string
  // Lead time handlers
  onQuantityRangeChange?: (value: string) => void
  onLeadTimeValueChange?: (value: string) => void
  onLeadTimeUnitChange?: (value: string) => void
  onAddLeadTime?: () => void
  onRemoveLeadTime?: (index: number) => void
  onUpdateLeadTime?: (index: number, lead_time_value: number, lead_time_unit: string) => void
  onApplyTemplate?: (leadTimes: any[]) => void
}

export const ProductInformationSection: React.FC<ProductInformationSectionProps> = ({
  inventoryData,
  isLoadingData,
  categoryOpen,
  onCategoryOpenChange,
  subCategoryOpen,
  onSubCategoryOpenChange,
  isCategoryModalOpen,
  onCategoryModalChange,
  isSubCategoryModalOpen,
  onSubCategoryModalChange,
  newCategoryName,
  onNewCategoryNameChange,
  categoryNameError,
  onAddCategory,
  onDeleteCategory,
  newSubCategoryName,
  onNewSubCategoryNameChange,
  subCategoryNameError,
  onAddSubCategory,
  onDeleteSubCategory,
  validateCategoryName,
  validateSubCategoryName,
  onNumberInputChange,
  onInputChange,
  onArrayChange,
  onGenerateDescriptionClick,
  getHighlightStyles,
  onQuantityRangeChange,
  onLeadTimeValueChange,
  onLeadTimeUnitChange,
  onAddLeadTime,
  onRemoveLeadTime,
  onUpdateLeadTime,
  onApplyTemplate,
}) => {
  const { control, watch, setValue, formState: { errors }, getValues } = useFormContext<EditInventoryFormValues>()
  const category = watch('category')
  const subCategory = watch('Sub_category')
  const collections = watch('collections') || []
  


  // Helper function to apply highlighting if available
  const applyHighlight = (fieldKey: string, baseClassName: string) => {
    return getHighlightStyles ? getHighlightStyles(fieldKey, baseClassName) : baseClassName
  }

  // Handle number input changes
  const handleNumberChange = (field: keyof EditInventoryFormValues, value: string) => {
    if (onNumberInputChange) {
      onNumberInputChange(field, value)
    }
  }

  return (
    <div className="space-y-3">
      {/* 1st line: Product Name, HSN/SAC Code, Product Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Product Name *</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  id="name"
                  {...field}
                  placeholder="Enter product name"
                  className={applyHighlight('is_name_change', `h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`)}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </>
            )}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="hsn_code" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">HSN / SAC Code</Label>
          <Controller
            name="hsn_code"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  id="hsn_code"
                  {...field}
                  placeholder="Enter HSN/SAC code"
                  className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.hsn_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.hsn_code && <p className="text-xs text-red-600 mt-1">{errors.hsn_code.message}</p>}
              </>
            )}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="product_type" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Product Type</Label>
          <Controller
            name="product_type"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  id="product_type"
                  {...field}
                  placeholder="Enter product type"
                  className={applyHighlight('is_product_type_change', `h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.product_type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`)}
                />
                {errors.product_type && <p className="text-xs text-red-600 mt-1">{errors.product_type.message}</p>}
              </>
            )}
          />
        </div>
      </div>

      {/* 2nd line: Category, Sub-category, Unit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="category" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Category *</Label>
            <Dialog open={isCategoryModalOpen} onOpenChange={(open) => {
              onCategoryModalChange(open)
              if (!open) {
                onNewCategoryNameChange('')
              }
            }}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-7 border-none text-secondary-900 hover:bg-white hover:text-secondary-700 body-3 font-urbanist text-sm">
                  <CirclePlus /> <span className="text-sm">Add New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newCategory">Add New Category</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          id="newCategory"
                          value={newCategoryName}
                          onChange={(e) => {
                            onNewCategoryNameChange(e.target.value)
                            validateCategoryName(e.target.value)
                          }}
                          placeholder="Enter category name"
                          onKeyPress={(e) => e.key === 'Enter' && onAddCategory()}
                          className={categoryNameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                        />
                        {categoryNameError && (
                          <p className="text-xs text-red-600 mt-1">{categoryNameError}</p>
                        )}
                      </div>
                      <Button onClick={onAddCategory} disabled={!newCategoryName.trim() || !!categoryNameError}>
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Existing Categories</Label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {inventoryData?.categories?.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <span className="text-sm">{category.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Popover open={categoryOpen} onOpenChange={onCategoryOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className={applyHighlight('is_category_change', `w-full justify-between h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`)}
                  >
                    {field.value && inventoryData?.categories
                      ? inventoryData.categories.find(cat => cat.name === field.value)?.name
                      : isLoadingData ? "Loading..." : "Select category..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 body-3 font-urbanist text-sm text-neutral-900 hover:text-white" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search categories..." className="body-3 font-urbanist text-sm text-neutral-900" />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {Array.isArray(inventoryData?.categories) && inventoryData.categories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.name}
                            onSelect={() => {
                              const previousCategory = category
                              field.onChange(cat.name)
                              if (onInputChange) {
                                onInputChange('category', cat.name)
                              }
                              // Clear subcategory if it's the same as the selected category
                              if (subCategory === cat.name) {
                                setValue('Sub_category', '')
                                if (onInputChange) {
                                  onInputChange('Sub_category', '')
                                }
                              }
                              // Sync collections: remove previous category, add new category
                              if (onArrayChange) {
                                const currentCollections = getValues('collections') || []
                                let updatedCollections = [...currentCollections]
                                // Remove previous category if it exists
                                if (previousCategory && updatedCollections.includes(previousCategory)) {
                                  updatedCollections = updatedCollections.filter(c => c !== previousCategory)
                                }
                                // Add new category if not already present
                                if (cat.name && !updatedCollections.includes(cat.name)) {
                                  updatedCollections.push(cat.name)
                                }
                                onArrayChange('collections', updatedCollections)
                              }
                              onCategoryOpenChange(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === cat.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="Sub_category" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Sub-category</Label>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-7 border-none text-secondary-900 hover:bg-white hover:text-secondary-700 body-3 font-urbanist text-sm"
              onClick={() => onSubCategoryModalChange(true)}
            >
              <CirclePlus /> <span className="text-sm">Add New</span>
            </Button>
          </div>
          <Dialog open={isSubCategoryModalOpen} onOpenChange={(open) => {
            onSubCategoryModalChange(open)
            if (!open) {
              onNewSubCategoryNameChange('')
            }
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Manage Sub-Categories</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newSubCategory">Add New Sub-Category</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="newSubCategory"
                        value={newSubCategoryName}
                        onChange={(e) => {
                          onNewSubCategoryNameChange(e.target.value)
                          validateSubCategoryName(e.target.value)
                        }}
                        placeholder="Enter sub-category name"
                        onKeyPress={(e) => e.key === 'Enter' && onAddSubCategory()}
                        className={subCategoryNameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                      />
                      {subCategoryNameError && (
                        <p className="text-xs text-red-600 mt-1">{subCategoryNameError}</p>
                      )}
                    </div>
                    <Button onClick={onAddSubCategory} disabled={!newSubCategoryName.trim() || !!subCategoryNameError}>
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Existing Sub-Categories</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {inventoryData?.ecomCategories?.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <span className="text-sm">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteSubCategory(category.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Controller
            name="Sub_category"
            control={control}
            render={({ field }) => (
              <Popover open={subCategoryOpen} onOpenChange={onSubCategoryOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={subCategoryOpen}
                    className={applyHighlight('is_sub_category_change', `w-full justify-between h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.Sub_category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`)}
                  >
                    {field.value
                      ? field.value
                      : isLoadingData ? "Loading..." : "Select sub-category..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 body-3 font-urbanist text-sm text-neutral-900" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search sub-category..." className="body-3 font-urbanist text-sm text-neutral-900" />
                    <CommandList>
                      <CommandEmpty>No sub-category found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            const previousSubCategory = subCategory
                            field.onChange('')
                            if (onInputChange) {
                              onInputChange('Sub_category', '')
                            }
                            // Remove previous subcategory from collections when "None" is selected
                            if (previousSubCategory && onArrayChange) {
                              const currentCollections = getValues('collections') || []
                              const updatedCollections = currentCollections.filter(c => c !== previousSubCategory)
                              onArrayChange('collections', updatedCollections)
                            }
                            onSubCategoryOpenChange(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {Array.isArray(inventoryData?.ecomCategories) && inventoryData.ecomCategories
                          .filter(cat => cat.name !== category) // Filter out the selected category
                          .map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.name}
                            onSelect={() => {
                              // Prevent selecting the same category as main category
                              if (cat.name !== category) {
                                const previousSubCategory = subCategory
                                field.onChange(cat.name)
                                if (onInputChange) {
                                  onInputChange('Sub_category', cat.name)
                                }
                                // Sync collections: remove previous subcategory, add new subcategory
                                if (onArrayChange) {
                                  const currentCollections = getValues('collections') || []
                                  let updatedCollections = [...currentCollections]
                                  // Remove previous subcategory if it exists
                                  if (previousSubCategory && updatedCollections.includes(previousSubCategory)) {
                                    updatedCollections = updatedCollections.filter(c => c !== previousSubCategory)
                                  }
                                  // Add new subcategory if not already present
                                  if (cat.name && !updatedCollections.includes(cat.name)) {
                                    updatedCollections.push(cat.name)
                                  }
                                  onArrayChange('collections', updatedCollections)
                                }
                                onSubCategoryOpenChange(false)
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === cat.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.Sub_category && <p className="text-xs text-red-600 mt-1">{errors.Sub_category.message}</p>}
        </div>

        <div className="space-y-[9px]">
          <Label htmlFor="unit" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Unit</Label>
          <Controller
            name="unit" 
            control={control}
            render={({ field }) => {
              // Get the current value using watch for reactivity
              const currentValue = watch('unit')
              // Convert to string for Select component - handle both number and undefined/null values
              // Use field.value as fallback if watch doesn't return value yet
              const unitValue = currentValue ?? field.value
              const selectValue = unitValue != null && unitValue !== undefined && !isNaN(Number(unitValue))
                ? String(unitValue) 
                : undefined
              
              return (
              <>
                <Select 
                  value={selectValue}
                  onValueChange={(value) => {
                    const numValue = Number(value)
                    if (!isNaN(numValue)) {
                      field.onChange(numValue)
                    }
                  }}
                >
                  <SelectTrigger className={`h-9 body-3 font-urbanist text-sm text-neutral-900 w-full ${errors.unit ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}>
                    <SelectValue placeholder={isLoadingData ? "Loading..." : "Select unit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryData?.uomList && Array.isArray(inventoryData.uomList) && inventoryData.uomList.length > 0 ? (
                      inventoryData.uomList.map((uom) => (
                        <SelectItem key={uom.id} value={uom.id.toString()}>
                          {uom.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {isLoadingData ? "Loading units..." : inventoryData ? "No units available" : "Loading form data..."}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit.message}</p>}
              </>
            )}}
          />
        </div>
      </div>

      {/* 3rd line: SKU/Item Code, Collection Name, CAD/3D File */}
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
                  value={field.value || ''}
                  placeholder="Enter SKU/Item code"
                  className={`h-9 flex-1 body-3 font-urbanist text-sm text-neutral-900 ${errors.sku_item_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {errors.sku_item_code && <p className="text-xs text-red-600 mt-1">{errors.sku_item_code.message}</p>}
              </>
            )}
          />
        </div>
        <MultiSelectInput
          label="Collection Name"
          placeholder="Enter collection name"
          data={inventoryData?.collections}
          name="collections"
          getHighlightStyles={getHighlightStyles}
          highlightField={getHighlightStyles ? 'is_collection_change' : undefined}
        />
        <div className="space-y-1">
          <Label htmlFor="cad_3d_files" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">CAD/3D File</Label>
          <Controller
            name="cad_3d_files"
            control={control}
            render={({ field }) => (
              <Select 
                value={field.value || '0'} 
                onValueChange={field.onChange}
              >
                <SelectTrigger className="h-9 body-3 font-urbanist text-sm text-neutral-900 border-gray-300">
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

      {/* Last line: Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="description" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Description</Label>
          {onGenerateDescriptionClick && (
            <Button 
              type="button" 
              className="h-7 px-3 text-xs text-white hover:text-black bg-secondary-900 hover:bg-secondary-800 hover:text-white"
              onClick={onGenerateDescriptionClick}
            >                    
              {watch('description')?.trim() && watch('description')!.trim().length > 1 ? 'Regenerate Description' : 'Generate Description'}
            </Button>
          )}
        </div>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  id="description"
                  {...field}
                  value={field.value || ''}
                  placeholder="Enter the Product Description here."
                  className={applyHighlight('is_description_change', `min-h-[120px] body-3 font-urbanist text-sm text-neutral-900 rounded-none border rounded-lg ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`)}
                />
              </div>
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
            </div>
          )}
        />
      </div>

      {/* Lead Time for Manufacturing */}
      {onAddLeadTime && onRemoveLeadTime && onUpdateLeadTime && onApplyTemplate && (
        <LeadTimeManagement
          quantity_range={watch('quantity_range') || ''}
          lead_time_value={watch('lead_time_value') || 0}
          lead_time_unit={watch('lead_time_unit') || 'days'}
          manufacture_lead_times={watch('manufacture_lead_times') || []}
          errors={{
            quantity_range: errors.quantity_range?.message,
            lead_time_value: errors.lead_time_value?.message,
            manufacture_lead_times: errors.manufacture_lead_times?.message,
          }}
          onQuantityRangeChange={(value) => setValue('quantity_range', value)}
          onLeadTimeValueChange={(value) => setValue('lead_time_value', value === '' ? 0 : Number(value))}
          onLeadTimeUnitChange={(value) => setValue('lead_time_unit', value)}
          onAddLeadTime={onAddLeadTime}
          onRemoveLeadTime={onRemoveLeadTime}
          onUpdateLeadTime={onUpdateLeadTime}
          onApplyTemplate={onApplyTemplate}
          showImportExport={false}
          required={false}
        />
      )}
    </div>
  )
}

export default ProductInformationSection

