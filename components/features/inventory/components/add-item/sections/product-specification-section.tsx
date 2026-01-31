"use client"

import React, { useState, memo } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Package, Upload, X } from 'lucide-react'
import MultiSelectInput from './multi-select-input'
import type { InventoryFormData } from '../../../types/inventory.types'
import type { InventoryFormValues } from '../schemas/inventory-form.schema'

interface ProductSpecificationSectionProps {
  inventoryData: InventoryFormData | null
  selectedDocument: File | null
  isAssemblyDocDialogOpen: boolean
  documentInputRef: React.RefObject<HTMLInputElement | null>
  onAssemblyRequirementChange: (value: string) => void
  onAssemblyDialogClose: (open: boolean) => void
  onAssemblyDocDialogOpen: () => void
  onDocumentClick: () => void
  onDocumentUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAssemblyDone: () => void
  onRemoveDocument: () => void
}

export const ProductSpecificationSection: React.FC<ProductSpecificationSectionProps> = memo(function ProductSpecificationSection({
  inventoryData,
  selectedDocument,
  isAssemblyDocDialogOpen,
  documentInputRef,
  onAssemblyRequirementChange,
  onAssemblyDialogClose,
  onAssemblyDocDialogOpen,
  onDocumentClick,
  onDocumentUpload,
  onAssemblyDone,
  onRemoveDocument,
}) {
  const [isOpen, setIsOpen] = useState(true)
  const { control, formState: { errors }, setError, clearErrors, watch } = useFormContext<InventoryFormValues>()
  const assemblyRequirement = watch('assembly_requirement')

  return (
    <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mx-[16px] mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-3 px-2 py-5">
            {/* 1st line: Product Material, Finish */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Controller
                name="product_material"
                control={control}
                render={({ field }) => (
                  <MultiSelectInput
                    label="Product Material"
                    placeholder="Teak wood, MDF, Steel, Plastic, etc."
                    data={inventoryData?.productMaterials}
                    values={field.value || []}
                    error={errors.product_material?.message}
                    required={false}
                    onChange={(vals) => {
                      field.onChange(vals)
                      clearErrors('product_material')
                    }}
                    onError={(msg) => {
                      if (msg) {
                        setError('product_material', { type: 'manual', message: msg })
                      } else {
                        clearErrors('product_material')
                      }
                    }}
                  />
                )}
              />
              <Controller
                name="finish"
                control={control}
                render={({ field }) => (
                  <MultiSelectInput
                    label="Finish"
                    placeholder="Matte, Glossy, Laminated, Painted, etc"
                    data={inventoryData?.finishes}
                    values={field.value || []}
                    error={errors.finish?.message}
                    required={false}
                    onChange={(vals) => {
                      field.onChange(vals)
                      clearErrors('finish')
                    }}
                    onError={(msg) => {
                      if (msg) {
                        setError('finish', { type: 'manual', message: msg })
                      } else {
                        clearErrors('finish')
                      }
                    }}
                  />
                )}
              />
            </div>

            {/* 2nd line: Dimensions, Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Dimensions</Label>
                  <div className="w-20 flex gap-2">
                    <Controller
                      name="product_dimension_height_unit"
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
                      name="product_dimension_length"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="length"
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
                          placeholder="Length"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.product_dimension_length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Controller
                      name="product_dimension_width"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="width"
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
                          placeholder="Width"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.product_dimension_width ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Controller
                      name="product_dimension_height"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="height"
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
                          placeholder="Height"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.product_dimension_height ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      )}
                    />
                  </div>
                </div>
                {(errors.product_dimension_length || errors.product_dimension_width || errors.product_dimension_height) && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.product_dimension_length?.message || errors.product_dimension_width?.message || errors.product_dimension_height?.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-[10px]">
                <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Weight (net/gross)</Label>
                <Controller
                  name="product_dimension_weight"
                  control={control}
                  render={({ field: weightField }) => (
                    <Controller
                      name="product_dimension_weight_unit"
                      control={control}
                      render={({ field: unitField }) => (
                        <>
                          <div className={`flex gap-2 border rounded-md items-center mt-3 ${errors.product_dimension_weight ? 'border-red-500' : 'border-gray-300'}`}>
                            <Input
                              id="weight"
                              type="text"
                              inputMode="decimal"
                              value={weightField.value === 0 ? '' : (weightField.value?.toString() || '')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === '') {
                                  weightField.onChange(0)
                                } else {
                                  const num = parseFloat(val)
                                  if (!isNaN(num)) weightField.onChange(num)
                                }
                              }}
                              placeholder="149.98"
                              className="border-none h-9 flex-1 body-3 font-urbanist text-sm text-neutral-900 focus:ring-0 focus:border-none"
                            />
                            <Select value={unitField.value} onValueChange={unitField.onChange}>
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
                          </div>
                          {errors.product_dimension_weight && <p className="text-xs text-red-600 mt-1">{errors.product_dimension_weight.message}</p>}
                        </>
                      )}
                    />
                  )}
                />
              </div>
            </div>
            {/* Assembly Requirement and Usage Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="assembly_requirement" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Assembly Requirement (Yes/No)</Label>
                <Controller
                  name="assembly_requirement"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select value={field.value || ''} onValueChange={(value) => {
                        field.onChange(value)
                        onAssemblyRequirementChange(value)
                      }}>
                        <SelectTrigger className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.assembly_requirement ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.assembly_requirement && <p className="text-xs text-red-600 mt-1">{errors.assembly_requirement.message}</p>}
                    </>
                  )}
                />
                {/* Show document tag below field if uploaded */}
                {selectedDocument && assemblyRequirement === 'yes' && (
                  <div className="flex items-center justify-between p-2 border border-secondary-900 rounded-md mt-1">
                    <div className="flex items-center space-x-2">
                      <Package className="h-3 w-3 text-secondary-900" />
                      <span className="text-xs text-secondary-900 font-medium truncate max-w-[200px]">
                        {selectedDocument.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={onAssemblyDocDialogOpen}
                        className="text-secondary-900 hover:text-secondary-800 text-xs underline"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={onRemoveDocument}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Assembly Document Upload Dialog */}
                <Dialog open={isAssemblyDocDialogOpen} onOpenChange={onAssemblyDialogClose}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader className="border-b border-gray-200 pb-4">
                      <DialogTitle className="font-semibold text-gray-900 label-1 font-urbanist text-[16px]">
                        <span>Upload Assembly Requirement Document</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                        onClick={onDocumentClick}
                      >
                        {selectedDocument ? (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700 body-3 font-urbanist">Selected Document</p>
                            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Package className="h-5 w-5 text-secondary-900" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium text-gray-900 body-3 font-urbanist">{selectedDocument.name}</p>
                                  <p className="text-xs text-gray-500 body-3 font-urbanist">
                                    {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRemoveDocument()
                                }}
                                className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <Button type="button" variant="outline" className="h-8 cursor-pointer text-white body-3 font-urbanist text-sm bg-secondary-900 hover:bg-secondary-800 hover:text-white">
                              Choose Different Document
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-1 body-3 font-urbanist text-sm font-medium">Upload assembly document</p>
                            <p className="text-xs text-gray-500 mb-3 body-3 font-urbanist">PDF, DOC, DOCX, or TXT formats (max 10MB)</p>
                            <Button type="button" variant="outline" className="h-8 cursor-pointer text-white body-3 font-urbanist text-sm bg-secondary-900 hover:bg-secondary-800 hover:text-white">
                              Choose Document
                            </Button>
                          </>
                        )}
                        <input
                          ref={documentInputRef}
                          type="file"
                          id="document-upload"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={onDocumentUpload}
                          className="hidden"
                        />
                      </div>
                      <div className="flex justify-end space-x-3 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => onAssemblyDialogClose(false)}
                          className="h-9 px-4 body-3 font-urbanist text-sm border-gray-300"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button" 
                          onClick={onAssemblyDone}
                          disabled={!selectedDocument}
                          className="h-9 px-4 body-3 font-urbanist text-sm text-white border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: !selectedDocument ? '#9CA3AF' : '' }}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Controller
                name="usage_type"
                control={control}
                render={({ field }) => (
                  <MultiSelectInput
                    label="Usage Type"
                    placeholder="(Indoor / Outdoor / Office / Commercial)"
                    data={inventoryData?.usageTypes}
                    values={field.value || []}
                    error={errors.usage_type?.message}
                    required={false}
                    onChange={(vals) => {
                      field.onChange(vals)
                      clearErrors('usage_type')
                    }}
                    onError={(msg) => {
                      if (msg) {
                        setError('usage_type', { type: 'manual', message: msg })
                      } else {
                        clearErrors('usage_type')
                      }
                    }}
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

export default ProductSpecificationSection


