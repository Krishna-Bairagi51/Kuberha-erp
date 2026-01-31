"use client"

import type React from 'react'
import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { validateLeadTimes } from '../components/lead-time/utils'
import { useInventoryFormDataQuery, useAddInventoryItemMutation, queryKeys } from './use-inventory-query'
import { uploadProductImages, deleteProductImage } from '../services/inventory.service'
import { isDuplicateCategory } from '../utils/form-data-transformers'
import {
  CATEGORY_NAME_ERROR,
  CATEGORY_NAME_REGEX,
} from '../components/add-item/sections/constants'
import { inventoryFormSchema, type InventoryFormValues } from '../components/add-item/schemas/inventory-form.schema'
import type {
  InventoryFormData,
  InventoryItemFormData,
  LeadTimeEntry,
} from '../types/inventory.types'

type InputValue<T> = T[keyof T]

const initialFormData: Partial<InventoryFormValues> = {
  name: '',
  hsn_code: '',
  product_type: '',
  item_status: 'draft',
  lead_time: 0,
  lead_time_unit: 'days',
  quantity_range: '',
  lead_time_value: 0,
  manufacture_lead_times: [],
  category: '',
  Sub_category: '',
  unit: 1,
  sku_item_code: '',
  collections: [],
  cad_3d_files: '0',
  description: '',
  product_material: [],
  finish: [],
  package_weight: 0,
  package_weight_unit: 'kg',
  product_dimension_length: 0,
  product_dimension_width: 0,
  product_dimension_height: 0,
  product_dimension_height_unit: 'cm',
  product_dimension_weight: 0,
  product_dimension_weight_unit: 'kg',
  assembly_requirement: undefined,
  usage_type: [],
  quantity: 0,
  mrp: 0,
  taxes: [],
  discount_type: 'percentage',
  discount_value: 0,
  price_after_discount: 0,
  low_stock_value: 0,
  low_stock_alert: true,
  package_length: 0,
  package_width: 0,
  package_height: 0,
  package_height_unit: 'mm',
  package_type: [],
  box_type: '',
  handling_instructions: '',
  courier_feasibility: 'standard',
  fragility_indicator: true,
  options: [],
  variants: [],
  assembly_requirement_document: '',
  images: [],
  operation_status: 'pending',
}

const toNumber = (value: number | string): number =>
  typeof value === 'string' ? parseFloat(value) || 0 : value

