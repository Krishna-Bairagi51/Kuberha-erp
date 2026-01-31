"use client"
import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { X, Plus, Info, ChevronDown, ChevronUp, Package, User, CirclePlus, ChevronLeft, ChevronRight, CloudUpload, Settings, Search, Loader2 } from 'lucide-react'
import type { 
  VariantOption, 
  VariantOptionValue,
  Variant,
  Option,
  ProductOptionsVariantsProps,
} from '../../../types/inventory.types'
import { ImagePreviewModal } from '@/components/shared'
import { uploadProductImages } from '../../../services/inventory.service'

export const ProductOptionsVariants = ({ 
  options, 
  variants, 
  variantOptions,
  onOptionsChange,
  onVariantsChange,
  onSliderStateChange,
  productName,
  productImage,
  productPrice,
  productWeight,


}: ProductOptionsVariantsProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [isSlideOpen, setIsSlideOpen] = useState(false)
  const [isMediaSlideOpen, setIsMediaSlideOpen] = useState(false)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null)
  const [mediaPreviews, setMediaPreviews] = useState<Record<number, string[]>>({})
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('')
  const [previewModalImageUrl, setPreviewModalImageUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const [currentVariant, setCurrentVariant] = useState<Partial<Variant>>({
    title: "",
    extra_charges: 0,
    stock_quantity: 0,
    images: []
  })
  const [attributeRows, setAttributeRows] = useState<Array<{
    id: string
    attributeType: string
    attributeValues: string
  }>>([])
  const [showPreviewVariants, setShowPreviewVariants] = useState(false)
  const [isAddAttributeModalOpen, setIsAddAttributeModalOpen] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState('')
  const [pendingRowId, setPendingRowId] = useState<string | null>(null)
  const [customAttributes, setCustomAttributes] = useState<VariantOption[]>([])
  const [excludedVariants, setExcludedVariants] = useState<Set<string>>(new Set())
  const [showVariantsTable, setShowVariantsTable] = useState(false)
  const [createdVariants, setCreatedVariants] = useState<Array<{
    id: string
    productName: string
    extraCharge: number
    stock: number
    media?: File[]
    extraLeadTime?: number
    variantLength?: number
    variantWidth?: number
    variantHeight?: number
    variantDimensionUnit?: string
    variantWeight?: string
    variantWeightUnit?: string
    [key: string]: any // Allow dynamic attributes
  }>>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  // Search query state
  const [searchQuery, setSearchQuery] = useState('')

  // Add New Variant Collapsible Row state
  const [isAddVariantRowOpen, setIsAddVariantRowOpen] = useState(false)
  const [newVariantSelections, setNewVariantSelections] = useState<Record<string, string>>({})
  
  // Additional variant details modal state
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(false)
  const [selectedAdditionalDetailsIndex, setSelectedAdditionalDetailsIndex] = useState<number | null>(null)
  
  // Track uploaded image URLs for each variant and upload status
  const [variantUploadedUrls, setVariantUploadedUrls] = useState<Record<number, string[]>>({})
  const [isUploadingVariantMedia, setIsUploadingVariantMedia] = useState<Record<number, boolean>>({})

  // Local state for dimension inputs to preserve decimal point while typing
  const [dimensionInputs, setDimensionInputs] = useState<{
    length: string
    width: string
    height: string
  }>({ length: '', width: '', height: '' })

  // Local state for extra charge inputs to preserve decimal point while typing (keyed by variant index)
  const [extraChargeInputs, setExtraChargeInputs] = useState<Record<number, string>>({})

  // Initialize dimension inputs when modal opens
  React.useEffect(() => {
    if (selectedAdditionalDetailsIndex !== null && isAdditionalDetailsOpen) {
      const variant = createdVariants[selectedAdditionalDetailsIndex]
      setDimensionInputs({
        length: variant?.variantLength === 0 ? '' : variant?.variantLength?.toString() || '',
        width: variant?.variantWidth === 0 ? '' : variant?.variantWidth?.toString() || '',
        height: variant?.variantHeight === 0 ? '' : variant?.variantHeight?.toString() || '',
      })
    }
  }, [selectedAdditionalDetailsIndex, isAdditionalDetailsOpen])
  
  // Initialize state from props on mount (to persist data when switching tabs)
  React.useEffect(() => {
    // Only initialize if we have variants from parent and no local variants yet
    if (variants.length > 0 && createdVariants.length === 0) {
      // Reconstruct createdVariants from the variants prop
      const reconstructedVariants = variants.map((variant, index) => {
        // Parse the title to extract attribute values (e.g., "Red/Large" -> {Color: "Red", Size: "Large"})
        const titleParts = variant.title.split('/')
        const dynamicAttributes: Record<string, string> = {}
        
        // If we have options, map the title parts to attribute names
        if (options.length > 0) {
          options.forEach((option, idx) => {
            if (titleParts[idx]) {
              dynamicAttributes[option.name] = titleParts[idx]
            }
          })
        }
        
        return {
          id: `D${String(index + 1).padStart(3, '0')}`,
          productName: productName || 'Product',
          ...dynamicAttributes,
          extraCharge: variant.extra_charges || 0,
          stock: variant.stock_quantity || 0,
          media: [], // Media will need to be re-uploaded (can't reconstruct File objects from base64)
          extraLeadTime: variant.extra_lead_time || 0,
          variantLength: variant.variant_product_length || 0,
          variantWidth: variant.variant_product_width || 0,
          variantHeight: variant.variant_product_height || 0,
          variantDimensionUnit: variant.variant_product_dimension_unit || 'cm',
          variantWeight: variant.variant_shopify_weight || '0',
          variantWeightUnit: variant.variant_shopify_weight_unit || 'kg'
        }
      })
      
      setCreatedVariants(reconstructedVariants)
      setShowVariantsTable(true)
    }
    
    // Initialize attributeRows from options prop
    if (options.length > 0 && attributeRows.length === 0) {
      const reconstructedRows = options.map((option) => ({
        id: Date.now().toString() + Math.random(),
        attributeType: option.name,
        attributeValues: option.values.join(', ')
      }))
      setAttributeRows(reconstructedRows)
    }
  }, []) // Only run on mount
  
  // Set preview image URL for display purposes only (not used in final payload)
  React.useEffect(() => {
    if (productImage) {
      // Create a preview URL from the File object for display only
      const previewUrl = URL.createObjectURL(productImage)
      setImagePreviewUrl(previewUrl)
      
      // Cleanup function to revoke the URL when component unmounts or image changes
      return () => URL.revokeObjectURL(previewUrl)
    } else {
      // Use default logo if no product image
      setImagePreviewUrl('/images/Logo_Casa Carigar_TERRACOTTA 1.png')
    }
  }, [productImage])
      
  // Notify parent when slider state changes
  React.useEffect(() => {
    onSliderStateChange?.(isSlideOpen)
  }, [isSlideOpen, onSliderStateChange])

  // Update parent with variants data whenever createdVariants or uploaded URLs change
  React.useEffect(() => {
    const updateVariants = () => {
      const validRows = attributeRows.filter(row => 
        row.attributeType && row.attributeValues && row.attributeValues.trim()
      )
      
      if (createdVariants.length > 0 && validRows.length > 0) {
        // Convert createdVariants to the format expected by the API
        const formattedVariants = createdVariants.map((variant, index) => {
            // Create title from attribute values (e.g., "Red/Large")
            const titleParts = validRows.map(row => variant[row.attributeType] || 'N/A')
            const title = titleParts.join('/')
            
          // Use already uploaded image URLs (uploaded immediately when selected)
          const images = variantUploadedUrls[index] || []
            
            return {
              title,
              extra_charges: variant.extraCharge || 0,
              stock_quantity: variant.stock || 0,
            images, // Each variant has its own separate images array (now URLs)
              extra_lead_time: variant.extraLeadTime || 0,
              variant_product_length: variant.variantLength || 0,
              variant_product_width: variant.variantWidth || 0,
              variant_product_height: variant.variantHeight || 0,
              variant_product_dimension_unit: variant.variantDimensionUnit || 'cm',
              variant_shopify_weight: variant.variantWeight || '0',
              variant_shopify_weight_unit: variant.variantWeightUnit || 'kg'
            }
          })
        
        onVariantsChange(formattedVariants)
      }
    }
    
    updateVariants()
  }, [createdVariants, attributeRows, variantUploadedUrls])

  // Reset excluded variants when attribute rows change
  React.useEffect(() => {
    setExcludedVariants(new Set())
  }, [attributeRows])

  // Optimistically clean up variants with "N/A" values or invalid attributes when attributes change
  React.useEffect(() => {
    if (createdVariants.length === 0 || !showVariantsTable) return
    
    const validRows = attributeRows.filter(row => 
      row.attributeType && row.attributeValues && row.attributeValues.trim()
    )
    
    if (validRows.length === 0) {
      // If no valid rows, clear all variants
      setCreatedVariants([])
      setShowVariantsTable(false)
      return
    }
    
    // Get all valid attribute type names
    const validAttributeTypes = new Set(validRows.map(row => row.attributeType))
    
    // Check if any variant has "N/A" for any current attribute OR has attributes that no longer exist
    const hasInvalidVariants = createdVariants.some(variant => {
      // Check if variant has attributes that don't exist in current attributeRows
      const variantAttributeTypes = Object.keys(variant).filter(key => 
        !['id', 'productName', 'extraCharge', 'stock', 'media', 'extraLeadTime', 
          'variantLength', 'variantWidth', 'variantHeight', 'variantDimensionUnit',
          'variantWeight', 'variantWeightUnit'].includes(key)
      )
      
      // Check if variant has attributes that are no longer in validAttributeTypes
      const hasRemovedAttributes = variantAttributeTypes.some(attrType => 
        !validAttributeTypes.has(attrType)
      )
      
      if (hasRemovedAttributes) return true
      
      // Check if variant has "N/A" or missing values for any current attribute
      return validRows.some(row => {
        const value = (variant as any)[row.attributeType]
        return !value || value === 'N/A'
      })
    })
    
    if (hasInvalidVariants) {
      // Optimistically remove variants with "N/A" values or invalid attributes
      const validVariants = createdVariants.filter(variant => {
        // First, check if variant has attributes that no longer exist - remove it
        const variantAttributeTypes = Object.keys(variant).filter(key => 
          !['id', 'productName', 'extraCharge', 'stock', 'media', 'extraLeadTime', 
            'variantLength', 'variantWidth', 'variantHeight', 'variantDimensionUnit',
            'variantWeight', 'variantWeightUnit'].includes(key)
        )
        
        const hasRemovedAttributes = variantAttributeTypes.some(attrType => 
          !validAttributeTypes.has(attrType)
        )
        
        if (hasRemovedAttributes) return false
        
        // Then check if variant has valid values for all current attributes
        return validRows.every(row => {
          const value = (variant as any)[row.attributeType]
          return value && value !== 'N/A'
        })
      })
      
      // Remove attributes that no longer exist from valid variants
      const cleanedVariants = validVariants.map(variant => {
        const cleaned = { ...variant }
        // Remove attributes that are no longer in validAttributeTypes
        Object.keys(cleaned).forEach(key => {
          if (!['id', 'productName', 'extraCharge', 'stock', 'media', 'extraLeadTime', 
                'variantLength', 'variantWidth', 'variantHeight', 'variantDimensionUnit',
                'variantWeight', 'variantWeightUnit'].includes(key) && 
              !validAttributeTypes.has(key)) {
            delete cleaned[key]
          }
        })
        return cleaned
      })
      
      // Only update if we actually removed some variants or cleaned attributes
      if (cleanedVariants.length !== createdVariants.length || 
          cleanedVariants.some((v, i) => {
            const original = createdVariants[i]
            if (!original) return true
            const originalKeys = Object.keys(original).filter(k => 
              !['id', 'productName', 'extraCharge', 'stock', 'media', 'extraLeadTime', 
                'variantLength', 'variantWidth', 'variantHeight', 'variantDimensionUnit',
                'variantWeight', 'variantWeightUnit'].includes(k)
            )
            const cleanedKeys = Object.keys(v).filter(k => 
              !['id', 'productName', 'extraCharge', 'stock', 'media', 'extraLeadTime', 
                'variantLength', 'variantWidth', 'variantHeight', 'variantDimensionUnit',
                'variantWeight', 'variantWeightUnit'].includes(k)
            )
            return originalKeys.length !== cleanedKeys.length
          })) {
        setCreatedVariants(cleanedVariants)
        
        // Also clean up extraChargeInputs for removed variants
        setExtraChargeInputs(prev => {
          const updated: Record<number, string> = {}
          cleanedVariants.forEach((variant, newIndex) => {
            // Find the old index by matching variant ID
            const oldIndex = createdVariants.findIndex(v => v.id === variant.id)
            if (oldIndex !== -1 && prev[oldIndex] !== undefined) {
              updated[newIndex] = prev[oldIndex]
            }
          })
          return updated
        })
        
        // Clean up variant uploaded URLs for removed variants
        setVariantUploadedUrls(prev => {
          const updated: Record<number, string[]> = {}
          cleanedVariants.forEach((variant, newIndex) => {
            const oldIndex = createdVariants.findIndex(v => v.id === variant.id)
            if (oldIndex !== -1 && prev[oldIndex]) {
              updated[newIndex] = prev[oldIndex]
            }
          })
          return updated
        })
        
        // Clean up media previews for removed variants
        setMediaPreviews(prev => {
          const updated: Record<number, string[]> = {}
          cleanedVariants.forEach((variant, newIndex) => {
            const oldIndex = createdVariants.findIndex(v => v.id === variant.id)
            if (oldIndex !== -1 && prev[oldIndex]) {
              updated[newIndex] = prev[oldIndex]
            }
          })
          return updated
        })
      }
    }
  }, [attributeRows, showVariantsTable]) // Only depend on attributeRows and showVariantsTable

  // Auto-hide preview when conditions are no longer met
  React.useEffect(() => {
    const validRows = attributeRows.filter(row => 
      row.attributeType && row.attributeValues && row.attributeValues.trim()
    )
    // Hide preview if less than 2 valid rows or no attribute rows at all
    if (showPreviewVariants && (validRows.length < 2 || attributeRows.length === 0)) {
      setShowPreviewVariants(false)
    }
  }, [attributeRows, showPreviewVariants])

  // Validation function for numbers 0-100000 with decimals
  const validateNumber = (value: string) => {
    if (value === '') return true // Allow empty values
    // Allow decimal point and numbers
    const decimalRegex = /^\d*\.?\d*$/
    if (!decimalRegex.test(value)) return false
    const num = parseFloat(value)
    return !isNaN(num) && num >= 0 && num <= 1000000000000
  }

  // Convert File to base64
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

  const addVariant = () => {
    if (currentVariant.title) {
      onVariantsChange([...variants, currentVariant as Variant])
      setCurrentVariant({
        title: "",
        extra_charges: 0,
        stock_quantity: 0,
        images: []
      })
    }
  }

  const removeOption = (index: number) => {
    onOptionsChange(options.filter((_, i) => i !== index))
  }

  const removeVariant = (index: number) => {
    onVariantsChange(variants.filter((_, i) => i !== index))
  }

  const addAttributeRow = () => {
    const newRow = {
      id: Date.now().toString(),
      attributeType: '',
      attributeValues: ''
    }
    setAttributeRows([...attributeRows, newRow])
  }

  const removeAttributeRow = (id: string) => {
    const rowToRemove = attributeRows.find(row => row.id === id)
    const updatedRows = attributeRows.filter(row => row.id !== id)
    setAttributeRows(updatedRows)
    
    // If all rows are removed, reset preview and excluded variants, and clear variants
    if (updatedRows.length === 0) {
      setShowPreviewVariants(false)
      setExcludedVariants(new Set())
      setCreatedVariants([])
      setShowVariantsTable(false)
      return
    }
    
    // If we have variants and removed an attribute, regenerate variants based on remaining attributes
    if (showVariantsTable && createdVariants.length > 0 && rowToRemove?.attributeType) {
      const validRows = updatedRows.filter(row => 
        row.attributeType && row.attributeValues && row.attributeValues.trim()
      )
      
      if (validRows.length === 0) {
        setCreatedVariants([])
        setShowVariantsTable(false)
        return
      }
      
      // Generate new combinations based on remaining attributes
      const generateCombinations = () => {
        if (validRows.length === 0) return []
        
        const combinations: string[] = []
        const attributeValues = validRows.map(row => 
          row.attributeValues.split(',').map(v => v.trim()).filter(v => v)
        )
        
        const generateCombos = (arrays: string[][], index = 0, current: string[] = []): void => {
          if (index === arrays.length) {
            combinations.push(current.join(' x '))
            return
          }
          
          for (const value of arrays[index]) {
            generateCombos(arrays, index + 1, [...current, value])
          }
        }
        
        generateCombos(attributeValues)
        return combinations
      }
      
      const newCombinations = generateCombinations()
      
      // Generate new variants - reset all data since variants with different attribute counts are different products
      const newVariants = newCombinations.map((combination, index) => {
        const parts = combination.split(' x ')
        
        // Create new variant with all data reset
        const dynamicAttributes: Record<string, string> = {}
        validRows.forEach((row, rowIndex) => {
          dynamicAttributes[row.attributeType] = parts[rowIndex] || ''
        })
        
        return {
          id: `D${String(index + 1).padStart(3, '0')}`,
          productName: productName || 'Product',
          ...dynamicAttributes,
          extraCharge: 0,
          stock: 0,
          media: [],
          extraLeadTime: 0,
          variantLength: 0,
          variantWidth: 0,
          variantHeight: 0,
          variantDimensionUnit: 'cm',
          variantWeight: '0',
          variantWeightUnit: 'kg'
        }
      })
      
      // Update variants optimistically - all data is reset
      setCreatedVariants(newVariants)
      
      // Clear all extraChargeInputs since these are different products
      setExtraChargeInputs({})
      
      // Clear all variant uploaded URLs since these are different products
      setVariantUploadedUrls({})
      
      // Clear all media previews since these are different products
      setMediaPreviews({})
    }
  }

  const updateAttributeRow = (id: string, field: 'attributeType' | 'attributeValues', value: string) => {
    setAttributeRows(prevRows => {
      return prevRows.map(row => {
        if (row.id === id) {
          // If changing attribute type, clear the attribute values
          if (field === 'attributeType') {
            return { ...row, attributeType: value, attributeValues: '' }
          }
          return { ...row, [field]: value }
        }
        return row
      })
    })
  }

  // Clear attribute type if it's no longer available (when another row selects the same type)
  React.useEffect(() => {
    setAttributeRows(prevRows => 
      prevRows.map(row => {
        if (row.attributeType) {
          const availableTypes = getAvailableAttributeTypes(row.id)
          const isStillAvailable = availableTypes.some(option => option.name === row.attributeType)
          
          if (!isStillAvailable) {
            // Clear the attribute type and values if it's no longer available
            return { ...row, attributeType: '', attributeValues: '' }
          }
        }
        return row
      })
    )
  }, [attributeRows.length]) // Trigger when rows are added/removed

  // Get available values for a selected attribute type from API or custom attributes
  const getAvailableValuesForAttribute = (attributeType: string): VariantOptionValue[] => {
    // Check in predefined variant options first
    const variantOption = variantOptions?.find(vo => vo.name === attributeType)
    if (variantOption) {
      return variantOption.values || []
    }
    
    // Check in custom attributes
    const customAttribute = customAttributes.find(ca => ca.name === attributeType)
    return customAttribute?.values || []
  }

  // Get available attribute types for a specific row (excluding already selected ones in other rows)
  const getAvailableAttributeTypes = (currentRowId: string) => {
    // Combine predefined variant options with custom attributes
    const allOptions = [...(variantOptions || []), ...customAttributes]
    
    if (allOptions.length === 0) return []
    
    // Get all currently selected attribute types in other rows
    const selectedTypes = attributeRows
      .filter(row => row.id !== currentRowId && row.attributeType)
      .map(row => row.attributeType)
    
    // Return only the attribute types that haven't been selected in other rows
    return allOptions.filter(option => !selectedTypes.includes(option.name))
  }

  // Toggle a preset value in the attribute values input (add if not present, remove if present)
  const togglePresetValueToAttribute = (rowId: string, valueName: string) => {
    setAttributeRows(attributeRows.map(row => {
      if (row.id === rowId) {
        const currentValues = row.attributeValues ? row.attributeValues.split(',').map(v => v.trim()).filter(v => v) : []
        if (currentValues.includes(valueName)) {
          // Remove the value
          const newValues = currentValues.filter(v => v !== valueName).join(', ')
          return { ...row, attributeValues: newValues }
        } else {
          // Add the value
          const newValues = [...currentValues, valueName].join(', ')
          return { ...row, attributeValues: newValues }
        }
      }
      return row
    }))
  }

  // Check if a value is selected for a given row
  const isValueSelected = (rowId: string, valueName: string): boolean => {
    const row = attributeRows.find(r => r.id === rowId)
    if (!row) return false
    const currentValues = row.attributeValues ? row.attributeValues.split(',').map(v => v.trim()).filter(v => v) : []
    return currentValues.includes(valueName)
  }


  // Handle attribute type change
  const handleAttributeTypeChange = (rowId: string, value: string) => {
    if (value === 'other') {
      setPendingRowId(rowId)
      setIsAddAttributeModalOpen(true)
    } else {
      updateAttributeRow(rowId, 'attributeType', value)
    }
  }

  // Handle saving new attribute
  const handleSaveNewAttribute = () => {
    if (newAttributeName.trim() && pendingRowId) {
      const trimmedName = newAttributeName.trim()
      
      // Add the new attribute to custom attributes list if it doesn't already exist
      const attributeExists = [...(variantOptions || []), ...customAttributes].some(
        option => option.name.toLowerCase() === trimmedName.toLowerCase()
      )
      
      if (!attributeExists) {
        const newCustomAttribute: VariantOption = {
          id: 0, // Using 0 for custom attributes since we only use the name
          name: trimmedName,
          values: []
        }
        setCustomAttributes([...customAttributes, newCustomAttribute])
      }
      
      // Set the attribute type for the current row
      updateAttributeRow(pendingRowId, 'attributeType', trimmedName)
      setIsAddAttributeModalOpen(false)
      setNewAttributeName('')
      setPendingRowId(null)
    }
  }

  // Handle closing modal
  const handleCloseModal = () => {
    setIsAddAttributeModalOpen(false)
    setNewAttributeName('')
    setPendingRowId(null)
  }

  // Handle opening add variant row
  const handleOpenAddVariantRow = () => {
    // Reset selections
    setNewVariantSelections({})
    setIsAddVariantRowOpen(true)
  }

  // Handle closing add variant row
  const handleCloseAddVariantRow = () => {
    setIsAddVariantRowOpen(false)
    setNewVariantSelections({})
  }

  // Handle adding new variant
  const handleAddNewVariant = () => {
    const validRows = attributeRows.filter(row => 
      row.attributeType && row.attributeValues && row.attributeValues.trim()
    )
    
    // Check if all required attributes are selected
    const allAttributesSelected = validRows.every(row => 
      newVariantSelections[row.attributeType] && newVariantSelections[row.attributeType].trim()
    )
    
    if (!allAttributesSelected) {
      toast.error('Please select values for all attributes')
      return
    }
    const variantParts = validRows.map(row => newVariantSelections[row.attributeType])
    const newVariantCombination = variantParts.join(' x ')
        const variantExistsInTable = variantCombinations.includes(newVariantCombination)
    
    if (variantExistsInTable) {
      toast.error('This variant combination already exists in the preview')
      return
    }
    
    // Remove from excluded variants if it was previously excluded
    setExcludedVariants(prev => {
      const newSet = new Set(prev)
      newSet.delete(newVariantCombination)
      return newSet
    })
    
    // Close row and reset selections
    handleCloseAddVariantRow()
  }

  // Generate all possible combinations of attributes
  const generateVariantCombinations = () => {
    const validRows = attributeRows.filter(row => 
      row.attributeType && row.attributeValues && row.attributeValues.trim()
    )
    
    if (validRows.length === 0) return []
    
    const combinations: string[] = []
    
    // Get all values for each attribute
    const attributeValues = validRows.map(row => 
      row.attributeValues.split(',').map(v => v.trim()).filter(v => v)
    )
    
    // Generate cartesian product of all attribute values
    const generateCombinations = (arrays: string[][], index = 0, current: string[] = []): void => {
      if (index === arrays.length) {
        combinations.push(current.join(' x '))
        return
      }
      
      for (const value of arrays[index]) {
        generateCombinations(arrays, index + 1, [...current, value])
      }
    }
    
    generateCombinations(attributeValues)
    return combinations
  }

  // Handle removing a variant combination
  const removeVariantCombination = (combination: string) => {
    setExcludedVariants(prev => {
      const newSet = new Set(prev)
      newSet.add(combination)
      return newSet
    })
  }

  const allVariantCombinations = generateVariantCombinations()
  const variantCombinations = allVariantCombinations.filter(combo => !excludedVariants.has(combo))

  // Check if Preview button should be enabled
  const hasValidAttributesForPreview = () => {
    const validRows = attributeRows.filter(row => 
      row.attributeType && row.attributeValues && row.attributeValues.trim()
    )
    return validRows.length > 1
  }

  React.useEffect(() => {
    if (showPreviewVariants && !hasValidAttributesForPreview()) {
      setShowPreviewVariants(false)
      setIsAddVariantRowOpen(false)
    }
  }, [showPreviewVariants, attributeRows])

  // Auto-hide preview when all variant combinations are removed
  React.useEffect(() => {
    if (showPreviewVariants && variantCombinations.length === 0 && allVariantCombinations.length > 0) {
      setShowPreviewVariants(false)
      // Also reset excluded variants when all are removed
      setExcludedVariants(new Set())
    }
  }, [showPreviewVariants, variantCombinations.length, allVariantCombinations.length])

  // Handle file upload for variants (from the media slide)
  const handleFileUpload = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return

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

    // Attach uploaded files to the variant for preview
    setCreatedVariants(prev =>
      prev.map((v, i) => (i === index ? { ...v, media: [...(v.media || []), ...validFiles] } : v))
    )

    // Create preview URLs
    const urls = validFiles.map(f => URL.createObjectURL(f))
    setMediaPreviews(prev => ({
      ...prev,
      [index]: [...(prev[index] || []), ...urls],
    }))
    
    // Upload images immediately
    setIsUploadingVariantMedia(prev => ({ ...prev, [index]: true }))
    try {
      const uploadedUrls = await uploadProductImages(validFiles)
      setVariantUploadedUrls(prev => ({
        ...prev,
        [index]: [...(prev[index] || []), ...uploadedUrls]
      }))
      toast.success(`${validFiles.length} image(s) uploaded successfully`)
    } catch (error) {
      toast.error('Failed to upload images')
      // Remove the files that failed to upload
      setCreatedVariants(prev =>
        prev.map((v, i) => {
          if (i !== index) return v
          const media = (v.media || []).filter(f => !validFiles.includes(f))
          return { ...v, media }
        })
      )
      setMediaPreviews(prev => ({
        ...prev,
        [index]: (prev[index] || []).slice(0, -validFiles.length)
      }))
    } finally {
      setIsUploadingVariantMedia(prev => ({ ...prev, [index]: false }))
    }
  }


  const removePreviewAt = (index: number, previewIndex: number) => {
    // Remove the file from variant media
    setCreatedVariants(prev => {
      const updated = prev.map((v, i) => {
        if (i !== index) return v
        const media = (v.media || []).filter((_, mIdx) => mIdx !== previewIndex)
        return { ...v, media }
      })
      
      return updated
    })
    
    // Remove the preview URL
    setMediaPreviews(prev => {
      const next = { ...(prev || {}) }
      const arr = (next[index] || []).filter((_, pIdx) => pIdx !== previewIndex)
      next[index] = arr
      return next
    })
    
    // Remove the uploaded URL
    setVariantUploadedUrls(prev => {
      const next = { ...prev }
      const arr = (next[index] || []).filter((_, pIdx) => pIdx !== previewIndex)
      next[index] = arr
      return next
    })
  }

  // Create object URLs for all variant media files
  const variantMediaUrls = useMemo(() => {
    const urls: Record<number, string[]> = {}
    createdVariants.forEach((variant, index) => {
      if (variant.media && variant.media.length > 0) {
        urls[index] = variant.media.map((file) => URL.createObjectURL(file))
      }
    })
    return urls
  }, [createdVariants])

  // Cleanup object URLs on unmount or when files change
  useEffect(() => {
    return () => {
      Object.values(variantMediaUrls).forEach((urls) => {
        urls.forEach((url) => URL.revokeObjectURL(url))
      })
      if (previewModalImageUrl && previewModalImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewModalImageUrl)
      }
    }
  }, [variantMediaUrls, previewModalImageUrl])

  const handleFileClick = (file: File) => {
    // Clean up previous preview URL if it was an object URL
    if (previewModalImageUrl && previewModalImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewModalImageUrl)
    }
    const imageUrl = URL.createObjectURL(file)
    setPreviewModalImageUrl(imageUrl)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = (open: boolean) => {
    setIsPreviewOpen(open)
    if (!open && previewModalImageUrl) {
      // Only revoke if it's an object URL (starts with blob:)
      if (previewModalImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewModalImageUrl)
      }
      setPreviewModalImageUrl(null)
    }
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return ''
    const sizes = ['B','KB','MB','GB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
    const value = bytes / Math.pow(1024, i)
    return `${value.toFixed(1)}${sizes[i]}`
  }

  // Filter variants based on search query
  const filteredVariants = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return createdVariants
    }
    
    const query = searchQuery.toLowerCase().trim()
    const validRows = attributeRows.filter(row => 
      row.attributeType && row.attributeValues && row.attributeValues.trim()
    )
    
    return createdVariants.filter(variant => {
      // Search in product name
      if (variant.productName?.toLowerCase().includes(query)) {
        return true
      }
      
      // Search in dynamic attribute values
      const matchesAttribute = validRows.some(row => {
        const attributeValue = (variant as any)[row.attributeType] || ''
        return attributeValue.toString().toLowerCase().includes(query)
      })
      if (matchesAttribute) {
        return true
      }
      
      // Search in extra charge
      if (variant.extraCharge?.toString().includes(query)) {
        return true
      }
      
      // Search in stock
      if (variant.stock?.toString().includes(query)) {
        return true
      }
      
      return false
    })
  }, [createdVariants, searchQuery, attributeRows])

  // Pagination logic
  const totalPages = Math.ceil(filteredVariants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVariants = filteredVariants.slice(startIndex, endIndex)

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    setItemsPerPage(Number(newItemsPerPage))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  // Create variants table from combinations
  const createVariantsTable = async () => {
    const validRows = attributeRows.filter(row => 
      row.attributeType && row.attributeValues && row.attributeValues.trim()
    )
    
    // Create options array from validRows
    const optionsData: Option[] = validRows.map(row => ({
      name: row.attributeType,
      values: row.attributeValues.split(',').map(v => v.trim()).filter(v => v)
    }))
    
    // Create variants array from combinations
    const variantsData = variantCombinations.map((combination, index) => {
      const parts = combination.split(' x ')
      
      // Create dynamic attributes object
      const dynamicAttributes: Record<string, string> = {}
      validRows.forEach((row, rowIndex) => {
        const attributeName = row.attributeType
        const value = parts[rowIndex] || 'N/A'
        dynamicAttributes[attributeName] = value
      })

      return {
        id: `D${String(index + 1).padStart(3, '0')}`,
        productName: productName || 'Product',
        ...dynamicAttributes,
        extraCharge: 0,
        stock: 0,
        extraLeadTime: 0,
        variantLength: 0,
        variantWidth: 0,
        variantHeight: 0,
        variantDimensionUnit: 'cm',
        variantWeight: '0',
        variantWeightUnit: 'kg'
      }

    })
    
    setCreatedVariants(variantsData)
    setShowVariantsTable(true)
    
    // Update parent with options data
    onOptionsChange(optionsData)
    setIsSlideOpen(false)
    // Hide the preview section after creating table
    setShowPreviewVariants(false)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
      
      {/* Main Card */}
      <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mx-[16px] mb-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* <CardHeader className="border-b border-gray-200 px-2 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 font-semibold text-gray-900 label-1 font-urbanist text-[16px]">
                <span>Product Variant Information</span>
                <Info className="h-4 w-4 text-gray-500" />
              </CardTitle>
              <div className="flex items-center space-x-3">
                <span title="Product Name, Price and Weight are required">
                <Button 
                  type="button"
                  onClick={() => setIsSlideOpen(true)}
                  className="h-8 body-3 font-urbanist text-sm bg-secondary-900 hover:bg-secondary-800 text-white px-4 py-2 rounded-lg"
                  disabled = {productName === '' && productPrice === 0 && productWeight === 0}
                >
                  Create Variants
                </Button>
              
                </span>
                
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
              
            </div>
          </CardHeader> */}
          
          <CollapsibleContent>
            <CardContent className="px-0 pb-0">
              {/* Show variants table if created, otherwise empty state */}
              {showVariantsTable && createdVariants.length > 0 && variantCombinations.length >= 1 ? (
                <div className="space-y-4 mt-3" >
                  <div className="flex items-center justify-between gap-4 px-5">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search variants..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setCurrentPage(1) // Reset to first page when searching
                        }}
                        className="pl-10 h-9 border-gray-300 text-sm"
                      />
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 font-medium bg-secondary-900 hover:bg-secondary-800 text-white hover:text-white"
                      onClick={() =>setIsSlideOpen(true)}
                    >
                      Create Variants
                    </Button>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                            {(() => {
                              const validRows = attributeRows.filter(row => 
                                row.attributeType && row.attributeValues && row.attributeValues.trim()
                              )
                              return validRows.map((row) => (
                                <th key={row.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {row.attributeType}
                                </th>
                              ))
                            })()}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extra Charge</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedVariants.map((variant, index) => {
                            // Find the original index in createdVariants array
                            const actualIndex = createdVariants.findIndex(v => v.id === variant.id)
                            return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900 ">{variant.productName}</td>
                              {(() => {
                                const validRows = attributeRows.filter(row => 
                                  row.attributeType && row.attributeValues && row.attributeValues.trim()
                                )
                                return validRows.map((row) => (
                                  <td key={row.id} className="px-4 py-3 text-sm text-gray-900">
                                    {(variant as any)[row.attributeType] || 'N/A'}
                                  </td>
                                ))
                              })()}
                              <td className="px-4 py-3 text-sm">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    extraChargeInputs[actualIndex] !== undefined
                                      ? extraChargeInputs[actualIndex]
                                      : variant.extraCharge === 0
                                      ? ''
                                      : variant.extraCharge?.toString() || ''
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value
                                    // Allow numbers, decimal point, and empty string
                                    // This regex allows: empty, numbers, decimals like "10.", "10.5", ".5"
                                    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                                      // Count digits (excluding decimal point and negative sign)
                                      const digitCount = value.replace(/[^0-9]/g, '').length
                                      // Limit to 7 digits
                                      if (digitCount <= 7) {
                                        // Store raw string value to preserve decimal point
                                        setExtraChargeInputs(prev => ({
                                          ...prev,
                                          [actualIndex]: value,
                                        }))
                                        // Update the variant with parsed value (or 0 if empty/invalid)
                                        const numValue = value === '' || value === '.' || value === '-' ? 0 : parseFloat(value) || 0
                                        setCreatedVariants(prev => 
                                          prev.map((v, i) => 
                                            i === actualIndex ? { ...v, extraCharge: numValue } : v
                                          )
                                        )
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    // Ensure final value is properly formatted
                                    const currentValue = extraChargeInputs[actualIndex] || ''
                                    const numValue = currentValue === '' || currentValue === '.' || currentValue === '-'
                                      ? 0
                                      : parseFloat(currentValue) || 0
                                    setCreatedVariants(prev => 
                                      prev.map((v, i) => 
                                        i === actualIndex ? { ...v, extraCharge: numValue } : v
                                      )
                                    )
                                    setExtraChargeInputs(prev => ({
                                      ...prev,
                                      [actualIndex]: numValue === 0 ? '' : numValue.toString(),
                                    }))
                                  }}
                                  placeholder="0"
                                  className="w-20 h-8 text-sm border-gray-300 "
                                />
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Input
                                  type="text"
                                  value={variant.stock === 0 ? '' : variant.stock}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    // Only allow numbers
                                    if (value === '' || /^\d+$/.test(value)) {
                                      // Limit to 7 digits
                                      if (value === '' || value.length <= 7) {
                                        setCreatedVariants(prev => 
                                          prev.map((v, i) => 
                                            i === actualIndex ? { ...v, stock: value === '' ? 0 : parseInt(value) } : v
                                          )
                                        )
                                      }
                                    }
                                  }}
                                  placeholder="0"
                                  className="w-20 h-8 text-sm border-gray-300 "
                                />
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {variant.media && variant.media.length > 0 ? (
                                  <button 
                                    type="button"
                                    className="h-8 text-secondary-900 flex items-center gap-1.5"
                                    onClick={() => { setSelectedVariantIndex(actualIndex); setIsMediaSlideOpen(true) }}
                                  >
                                    <CloudUpload className="h-4 w-4" />
                                    <span className="text-sm font-medium">Media Uploaded</span>
                                  </button>
                                ) : (
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 border-teal-500 text-teal-500 hover:bg-teal-50"
                                    onClick={() => { setSelectedVariantIndex(actualIndex); setIsMediaSlideOpen(true) }}
                                  >
                                    Upload
                                  </Button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0 border-gray-300 hover:bg-gray-100"
                                    onClick={() => { setSelectedAdditionalDetailsIndex(actualIndex); setIsAdditionalDetailsOpen(true) }}
                                  >
                                    <CirclePlus className="h-4 w-4 text-gray-600" />
                                  </Button>
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0 border-gray-300 hover:bg-red-50"
                                    onClick={() => {
                                      // Remove the variant
                                      const updatedVariants = createdVariants.filter((_, i) => i !== actualIndex)
                                      setCreatedVariants(updatedVariants)

                                      // Also reindex extraChargeInputs to match new variant indices
                                      setExtraChargeInputs(prev => {
                                        const reindexed: Record<number, string> = {}
                                        updatedVariants.forEach((variant, newIndex) => {
                                          // Find the old index by matching variant ID
                                          const oldIndex = createdVariants.findIndex(v => v.id === variant.id)
                                          if (oldIndex !== -1 && prev[oldIndex] !== undefined) {
                                            reindexed[newIndex] = prev[oldIndex]
                                          }
                                        })
                                        return reindexed
                                      })
                                      
                                      // Update attribute rows to remove values that are no longer used
                                      if (updatedVariants.length > 0) {
                                        const validRows = attributeRows.filter(row => 
                                          row.attributeType && row.attributeValues && row.attributeValues.trim()
                                        )
                                        
                                        // Get all unique values still used by remaining variants for each attribute
                                        const updatedAttributeRows = validRows
                                          .map(row => {
                                            const usedValues = new Set<string>()
                                            updatedVariants.forEach(variant => {
                                              const value = (variant as any)[row.attributeType]
                                              if (value && value !== 'N/A') {
                                                usedValues.add(value)
                                              }
                                            })
                                            
                                            return {
                                              ...row,
                                              attributeValues: Array.from(usedValues).join(', ')
                                            }
                                          })
                                          .filter(row => row.attributeValues.trim() !== '') // Remove rows with no values
                                        
                                        setAttributeRows(updatedAttributeRows)

                                        // Update options data to reflect the changes
                                        const optionsData: Option[] = updatedAttributeRows.map(row => ({
                                          name: row.attributeType,
                                          values: row.attributeValues.split(',').map(v => v.trim()).filter(v => v)
                                        }))
                                        onOptionsChange(optionsData)
                                      } else {
                                        // If no variants left, clear attribute rows
                                        setAttributeRows([])
                                        setShowVariantsTable(false)
                                        onOptionsChange([])
                                      }
                                    }}
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* No results message */}
                  {filteredVariants.length === 0 && searchQuery.trim() && (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm font-medium">No variants found matching "{searchQuery}"</p>
                    </div>
                  )}
                  
                  {/* Pagination Footer */}
                  {filteredVariants.length > 0 && (
                    <div className="px-5 py-[15px] border-t border-gray-200 flex items-center justify-between rounded-br-[5px] rounded-bl-[5px]">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">Row Per Page</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors duration-200 min-w-[60px]">
                            {itemsPerPage}
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[60px] min-w-[60px]">
                            {[5, 10, 15].map((value) => {
                              const isDisabled = filteredVariants.length < value
                              return (
                                <DropdownMenuItem
                                  key={value}
                                  onClick={() => !isDisabled && handleItemsPerPageChange(value.toString())}
                                  disabled={isDisabled}
                                  className={`${
                                    isDisabled 
                                      ? 'cursor-not-allowed opacity-50 text-gray-400' 
                                      : 'cursor-pointer focus:bg-gray-100 focus:text-gray-900'
                                  } ${
                                    itemsPerPage === value && !isDisabled ? 'bg-secondary-900 text-white' : ''
                                  }`}
                                >
                                  {value}
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <span className="text-sm text-gray-600">Entries</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          type="button"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {getPageNumbers().map((page, index) => (
                            page === '...' ? (
                              <span key={index} className="px-2 text-sm text-gray-500">...</span>
                            ) : (
                              <button
                                type="button"
                                key={index}
                                onClick={() => handlePageChange(page as number)}
                                className={`w-8 h-8 text-sm rounded-full border flex items-center justify-center ${
                                  currentPage === page
                                    ? 'text-white bg-secondary-900'
                                    : 'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          ))}
                        </div>
                        
                        <button 
                          type="button"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
              <div className="text-center py-[30px]">
                <p className="text-gray-400 text-sm font-medium mb-3">No variants created yet</p>
                <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 font-medium bg-secondary-900 hover:bg-secondary-800 text-white hover:text-white"
                      onClick={() =>setIsSlideOpen(true)}
                    >
                      Create Variants
                    </Button>
              </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Slide Panel */}
      <div className={cn(
        "fixed inset-0 z-40 transition-all duration-300 ease-in-out",
        isSlideOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        {/* Backdrop */}
        <div 
          className={cn(
            "fixed inset-0 bg-white transition-all duration-300 ease-in-out",
            isSlideOpen ? "bg-opacity-50" : "bg-opacity-0"
          )}
          onClick={() => setIsSlideOpen(false)}
        />
        
        {/* Sliding Panel */}
        <div className={cn(
          "fixed right-0 top-0 h-full w-[606px] bg-gray-50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out rounded-l-lg",
          isSlideOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-[16px] h-[56px] bg-white border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <h2 className="label-1 font-semibold text-gray-900 font-urbanist">
                  Create Product Variants
                </h2>
                {/* <Info className="h-4 w-4 text-gray-400" /> */}
              </div>
              <button 
                type="button"
                onClick={() => setIsSlideOpen(false)}
                className="text-gray-700 hover:text-gray-900 font-bold  font-urbanist text-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}

            
          <div className="flex-1 overflow-y-auto p-[16px] space-y-6 bg-gray-50">
            {/* Variant Details Summary Card - show automatically when there are attribute rows */}
            {(() => {
              const validRows = attributeRows.filter(row => 
                row.attributeType && row.attributeValues && row.attributeValues.trim()
              )
              return validRows.length > 0 && variantCombinations.length > 0
            })() && (
              <div 
                className="bg-white rounded-lg border border-gray-200"
                style={{
                  animation: 'slideIn 0.3s ease-out'
                }}
              >
                <div className="flex items-center justify-between p-[8px] border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Variant Details</h3>
                    {/* <Info className="h-4 w-4 text-gray-400" /> */}
                  </div>
                  <div className="text-sm font-medium text-gray-600 font-urbanist">
                    Total Variants: {variantCombinations.length}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {(() => {
                    const validRows = attributeRows.filter(row => 
                      row.attributeType && row.attributeValues && row.attributeValues.trim()
                    )
                    
                    return validRows.map((row, index) => {
                      const values = row.attributeValues.split(',').map(v => v.trim()).filter(v => v)
                      return (
                        <div key={row.id} className={`${index % 2 === 0 ? 'border-r border-gray-200 pr-4 border-t border-b px-[8px]' : 'border-t border-b px-[8px]'}`}>
                          <div className="text-sm font-semibold text-gray-700 font-urbanist my-2 ">
                            {row.attributeType}: {values.length}
                          </div>
                          <div className="text-sm text-gray-600 font-urbanist">
                            {values.join(', ')}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
                <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Add variants attribute and value</h3>
                {/* <Info className="h-4 w-4 text-gray-400" /> */}
              </div>
              <div className="flex items-start py-[8px] px-[8px]">
                      {/* Left side - Image and details (2/3 of space) */}
                      <div className="flex items-start space-x-[8px] flex-[4]">
                        {imagePreviewUrl && (
                        <img src={imagePreviewUrl} alt={productName} className="w-[50px] h-[50px] object-cover rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="body-2 text-gray-900 font-urbanist font-semibold">{productName}</div>
                          <div className="body-3 text-gray-500 font-urbanist text-sm">
                              <span className='text-black font-spectral'>{productWeight}</span>/unit
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Price and subtotal (1/3 of space) */}
                      <div className="text-right ml-4 flex-[1]">
                        <div className="body-3 text-gray-900 font-spectral font-bold">₹{productPrice}</div>
                        <div className="body-3 text-gray-500 font-urbanist text-sm">/unit</div>
                      </div>
                    </div>
                    
                    {/* Dynamic Attribute Rows */}
                    {attributeRows.map((row) => (
                      <div 
                        key={row.id} 
                        className="relative p-4 rounded-lg bg-white animate-[slideIn_0.3s_ease-out]"
                        style={{
                          animation: 'slideIn 0.3s ease-out'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => removeAttributeRow(row.id)}
                          className="absolute top-3 right-3 w-6 h-6 border border-red-500 hover:bg-red-600 rounded-full flex items-center justify-center"
                        >
                          <X className="h-3 w-3 text-red-500 hover:text-white hover:bg-red-600" />
                        </button>
                        
                        <div className="pr-8">
                          <div>
                              <Select
                                value={row.attributeType}
                                onValueChange={(value) => handleAttributeTypeChange(row.id, value)}
                              >
                                <SelectTrigger className="w-full border-gray-300 h-9 body-3 font-urbanist text-sm text-neutral-900 rounded-t-lg rounded-b-none">
                                  <SelectValue placeholder="Select Attribute type Here like : Color, Fabric, Size" />
                                </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  const availableTypes = getAvailableAttributeTypes(row.id)
                                  return (
                                    <>
                                      {availableTypes.length > 0 ? (
                                        availableTypes.map((option) => (
                                          <SelectItem key={option.name} value={option.name}>
                                            {option.name}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <div className="px-2 py-1.5 text-sm text-gray-500">
                                          {attributeRows.some(r => r.id !== row.id && r.attributeType) 
                                            ? "All attribute types have been selected in other rows" 
                                            : "No attribute types available"
                                          }
                                        </div>
                                      )}
                                      <SelectItem value="other" className="border-t border-gray-200 mt-1 pt-1">
                                        <div className="flex items-center">
                                          <Plus className="h-4 w-4 mr-2" />
                                          <span>Other (Add New Attribute)</span>
                                        </div>
                                      </SelectItem>
                                    </>
                                  )
                                })()}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            {/* Display available preset values and input field */}
                            {row.attributeType && (
                              <div 
                                className="mb-2 p-2 rounded-b-lg border border-gray-300 border-t-0"
                                style={{
                                  animation: 'slideIn 0.3s ease-out'
                                }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs text-gray-500 font-urbanist">
                                    {getAvailableValuesForAttribute(row.attributeType).length > 0 
                                      ? `Available ${row.attributeType} values (click to add):`
                                      : `No preset values found for ${row.attributeType}`
                                    }
                                  </Label>
                                </div>
                                
                                {getAvailableValuesForAttribute(row.attributeType).length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {getAvailableValuesForAttribute(row.attributeType).map((value) => {
                                      const isSelected = isValueSelected(row.id, value.name)
                                      return (
                                        <Badge
                                          key={value.name}
                                          variant={isSelected ? "default" : "outline"}
                                          className={cn(
                                            "cursor-pointer transition-colors body-3 font-urbanist text-xs",
                                            isSelected 
                                              ? "bg-secondary-900 text-white hover:bg-secondary-800" 
                                              : "hover:bg-secondary-900 hover:text-white"
                                          )}
                                          onClick={() => togglePresetValueToAttribute(row.id, value.name)}
                                        >
                                          {value.name}
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 font-urbanist italic mb-3">
                                    Add custom values below
                                  </div>
                                )}
                                
                                {/* Comma-separated input field inside the same div */}
                                <div>
                                  <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm mb-2 block">
                                    Enter {row.attributeType} of the variants separated by commas
                                  </Label>
                                  <Input
                                    type="text"
                                    placeholder="Red, Blue, Green, Yellow"
                                    value={row.attributeValues}
                                    onChange={(e) => updateAttributeRow(row.id, 'attributeValues', e.target.value)}
                                    className="border-gray-300 h-9 body-3 font-urbanist text-sm text-neutral-900"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className={cn(
                      "flex",
                      hasValidAttributesForPreview() ? "justify-between" : "justify-end"
                    )}>
                      {hasValidAttributesForPreview() && (
                        <Button 
                          type="button"
                          onClick={() => setShowPreviewVariants(!showPreviewVariants)}
                          className="mb-[8px] h-6 bg-white hover:bg-white text-secondary-900 hover:text-secondary-800 border border-secondary-900 px-2 py-4 rounded-lg ml-4"
                        >
                          Preview Variant
                        </Button>
                      )}
                      {attributeRows.length < 2 && (
                        <Button 
                          type="button"
                          onClick={addAttributeRow}
                          className="h-6 bg-white hover:bg-white text-secondary-900 hover:text-secondary-800 border border-secondary-900 px-2 py-4 rounded-lg mb-[8px] mr-[8px]"
                        >
                          Add New Attribute
                          <CirclePlus className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
            </div>

            {/* Preview Variants Section - Outside the main content div */}
            {showPreviewVariants && hasValidAttributesForPreview() && variantCombinations.length > 0 && (
              <div 
                className="mt-4 bg-white border border-gray-200 rounded-lg"
                style={{
                  animation: 'slideIn 0.3s ease-out'
                }}
              >
              <div className="flex items-center space-x-2 border-b border-gray-200 p-[8px]">
                <h3 className="label-1 font-semibold text-gray-900 font-urbanist">Preview Variants Listing</h3>
                {/* <Info className="h-4 w-4 text-gray-400" /> */}  
              </div>
                
                <div className="flex flex-wrap gap-2 p-[8px]">
                  {variantCombinations.map((combination, index) => (
                    <div
                      key={index}
                      className="flex items-center border border-natural-800 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      <span className="body-3 font-urbanist text-natural-800">{combination}</span>
                      <button
                        type="button"
                        onClick={() => removeVariantCombination(combination)}
                        className="ml-2 w-5 h-5 border border-red-500 hover:bg-red-600 text-red-500 hover:text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="h-3 w-3 text-red-500 hover:text-white hover:bg-red-600" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleOpenAddVariantRow}
                    className="flex items-center bg-white text-secondary-900 border border-secondary-900 hover:bg-secondary-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CirclePlus className="h-4 w-4 mr-1" />
                    Add New variant
                  </button>
                </div>

                {/* Collapsible Add New Variant Row */}
                {isAddVariantRowOpen && (
                  <div 
                    className="ml-2 mr-2 py-2 border-t border-gray-200 animate-[slideIn_0.3s_ease-out]"
                    style={{
                      animation: 'slideIn 0.3s ease-out'
                    }}
                  >
                    
                    
                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        const validRows = attributeRows.filter(row => 
                          row.attributeType && row.attributeValues && row.attributeValues.trim()
                        )
                        
                        return validRows.map((row) => {
                          const availableValues = row.attributeValues.split(',').map(v => v.trim()).filter(v => v)
                          
                          return (
                            <div key={row.id} className="space-y-2">
                              <Select
                                value={newVariantSelections[row.attributeType] || ''}
                                onValueChange={(value) => {
                                  setNewVariantSelections(prev => ({
                                    ...prev,
                                    [row.attributeType]: value
                                  }))
                                }}
                              >
                                <SelectTrigger className="border-gray-300 h-10 body-3 font-urbanist text-sm text-neutral-900">
                                  <SelectValue placeholder={`Choose ${row.attributeType}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableValues.map((value) => (
                                    <SelectItem key={value} value={value}>
                                      {value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )
                        })
                      })()}
                      
                      {(() => {
                        const validRows = attributeRows.filter(row => 
                          row.attributeType && row.attributeValues && row.attributeValues.trim()
                        )
                        const allSelected = validRows.every(row => 
                          newVariantSelections[row.attributeType] && newVariantSelections[row.attributeType].trim()
                        )
                        
                        if (allSelected && validRows.length > 0) {
                          const variantParts = validRows.map(row => newVariantSelections[row.attributeType])
                          const previewCombination = variantParts.join(' x ')
                          
                          return (
                            <div className="col-span-2 p-3 bg-white rounded-lg border border-gray-200">
                              <Label className="body-2 font-semibold text-gray-700 font-urbanist mb-2 block">
                                Preview:
                              </Label>
                              <div className="text-sm text-gray-600 font-urbanist">
                                {previewCombination}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                      
                      <div className="col-span-2 flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCloseAddVariantRow}
                          className="body-3 font-urbanist border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleAddNewVariant}
                          disabled={(() => {
                            const validRows = attributeRows.filter(row => 
                              row.attributeType && row.attributeValues && row.attributeValues.trim()
                            )
                            return !validRows.every(row => 
                              newVariantSelections[row.attributeType] && newVariantSelections[row.attributeType].trim()
                            )
                          })()}
                          className="body-3 font-urbanist bg-secondary-900 hover:bg-secondary-800 text-white"
                        >
                          Add Variant
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Create Table Button - Outside preview section */}
            {variantCombinations.length >= 1 && (
              <div className="mt-4 flex justify-center">
                <Button 
                  type="button"
                  onClick={createVariantsTable}
                  className="h-10 bg-secondary-900 hover:bg-secondary-800 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Create Variants Table
                </Button>
              </div>
            )}

            </div>
          </div>
        </div>
      </div>

      {/* Media Upload Slide Panel */}
      <div className={cn(
        "fixed inset-0 z-40 transition-all duration-300 ease-in-out",
        isMediaSlideOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        <div 
          className={cn(
            "fixed inset-0 bg-white transition-all duration-300 ease-in-out",
            isMediaSlideOpen ? "bg-opacity-50" : "bg-opacity-0"
          )}
          onClick={() => { setIsMediaSlideOpen(false); setSelectedVariantIndex(null) }}
        />
        <div className={cn(
          "fixed right-0 top-0 h-full w-[606px] bg-gray-50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out rounded-l-lg",
          isMediaSlideOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-[16px] h-[56px] bg-white border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <h2 className="label-1 font-semibold text-gray-900 font-urbanist">Upload Variant Media</h2>
                {/* <Info className="h-4 w-4 text-gray-400" /> */}  
              </div>
              <button 
                type="button"
                onClick={() => { setIsMediaSlideOpen(false); setSelectedVariantIndex(null) }}
                className="text-gray-700 hover:text-gray-900 font-bold  font-urbanist text-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-[16px] space-y-4 bg-gray-50">
              {selectedVariantIndex !== null && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  {/* Product row */}
                  <div className="flex items-start">
                    <img src={imagePreviewUrl} alt={productName} className="w-[56px] h-[56px] object-cover rounded-lg flex-shrink-0" />
                    <div className="ml-3 flex-1">
                      <div className="text-[16px] text-gray-900 font-urbanist font-semibold">{productName}</div>
                      <div className="body-3 text-gray-500 font-urbanist">{productWeight}<span className="ml-1">/unit</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] text-gray-900 font-spectral font-bold">₹{productPrice}</div>
                      <div className="body-3 text-gray-500 font-urbanist">/unit</div>
                    </div>
                  </div>

                  {/* Variant attributes chips */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {(() => {
                      const v = createdVariants[selectedVariantIndex] || {}
                      const validRows = attributeRows.filter(r => r.attributeType)
                      return validRows.map(row => (
                        <div key={row.id} className="border border-gray-200 rounded-lg">
                          <div className="text-[14px] font-semibold body-3 text-gray-500 font-urbanist border-b border-gray-200 px-[8px] py-[6px]">{row.attributeType}</div>
                          <div className="inline-flex font-semibold body-3 items-center border border-gray-200 rounded-lg px-[8px] py-[6px] text-[14px] text-gray-800 font-urbanist mx-[6px] my-[8px]">
                            {(v as any)[row.attributeType] || '-'}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>

                  {/* Upload area */}
                  <div className="mt-4 border-2 border-dashed border-teal-300 rounded-md p-6 text-center">
                    <div className="mx-auto mb-2 w-9 h-9 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-teal-600"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M20 16.5a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5 3.5 3.5 0 0 1 7.5 13H9"/></svg>
                    </div>
                    <div className="text-sm text-gray-600 font-urbanist">Drag your file(s) or <label htmlFor="media-input" className="text-secondary-900 underline cursor-pointer">browse</label></div>
                    <div className="mt-1 text-xs text-gray-500 font-urbanist">Max 10 MB files are allowed</div>
                    <input id="media-input" type="file" className="hidden" multiple accept="image/jpeg,image/jpg,image/png,image/webp" onChange={(e)=>handleFileUpload(selectedVariantIndex, e.target.files)} />
                  </div>

                  {/* Previews */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {(createdVariants[selectedVariantIndex]?.media || []).map((file, idx) => {
                      const src = variantMediaUrls[selectedVariantIndex]?.[idx] || URL.createObjectURL(file)
                      return (
                        <div key={idx} className="relative border border-gray-200 rounded-lg p-2 bg-white">
                          <img 
                            src={src} 
                            alt={file.name} 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleFileClick(file)}
                          />
                          <button 
                            type="button" 
                            className="absolute top-2 right-2 w-6 h-6 bg-white border rounded-full flex items-center justify-center" 
                            onClick={(e) => {
                              e.stopPropagation()
                              removePreviewAt(selectedVariantIndex, idx)
                            }}
                          >
                            <X className="h-3 w-3 text-gray-700" />
                          </button>
                          <div className="mt-2 text-[12px] text-gray-800 truncate font-urbanist">{file.name}</div>
                          <div className="text-[12px] text-gray-500 font-urbanist">{formatBytes(file.size)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Attribute Modal */}
      <Dialog open={isAddAttributeModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="label-1 font-semibold text-gray-900 font-urbanist flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Attribute
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="attribute-name" className="body-2 font-semibold text-gray-700 font-urbanist mb-2 block">
              Attribute Name
            </Label>
            <Input
              id="attribute-name"
              type="text"
              placeholder="Enter attribute name (e.g., Material, Style, Pattern)"
              value={newAttributeName}
              onChange={(e) => setNewAttributeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveNewAttribute()
                }
              }}
              className="border-gray-300 h-10 body-3 font-urbanist text-sm text-neutral-900"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 font-urbanist">
              Enter a custom attribute type that isn't in the predefined list.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="body-3 font-urbanist border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNewAttribute}
              disabled={!newAttributeName.trim()}
              className="body-3 font-urbanist bg-secondary-900 hover:bg-secondary-800 text-white"
            >
              Add Attribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Variant Details Modal */}
      <Dialog open={isAdditionalDetailsOpen} onOpenChange={setIsAdditionalDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="label-1 font-semibold text-gray-900 font-urbanist flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Additional Variant Details
            </DialogTitle>
          </DialogHeader>
          {selectedAdditionalDetailsIndex !== null && (
            <div className="py-4 space-y-4">
              {/* Extra Lead Time */}
              <div className="space-y-2">
                <Label htmlFor="extra-lead-time" className="body-2 font-semibold text-gray-700 font-urbanist">
                  Extra Lead Time (days)
                </Label>
                <Input
                  id="extra-lead-time"
                  type="text"
                  value={createdVariants[selectedAdditionalDetailsIndex]?.extraLeadTime === 0 ? '' : createdVariants[selectedAdditionalDetailsIndex]?.extraLeadTime || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setCreatedVariants(prev => 
                        prev.map((v, i) => 
                          i === selectedAdditionalDetailsIndex ? { ...v, extraLeadTime: value === '' ? 0 : parseFloat(value) } : v
                        )
                      )
                    }
                  }}
                  placeholder="0"
                  className="border-gray-300 h-10 body-3 font-urbanist text-sm text-neutral-900"
                />
              </div>

              {/* Variant Dimensions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="body-2 font-semibold text-gray-700 font-urbanist">
                    Variant Dimensions
                  </Label>
                  <Select 
                    value={createdVariants[selectedAdditionalDetailsIndex]?.variantDimensionUnit || 'cm'} 
                    onValueChange={(value) => {
                      setCreatedVariants(prev => 
                        prev.map((v, i) => 
                          i === selectedAdditionalDetailsIndex ? { ...v, variantDimensionUnit: value } : v
                        )
                      )
                    }}
                  >
                    <SelectTrigger className="border-gray-300 h-8 w-20 body-3 font-urbanist text-sm text-neutral-900">
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
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 font-urbanist">Length</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={dimensionInputs.length}
                      onChange={(e) => {
                        const value = e.target.value
                        // Allow numbers, decimal point, and empty string
                        // This regex allows: empty, numbers, decimals like "10.", "10.5", ".5"
                        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                          setDimensionInputs(prev => ({ ...prev, length: value }))
                          // Update the variant with parsed value (or 0 if empty/invalid)
                          const numValue = value === '' || value === '.' || value === '-' ? 0 : parseFloat(value) || 0
                          setCreatedVariants(prev => 
                            prev.map((v, i) => 
                              i === selectedAdditionalDetailsIndex ? { ...v, variantLength: numValue } : v
                            )
                          )
                        }
                      }}
                      onBlur={() => {
                        // Ensure final value is properly formatted
                        const numValue = dimensionInputs.length === '' || dimensionInputs.length === '.' || dimensionInputs.length === '-'
                          ? 0
                          : parseFloat(dimensionInputs.length) || 0
                        setCreatedVariants(prev => 
                          prev.map((v, i) => 
                            i === selectedAdditionalDetailsIndex ? { ...v, variantLength: numValue } : v
                          )
                        )
                        setDimensionInputs(prev => ({
                          ...prev,
                          length: numValue === 0 ? '' : numValue.toString(),
                        }))
                      }}
                      placeholder="0"
                      className="border-gray-300 h-9 body-3 font-urbanist text-sm text-neutral-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 font-urbanist">Width</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={dimensionInputs.width}
                      onChange={(e) => {
                        const value = e.target.value
                        // Allow numbers, decimal point, and empty string
                        // This regex allows: empty, numbers, decimals like "10.", "10.5", ".5"
                        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                          setDimensionInputs(prev => ({ ...prev, width: value }))
                          // Update the variant with parsed value (or 0 if empty/invalid)
                          const numValue = value === '' || value === '.' || value === '-' ? 0 : parseFloat(value) || 0
                          setCreatedVariants(prev => 
                            prev.map((v, i) => 
                              i === selectedAdditionalDetailsIndex ? { ...v, variantWidth: numValue } : v
                            )
                          )
                        }
                      }}
                      onBlur={() => {
                        // Ensure final value is properly formatted
                        const numValue = dimensionInputs.width === '' || dimensionInputs.width === '.' || dimensionInputs.width === '-'
                          ? 0
                          : parseFloat(dimensionInputs.width) || 0
                        setCreatedVariants(prev => 
                          prev.map((v, i) => 
                            i === selectedAdditionalDetailsIndex ? { ...v, variantWidth: numValue } : v
                          )
                        )
                        setDimensionInputs(prev => ({
                          ...prev,
                          width: numValue === 0 ? '' : numValue.toString(),
                        }))
                      }}
                      placeholder="0"
                      className="border-gray-300 h-9 body-3 font-urbanist text-sm text-neutral-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 font-urbanist">Height</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={dimensionInputs.height}
                      onChange={(e) => {
                        const value = e.target.value
                        // Allow numbers, decimal point, and empty string
                        // This regex allows: empty, numbers, decimals like "10.", "10.5", ".5"
                        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                          setDimensionInputs(prev => ({ ...prev, height: value }))
                          // Update the variant with parsed value (or 0 if empty/invalid)
                          const numValue = value === '' || value === '.' || value === '-' ? 0 : parseFloat(value) || 0
                          setCreatedVariants(prev => 
                            prev.map((v, i) => 
                              i === selectedAdditionalDetailsIndex ? { ...v, variantHeight: numValue } : v
                            )
                          )
                        }
                      }}
                      onBlur={() => {
                        // Ensure final value is properly formatted
                        const numValue = dimensionInputs.height === '' || dimensionInputs.height === '.' || dimensionInputs.height === '-'
                          ? 0
                          : parseFloat(dimensionInputs.height) || 0
                        setCreatedVariants(prev => 
                          prev.map((v, i) => 
                            i === selectedAdditionalDetailsIndex ? { ...v, variantHeight: numValue } : v
                          )
                        )
                        setDimensionInputs(prev => ({
                          ...prev,
                          height: numValue === 0 ? '' : numValue.toString(),
                        }))
                      }}
                      placeholder="0"
                      className="border-gray-300 h-9 body-3 font-urbanist text-sm text-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* Variant Weight */}
              <div className="space-y-2">
                <Label className="body-2 font-semibold text-gray-700 font-urbanist">
                  Variant Weight
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={createdVariants[selectedAdditionalDetailsIndex]?.variantWeight === '0' || !createdVariants[selectedAdditionalDetailsIndex]?.variantWeight ? '' : createdVariants[selectedAdditionalDetailsIndex]?.variantWeight}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setCreatedVariants(prev => 
                          prev.map((v, i) => 
                            i === selectedAdditionalDetailsIndex ? { ...v, variantWeight: value === '' ? '0' : value } : v
                          )
                        )
                      }
                    }}
                    placeholder="0"
                    className="border-gray-300 h-10 flex-1 body-3 font-urbanist text-sm text-neutral-900"
                  />
                  <Select 
                    value={createdVariants[selectedAdditionalDetailsIndex]?.variantWeightUnit || 'kg'} 
                    onValueChange={(value) => {
                      setCreatedVariants(prev => 
                        prev.map((v, i) => 
                          i === selectedAdditionalDetailsIndex ? { ...v, variantWeightUnit: value } : v
                        )
                      )
                    }}
                  >
                    <SelectTrigger className="border-gray-300 h-10 w-24 body-3 font-urbanist text-sm text-neutral-900">
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
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdditionalDetailsOpen(false)
                setSelectedAdditionalDetailsIndex(null)
              }}
              className="body-3 font-urbanist border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsAdditionalDetailsOpen(false)
                setSelectedAdditionalDetailsIndex(null)
              }}
              className="body-3 font-urbanist bg-secondary-900 hover:bg-secondary-800 text-white"
            >
              Save Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImagePreviewModal
        open={isPreviewOpen}
        onOpenChange={handleClosePreview}
        imageUrl={previewModalImageUrl}
        alt="Image preview"
      />
    </>
  )
}

export default ProductOptionsVariants

