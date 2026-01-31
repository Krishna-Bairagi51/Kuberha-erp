"use client"

import React, { memo } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown, Check, CirclePlus, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryFormData } from '../../../types/inventory.types'
import type { InventoryFormValues } from '../schemas/inventory-form.schema'

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
  onInputChange?: <K extends keyof InventoryFormValues>(field: K, value: InventoryFormValues[K]) => void
  onArrayChange?: (field: keyof InventoryFormValues, value: any[]) => void
}

export const ProductInformationSection: React.FC<ProductInformationSectionProps> = memo(function ProductInformationSection({
  inventoryData,
  isLoadingData,
  categoryOpen,
  onCategoryOpenChange,
  subCategoryOpen,
  onSubCategoryOpenChange,
  isCategoryModalOpen,
  onCategoryModalChange,
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
  isSubCategoryModalOpen,
  onSubCategoryModalChange,
  onInputChange,
  onArrayChange,
}) {
  const { control, watch, formState: { errors }, getValues } = useFormContext<InventoryFormValues>()
  const category = watch('category')
  const subCategory = watch('Sub_category')
  const collections = watch('collections') || []

  return (
    <div className="space-y-3">
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
                    className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
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
                    className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.product_type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  />
                  {errors.product_type && <p className="text-xs text-red-600 mt-1">{errors.product_type.message}</p>}
                </>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="category" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Category *</Label>
              <Dialog open={isCategoryModalOpen} onOpenChange={(open) => {
                onCategoryModalChange(open)
                if (!open) {
                  onNewCategoryNameChange('')
                  // clear error handled in parent
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
                <>
                  <Popover open={categoryOpen} onOpenChange={onCategoryOpenChange}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        className={`w-full justify-between h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
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
                                    // This would need to be handled via setValue if needed
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
                  {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
                </>
              )}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="Sub_category" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Sub Category</Label>
              <Dialog open={isSubCategoryModalOpen} onOpenChange={(open) => {
                onSubCategoryModalChange(open)
                if (!open) {
                  onNewSubCategoryNameChange('')
                }
              }}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-7 border-none text-secondary-900 hover:bg-white hover:text-secondary-700 body-3 font-urbanist text-sm">
                    <CirclePlus /> <span className="text-sm">Add New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Manage Sub Categories</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newSubCategory">Add New Sub Category</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            id="newSubCategory"
                            value={newSubCategoryName}
                            onChange={(e) => {
                              onNewSubCategoryNameChange(e.target.value)
                              validateSubCategoryName(e.target.value)
                            }}
                            placeholder="Enter sub category name"
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
                      <Label>Existing Sub Categories</Label>
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
            </div>
            <Controller
              name="Sub_category"
              control={control}
              render={({ field }) => (
                <>
                  <Popover open={subCategoryOpen} onOpenChange={onSubCategoryOpenChange}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={subCategoryOpen}
                        className={`w-full justify-between h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.Sub_category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      >
                        {field.value && inventoryData?.ecomCategories
                          ? inventoryData.ecomCategories.find(cat => cat.name === field.value)?.name
                          : isLoadingData ? "Loading..." : "Select sub category..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 body-3 font-urbanist text-sm text-neutral-900" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search sub categories..." className="body-3 font-urbanist text-sm text-neutral-900" />
                        <CommandList>
                          <CommandEmpty>No sub category found.</CommandEmpty>
                          <CommandGroup>
                            {Array.isArray(inventoryData?.ecomCategories) && inventoryData.ecomCategories.map((cat) => (
                              <CommandItem
                                key={cat.id}
                                value={cat.name}
                                onSelect={() => {
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
                  {errors.Sub_category && <p className="text-xs text-red-600 mt-1">{errors.Sub_category.message}</p>}
                </>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="unit" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Unit</Label>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <>
                  <Select 
                    value={field.value?.toString() || '1'} 
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.unit ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryData?.uomList?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit.message}</p>}
                </>
              )}
            />
          </div>
        </div>
    </div>
  )
})

export default ProductInformationSection

