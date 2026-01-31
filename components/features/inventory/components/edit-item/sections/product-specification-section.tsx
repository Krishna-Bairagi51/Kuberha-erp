"use client"

import React from 'react'
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
import type { EditInventoryFormValues } from '../schemas/edit-inventory-form.schema'

interface ProductSpecificationSectionProps {
  inventoryData: InventoryFormData | null
  selectedDocument: File | null
  isAssemblyDocDialogOpen: boolean
  isProductSpecOpen: boolean
  onProductSpecOpenChange: (open: boolean) => void
  documentInputRef: React.RefObject<HTMLInputElement | null>
  onAssemblyRequirementChange: (value: string) => void
  onAssemblyDialogClose: (open: boolean) => void
  onDocumentClick: () => void
  onDocumentUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAssemblyDone: () => void
  onRemoveDocument: () => void
  // Optional highlighting function for admin version
  getHighlightStyles?: (fieldKey: string, baseClassName: string) => string
}

export const ProductSpecificationSection: React.FC<ProductSpecificationSectionProps> = ({
  inventoryData,
  selectedDocument,
  isAssemblyDocDialogOpen,
  isProductSpecOpen,
  onProductSpecOpenChange,
  documentInputRef,
  onAssemblyRequirementChange,
  onAssemblyDialogClose,
  onDocumentClick,
  onDocumentUpload,
  onAssemblyDone,
  onRemoveDocument,
  getHighlightStyles,
}) => {
  const { control, watch, formState: { errors } } = useFormContext<EditInventoryFormValues>()
  const assemblyRequirement = watch('assembly_requirement')

  // Helper function to apply highlighting if available
  const applyHighlight = (fieldKey: string, baseClassName: string) => {
    return getHighlightStyles ? getHighlightStyles(fieldKey, baseClassName) : baseClassName
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mx-[16px] mb-4">
      <Collapsible open={isProductSpecOpen} onOpenChange={onProductSpecOpenChange}>
        <CollapsibleContent>
          <CardContent className="space-y-3 px-[16px] py-5">
            {/* 1st line: Product Material, Finish */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MultiSelectInput
                name="product_material"
                label="Product Material"
                placeholder="Teak wood, MDF, Steel, Plastic, etc."
                data={inventoryData?.productMaterials}
                getHighlightStyles={getHighlightStyles}
              />
              <MultiSelectInput
                name="finish"
                label="Finish"
                placeholder="Matte, Glossy, Laminated, Painted, etc"
                data={inventoryData?.finishes}
                getHighlightStyles={getHighlightStyles}
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
                        <Select value={field.value || 'cm'} onValueChange={field.onChange}>
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
                  <Controller
                    name="product_dimension_length"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <Input
                          id="length"
                          type="text"
                          inputMode="decimal"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="Length"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.product_dimension_length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="product_dimension_width"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <Input
                          id="width"
                          type="text"
                          inputMode="decimal"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="Width"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.product_dimension_width ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="product_dimension_height"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <Input
                          id="height"
                          type="text"
                          inputMode="decimal"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          placeholder="Height"
                          className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.product_dimension_height ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                      </div>
                    )}
                  />
                </div>
                {(errors.product_dimension_length || errors.product_dimension_width || errors.product_dimension_height) && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.product_dimension_length?.message || errors.product_dimension_width?.message || errors.product_dimension_height?.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-[10px]">
                <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Weight (net/gross)</Label>
                <div className={`flex gap-2 border rounded-md items-center mt-3 ${errors.product_dimension_weight ? 'border-red-500' : 'border-gray-300'}`}>
                  <Controller
                    name="product_dimension_weight"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="weight"
                        type="text"
                        inputMode="decimal"
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="149.98"
                        className="border-none h-9 flex-1 body-3 font-urbanist text-sm text-neutral-900 focus:ring-0 focus:border-none"
                      />
                    )}
                  />
                  <Controller
                    name="product_dimension_weight_unit"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || 'kg'} onValueChange={field.onChange}>
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
                {errors.product_dimension_weight && <p className="text-xs text-red-600 mt-1">{errors.product_dimension_weight.message}</p>}
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
                        <SelectTrigger className={`h-9 body-3 font-urbanist text-sm text-neutral-900 ${errors.assembly_requirement || errors.assembly_requirement_document ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.assembly_requirement && <p className="text-xs text-red-600 mt-1">{errors.assembly_requirement.message}</p>}
                      {errors.assembly_requirement_document && <p className="text-xs text-red-600 mt-1">{errors.assembly_requirement_document.message}</p>}
                    </>
                  )}
                />
                
                {/* Show existing document if available and no new document selected */}
                {!selectedDocument && assemblyRequirement === 'yes' && watch('assembly_requirement_document') && (
                  <div className="flex items-center justify-between p-2 border border-secondary-900 rounded-md mt-1">
                    <div className="flex items-center space-x-2">
                      <Package className="h-3 w-3 text-secondary-900" />
                      <a 
                        href={watch('assembly_requirement_document') || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-secondary-900 font-medium truncate max-w-[200px] hover:underline"
                      >
                        {(watch('assembly_requirement_document') || '').split('/').pop() || "View Document"}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => onAssemblyDialogClose(true)}
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
                        onClick={() => onAssemblyDialogClose(true)}
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
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                          errors.assembly_requirement_document
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
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
                      {errors.assembly_requirement_document && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-600 font-urbanist">{errors.assembly_requirement_document.message}</p>
                        </div>
                      )}
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
              <MultiSelectInput
                name="usage_type"
                label="Usage Type"
                placeholder="(Indoor / Outdoor / Office / Commercial)"
                data={inventoryData?.usageTypes}
                getHighlightStyles={getHighlightStyles}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default ProductSpecificationSection

