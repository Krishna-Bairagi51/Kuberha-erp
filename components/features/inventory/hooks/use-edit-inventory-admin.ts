"use client"

import type React from 'react'
import { useRef, useState, useLayoutEffect, useEffect, useMemo, useCallback } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { validateLeadTimes } from '../components/lead-time/utils'
import { 
  useInventoryFormDataQuery, 
  useProductDetailsQuery,
  useUpdateInventoryItemMutation,
  useUpdateProductStatusMutation,
  queryKeys
} from './use-inventory-query'
import { uploadProductImages, deleteProductImage } from '../services/inventory.service'
import { 
  extractNames,
  extractIds,
  transformLeadTimes,
  isDuplicateCategory
} from '../utils/form-data-transformers'
import {
  CATEGORY_NAME_ERROR,
  CATEGORY_NAME_REGEX,
} from '../components/edit-item/sections/constants'
import { editInventoryFormSchema, type EditInventoryFormValues } from '../components/edit-item/schemas/edit-inventory-form.schema'
import type {
  InventoryFormData,
  InventoryItemFormData,
  LeadTimeEntry,
} from '../types/inventory.types'

const toNumber = (value: number | string): number =>
  typeof value === 'string' ? parseFloat(value) || 0 : value

export const useEditInventoryAdmin = ({ 
  onClose, 
  selectedProductId 
}: { 
  onClose: () => void
  selectedProductId: number 
}) => {
  // Use TanStack Query for form data and product details
  const { 
    data: inventoryData, 
    isLoading: isLoadingData, 
    error: dataError 
  } = useInventoryFormDataQuery()
  
  const { 
    data: productDetailsResponse, 
    isLoading: isLoadingProduct,
    error: productError 
  } = useProductDetailsQuery(selectedProductId, selectedProductId !== null)
  
  const updateInventoryMutation = useUpdateInventoryItemMutation()
  const updateProductStatusMutation = useUpdateProductStatusMutation()
  const queryClient = useQueryClient()
  
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [Sub_categoryOpen, setSub_categoryOpen] = useState(false)
  const [taxesOpen, setTaxesOpen] = useState(false)
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryNameError, setCategoryNameError] = useState('')
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false)
  const [newSubCategoryName, setNewSubCategoryName] = useState('')
  const [subCategoryNameError, setSubCategoryNameError] = useState('')
  
  const [isAssemblyDocDialogOpen, setIsAssemblyDocDialogOpen] = useState(false)
  const [isProductSpecOpen, setIsProductSpecOpen] = useState(true)
  
  // State for tab navigation
  const [activeSection, setActiveSection] = useState<string>('product-information')
  
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  // isSubmitting is now managed by react-hook-form
  
  // State for Generate Description modal
  const [isGenerateDescriptionModalOpen, setIsGenerateDescriptionModalOpen] = useState(false)
  
  // Approve/Reject modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [rejectDescription, setRejectDescription] = useState('')
  const [rejectionNotes, setRejectionNotes] = useState<string>('')

  // Initialize react-hook-form with Zod validation
  const defaultValues: Partial<EditInventoryFormValues> = {
    name: "",
    hsn_code: "",
    product_type: "",
    item_status: "",
    lead_time: 0,
    lead_time_unit: "days",
    quantity_range: "",
    lead_time_value: 0,
    manufacture_lead_times: [],
    category: "",
    Sub_category: "",
    unit: undefined,
    sku_item_code: "",
    collections: [],
    cad_3d_files: "0",
    description: "",
    product_material: [],
    finish: [],
    package_weight: 0,
    package_weight_unit: "kg",
    operation_status: "",
    product_dimension_length: 0,
    product_dimension_width: 0,
    product_dimension_height: 0,
    product_dimension_height_unit: "cm",
    product_dimension_weight: 0,
    product_dimension_weight_unit: "kg",
    assembly_requirement: undefined,
    usage_type: [],
    quantity: 0,
    mrp: 0,
    taxes: [],
    discount_type: "percentage",
    discount_value: 0,
    price_after_discount: 0,
    low_stock_value: 0,
    low_stock_alert: true,
    package_length: 0,
    package_width: 0,
    package_height: 0,
    package_height_unit: "mm",
    package_type: [],
    box_type: "",
    handling_instructions: "",
    courier_feasibility: "standard",
    fragility_indicator: true,  
    options: [],
    variants: [],
    assembly_requirement_document: "",
    images: []
  }

  const form = useForm<EditInventoryFormValues>({
    resolver: zodResolver(editInventoryFormSchema),
    defaultValues: defaultValues as EditInventoryFormValues,
    mode: 'onSubmit', // Only validate on form submit
    reValidateMode: 'onChange', // After first submit, re-validate on every change
  })

  const { 
    handleSubmit: formHandleSubmit, 
    watch, 
    setValue, 
    getValues,
    reset,
    formState: { errors: formErrors, isSubmitting: formIsSubmitting },
    control,
    trigger,
  } = form

  // Don't watch all form values - causes unnecessary re-renders
  // Individual components will watch only the fields they need

  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [apiImageUrls, setApiImageUrls] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Merge form errors with custom errors for backward compatibility
  const errors = useMemo(() => {
    const merged: Record<string, string> = {}
    // Add form validation errors
    Object.entries(formErrors).forEach(([key, error]) => {
      if (error?.message) {
        merged[key] = error.message
      }
    })
    return merged
  }, [formErrors])
  const [apiVariants, setApiVariants] = useState<any[]>([])
  const [supplierInfo, setSupplierInfo] = useState<{
    name: string
    phone: string
    id: string | number | null
  }>({
    name: '',
    phone: '',
    id: null,
  })
  
  // State to track field changes from API
  const [fieldChanges, setFieldChanges] = useState<Record<string, boolean>>({
    is_name_change: false,
    is_category_change: false,
    is_sub_category_change: false,
    is_product_type_change: false,
    is_description_change: false,
    is_qty_change: false,
    is_mrp_change: false,
    is_tax_change: false,
    is_variant_change: false,
    is_images_change: false,
    is_collection_change: false,
    is_status_change: false,
  })
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const formTopRef = useRef<HTMLDivElement>(null)

  // Memoize helper function to get highlighting styles for changed fields
  const getHighlightStyles = useCallback((fieldKey: string, baseClassName: string) => {
    const isChanged = fieldChanges[fieldKey]
    if (isChanged) {
      return `${baseClassName} bg-yellow-50 border-yellow-300 focus:border-yellow-400 focus:ring-yellow-200`
    }
    return baseClassName
  }, [fieldChanges])

  // Memoize formatting functions to avoid recreating on every render
  const formatCurrency = useCallback((value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '₹0'
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  }, [])

  const formatWeight = useCallback((value?: number | null, unit?: string) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-'
    const normalizedUnit = unit || ''
    return `${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${normalizedUnit}`.trim()
  }, [])

  // Memoize transformed product data to avoid recalculating on every render
  const transformedProductData = useMemo(() => {
    if (productDetailsResponse?.status_code !== 200 || !productDetailsResponse.record) {
      return null
    }
    const record = productDetailsResponse.record as any
    
    const leadTimes = transformLeadTimes(record.manufacture_lead_time || [])
    // Handle unit_id: convert to number, allow 0 as valid value, but use undefined if null/undefined
    const unitValue = record.unit_id != null ? Number(record.unit_id) : (record.unit != null ? Number(record.unit) : undefined)
    return {
        name: record.name || "",
        hsn_code: record.hsn_code || "",
        product_type: record.product_type || "",
        item_status: record.item_status ?? "",
        lead_time: 0,
        lead_time_unit: "days",
        quantity_range: "",
        lead_time_value: 0,
        manufacture_lead_times: leadTimes,
        category: record.category || "",
        Sub_category: record.sub_category || "",
        unit: unitValue,
        sku_item_code: record.sku_code || "",
        collections: extractNames(record.collections),
        cad_3d_files: record.cad_3d_files ? "1" : "0",
        description: record.description || "",
        product_material: extractNames(record.product_material),
        finish: extractNames(record.finish),
        operation_status: record.operation_status || "",
        package_weight: record.package_weight || 0,
        package_weight_unit: record.package_weight_unit || "kg",
        product_dimension_length: record.product_dimension_length || 0,
        product_dimension_width: record.product_dimension_width || 0,
        product_dimension_height: record.product_dimension_height || 0,
        product_dimension_height_unit: record.product_dimension_height_unit || "cm",
        product_dimension_weight: record.product_dimension_weight || 0,
        product_dimension_weight_unit: record.product_dimension_weight_unit || "kg",
        assembly_requirement: record.assembly_requirement === "1" || record.assembly_requirement === "yes" || record.assembly_requirement === true ? "yes" : "no",
        usage_type: extractNames(record.usage_type),
        quantity: record.quantity || 0,
        mrp: record.mrp || 0,
        taxes: extractIds(record.taxes),
        discount_type: record.discount_type || "percentage",
        discount_value: record.discount_value || 0,
        price_after_discount: record.price_after_discount || 0,
        low_stock_value: record.low_stock_value || 0,
        low_stock_alert: record.low_stock_alert === 1 || record.low_stock_alert === true,
        package_length: record.package_length || 0,
        package_width: record.package_width || 0,
        package_height: record.package_height || 0,
        package_height_unit: record.package_height_unit || "mm",
        package_type: extractNames(record.package_type),
        box_type: Array.isArray(record.box_type) && record.box_type.length > 0 
          ? (typeof record.box_type[0] === 'string' ? record.box_type[0] : record.box_type[0].id.toString())
          : (typeof record.box_type === 'string' ? record.box_type : ""),
        handling_instructions: record.handling_instructions || "",
        courier_feasibility: record.courier_feasibility || "standard",
        fragility_indicator: record.fragility_indicator === 1 || record.fragility_indicator === true,
        options: record.options || [],
        variants: record.variants || [],
        assembly_requirement_document: record.assembly_requirement_document || "",
        images: record.images || []
      }
  }, [productDetailsResponse])

  // Track if form data has been populated to prevent glitching
  const isFormDataPopulated = useMemo(() => {
    return !!transformedProductData
  }, [transformedProductData])

  // Populate form when product details are loaded
  // This is the ONLY correct place to hydrate the form with API data
  useEffect(() => {
    const record = productDetailsResponse?.record as any
    if (!record || !transformedProductData) {
      return
    }
    
    // CRITICAL: Reset form with explicit unit mapping from unit_id
    // RHF does NOT react to data changes - YOU must call reset() when async data arrives
    // Handle unit_id: convert to number, allow 0 as valid value, but use undefined if null/undefined
    // Check both unit_id and unit fields from API
    let unitValue: number | undefined = undefined
    if (record.unit_id != null && record.unit_id !== '') {
      const parsed = Number(record.unit_id)
      if (!isNaN(parsed)) {
        unitValue = parsed
      }
    } else if (record.unit != null && record.unit !== '') {
      const parsed = Number(record.unit)
      if (!isNaN(parsed)) {
        unitValue = parsed
      }
    }
    
    // Ensure item_status is properly set - use the value from API or keep empty string
    const itemStatusValue = transformedProductData.item_status || ''
    
    reset({
      ...transformedProductData,
      unit: unitValue,
      item_status: itemStatusValue, // Explicitly set to ensure it's included
    } as EditInventoryFormValues)
    
    // Store timers for cleanup
    const timers: NodeJS.Timeout[] = []
    
    // Explicitly set item_status value after reset with a small delay
    // This ensures the Select component receives the value after it has rendered
    // Only set if we have a valid status value (archive or unarchive)
    if (itemStatusValue && (itemStatusValue === 'archive' || itemStatusValue === 'unarchive')) {
      // Use setTimeout to ensure the Select component has rendered before setting the value
      const itemStatusTimer = setTimeout(() => {
        setValue('item_status', itemStatusValue, { shouldValidate: false, shouldDirty: false })
      }, 50)
      timers.push(itemStatusTimer)
    }
    
    // Explicitly set unit value after reset to ensure it's applied correctly
    // Use setTimeout to ensure the Select component can match the value after uomList is available
    // This is important for Select components that need a valid value and matching options
    if (unitValue != null && !isNaN(unitValue)) {
      // Set immediately
      setValue('unit', unitValue, { shouldValidate: false, shouldDirty: false })
      // Also set with a small delay to ensure it's applied after Select component renders with uomList
      const unitTimer = setTimeout(() => {
        setValue('unit', unitValue!, { shouldValidate: false, shouldDirty: false })
      }, 150)
      timers.push(unitTimer)
    }
    
    if (record.images && Array.isArray(record.images)) {
      setApiImageUrls(record.images)
    }
    
    if (record.variants && Array.isArray(record.variants)) {
      setApiVariants(record.variants)
    }

    setSupplierInfo({
      name: record.vendor_name || '',
      phone: record.vendor_phone || '',
      id: typeof record.vendor_id === 'number' || typeof record.vendor_id === 'string'
        ? record.vendor_id
        : null,
    })
    
    // Extract rejection notes if item is rejected
    if (record.item_status === 'rejected' && record.rejection_notes) {
      setRejectionNotes(record.rejection_notes)
    } else {
      setRejectionNotes('')
    }
    
    setFieldChanges({
      is_name_change: record.is_name_change === 1 || record.is_name_change === true,
      is_category_change: record.is_category_change === 1 || record.is_category_change === true,
      is_sub_category_change: record.is_sub_category_change === 1 || record.is_sub_category_change === true,
      is_product_type_change: record.is_product_type_change === 1 || record.is_product_type_change === true,
      is_description_change: record.is_description_change === 1 || record.is_description_change === true,
      is_qty_change: record.is_qty_change === 1 || record.is_qty_change === true,
      is_mrp_change: record.is_mrp_change === 1 || record.is_mrp_change === true,
      is_tax_change: record.is_tax_change === 1 || record.is_tax_change === true,
      is_variant_change: record.is_variant_change === 1 || record.is_variant_change === true,
      is_images_change: record.is_images_change === 1 || record.is_images_change === true,
      is_collection_change: record.is_collection_change === 1 || record.is_collection_change === true,
      is_status_change: record.is_status_change === 1 || record.is_status_change === true,
    })
    
    // Cleanup all timers
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [productDetailsResponse, transformedProductData, reset, setValue])

  // Ensure unit value is set when both form data and uomList are available
  // This handles the case where form is reset before uomList is loaded
  useEffect(() => {
    const record = productDetailsResponse?.record as any
    if (!record || !inventoryData?.uomList || !Array.isArray(inventoryData.uomList)) {
      return
    }
    
    // Get the current unit value from form
    const currentUnit = getValues('unit')
    
    // Calculate the expected unit value from API
    let unitValue: number | undefined = undefined
    if (record.unit_id != null && record.unit_id !== '') {
      const parsed = Number(record.unit_id)
      if (!isNaN(parsed)) {
        unitValue = parsed
      }
    } else if (record.unit != null && record.unit !== '') {
      const parsed = Number(record.unit)
      if (!isNaN(parsed)) {
        unitValue = parsed
      }
    }
    
    // Only set if we have a valid unit value and it doesn't match current value
    // Also verify the unit exists in uomList
    if (unitValue != null && !isNaN(unitValue)) {
      const unitExists = inventoryData.uomList.some(uom => uom.id === unitValue)
      if (unitExists && currentUnit !== unitValue) {
        setValue('unit', unitValue, { shouldValidate: false, shouldDirty: false })
      }
    }
  }, [productDetailsResponse, inventoryData, getValues, setValue])

  // Trigger validation for required fields after form is populated
  useEffect(() => {
    if (isFormDataPopulated) {
      // Trigger validation for required fields to ensure error counts are accurate
      // Use setTimeout to ensure form state is updated
      const timer = setTimeout(() => {
        trigger(['name', 'category', 'mrp'])
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isFormDataPopulated, trigger])

  // ========== HANDLERS ==========
  
  const handleInputChange = (field: keyof EditInventoryFormValues, value: any) => {
    setValue(field as any, value, { shouldValidate: true, shouldDirty: true })
  }

  const handleNumberInputChange = (field: keyof EditInventoryFormValues, value: string) => {
    // Special validation for discount_value when discount_type is percentage
    const currentDiscountType = getValues('discount_type')
    if (field === 'discount_value' && currentDiscountType === 'percentage') {
      if (value === '') {
        setValue('discount_value', 0, { shouldValidate: true })
        return
      }
      const decimalRegex = /^\d*\.?\d*$/
      if (!decimalRegex.test(value)) return
      const num = parseFloat(value)
      if (isNaN(num) || num < 0 || num > 100) return
      setValue('discount_value', num, { shouldValidate: true })
      return
    }
    
    // Allow empty string
    if (value === '') {
      setValue(field as any, 0, { shouldValidate: true })
      return
    }
    
    // Validate decimal format
    const decimalRegex = /^\d*\.?\d*$/
    if (!decimalRegex.test(value)) return
    
    // Check range if it's a valid number
    const num = parseFloat(value)
    if (!isNaN(num) && (num < 0 || num > 10000000000)) return
    
    // Store the value - preserve trailing decimal point for better UX
    if (value.endsWith('.') || value.endsWith('.0')) {
      setValue(field as any, value as any, { shouldValidate: true })
    } else if (!isNaN(num)) {
      setValue(field as any, num, { shouldValidate: true })
    }
  }

  const handleArrayChange = (field: keyof EditInventoryFormValues, value: any[]) => {
    setValue(field as any, value, { shouldValidate: true })
  }

  const getQuantityRange = (range: string) => {
    switch (range) {
      case '1':
        return { start_qty: 1, end_qty: 1 }
      case '0-1':
        return { start_qty: 0, end_qty: 1 }
      case '2-4':
        return { start_qty: 2, end_qty: 4 }
      case '2-5':
        return { start_qty: 2, end_qty: 5 }
      case '5-9':
        return { start_qty: 5, end_qty: 9 }
      case '6-9':
        return { start_qty: 6, end_qty: 9 }
      case '10+':
        return { start_qty: 10, end_qty: 100 }
      default:
        return { start_qty: 1, end_qty: 1 }
    }
  }

  const handleAddLeadTime = () => {
    const currentData = getValues()
    if (!currentData.quantity_range || !currentData.lead_time_value || currentData.lead_time_value === 0) {
      return
    }

    const { start_qty, end_qty } = getQuantityRange(currentData.quantity_range)

    const newLeadTime = {
      quantity_range: currentData.quantity_range,
      lead_time_value: typeof currentData.lead_time_value === 'string' ? parseFloat(currentData.lead_time_value) : currentData.lead_time_value || 0,
      lead_time_unit: (currentData.lead_time_unit || 'days') as 'days' | 'weeks' | 'months',
      start_qty,
      end_qty
    }

    const currentLeadTimes = currentData.manufacture_lead_times || []
    setValue('manufacture_lead_times', [...currentLeadTimes, newLeadTime] as any, { shouldValidate: true })
    setValue('quantity_range', '', { shouldValidate: true })
    setValue('lead_time_value', 0, { shouldValidate: true })
  }

  const handleRemoveLeadTime = (index: number) => {
    const currentData = getValues()
    const currentLeadTimes = currentData.manufacture_lead_times || []
    setValue('manufacture_lead_times', currentLeadTimes.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handleUpdateLeadTime = (index: number, lead_time_value: number, lead_time_unit: string) => {
    const currentData = getValues()
    const currentLeadTimes = currentData.manufacture_lead_times || []
    setValue('manufacture_lead_times', currentLeadTimes.map((item, i) => 
      i === index 
        ? { ...item, lead_time_value, lead_time_unit: lead_time_unit as 'days' | 'weeks' | 'months' }
        : item
    ) as any, { shouldValidate: true })
  }

  const handleApplyTemplate = (leadTimes: LeadTimeEntry[]) => {
    setValue('manufacture_lead_times', leadTimes.map(lt => ({
      ...lt,
      lead_time_unit: lt.lead_time_unit as 'days' | 'weeks' | 'months'
    })) as any, { shouldValidate: true })
  }

  const validateCategoryName = (name: string): string => {
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      return ''
    }
    
    // Check for special characters
    if (!CATEGORY_NAME_REGEX.test(trimmedName)) {
      return CATEGORY_NAME_ERROR
    }
    
    if (!inventoryData) {
      return ''
    }
    
    // Check for case-insensitive duplicates
    const normalizedInput = trimmedName.toLowerCase()
    const isDuplicate = inventoryData.categories?.some(
      cat => cat.name.toLowerCase() === normalizedInput
    )
    
    if (isDuplicate) {
      return 'Category already exists (case-insensitive)'
    }
    
    return ''
  }

  const addCategory = () => {
    const trimmedName = newCategoryName.trim()
    
    if (!trimmedName) return
    
    const error = validateCategoryName(newCategoryName)
    if (error) {
      setCategoryNameError(error)
      toast.error(error)
      return
    }
    
    setCategoryNameError('')
    
    const newCategory = {
      id: Date.now(),
      name: trimmedName
    }
    // Update cache optimistically
    queryClient.setQueryData(queryKeys.inventory.formData(), (prev: any) => {
      if (!prev) return prev
      return {
        ...prev,
        categories: [...(prev.categories || []), newCategory]
      }
    })
    setNewCategoryName('')
    setIsCategoryModalOpen(false)
    toast.success('Category added successfully')
  }

  const deleteCategory = (categoryId: number) => {
    if (inventoryData) {
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.inventory.formData(), (prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          categories: prev.categories?.filter((cat: any) => cat.id !== categoryId) || []
        }
      })
      const currentCategory = getValues('category')
      if (currentCategory === inventoryData.categories.find(cat => cat.id === categoryId)?.name) {
        handleInputChange('category', '')
      }
    }
  }

  const validateSubCategoryName = (name: string): string => {
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      return ''
    }
    
    // Check for special characters
    if (!CATEGORY_NAME_REGEX.test(trimmedName)) {
      return CATEGORY_NAME_ERROR
    }
    
    if (!inventoryData) {
      return ''
    }
    
    // Check for case-insensitive duplicates
    const normalizedInput = trimmedName.toLowerCase()
    const isDuplicate = inventoryData.ecomCategories?.some(
      cat => cat.name.toLowerCase() === normalizedInput
    )
    
    if (isDuplicate) {
      return 'Sub-category already exists (case-insensitive)'
    }
    
    return ''
  }

  const addSubCategory = () => {
    const trimmedName = newSubCategoryName.trim()
    
    if (!trimmedName) return
    
    const error = validateSubCategoryName(newSubCategoryName)
    if (error) {
      setSubCategoryNameError(error)
      toast.error(error)
      return
    }
    
    setSubCategoryNameError('')
    
    const newSubCategory = {
      id: Date.now(),
      name: trimmedName
    }
    // Update cache optimistically
    queryClient.setQueryData(queryKeys.inventory.formData(), (prev: any) => {
      if (!prev) return prev
      return {
        ...prev,
        ecomCategories: [...(prev.ecomCategories || []), newSubCategory]
      }
    })
    setNewSubCategoryName('')
    setIsSubCategoryModalOpen(false)
    toast.success('Sub-category added successfully')
  }

  const deleteSubCategory = (categoryId: number) => {
    if (inventoryData) {
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.inventory.formData(), (prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          ecomCategories: prev.ecomCategories?.filter((cat: any) => cat.id !== categoryId) || []
        }
      })
      const categoryToDelete = inventoryData.ecomCategories.find(cat => cat.id === categoryId)
      const currentSubCategory = getValues('Sub_category')
      if (categoryToDelete && currentSubCategory === categoryToDelete.name) {
        handleInputChange('Sub_category', '')
      }
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileArray = Array.from(files)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const invalidFiles: string[] = []
      
      const validFiles = fileArray.filter(file => {
        const fileType = file.type.toLowerCase()
        if (!fileType.startsWith('image/')) {
          invalidFiles.push(`${file.name} is not an image`)
          return false
        }
        if (!allowedTypes.includes(fileType)) {
          invalidFiles.push(`${file.name} is not a supported format. Please use JPG, PNG, or WEBP.`)
          return false
        }
        if (file.size > 20 * 1024 * 1024) {
          invalidFiles.push(`${file.name} is too large (max 20MB)`)
          return false
        }
        return true
      })

      // Show toast errors for invalid files
      if (invalidFiles.length > 0) {
        invalidFiles.forEach(error => toast.error(error))
      }

      if (validFiles.length === 0) return

      setUploadError(null)
      setSelectedImages(prev => [...prev, ...validFiles])
      
      // Clear images validation error if it exists
      if (formErrors.images) {
        form.clearErrors('images')
      }
      
      // Upload images immediately and get URLs
      setIsUploadingImages(true)
      try {
        const uploadedUrls = await uploadProductImages(validFiles)
        setApiImageUrls(prev => [...prev, ...uploadedUrls])
        // Clear local files since they're now in apiImageUrls
        setSelectedImages(prev => prev.filter(f => !validFiles.includes(f)))
        toast.success(`${validFiles.length} image(s) uploaded successfully`)
      } catch (error) {
        setUploadError('Failed to upload images. Please try again.')
        toast.error('Failed to upload images')
        // Remove the files that failed to upload
        setSelectedImages(prev => prev.filter(f => !validFiles.includes(f)))
      } finally {
        setIsUploadingImages(false)
      }
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        setUploadError(`File ${file.name} is not a supported document type`)
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File ${file.name} is too large (max 10MB)`)
        return
      }

      setUploadError(null)
      setSelectedDocument(file)
      
      // Clear assembly document validation error if it exists
      if (formErrors.assembly_requirement_document) {
        form.clearErrors('assembly_requirement_document')
      }
      
      try {
        const base64Document = await convertFileToBase64(file)
        setValue('assembly_requirement_document', base64Document, { shouldValidate: true })
        form.clearErrors('assembly_requirement_document')
      } catch (error) {
        setUploadError('Error processing document')
      }
    }
  }

  const removeImage = async (index: number, isApiImage: boolean = false) => {
    if (isApiImage) {
      // Removing an existing API image - use optimistic update
      const imageUrlToDelete = apiImageUrls[index]
      if (!imageUrlToDelete) return
      
      // Optimistically remove from UI
      const previousUrls = [...apiImageUrls]
      setApiImageUrls(prev => prev.filter((_, i) => i !== index))
      
      // Check if we need to clear validation error (calculate based on new state)
      const remainingImages = previousUrls.length - 1 + selectedImages.length
      if (remainingImages > 0 && formErrors.images) {
        form.clearErrors('images')
      }
      
      // Call delete API in background
      try {
        await deleteProductImage(imageUrlToDelete)
        // Success - image already removed optimistically
      } catch (error) {
        // Revert on error
        setApiImageUrls(previousUrls)
        toast.error('Failed to delete image. Please try again.')
      }
    } else {
      // Removing a newly selected image (not yet uploaded to server)
      const apiImageCount = apiImageUrls.length
      const localIndex = index - apiImageCount
      const previousSelectedImages = [...selectedImages]
      setSelectedImages(prev => prev.filter((_, i) => i !== localIndex))
      
      // Check if we need to clear validation error (calculate based on new state)
      const remainingImages = apiImageUrls.length + previousSelectedImages.length - 1
      if (remainingImages > 0 && formErrors.images) {
        form.clearErrors('images')
      }
    }
  }

  const removeDocument = () => {
    setSelectedDocument(null)
    setValue('assembly_requirement_document', '', { shouldValidate: true })
    setValue('assembly_requirement', 'no', { shouldValidate: true })
  }

  const handleAssemblyRequirementChange = (value: string) => {
    if (value === 'yes') {
      setIsAssemblyDocDialogOpen(true)
    } else if (value === 'no') {
      removeDocument()
    }
  }

  const handleAssemblyDialogClose = (open: boolean) => {
    setIsAssemblyDocDialogOpen(open)
    const currentAssemblyDoc = getValues('assembly_requirement_document')
    if (!open && !selectedDocument && !currentAssemblyDoc) {
      handleInputChange('assembly_requirement', 'no')
    }
  }

  const handleAssemblyDone = () => {
    if (selectedDocument) {
      handleInputChange('assembly_requirement', 'yes')
    }
    setIsAssemblyDocDialogOpen(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      const fileArray = imageFiles
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const invalidFiles: string[] = []
      
      const validFiles = fileArray.filter(file => {
        const fileType = file.type.toLowerCase()
        if (!allowedTypes.includes(fileType)) {
          invalidFiles.push(`${file.name} is not a supported format. Please use JPG, PNG, or WEBP.`)
          return false
        }
        if (file.size > 20 * 1024 * 1024) {
          invalidFiles.push(`${file.name} is too large (max 20MB)`)
          return false
        }
        return true
      })

      // Show toast errors for invalid files
      if (invalidFiles.length > 0) {
        invalidFiles.forEach(error => toast.error(error))
      }

      if (validFiles.length === 0) return

      setUploadError(null)
      setSelectedImages(prev => [...prev, ...validFiles])
      
      // Clear images validation error if it exists
      if (formErrors.images) {
        form.clearErrors('images')
      }
      
      // Upload images immediately and get URLs
      setIsUploadingImages(true)
      try {
        const uploadedUrls = await uploadProductImages(validFiles)
        setApiImageUrls(prev => [...prev, ...uploadedUrls])
        // Clear local files since they're now in apiImageUrls
        setSelectedImages(prev => prev.filter(f => !validFiles.includes(f)))
        toast.success(`${validFiles.length} image(s) uploaded successfully`)
      } catch (error) {
        setUploadError('Failed to upload images. Please try again.')
        toast.error('Failed to upload images')
        // Remove the files that failed to upload
        setSelectedImages(prev => prev.filter(f => !validFiles.includes(f)))
      } finally {
        setIsUploadingImages(false)
      }
    }
  }

  const handleImageClick = () => {
    imageInputRef.current?.click()
  }

  const handleDocumentClick = () => {
    documentInputRef.current?.click()
  }

  // Helper function to ensure box_type is always the ID (as string)
  const getBoxTypeId = useCallback((boxTypeValue: any): string => {
    if (!boxTypeValue) return ''
    
    // Handle array case
    if (Array.isArray(boxTypeValue)) {
      if (boxTypeValue.length === 0) return ''
      boxTypeValue = boxTypeValue[0]
    }
    
    // Convert to string
    const stringValue = typeof boxTypeValue === 'string' ? boxTypeValue : String(boxTypeValue)
    if (!stringValue) return ''
    
    // Check if it's already a numeric string (ID)
    if (/^\d+$/.test(stringValue.trim())) {
      return stringValue.trim()
    }
    
    // If it's not numeric, it might be a name - find the ID from boxTypes
    if (inventoryData?.boxTypes) {
      const boxType = inventoryData.boxTypes.find(
        (bt: any) => bt.name?.toLowerCase() === stringValue.toLowerCase() || 
                     bt.box_type?.toLowerCase() === stringValue.toLowerCase()
      )
      if (boxType?.id) {
        return String(boxType.id)
      }
    }
    
    // If we can't find it, return empty string (or could return the original value, but ID is required)
    return ''
  }, [inventoryData])

  const handleSubmit = async (data: EditInventoryFormValues) => {
    // Additional custom validations
    const leadTimeValidation = validateLeadTimes(data.manufacture_lead_times || [], false, { allowEmpty: true })
    if (!leadTimeValidation.isValid) {
      form.setError('manufacture_lead_times', {
        type: 'manual',
        message: leadTimeValidation.error || 'Lead time validation failed'
      })
      if (leadTimeValidation.error) {
        toast.error(leadTimeValidation.error)
      }
      formTopRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      return
    }
    
    try {
      // Use already uploaded image URLs (uploaded immediately when selected)
      const allImageUrls = apiImageUrls
      
      // Process variants - upload any base64 images that haven't been uploaded yet
      const processedVariants = await Promise.all(
        (data.variants || []).map(async (variant) => {
          let variantImageUrls: string[] = []
          
          if (variant.images && variant.images.length > 0) {
            // Check if images are base64 strings or URLs
            const base64Images = variant.images.filter((img: string) => 
              img && !img.startsWith('http')
            )
            const existingUrls = variant.images.filter((img: string) => 
              img && img.startsWith('http')
            )
            
            // Convert base64 to File objects and upload
            if (base64Images.length > 0) {
              try {
                const filesToUpload = await Promise.all(
                  base64Images.map(async (base64: string, index: number) => {
                    const response = await fetch(`data:image/jpeg;base64,${base64}`)
                    const blob = await response.blob()
                    return new File([blob], `variant_image_${index}.jpg`, { type: 'image/jpeg' })
                  })
                )
                const uploadedUrls = await uploadProductImages(filesToUpload)
                variantImageUrls = [...existingUrls, ...uploadedUrls]
              } catch (error) {
                console.error('Failed to upload variant images:', error)
                variantImageUrls = existingUrls
              }
            } else {
              variantImageUrls = existingUrls
            }
          }
          
          return {
            ...variant,
            images: variantImageUrls
          }
        })
      )

      const submitData = {
        name: data.name,
        hsn_code: data.hsn_code || '',
        product_type: data.product_type || '',
        item_status: data.item_status,
        category: data.category,
        sub_category: data.Sub_category || '',
        collections: data.collections || [],
        cad_3d_files: data.cad_3d_files,
        unit: data.unit || 1,
        sku_code: data.sku_item_code || '',
        description: data.description || '',
        product_material: data.product_material || [],
        package_weight: toNumber(data.package_weight || 0),
        package_weight_unit: data.package_weight_unit || 'kg',
        finish: data.finish || [],
        product_dimension_length: toNumber(data.product_dimension_length || 0),
        product_dimension_width: toNumber(data.product_dimension_width || 0),
        product_dimension_height: toNumber(data.product_dimension_height || 0),
        product_dimension_height_unit: data.product_dimension_height_unit,
        product_dimension_weight: toNumber(data.product_dimension_weight || 0),
        product_dimension_weight_unit: data.product_dimension_weight_unit,
        usage_type: data.usage_type || [],
        quantity: toNumber(data.quantity || 0),
        mrp: toNumber(data.mrp),
        taxes: data.taxes || [],
        discount_type: data.discount_type,
        discount_value: toNumber(data.discount_value || 0),
        price_after_discount: toNumber(data.price_after_discount || 0),
        low_stock_value: toNumber(data.low_stock_value || 0),
        low_stock_alert: data.low_stock_alert ? 1 : 0,
        package_length: toNumber(data.package_length || 0),
        package_width: toNumber(data.package_width || 0),
        package_height: toNumber(data.package_height || 0),
        package_height_unit: data.package_height_unit || 'mm',
        package_type: data.package_type || [],
        box_type: getBoxTypeId(data.box_type),
        handling_instructions: data.handling_instructions || '',
        courier_feasibility: data.courier_feasibility || 'standard',
        fragility_indicator: data.fragility_indicator ? 1 : 0,
        assembly_requirement: data.assembly_requirement === 'yes' ? "1" : "0",
        assembly_requirement_document: data.assembly_requirement_document || '',
        manufacture_lead_time: (data.manufacture_lead_times || []).map(entry => ({
          start_qty: entry.start_qty,
          end_qty: entry.end_qty,
          lead_time: entry.lead_time_value,
          lead_time_unit: entry.lead_time_unit
        })),
        options: (data.options || []).map(option => ({
          name: option.name,
          values: option.values
        })),
        variants: processedVariants,
        images: allImageUrls
      }
      
      const response = await updateInventoryMutation.mutateAsync({
        productId: selectedProductId,
        data: submitData
      })
      
      if (response.status_code === 200) {
        toast.success('Product updated successfully!')
        onClose()
      } else {
        setErrorMessage(response.message || 'An error occurred while updating the product')
        setIsErrorModalOpen(true)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setErrorMessage(errorMsg)
      setIsErrorModalOpen(true)
    }
  }

  // Wrapper for form submission that uses react-hook-form's handleSubmit
  const onSubmit = formHandleSubmit(
    // Success callback - called when validation passes
    async (data: EditInventoryFormValues) => {
      await handleSubmit(data)
    },
    // Error callback - called when validation fails
    (errors) => {
      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0]
        if (firstErrorField) {
          const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          } else {
            formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } else {
          formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 0)
    }
  )

  const handleRetry = () => {
    setIsErrorModalOpen(false)
    setErrorMessage('')
    onSubmit()
  }

  // Function to count required field errors for each tab section
  // Only required fields: name, category (Product Information), mrp (Pricing & Inventory)
  const getErrorCount = useCallback((section: string): number => {
    const requiredFields: Record<string, string[]> = {
      'product-information': ['name', 'category'], // Only required fields
      'product-specification': [], // No required fields
      'pricing-inventory': ['mrp'], // Only required field
      'logistics-handling': [], // No required fields
      'product-options-variants': [], // No required fields
      'images-documents': [] // No required fields
    }
    
    const fields = requiredFields[section] || []
    // Check formErrors directly from react-hook-form for accurate error detection
    return fields.filter(field => {
      const fieldError = formErrors[field as keyof typeof formErrors]
      // Check if error exists and has a message
      return !!(fieldError?.message)
    }).length
  }, [formErrors])

  const handleShopifyStatus = async (productId: number, status: string, rejectReason: string) => {
    try {
      const response = await updateProductStatusMutation.mutateAsync({
        productId,
        status,
        rejectReason
      })
      if (response.status_code === 200) {
        toast.success('Product Status updated successfully!')
        onClose()
      } else {
        setIsErrorModalOpen(true)
        setErrorMessage(response.message || 'An error occurred while updating the product')
      }
    } catch (error) {
      setIsErrorModalOpen(true)
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while updating the product')
    }
  }

  const handleApproveClick = () => {
    setIsApproveModalOpen(true)
  }

  const handleRejectClick = () => {
    setIsRejectModalOpen(true)
  }

  const handleConfirmApprove = async () => {
    try {
      setIsUpdatingStatus(true)
      await handleShopifyStatus(selectedProductId, 'approved', '')
      setIsApproveModalOpen(false)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleConfirmReject = async () => {
    // Build final rejection reason from dropdown or description
    const trimmedDesc = rejectDescription.trim()
    const trimmedReason = rejectReason.trim()
    if (!trimmedReason && !trimmedDesc) {
      // Require at least one source of reason
      toast.error('Please select a reason or enter a description')
      return
    }
    const finalReason = [trimmedReason, trimmedDesc].filter(Boolean).join(' - ')

    try {
      setIsUpdatingStatus(true)
      await handleShopifyStatus(selectedProductId, 'rejected', finalReason)
      setIsRejectModalOpen(false)
      setRejectReason('')
      setRejectDescription('')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleCancelApprove = () => {
    setIsApproveModalOpen(false)
  }

  const handleCancelReject = () => {
    setIsRejectModalOpen(false)
    setRejectReason('')
    setRejectDescription('')
  }

  // Memoize expensive calculations
  const subTitle = useMemo(() => {
    if (transformedProductData) {
      return transformedProductData.item_status === "draft" ? "Pending Items for Approval" : "Edit Items"
    }
    return "Edit Items"
  }, [transformedProductData])
  
  const primaryImageUrl = useMemo(() => apiImageUrls?.[0] || '', [apiImageUrls])
  
  const variantCount = useMemo(() => {
    const variants = getValues('variants')
    return Array.isArray(variants) ? variants.length : 0
  }, [getValues])
  
  const totalStockQuantity = useMemo(() => {
    const variants = getValues('variants')
    const quantity = getValues('quantity')
    if (Array.isArray(variants) && variants.length > 0) {
      return variants.reduce((sum, variant) => {
        const stockValue = Number((variant as any)?.stock ?? variant.stock_quantity ?? 0)
        return sum + (Number.isNaN(stockValue) ? 0 : stockValue)
      }, 0)
    }
    return quantity ?? 0
  }, [getValues])

  // ========== RETURN ==========
  return {
    state: {
      inventoryData: inventoryData || null,
      isLoadingData,
      isLoadingProduct,
      dataError: dataError instanceof Error ? dataError.message : (dataError ? String(dataError) : null),
      productError: productError instanceof Error ? productError.message : (productError ? String(productError) : null),
      productDetailsResponse,
      categoryOpen,
      Sub_categoryOpen,
      taxesOpen,
      isCategoryModalOpen,
      newCategoryName,
      categoryNameError,
      isSubCategoryModalOpen,
      newSubCategoryName,
      subCategoryNameError,
      isAssemblyDocDialogOpen,
      isProductSpecOpen,
      activeSection,
      isErrorModalOpen,
      errorMessage,
      isSubmitting: formIsSubmitting,
      isGenerateDescriptionModalOpen,
      isApproveModalOpen,
      isRejectModalOpen,
      rejectReason,
      isUpdatingStatus,
      rejectDescription,
      rejectionNotes,
      formData: getValues() as InventoryItemFormData,
      selectedImages,
      apiImageUrls,
      isUploadingImages,
      selectedDocument,
      isDragOver,
      uploadError,
      errors,
      apiVariants,
      supplierInfo,
      fieldChanges,
      isFormDataPopulated,
      subTitle,
      primaryImageUrl,
      variantCount,
      totalStockQuantity,
    },
    refs: {
      imageInputRef,
      documentInputRef,
      formTopRef,
    },
    setters: {
      setCategoryOpen,
      setSub_categoryOpen,
      setTaxesOpen,
      setIsCategoryModalOpen,
      setIsAssemblyDocDialogOpen,
      setIsProductSpecOpen,
      setNewCategoryName,
      setIsSubCategoryModalOpen,
      setNewSubCategoryName,
      setActiveSection,
      setIsErrorModalOpen,
      setIsGenerateDescriptionModalOpen,
      setUploadError,
      setErrors: () => {}, // Deprecated - use form.setError instead
      setSelectedImages,
      setApiImageUrls,
      setSelectedDocument,
      setIsDragOver,
      setApiVariants,
      setSupplierInfo,
      setFieldChanges,
      setIsApproveModalOpen,
      setIsRejectModalOpen,
      setRejectReason,
      setIsUpdatingStatus,
      setRejectDescription,
    },
    handlers: {
      handleInputChange,
      handleNumberInputChange,
      handleArrayChange,
      handleAddLeadTime,
      handleRemoveLeadTime,
      handleUpdateLeadTime,
      handleApplyTemplate,
      validateCategoryName,
      validateSubCategoryName,
      addCategory,
      deleteCategory,
      addSubCategory,
      deleteSubCategory,
      handleImageUpload,
      handleDocumentUpload,
      removeImage,
      removeDocument,
      handleAssemblyRequirementChange,
      handleAssemblyDialogClose,
      handleAssemblyDone,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleImageClick,
      handleDocumentClick,
      handleSubmit: onSubmit,
      handleRetry,
      getErrorCount,
      handleShopifyStatus,
      handleApproveClick,
      handleRejectClick,
      handleConfirmApprove,
      handleConfirmReject,
      handleCancelApprove,
      handleCancelReject,
      getHighlightStyles,
      formatCurrency,
      formatWeight,
    },
    form: {
      ...form,
      control, // Export control separately for easier access
    },
    // Utility to get current form values without causing re-renders
    getFormValues: getValues,
  }
}

export type UseEditInventoryAdminReturn = ReturnType<typeof useEditInventoryAdmin>

