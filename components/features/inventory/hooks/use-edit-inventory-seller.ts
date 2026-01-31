"use client"

import type React from 'react'
import { useRef, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { validateLeadTimes } from '../components/lead-time/utils'
import { 
  useInventoryFormDataQuery, 
  useProductDetailsQuery,
  useUpdateInventoryItemMutation,
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

export const useEditInventorySeller = ({ 
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isWeightExceeded, setIsWeightExceeded] = useState(false)
  const [isGenerateDescriptionModalOpen, setIsGenerateDescriptionModalOpen] = useState(false)
  const [hasFormBeenReset, setHasFormBeenReset] = useState(false)
  const prevProductIdRef = useRef<number | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState<string>('')

  // Initialize react-hook-form with Zod validation
  const defaultValues: Partial<EditInventoryFormValues> = {
    name: "",
    hsn_code: "",
    product_type: "",
    item_status: "draft",
    lead_time: 0,
    lead_time_unit: "days",
    quantity_range: "",
    lead_time_value: 0,
    manufacture_lead_times: [],
    category: "",
    Sub_category: "",
    unit: 1, // Default to 1 (Units)
    sku_item_code: "",
    collections: [],
    cad_3d_files: "0",
    description: "",
    product_material: [],
    finish: [],
    package_weight: 0,
    package_weight_unit: "kg",
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
    images: [],
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
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const formTopRef = useRef<HTMLDivElement>(null)

  // Memoize transformed product data
  const transformedProductData = useMemo(() => {
    if (productDetailsResponse?.status_code !== 200 || !productDetailsResponse.record) {
      return null
    }
    const record = productDetailsResponse.record as any
    
    const leadTimes = transformLeadTimes(record.manufacture_lead_time || [])

    return {
      name: record.name || "",
      hsn_code: record.hsn_code || "",
      product_type: record.product_type || "",
      // Keep API status values as-is (archive, unarchive, draft, or empty string)
      item_status: (record.item_status === "archive" || record.item_status === "unarchive" || record.item_status === "draft" || record.item_status === "")
        ? record.item_status
        : "draft",
      shopify_status: record.shopify_status || "draft",
      operation_status: record.operation_status || "pending",
      lead_time: 0,
      lead_time_unit: "days",
      quantity_range: "",
      lead_time_value: 0,
      manufacture_lead_times: leadTimes,
      category: record.category || "",
      Sub_category: record.sub_category || "",
      unit: Number(record.unit_id) || Number(record.unit) || 1, // Default to 1 (Units) if not set
      sku_item_code: record.sku_code || "",
      collections: extractNames(record.collections),
      cad_3d_files: record.cad_3d_files ? "1" : "0",
      description: record.description || "",
      product_material: extractNames(record.product_material),
      finish: extractNames(record.finish),
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
      // Normalize variants: filter out invalid ones and ensure proper types
      variants: (record.variants || [])
        .filter((variant: any) => variant.title && typeof variant.title === 'string' && variant.title.trim().length > 0)
        .map((variant: any) => ({
          ...variant,
          variant_shopify_weight: typeof variant.variant_shopify_weight === 'number' 
            ? String(variant.variant_shopify_weight) 
            : (variant.variant_shopify_weight || '0'),
          // Ensure all required fields are present
          title: variant.title || '',
          extra_charges: variant.extra_charges || 0,
          stock_quantity: variant.stock_quantity || 0,
          images: variant.images || []
        })),
      assembly_requirement_document: record.assembly_requirement_document || "",
      images: record.images || [],
      brand: record.brand || "",
      color: record.color || "",
      features: Array.isArray(record.features) ? record.features : (typeof record.features === 'string' && record.features ? [record.features] : []),
      additional_info: record.additional_info || ""
    }
  }, [productDetailsResponse])

  // Track if form data has been populated
  // Need both inventoryData (for dropdowns), transformedProductData (for form values), and form has been reset
  const isFormDataPopulated = useMemo(() => {
    return !!transformedProductData && !!inventoryData && hasFormBeenReset
  }, [transformedProductData, inventoryData, hasFormBeenReset])

  // Populate form when product details are loaded
  useEffect(() => {
    if (!transformedProductData || !productDetailsResponse?.record) {
      return
    }
    
    // Check if productId changed - if so, we need to reset the form
    const productIdChanged = prevProductIdRef.current !== null && prevProductIdRef.current !== selectedProductId
    if (productIdChanged) {
      setHasFormBeenReset(false)
    }
    prevProductIdRef.current = selectedProductId
    
    // Always reset form when transformedProductData changes OR when selectedProductId changes
    // This ensures form repopulates correctly whether data is fresh or cached
    reset(transformedProductData as EditInventoryFormValues, { keepDefaultValues: false })
    
    // Explicitly set unit value to ensure it's applied, defaulting to 1 (Units) if 0 or invalid
    const unitValue = transformedProductData.unit && transformedProductData.unit > 0 
      ? transformedProductData.unit 
      : 1
    setValue('unit', unitValue, { shouldValidate: false, shouldDirty: false })
    
    // Mark form as reset to trigger re-render
    setHasFormBeenReset(true)
    
    if (productDetailsResponse.record.images && Array.isArray(productDetailsResponse.record.images)) {
      setApiImageUrls(productDetailsResponse.record.images)
    }
    
    if (productDetailsResponse.record.variants && Array.isArray(productDetailsResponse.record.variants)) {
      setApiVariants(productDetailsResponse.record.variants)
    }
    
    // Extract rejection notes if item is rejected
    const record = productDetailsResponse.record as any
    if (record.item_status === 'rejected' && record.rejection_notes) {
      setRejectionNotes(record.rejection_notes)
    } else {
      setRejectionNotes('')
    }
  }, [transformedProductData, productDetailsResponse, reset, setValue, getValues, selectedProductId])

  // Initial validation for required fields after form is populated
  // This effect runs once after the form data is populated from API
  useEffect(() => {
    if (isFormDataPopulated) {
      // Use setTimeout to ensure form state is updated
      const timer = setTimeout(() => {
        trigger(['name', 'category', 'mrp'])
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isFormDataPopulated, trigger])

  // Memoize validation functions
  const validateCategoryName = useCallback((name: string): string => {
    const trimmedName = name.trim()
    if (!trimmedName) return ''
    if (!CATEGORY_NAME_REGEX.test(trimmedName)) return CATEGORY_NAME_ERROR
    if (!inventoryData) return ''
    return isDuplicateCategory(trimmedName, inventoryData.categories) 
      ? 'Category already exists (case-insensitive)' 
      : ''
  }, [inventoryData])

  const validateSubCategoryName = useCallback((name: string): string => {
    const trimmedName = name.trim()
    if (!trimmedName) return ''
    if (!CATEGORY_NAME_REGEX.test(trimmedName)) return CATEGORY_NAME_ERROR
    if (!inventoryData) return ''
    return isDuplicateCategory(trimmedName, inventoryData.ecomCategories) 
      ? 'Sub-category already exists (case-insensitive)' 
      : ''
  }, [inventoryData])

  // ========== HANDLERS ==========
  
  const handleInputChange = useCallback((field: keyof EditInventoryFormValues, value: any) => {
    setValue(field as any, value, { shouldValidate: true, shouldDirty: true })
  }, [setValue])

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
    if (!open && !selectedDocument && !getValues('assembly_requirement_document')) {
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
      setIsSubmitting(false)
      return
    }

    // Weight validation
    if (isWeightExceeded) {
      form.setError('package_weight', {
        type: 'manual',
        message: 'The volumetric weight exceeds the maximum capacity for the selected box type. Please reduce the weight or select a larger box type.'
      })
      formTopRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      setIsSubmitting(false)
      return
    }
    
    try {
      // Use already uploaded image URLs (uploaded immediately when selected)
      const allImageUrls = apiImageUrls
      
      // Process variants - upload any base64 images that haven't been uploaded yet
      const processedVariants = await Promise.all(
        (data.variants || [])
          .filter(variant => variant.title && variant.title.trim().length > 0)
          .map(async (variant) => {
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
              images: variantImageUrls,
              variant_shopify_weight: typeof variant.variant_shopify_weight === 'number' 
                ? String(variant.variant_shopify_weight) 
                : (variant.variant_shopify_weight || '0')
            }
          })
      )
      
      const submitData = {
        name: data.name,
        hsn_code: data.hsn_code || '',
        product_type: data.product_type || '',
        // Pass through item_status as-is (already in API format: archive, unarchive, draft, or empty string)
        item_status: data.item_status as "archive" | "unarchive" | "draft" | "",
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
        mrp: toNumber(data.mrp || 0),
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
    } finally {
      setIsSubmitting(false)
    }
  }

  // Wrapper for form submission that uses react-hook-form's handleSubmit
  const onSubmit = formHandleSubmit(
    // Success callback - called when validation passes
    async (data: EditInventoryFormValues) => {
      // Normalize types before submission to ensure schema compliance
      const normalizedData = {
        ...data,
        box_type: getBoxTypeId(data.box_type),
        features: Array.isArray(data.features) 
          ? data.features 
          : (typeof data.features === 'string' && data.features ? [data.features] : [])
      }
      
      setIsSubmitting(true)
      await handleSubmit(normalizedData as EditInventoryFormValues)
    },
    // Error callback - called when validation fails
    (errors) => {
      // Show specific error messages for certain fields
      if (errors.box_type) {
        toast.error(`Box Type Error: ${errors.box_type.message}`)
      }
      if (errors.features) {
        toast.error(`Features Error: ${errors.features.message}`)
      }
      if (errors.item_status) {
        toast.error(`Status Error: ${errors.item_status.message}`)
      }
      if (errors.variants) {
        toast.error('Please fix variant errors before submitting')
      }
      if (!errors.box_type && !errors.features && !errors.item_status && !errors.variants) {
        toast.error('Please fix the form errors before submitting')
      }
      
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

  // Internal function to perform the draft save
  const performDraftSave = async (data: EditInventoryFormValues) => {
    // Validate only the required fields for draft (name, category, mrp)
    if (!data.name?.trim() || !data.category?.trim() || !data.mrp || data.mrp === 0) {
      // Validation will be handled by react-hook-form
      return
    }

    try {
      // Use already uploaded image URLs (uploaded immediately when selected)
      const allImageUrls = apiImageUrls
      
      // Process variants - upload any base64 images that haven't been uploaded yet
      const processedVariants = await Promise.all(
        (data.variants || [])
          .filter(variant => variant.title && variant.title.trim().length > 0)
          .map(async (variant) => {
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
              images: variantImageUrls,
              variant_shopify_weight: typeof variant.variant_shopify_weight === 'number' 
                ? String(variant.variant_shopify_weight) 
                : (variant.variant_shopify_weight || '0')
            }
          })
      )
      
      const submitData = {
        name: data.name,
        hsn_code: data.hsn_code || '',
        product_type: data.product_type || '',
        item_status: 'draft', // Save as draft
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
        mrp: toNumber(data.mrp || 0),
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
        toast.success('Product saved as draft successfully!')
        onClose()
      } else {
        setErrorMessage(response.message || 'An error occurred while saving the product')
        setIsErrorModalOpen(true)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setErrorMessage(errorMsg)
      setIsErrorModalOpen(true)
    }
  }

  // Wrapper that uses formHandleSubmit to properly mark form as submitted
  // so that reValidateMode: 'onChange' activates after first validation
  const handleSaveAsDraft = formHandleSubmit(
    // Success callback - called when validation passes
    async (data: EditInventoryFormValues) => {
      await performDraftSave(data)
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

  // Memoize subTitle based on item status
  const subTitle = useMemo(() => {
    if (transformedProductData) {
      return transformedProductData.item_status === "draft" ? "Pending Items for Approval" : "Edit Items"
    }
    return "Edit Items"
  }, [transformedProductData])

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
      isWeightExceeded,
      isGenerateDescriptionModalOpen,
      selectedImages,
      apiImageUrls,
      isUploadingImages,
      selectedDocument,
      isDragOver,
      uploadError,
      errors,
      apiVariants,
      subTitle,
      isFormDataPopulated,
      rejectionNotes,
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
      setIsWeightExceeded,
      setErrors: () => {}, // Deprecated - use form.setError instead
      setSelectedImages,
      setApiImageUrls,
      setSelectedDocument,
      setIsDragOver,
      setApiVariants,
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
      handleSaveAsDraft,
      handleRetry,
      getErrorCount,
    },
    form: {
      ...form,
      control, // Export control separately for easier access
    },
    // Utility to get current form values without causing re-renders
    getFormValues: getValues,
  }
}

export type UseEditInventorySellerReturn = ReturnType<typeof useEditInventorySeller>