export const useAddInventory = ({ onClose }: { onClose: () => void }) => {
  // Use TanStack Query for form data - cached and shared across components
  const { 
    data: inventoryData, 
    isLoading: isLoadingData, 
    error: dataError 
  } = useInventoryFormDataQuery()
  
  const queryClient = useQueryClient()
  
  // Use TanStack Query mutation for adding inventory
  const addInventoryMutation = useAddInventoryItemMutation()

  // Initialize react-hook-form with Zod validation
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: initialFormData as InventoryFormValues,
    mode: 'onSubmit', // Only validate on form submit
    reValidateMode: 'onChange', // After first submit, re-validate on every change
  })

  const { 
    handleSubmit: formHandleSubmit, 
    watch, 
    setValue, 
    getValues,
    formState: { errors: formErrors, isSubmitting: formIsSubmitting },
    control,
    trigger,
  } = form

  // Don't watch form values - causes re-renders
  // Components access values through form context

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

  const [activeSection, setActiveSection] = useState<string>('product-information')

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isWeightExceeded, setIsWeightExceeded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isGenerateDescriptionModalOpen, setIsGenerateDescriptionModalOpen] =
    useState(false)

  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const formTopRef = useRef<HTMLDivElement>(null)

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

  // Helper function to update form values
  const handleInputChange = <K extends keyof InventoryFormValues>(
    field: K,
    value: InventoryFormValues[K] | undefined
  ) => {
    setValue(field, value as any, { shouldValidate: true, shouldDirty: true })
  }

  const handleNumberInputChange = (
    field: keyof InventoryFormValues,
    value: string
  ) => {
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

      setValue('discount_value', value.endsWith('.') || value.endsWith('.0') ? value : num, { 
        shouldValidate: true 
      })
      return
    }

    if (value === '') {
      setValue(field as any, 0, { shouldValidate: true })
      return
    }

    const decimalRegex = /^\d*\.?\d*$/
    if (!decimalRegex.test(value)) return

    const num = parseFloat(value)
    if (!isNaN(num) && (num < 0 || num > 1000000000000)) return

    if (value.endsWith('.') || value.endsWith('.0')) {
      // Keep as string for partial input
      setValue(field as any, value as any, { shouldValidate: true })
    } else if (!isNaN(num)) {
      setValue(field as any, num, { shouldValidate: true })
    }
  }

  const handleArrayChange = (field: keyof InventoryFormValues, value: any[]) => {
    setValue(field as any, value, { shouldValidate: true })
  }

  const setFieldError = (field: string, message?: string) => {
    if (message) {
      form.setError(field as any, { type: 'manual', message })
    } else {
      form.clearErrors(field as any)
    }
  }

  const getQuantityRange = (range: string) => {
    switch (range) {
      case '0-1':
        return { start_qty: 0, end_qty: 1 }
      case '2-5':
        return { start_qty: 2, end_qty: 5 }
      case '6-9':
        return { start_qty: 6, end_qty: 9 }
      case '10+':
        return { start_qty: 10, end_qty: 100 }
      default:
        return { start_qty: 0, end_qty: 1 }
    }
  }

  const handleAddLeadTime = () => {
    const currentData = getValues()
    if (!currentData.quantity_range || !currentData.lead_time_value) return

    const { start_qty, end_qty } = getQuantityRange(currentData.quantity_range)

    const newLeadTime: LeadTimeEntry = {
      quantity_range: currentData.quantity_range,
      lead_time_value:
        typeof currentData.lead_time_value === 'string'
          ? parseFloat(currentData.lead_time_value)
          : currentData.lead_time_value || 0,
      lead_time_unit: currentData.lead_time_unit || 'days',
      start_qty,
      end_qty,
    }

    const currentLeadTimes = currentData.manufacture_lead_times || []
    setValue('manufacture_lead_times', [...currentLeadTimes, newLeadTime] as any, { shouldValidate: true })
    setValue('quantity_range', '', { shouldValidate: true })
    setValue('lead_time_value', 0, { shouldValidate: true })
  }

  const handleRemoveLeadTime = (index: number) => {
    const currentData = getValues()
    const currentLeadTimes = currentData.manufacture_lead_times || []
    setValue('manufacture_lead_times', currentLeadTimes.filter(
      (_, i) => i !== index
    ), { shouldValidate: true })
  }

  const handleUpdateLeadTime = (
    index: number,
    lead_time_value: number,
    lead_time_unit: string
  ) => {
    const currentData = getValues()
    const currentLeadTimes = currentData.manufacture_lead_times || []
    setValue('manufacture_lead_times', currentLeadTimes.map((item, i) =>
      i === index ? { ...item, lead_time_value, lead_time_unit: lead_time_unit as 'days' | 'weeks' | 'months' } : item
    ) as any, { shouldValidate: true })
  }

  const handleApplyTemplate = (leadTimes: LeadTimeEntry[]) => {
    setValue('manufacture_lead_times', leadTimes.map(lt => ({
      ...lt,
      lead_time_unit: lt.lead_time_unit as 'days' | 'weeks' | 'months'
    })) as any, { shouldValidate: true })
    setValue('quantity_range', '', { shouldValidate: true })
    setValue('lead_time_value', 0, { shouldValidate: true })
  }

  // Memoize validation functions to avoid recreating on every render
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
    const newCategory = { id: Date.now(), name: trimmedName }
    // Update cache optimistically
    queryClient.setQueryData<InventoryFormData>(queryKeys.inventory.formData(), (prev) => {
      if (!prev) return prev
      return {
        ...prev,
        categories: [...(prev.categories || []), newCategory],
      }
    })
    setNewCategoryName('')
    setIsCategoryModalOpen(false)
    toast.success('Category added successfully')
  }

  const deleteCategory = (categoryId: number) => {
    if (!inventoryData) return
    // Update cache optimistically
    queryClient.setQueryData<InventoryFormData>(queryKeys.inventory.formData(), (prev) => {
      if (!prev) return prev
      return {
        ...prev,
        categories: prev.categories?.filter((cat: any) => cat.id !== categoryId) || [],
      }
    })
    const categoryToDelete = inventoryData.categories.find((cat: any) => cat.id === categoryId)
    const currentCategory = getValues('category')
    if (categoryToDelete && currentCategory === categoryToDelete.name) {
      handleInputChange('category', '')
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
    const newSubCategory = { id: Date.now(), name: trimmedName }
    // Update cache optimistically
    queryClient.setQueryData<InventoryFormData>(queryKeys.inventory.formData(), (prev) => {
      if (!prev) return prev
      return {
        ...prev,
        ecomCategories: [...(prev.ecomCategories || []), newSubCategory],
      }
    })
    setNewSubCategoryName('')
    setIsSubCategoryModalOpen(false)
    toast.success('Sub-category added successfully')
  }

  const deleteSubCategory = (categoryId: number) => {
    if (!inventoryData) return
    // Update cache optimistically
    queryClient.setQueryData<InventoryFormData>(queryKeys.inventory.formData(), (prev) => {
      if (!prev) return prev
      return {
        ...prev,
        ecomCategories:
          prev.ecomCategories?.filter((cat: any) => cat.id !== categoryId) || [],
      }
    })

    const categoryToDelete = inventoryData.ecomCategories.find(
      (cat) => cat.id === categoryId
    )
    const currentSubCategory = getValues('Sub_category')
    if (categoryToDelete && currentSubCategory === categoryToDelete.name) {
      handleInputChange('Sub_category', '')
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const invalidFiles: string[] = []
    
    const validFiles = fileArray.filter((file) => {
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
    setSelectedImages((prev) => [...prev, ...validFiles])
    
    // Upload images immediately
    setIsUploadingImages(true)
    try {
      const newUrls = await uploadProductImages(validFiles)
      setUploadedImageUrls((prev) => [...prev, ...newUrls])
      // Update form with the new URLs
      setValue('images', [...(getValues('images') || []), ...newUrls], { shouldValidate: true })
      toast.success(`${validFiles.length} image(s) uploaded successfully`)
    } catch (error) {
      setUploadError('Failed to upload images. Please try again.')
      toast.error('Failed to upload images')
      // Remove the files that failed to upload
      setSelectedImages((prev) => prev.filter((f) => !validFiles.includes(f)))
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

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

    try {
      const base64Document = await convertFileToBase64(file)
      setValue('assembly_requirement_document', base64Document, { shouldValidate: true })
    } catch (error) {
      setUploadError('Error processing document')
    }
  }

  const removeImage = async (index: number) => {
    // Check if this image has been uploaded (has a URL)
    const imageUrlToDelete = uploadedImageUrls[index]
    
    // Optimistically remove from UI
    const previousSelectedImages = [...selectedImages]
    const previousUploadedUrls = [...uploadedImageUrls]
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index))
    
    // If image was uploaded, delete it from server
    if (imageUrlToDelete) {
      try {
        await deleteProductImage(imageUrlToDelete)
        // Success - image already removed optimistically
      } catch (error) {
        // Revert on error
        setSelectedImages(previousSelectedImages)
        setUploadedImageUrls(previousUploadedUrls)
        toast.error('Failed to delete image. Please try again.')
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
    if (!open && !selectedDocument) {
      handleInputChange('assembly_requirement', 'no')
    }
  }

  // Sync form images with uploaded URLs when they change
  useEffect(() => {
    setValue('images', uploadedImageUrls, { shouldValidate: true })
  }, [uploadedImageUrls, setValue])

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
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      toast.error('Please upload only image files')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const invalidFiles: string[] = []
    
    const validFiles = imageFiles.filter((file) => {
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
    setSelectedImages((prev) => [...prev, ...validFiles])
    
    // Upload images immediately
    setIsUploadingImages(true)
    try {
      const newUrls = await uploadProductImages(validFiles)
      setUploadedImageUrls((prev) => [...prev, ...newUrls])
      toast.success(`${validFiles.length} image(s) uploaded successfully`)
    } catch (error) {
      setUploadError('Failed to upload images. Please try again.')
      toast.error('Failed to upload images')
      // Remove the files that failed to upload
      setSelectedImages((prev) => prev.filter((f) => !validFiles.includes(f)))
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleImageClick = () => imageInputRef.current?.click()
  const handleDocumentClick = () => documentInputRef.current?.click()

  const handleSubmit = async (data: InventoryFormValues) => {
    // Additional custom validations
    if (isWeightExceeded) {
      form.setError('package_weight', {
        type: 'manual',
        message: 'The volumetric weight exceeds the maximum capacity for the selected box type. Please reduce the weight or select a larger box type.'
      })
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsSubmitting(false)
      return
    }

    const allowEmptyLeadTimes = data.item_status === 'draft'
    const leadTimeValidation = validateLeadTimes(
      data.manufacture_lead_times || [],
      false,
      { allowEmpty: allowEmptyLeadTimes }
    )
    if (!leadTimeValidation.isValid) {
      form.setError('manufacture_lead_times', {
        type: 'manual',
        message: leadTimeValidation.error || 'Lead time validation failed'
      })
      if (leadTimeValidation.error) {
        toast.error(leadTimeValidation.error)
      }
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsSubmitting(false)
      return
    }
    try {
      const isAdmin = localStorage.getItem('user_type') === 'admin'
      
      // Use already uploaded image URLs (uploaded immediately when selected)
      const imageUrls = uploadedImageUrls
      
      // Process variants - upload any base64 images that haven't been uploaded yet
      const processedVariants = await Promise.all(
        (data.variants || []).map(async (variant) => {
          // variant.images contains base64 strings from newly uploaded files
          // We need to check if they are base64 and convert them to File objects for upload
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
        unit: data.unit,
        sku_code: data.sku_item_code || '',
        description: data.description || '',
        product_material: data.product_material || [],
        package_weight: toNumber(data.package_weight || 0),
        package_weight_unit: data.package_weight_unit,
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
        price_after_discount: isAdmin
          ? toNumber(data.price_after_discount || 0)
          : toNumber(data.mrp),
        low_stock_value: toNumber(data.low_stock_value || 0),
        low_stock_alert: data.low_stock_alert ? 1 : 0,
        package_length: toNumber(data.package_length || 0),
        package_width: toNumber(data.package_width || 0),
        package_height: toNumber(data.package_height || 0),
        package_height_unit: data.package_height_unit,
        package_type: data.package_type || [],
        box_type: data.box_type || '',
        handling_instructions: data.handling_instructions || '',
        courier_feasibility: data.courier_feasibility || 'standard',
        fragility_indicator: data.fragility_indicator ? 1 : 0,
        assembly_requirement: data.assembly_requirement === 'yes' ? '1' : '0',
        assembly_requirement_document: data.assembly_requirement_document || '',
        manufacture_lead_time: (data.manufacture_lead_times || []).map((entry) => ({
          start_qty: entry.start_qty,
          end_qty: entry.end_qty,
          lead_time: entry.lead_time_value,
          lead_time_unit: entry.lead_time_unit,
        })),
        options: (data.options || []).map((option) => ({
          name: option.name,
          values: option.values,
        })),
        variants: processedVariants,
        images: imageUrls,
      }

      const response = await addInventoryMutation.mutateAsync(submitData)

      if (response.status_code === 200) {
        toast.success('Product added successfully!')
        setIsSubmitting(false)
        onClose()
      } else {
        setErrorMessage(
          response.message || 'An error occurred while adding the product'
        )
        setIsSubmitting(false)
        setIsErrorModalOpen(true)
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An unexpected error occurred'
      setErrorMessage(errorMsg)
      setIsSubmitting(false)
      setIsErrorModalOpen(true)
    }
  }

  const handleRetry = async () => {
    setIsErrorModalOpen(false)
    setErrorMessage('')
    
    // Re-submit the form which will trigger validation
    setIsSubmitting(true)
    const formValues = getValues()
    await handleSubmit(formValues)
  }

  // Wrapper for form submission that uses react-hook-form's handleSubmit
  const onSubmit = formHandleSubmit(
    // Success callback - called when validation passes
    async (data: InventoryFormValues) => {
      setIsSubmitting(true)
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

  // Function to count required field errors for each tab section
  // Only required fields: name, category (Product Information), mrp (Pricing & Inventory)
  const getErrorCount = useCallback((section: string): number => {
    const requiredFields: Record<string, string[]> = {
      'product-information': ['name', 'category'], // Only required fields (mrp removed - it belongs to pricing-inventory)
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

  return {
    state: {
      inventoryData: inventoryData || null,
      isLoadingData,
      dataError: dataError instanceof Error ? dataError.message : (dataError ? String(dataError) : null),
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
      activeSection,
      isErrorModalOpen,
      errorMessage,
      isSubmitting,
      isWeightExceeded,
      isGenerateDescriptionModalOpen,
      selectedImages,
      uploadedImageUrls,
      isUploadingImages,
      selectedDocument,
      isDragOver,
      uploadError,
      errors,
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
      setUploadedImageUrls,
    },
    handlers: {
      handleInputChange,
      handleNumberInputChange,
      handleArrayChange,
      setFieldError,
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
    },
    form: {
      ...form,
      control, // Export control separately for easier access
    },
    // Utility to get current form values without causing re-renders
    getFormValues: getValues,
  }
}

export type UseAddInventoryReturn = ReturnType<typeof useAddInventory>

