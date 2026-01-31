"use client"
import React, { useEffect, useState, useRef, FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: number
  name: string
}

interface GenerateDescriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Form data props
  name: string
  category: string
  price: number
  material: string[]
  dimensions: {
    length: number
    width: number
    height: number
    unit: string
  }
  images: File[]
  imageUrls: string[]
  categories?: Category[]
  // Callbacks to update form
  onNameChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onPriceChange: (value: number) => void
  onMaterialChange: (value: string[]) => void
  onDimensionsChange: (dimensions: { length: number; width: number; height: number; unit: string }) => void
  onImagesChange?: (files: File[]) => void
  // Optional fields
  color?: string
  features?: string
  additionalInfo?: string
  onColorChange?: (value: string) => void
  onFeaturesChange?: (value: string) => void
  onAdditionalInfoChange?: (value: string) => void
  onDescriptionChange?: (value: string) => void
}

const formatNumberInputValue = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value) || value === 0) {
    return ''
  }
  return value.toString()
}

export default function GenerateDescriptionModal({
  open,
  onOpenChange,
  name,
  category,
  price,
  material,
  dimensions,
  images,
  imageUrls,
  categories = [],
  onNameChange,
  onCategoryChange,
  onPriceChange,
  onMaterialChange,
  onDimensionsChange,
  onImagesChange,
  color = '',
  features = '',
  additionalInfo = '',
  onColorChange,
  onFeaturesChange,
  onAdditionalInfoChange,
  onDescriptionChange,
}: GenerateDescriptionModalProps) {
  // Local state for editable fields
  const [localName, setLocalName] = useState(name)
  const [localCategory, setLocalCategory] = useState(category)
  const [localPrice, setLocalPrice] = useState(formatNumberInputValue(price))
  const [localColor, setLocalColor] = useState(color)
  const [localMaterial, setLocalMaterial] = useState(material.join(', '))
  const [localDimensions, setLocalDimensions] = useState({
    length: formatNumberInputValue(dimensions.length),
    width: formatNumberInputValue(dimensions.width),
    height: formatNumberInputValue(dimensions.height),
    unit: dimensions.unit,
  })
  const [localFeatures, setLocalFeatures] = useState(features)
  const [localAdditionalInfo, setLocalAdditionalInfo] = useState(additionalInfo)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localImages, setLocalImages] = useState<File[]>(images)
  const [localImageUrls, setLocalImageUrls] = useState<string[]>(imageUrls)
  const [imageObjectUrls, setImageObjectUrls] = useState<Map<number, string>>(new Map())
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  // Sync local state with props when they change
  useEffect(() => {
    setLocalName(name)
  }, [name])

  useEffect(() => {
    setLocalCategory(category)
  }, [category])

  useEffect(() => {
    setLocalPrice(formatNumberInputValue(price))
  }, [price])

  useEffect(() => {
    setLocalMaterial(material.join(', '))
  }, [material])

  useEffect(() => {
    setLocalDimensions({
      length: formatNumberInputValue(dimensions.length),
      width: formatNumberInputValue(dimensions.width),
      height: formatNumberInputValue(dimensions.height),
      unit: dimensions.unit,
    })
  }, [dimensions])

  useEffect(() => {
    setLocalColor(color)
  }, [color])

  useEffect(() => {
    setLocalFeatures(features)
  }, [features])

  useEffect(() => {
    setLocalAdditionalInfo(additionalInfo)
  }, [additionalInfo])

  useEffect(() => {
    setLocalImages(images)
  }, [images])

  useEffect(() => {
    setLocalImageUrls(imageUrls)
  }, [imageUrls])

  // Create object URLs for File objects
  useEffect(() => {
    const urls = new Map<number, string>()
    localImages.forEach((file, index) => {
      const url = URL.createObjectURL(file)
      urls.set(index, url)
    })
    setImageObjectUrls(urls)

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [localImages])

  const getAllImages = () => {
    const allImages: Array<{ src: string; type: 'file' | 'url'; originalIndex: number }> = []
    
    // Add File images
    localImages.forEach((_, index) => {
      const objectUrl = imageObjectUrls.get(index)
      if (objectUrl) {
        allImages.push({ src: objectUrl, type: 'file', originalIndex: index })
      }
    })
    
    // Add URL images
    localImageUrls.forEach((url, index) => {
      allImages.push({ src: url, type: 'url', originalIndex: index })
    })
    
    return allImages
  }

  const handleNameChange = (value: string) => {
    setLocalName(value)
    onNameChange(value)
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const handleCategoryChange = (value: string) => {
    setLocalCategory(value)
    onCategoryChange(value)
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }))
    }
  }

  const handlePriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setLocalPrice(value)
    onPriceChange(numValue)
    if (errors.price) {
      setErrors(prev => ({ ...prev, price: '' }))
    }
  }

  const handleColorChange = (value: string) => {
    setLocalColor(value)
    onColorChange?.(value)
    if (errors.color) {
      setErrors(prev => ({ ...prev, color: '' }))
    }
  }

  const handleMaterialChange = (value: string) => {
    setLocalMaterial(value)
    const materialArray = value.split(',').map(m => m.trim()).filter(m => m.length > 0)
    onMaterialChange(materialArray)
    if (errors.material) {
      setErrors(prev => ({ ...prev, material: '' }))
    }
  }

  const handleDimensionsChange = (field: 'length' | 'width' | 'height' | 'unit', value: string) => {
    const newDimensions = { ...localDimensions, [field]: value }
    setLocalDimensions(newDimensions)
    
    const length = parseFloat(newDimensions.length) || 0
    const width = parseFloat(newDimensions.width) || 0
    const height = parseFloat(newDimensions.height) || 0
    
    onDimensionsChange({
      length,
      width,
      height,
      unit: newDimensions.unit,
    })
    
    if (errors.dimensions) {
      setErrors(prev => ({ ...prev, dimensions: '' }))
    }
  }

  const handleFeaturesChange = (value: string) => {
    setLocalFeatures(value)
    onFeaturesChange?.(value)
  }

  const handleAdditionalInfoChange = (value: string) => {
    setLocalAdditionalInfo(value)
    onAdditionalInfoChange?.(value)
  }

  const handleImageClick = () => {
    imageInputRef.current?.click()
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter(file => {
        if (!file.type.startsWith('image/')) {
          setUploadError(`File ${file.name} is not an image`)
          return false
        }
        if (file.size > 20 * 1024 * 1024) {
          setUploadError(`File ${file.name} is too large (max 20MB)`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      setUploadError(null)
      setLocalImages(prev => [...prev, ...validFiles])
      onImagesChange?.([...localImages, ...validFiles])
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter(file => {
        if (!file.type.startsWith('image/')) {
          setUploadError(`File ${file.name} is not an image`)
          return false
        }
        if (file.size > 20 * 1024 * 1024) {
          setUploadError(`File ${file.name} is too large (max 20MB)`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      setUploadError(null)
      setLocalImages(prev => [...prev, ...validFiles])
      onImagesChange?.([...localImages, ...validFiles])
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }))
      }
    }
  }

  const removeImage = (originalIndex: number, type: 'file' | 'url') => {
    if (type === 'file') {
      const newImages = localImages.filter((_, i) => i !== originalIndex)
      setLocalImages(newImages)
      onImagesChange?.(newImages)
    } else {
      const newUrls = localImageUrls.filter((_, i) => i !== originalIndex)
      setLocalImageUrls(newUrls)
    }
    const remainingImages = getAllImages()
    if (remainingImages.length === 0) {
      setErrors(prev => ({ ...prev, image: 'Image is required' }))
    } else if (errors.image) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.image
        return newErrors
      })
    }
  }

  const validateFields = () => {
    const newErrors: Record<string, string> = {}

    if (!localName.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!localCategory.trim()) {
      newErrors.category = 'Category is required'
    }
    if (!localPrice.trim() || parseFloat(localPrice) <= 0) {
      newErrors.price = 'Price is required and must be greater than 0'
    }
    if (!localColor.trim()) {
      newErrors.color = 'Color is required'
    }
    if (!localMaterial.trim()) {
      newErrors.material = 'Material is required'
    }
    if (!localDimensions.length.trim() || parseFloat(localDimensions.length) <= 0) {
      newErrors.dimensions = 'Dimensions are required'
    }
    if (!localDimensions.width.trim() || parseFloat(localDimensions.width) <= 0) {
      newErrors.dimensions = 'Dimensions are required'
    }
    if (!localDimensions.height.trim() || parseFloat(localDimensions.height) <= 0) {
      newErrors.dimensions = 'Dimensions are required'
    }
    if (getAllImages().length === 0) {
      newErrors.image = 'Image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClose = () => {
    setErrors({})
    setUploadError(null)
    setError('')
    setIsLoading(false)
    onOpenChange(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Validate fields before submitting
    if (!validateFields()) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const allImages = getAllImages()
      
      if (allImages.length === 0) {
        throw new Error('At least one image is required')
      }

      // Use the first image for generation
      const firstImage = allImages[0]
      
      // Get the image file - if it's a File, use it directly; if it's a URL, we need to fetch it
      let imageFile: File
      if (firstImage.type === 'file') {
        imageFile = localImages[firstImage.originalIndex]
      } else {
        // For URL images, fetch and convert to File
        const response = await fetch(firstImage.src)
        const blob = await response.blob()
        imageFile = new File([blob], 'image.jpg', { type: blob.type })
      }

      // Use modern API wrapper for consistency
      const { generateProductDescription } = await import('@/lib/api/endpoints/ai')
      
      const data = await generateProductDescription({
        image: imageFile,
        name: localName || undefined,
        category: localCategory || undefined,
        price: localPrice || undefined,
        color: localColor || undefined,
        material: localMaterial || undefined,
        dimensions: `${localDimensions.length} x ${localDimensions.width} x ${localDimensions.height} ${localDimensions.unit}`,
        features: localFeatures || undefined,
        additional_info: localAdditionalInfo || undefined,
      })

      const generatedDescription = data.description || ''
      
      // Automatically fill the description in the parent form
      if (onDescriptionChange && generatedDescription) {
        onDescriptionChange(generatedDescription)
      }
      
      // Close the modal after successful generation (small delay to show success)
      if (generatedDescription) {
        handleClose()
        setIsLoading(false)
        toast.success('Description updated successfully')
        return
      }

      // If no description was generated, reset loading
      setIsLoading(false)

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setIsLoading(false)
      toast.success('Description updated failed')
    }
  }

  const allImages = getAllImages()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 font-urbanist">
            Generate Description
          </DialogTitle>
        </DialogHeader>
         
          <form ref={formRef} onSubmit={handleSubmit}>
          {isLoading ? (
            <div className='flex justify-center items-center py-[300px]'>
              <div className='text-center'>
                <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-yellow-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Generating...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                    Images <span className="text-red-500">*</span>
                  </Label>
                  {allImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {allImages.map((img, index) => (
                        <div key={`${img.type}-${index}`} className="relative border border-gray-200 rounded-lg p-2 bg-gray-50">
                          <img
                            src={img.src}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeImage(img.originalIndex, img.type)
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                      errors.image
                        ? 'border-red-500 bg-red-50'
                        : isDragOver
                        ? 'border-secondary-900 bg-secondary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleImageClick}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-1 text-sm">Upload product images</p>
                    <p className="text-xs text-gray-500">Click to browse</p>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploadError && (
                    <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                  )}
                  {errors.image && (
                    <p className="text-xs text-red-600 mt-1">{errors.image}</p>
                  )}
                </div>

                {/* Row 1: Name, Category, Price */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="modal-name" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-name"
                      value={localName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`body-3 font-urbanist text-sm ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="modal-category" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select value={localCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger
                        id="modal-category"
                        className={`body-3 font-urbanist text-sm ${errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="z-[101]">
                        {categories
                          .filter((cat) => cat.name && cat.name.trim() !== '')
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-xs text-red-600 mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="modal-price" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                      Price <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={localPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className={`body-3 font-urbanist text-sm ${errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      placeholder="Enter price"
                    />
                    {errors.price && (
                      <p className="text-xs text-red-600 mt-1">{errors.price}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Material, Color, Dimensions */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="modal-material" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                      Material <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-material"
                      value={localMaterial}
                      onChange={(e) => handleMaterialChange(e.target.value)}
                      className={`body-3 font-urbanist text-sm ${errors.material ? 'mt-4 border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      placeholder="Enter materials (comma-separated)"
                    />
                    {errors.material && (
                      <p className="text-xs text-red-600 mt-1">{errors.material}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="modal-color" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                      Color <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-color"
                      value={localColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className={`body-3 font-urbanist text-sm ${errors.color ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      placeholder="Enter color"
                    />
                    {errors.color && (
                      <p className="text-xs text-red-600 mt-1">{errors.color}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                        Dimensions <span className="text-red-500">*</span>
                      </Label>
                      <Select value={localDimensions.unit} onValueChange={(value) => handleDimensionsChange('unit', value)}>
                        <SelectTrigger className="border-gray-300 h-8 w-20 body-3 font-urbanist text-sm text-neutral-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[101]">
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                          <SelectItem value="in">in</SelectItem>
                          <SelectItem value="ft">ft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localDimensions.length}
                        onChange={(e) => handleDimensionsChange('length', e.target.value)}
                        className={`body-3 font-urbanist text-sm ${errors.dimensions ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        placeholder="Length"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localDimensions.width}
                        onChange={(e) => handleDimensionsChange('width', e.target.value)}
                        className={`body-3 font-urbanist text-sm ${errors.dimensions ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        placeholder="Width"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localDimensions.height}
                        onChange={(e) => handleDimensionsChange('height', e.target.value)}
                        className={`body-3 font-urbanist text-sm ${errors.dimensions ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        placeholder="Height"
                      />
                    </div>
                    {errors.dimensions && (
                      <p className="text-xs text-red-600 mt-1">{errors.dimensions}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Features and Additional Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="modal-features" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                      Features
                    </Label>
                    <Textarea
                      id="modal-features"
                      value={localFeatures}
                      onChange={(e) => handleFeaturesChange(e.target.value)}
                      className="body-3 font-urbanist text-sm border-gray-300 min-h-[60px]"
                      placeholder="Enter features (optional)"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="modal-additional-info" className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
                      Additional Information
                    </Label>
                    <Textarea
                      id="modal-additional-info"
                      value={localAdditionalInfo}
                      onChange={(e) => handleAdditionalInfoChange(e.target.value)}
                      className="body-3 font-urbanist text-sm border-gray-300 min-h-[60px]"
                      placeholder="Enter additional information (optional)"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 border border-red-300 rounded-lg bg-red-50">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="body-3 font-urbanist text-sm border-gray-300"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="body-3 font-urbanist text-sm text-white bg-secondary-900 hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Description
                </Button>
              </DialogFooter>
            </>
          )}
          </form>
      </DialogContent>
    </Dialog>
  )
}
