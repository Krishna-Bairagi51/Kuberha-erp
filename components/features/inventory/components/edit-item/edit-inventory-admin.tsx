"use client"
import React, { memo } from 'react'
import { FormProvider, Controller } from 'react-hook-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Image as ImageIcon, Bell, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import PageHeader from '@/components/shared/layout/page-header'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { deleteProductImage } from '../../services/inventory.service'
import { useEditInventoryAdmin } from '../../hooks/use-edit-inventory-admin'
import ProductInformationSection from './sections/product-information-section'
import ProductSpecificationSection from './sections/product-specification-section'
import ImagesDocumentsSection from './sections/images-documents-section'
import GenerateDescriptionModal from '../generate-description-modal'

// Lazy load heavy components
const EditProductOptionsVariants = dynamic(() => import('./edit-variants-options-admin').then(m => ({ default: m.default })), {
  loading: () => <div className="p-4 text-center text-gray-500">Loading variants section...</div>,
  ssr: false
})
const LogisticsHandling = dynamic(() => import('../add-item/shared/logistics-handling').then(m => ({ default: m.default })), {
  loading: () => <div className="p-4 text-center text-gray-500">Loading logistics section...</div>,
  ssr: false
})
const PricingInventory = dynamic(() => import('../add-item/shared/pricing-inventory').then(m => ({ default: m.default })), {
  loading: () => <div className="p-4 text-center text-gray-500">Loading pricing section...</div>,
  ssr: false
})

// Memoized wrappers to prevent re-renders
const EditProductOptionsVariantsWrapper = memo(function EditProductOptionsVariantsWrapper({
  getFormValues,
  apiVariants,
  variantOptions,
  onOptionsChange,
  onVariantsChange,
  onSliderStateChange,
  selectedImages,
  apiImageUrls,
  isVariantChange,
}: any) {
  const formData = getFormValues()
  return (
    <EditProductOptionsVariants
      options={formData.options || []}
      variants={formData.variants || []}
      apiVariants={apiVariants}
      variantOptions={variantOptions}
      onOptionsChange={onOptionsChange}
      onVariantsChange={onVariantsChange}
      onSliderStateChange={onSliderStateChange}
      productName={formData.name || ''}
      productPrice={formData.mrp || 0}
      productWeight={formData.product_dimension_weight || 0}
      productImage={selectedImages[0] as File}
      productImageUrl={apiImageUrls[0]}
      isVariantChange={isVariantChange}
    />
  )
})

const GenerateDescriptionModalWrapper = memo(function GenerateDescriptionModalWrapper({
  open,
  onOpenChange,
  getFormValues,
  selectedImages,
  apiImageUrls,
  categories,
  handleInputChange,
  handleArrayChange,
  setSelectedImages,
  setApiImageUrls,
  onClose,
}: any) {
  const formData = getFormValues()
  return (
    <GenerateDescriptionModal
      open={open}
      onOpenChange={onOpenChange}
      name={formData.name || ''}
      category={formData.category || ''}
      price={formData.mrp || 0}
      material={formData.product_material || []}
      dimensions={{
        length: formData.product_dimension_length || 0,
        width: formData.product_dimension_width || 0,
        height: formData.product_dimension_height || 0,
        unit: formData.product_dimension_height_unit || 'cm'
      }}
      images={selectedImages}
      imageUrls={apiImageUrls}
      categories={categories}
      onNameChange={(value: string) => handleInputChange('name', value)}
      onCategoryChange={(value: string) => {
        // Update category
        handleInputChange('category', value)
        // Sync collections: remove previous category, add new category
        if (handleArrayChange) {
          const previousCategory = formData.category || ''
          const currentCollections = getFormValues('collections') || []
          let updatedCollections = [...currentCollections]
          
          // Remove previous category if it exists
          if (previousCategory && updatedCollections.includes(previousCategory)) {
            updatedCollections = updatedCollections.filter(c => c !== previousCategory)
          }
          
          // Add new category if not already present
          if (value && !updatedCollections.includes(value)) {
            updatedCollections.push(value)
          }
          
          handleArrayChange('collections', updatedCollections)
        }
      }}
      onPriceChange={(value: number) => handleInputChange('mrp', value)}
      onMaterialChange={(value: any) => handleInputChange('product_material', value)}
      onDimensionsChange={(dimensions: any) => {
        handleInputChange('product_dimension_length', dimensions.length)
        handleInputChange('product_dimension_width', dimensions.width)
        handleInputChange('product_dimension_height', dimensions.height)
        handleInputChange('product_dimension_height_unit', dimensions.unit)
      }}
      onImagesChange={(files: File[]) => {
        setSelectedImages(files)
        setApiImageUrls([])
      }}
      onDescriptionChange={(value: string) => {
        handleInputChange('description', value)
        onClose()
      }}
    />
  )
})

export const EditItemInventoryAdmin = ({ onClose, onSliderStateChange, selectedProductId }: { onClose: () => void, onSliderStateChange?: (isOpen: boolean) => void, selectedProductId: number }) => {
  // Use the custom hook to manage all state and handlers
  const {
    state: {
      inventoryData,
      isLoadingData,
      isLoadingProduct,
      dataError,
      productError,
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
      isSubmitting,
      isGenerateDescriptionModalOpen,
      formData,
      selectedImages,
      apiImageUrls,
      selectedDocument,
      isDragOver,
      uploadError,
      errors,
      apiVariants,
      subTitle,
      isFormDataPopulated,
      primaryImageUrl,
      variantCount,
      totalStockQuantity,
      supplierInfo,
      fieldChanges,
      isApproveModalOpen,
      isRejectModalOpen,
      rejectReason,
      isUpdatingStatus,
      rejectDescription,
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
      setErrors,
      setSelectedImages,
      setApiImageUrls,
      setSelectedDocument,
      setIsDragOver,
      setApiVariants,
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
      handleSubmit,
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
    form,
    getFormValues,
  } = useEditInventoryAdmin({ onClose, selectedProductId })

  // Handle removing API images with optimistic updates
  const handleRemoveApiImage = async (index: number) => {
    const imageUrlToDelete = apiImageUrls[index]
    if (!imageUrlToDelete) return
    
    // Optimistically remove from UI
    const previousUrls = [...apiImageUrls]
    setApiImageUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index)
      // Check if we need to show error after removing image
      const formData = getFormValues()
      const remainingImages = newUrls.length + selectedImages.length + (formData.images?.length || 0)
      if (remainingImages > 0 && form.formState.errors.images) {
        form.clearErrors('images')
      }
      return newUrls
    })
    
    // Call delete API in background
    try {
      await deleteProductImage(imageUrlToDelete)
      // Success - image already removed optimistically
    } catch (error) {
      // Revert on error
      setApiImageUrls(previousUrls)
      toast.error('Failed to delete image. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        
        <PageHeader title="Inventory" subTitle={subTitle} onTitleClick={onClose} />
        
        {/* Rejection Notes Banner - Show when item is rejected */}
        {isFormDataPopulated && (() => {
          const originalApiStatus = productDetailsResponse?.record?.item_status as string
          const isRejected = originalApiStatus === 'rejected'
          return isRejected && rejectionNotes ? (
            <div className="mx-[16px] mt-3 mb-3 bg-red-50 border-l-4 border-red-500 rounded px-3 py-2">
              <div className="flex items-start gap-2">
                {/* <Info className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" /> */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-red-900 font-urbanist mr-2">Rejection Reason:</span>
                  <span className="text-xs text-red-700 font-urbanist whitespace-pre-wrap">{rejectionNotes}</span>
                </div>
              </div>
            </div>
          ) : null
        })()}
        
        {/* Only show loading spinner on true initial load, not when data is cached */}
        {/* Render form structure immediately to improve perceived performance */}
        {(isLoadingData && !inventoryData) || (isLoadingProduct && !productDetailsResponse) ? (
          <LoadingSpinner />
        ) : null}
        {(dataError || productError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-red-600">
                {dataError ? String(dataError) : (productError ? String(productError) : 'Failed to load data')}
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onClose} 
              className="mt-2"
            >
              Close
            </Button>
          </div>
        )}
        {/* Form - Only show after data is loaded to prevent glitching */}
        {isFormDataPopulated && (
        <FormProvider {...form}>
        <form className={`${isLoadingData ? 'pointer-events-none opacity-50' : ''}`} suppressHydrationWarning onSubmit={handleSubmit}>
          <div ref={formTopRef}>
            {/* Action Buttons */}
            <div className="flex justify-between items-center my-[16px] mx-[16px] mb-6">
              {/* Left side: Cancel and Update buttons - Always visible */}
              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-[38px] body-3 font-urbanist text-sm border-gray-300 text-neutral-900 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-[38px] body-3 font-urbanist text-sm bg-black text-white hover:bg-gray-800"
                >
                  {isSubmitting ? 'Updating...' : 'Save & Update'}
                </Button>
              </div>

              {/* Right side: Approve and Reject buttons - Only show when data is loaded and status is actually pending */}
              {/* Prevent glitching by only showing after form data is populated */}
              {isFormDataPopulated && formData.operation_status === 'pending' && (
                <div className="flex space-x-4">
                  <Button 
                    type="button" 
                    variant="default" 
                    className="h-[38px] bg-white border border-red-500 hover:text-red-100 hover:bg-red-50 text-red-500 body-3 font-urbanist text-sm"
                    onClick={handleRejectClick}
                  >
                    Reject
                  </Button>
                  <Button 
                    type="button" 
                    variant="default" 
                    className="h-[38px] bg-green-500 hover:bg-green-600 text-white body-3 font-urbanist text-sm"
                    onClick={handleApproveClick}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
            
            {/* Item Overview Card - Only show after data is loaded */}
            {isFormDataPopulated && (
            <Card className="mx-[16px] mb-4 bg-white border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between px-[10px] py-[10px]">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 label-1 font-urbanist text-[16px]">Item Overview</span>
                  {/* <Info className="h-4 w-4 text-gray-500" /> */}
                </div>
                <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 body-3 font-urbanist text-sm">Status : </span>
                        <Controller
                          name="item_status" 
                          control={form.control}
                          render={({ field }) => {
                            // Ensure Select is always controlled - use undefined for empty/draft to show placeholder
                            // But keep archive/unarchive as-is to show the selected option
                            // This prevents the uncontrolled/controlled warning
                            const displayValue = !field.value || field.value === 'draft'
                              ? undefined 
                              : field.value
                            return (
                              <Select 
                                value={displayValue}
                                onValueChange={(value) => {
                                  field.onChange(value)
                                }}
                                disabled={localStorage.getItem('user_type') !== 'admin'}
                              >
                                <SelectTrigger className={cn("w-[180px] h-[38px] body-3 font-urbanist text-sm text-neutral-900", errors.item_status ? 'border-red-500' : 'border-gray-300', getHighlightStyles('is_status_change', ""))}>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unarchive">Listed</SelectItem>
                                  <SelectItem value="archive">Delisted</SelectItem>
                                </SelectContent>
                              </Select>
                            )
                          }}
                        />
                      </div>
                      {errors.item_status && (
                        <p className="text-red-500 text-xs">{errors.item_status}</p>
                      )}
                    </div>
              </CardHeader>
              <CardContent className="px-[10px] py-[10px]">
                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                        {primaryImageUrl ? (
                          <img
                            src={primaryImageUrl}
                            alt={formData.name || 'Product image'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-7 w-7 text-gray-400" />
                        )}
                      </div>
                      <div className="">
                        <div className="body-2 font-semibold text-gray-900 font-urbanist flex items-center flex-wrap">
                          <span>{formData.name || 'Unnamed Product'}</span>
                        </div>
                        <div className="flex flex-wrap items-center text-gray-600 font-urbanist">
                          <span className="text-gray-900 body-3">
                            <span className="font-semibold body-3 font-spectral text-sm">{formatCurrency(formData.mrp)}</span><span className="body-3 font-urbanist text-sm">/unit</span> 
                          </span>
                          <span className="text-secondary-900">&nbsp;•&nbsp;</span>
                          <span className="text-gray-600 body-3">
                            <span className="font-semibold body-3 font-urbanist text-sm">{formatWeight(formData.product_dimension_weight, formData.product_dimension_weight_unit)}</span><span className="body-3 font-urbanist text-sm">/unit</span>
                          </span>
                        </div>
                        <div className="text-gray-600 font-urbanist">
                          <span className="font-semibold text-gray-900 body-3 font-urbanist text-sm">
                            Supplier: {supplierInfo.name || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#EBD8CE] bg-[#F9EFE9] px-3 py-1 text-xs font-semibold text-[#8B3A24] font-urbanist">
                          Qty : {formData.quantity ?? 0}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[#EBD8CE] bg-[#F9EFE9] px-3 py-1 text-xs font-semibold text-[#8B3A24] font-urbanist">
                          Stock : {totalStockQuantity ?? 0}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[#EBD8CE] bg-[#F9EFE9] px-3 py-1 text-xs font-semibold text-[#8B3A24] font-urbanist">
                          Variants : {variantCount}
                        </span>
                        
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Tab Navigation */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-2 border-b-0 rounded-b-none mx-[16px]">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('product-information')}
                  className={`px-4 py-2 text-sm font-medium transition-all relative overflow-visible ${
                    activeSection === 'product-information'
                      ? 'text-secondary-900'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center">
                    Product Information
                    {getErrorCount('product-information') > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeSection === 'product-information'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {getErrorCount('product-information')}
                      </span>
                    )}
                  </span>
                  {activeSection === 'product-information' && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-900"
                      style={{
                        boxShadow: '0 0 8px rgba(0, 77, 92, 0.6), 0 0 12px rgba(0, 77, 92, 0.4)',
                        width: 'calc(100% + 8px)',
                        left: '-4px',
                      }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('product-specification')}
                  className={`px-4 py-2 text-sm font-medium transition-all relative overflow-visible ${
                    activeSection === 'product-specification'
                      ? 'text-secondary-900'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center">
                    Product Specification
                    {getErrorCount('product-specification') > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeSection === 'product-specification'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {getErrorCount('product-specification')}
                      </span>
                    )}
                  </span>
                  {activeSection === 'product-specification' && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-900"
                      style={{
                        boxShadow: '0 0 8px rgba(0, 77, 92, 0.6), 0 0 12px rgba(0, 77, 92, 0.4)',
                        width: 'calc(100% + 8px)',
                        left: '-4px',
                      }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('pricing-inventory')}
                  className={`px-4 py-2 text-sm font-medium transition-all relative overflow-visible ${
                    activeSection === 'pricing-inventory'
                      ? 'text-secondary-900'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center">
                    Pricing & Inventory
                    {getErrorCount('pricing-inventory') > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeSection === 'pricing-inventory'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {getErrorCount('pricing-inventory')}
                      </span>
                    )}
                  </span>
                  {activeSection === 'pricing-inventory' && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-900"
                      style={{
                        boxShadow: '0 0 8px rgba(0, 77, 92, 0.6), 0 0 12px rgba(0, 77, 92, 0.4)',
                        width: 'calc(100% + 8px)',
                        left: '-4px',
                      }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('logistics-handling')}
                  className={`px-4 py-2 text-sm font-medium transition-all relative overflow-visible ${
                    activeSection === 'logistics-handling'
                      ? 'text-secondary-900'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center">
                    Logistics & Handling
                    {getErrorCount('logistics-handling') > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeSection === 'logistics-handling'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {getErrorCount('logistics-handling')}
                      </span>
                    )}
                  </span>
                  {activeSection === 'logistics-handling' && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-900"
                      style={{
                        boxShadow: '0 0 8px rgba(0, 77, 92, 0.6), 0 0 12px rgba(0, 77, 92, 0.4)',
                        width: 'calc(100% + 8px)',
                        left: '-4px',
                      }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('product-options-variants')}
                  className={`px-4 py-2 text-sm font-medium transition-all relative overflow-visible ${
                    activeSection === 'product-options-variants'
                      ? 'text-secondary-900'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center">
                    Product Options & Variants
                    {getErrorCount('product-options-variants') > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeSection === 'product-options-variants'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {getErrorCount('product-options-variants')}
                      </span>
                    )}
                  </span>
                  {activeSection === 'product-options-variants' && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-900"
                      style={{
                        boxShadow: '0 0 8px rgba(0, 77, 92, 0.6), 0 0 12px rgba(0, 77, 92, 0.4)',
                        width: 'calc(100% + 8px)',
                        left: '-4px',
                      }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('images-documents')}
                  className={`px-4 py-2 text-sm font-medium transition-all relative overflow-visible ${
                    activeSection === 'images-documents'
                      ? 'text-secondary-900'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center">
                    Images & Documents
                    {getErrorCount('images-documents') > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeSection === 'images-documents'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {getErrorCount('images-documents')}
                      </span>
                    )}
                  </span>
                  {activeSection === 'images-documents' && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-900"
                      style={{
                        boxShadow: '0 0 8px rgba(0, 77, 92, 0.6), 0 0 12px rgba(0, 77, 92, 0.4)',
                        width: 'calc(100% + 8px)',
                        left: '-4px',
                      }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Section Content */}
            {activeSection === 'product-information' && (
            <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mb-4 mx-[16px]">
              <CardContent className="p-0 space-y-3 px-2 py-5">
                <ProductInformationSection
                  inventoryData={inventoryData}
                  isLoadingData={isLoadingData}
                  categoryOpen={categoryOpen}
                  onCategoryOpenChange={setCategoryOpen}
                  subCategoryOpen={Sub_categoryOpen}
                  onSubCategoryOpenChange={setSub_categoryOpen}
                  isCategoryModalOpen={isCategoryModalOpen}
                  onCategoryModalChange={setIsCategoryModalOpen}
                  isSubCategoryModalOpen={isSubCategoryModalOpen}
                  onSubCategoryModalChange={setIsSubCategoryModalOpen}
                  newCategoryName={newCategoryName}
                  onNewCategoryNameChange={setNewCategoryName}
                  categoryNameError={categoryNameError}
                  onAddCategory={addCategory}
                  onDeleteCategory={deleteCategory}
                  newSubCategoryName={newSubCategoryName}
                  onNewSubCategoryNameChange={setNewSubCategoryName}
                  subCategoryNameError={subCategoryNameError}
                  onAddSubCategory={addSubCategory}
                  onDeleteSubCategory={deleteSubCategory}
                  validateCategoryName={validateCategoryName}
                  validateSubCategoryName={validateSubCategoryName}
                  onNumberInputChange={handleNumberInputChange}
                  onInputChange={handleInputChange}
                  onArrayChange={handleArrayChange}
                  onGenerateDescriptionClick={() => setIsGenerateDescriptionModalOpen(true)}
                  getHighlightStyles={getHighlightStyles}
                  onQuantityRangeChange={(value) => handleInputChange('quantity_range', value)}
                  onLeadTimeValueChange={(value) => handleNumberInputChange('lead_time_value', value)}
                  onLeadTimeUnitChange={(value) => handleInputChange('lead_time_unit', value)}
                  onAddLeadTime={handleAddLeadTime}
                  onRemoveLeadTime={handleRemoveLeadTime}
                  onUpdateLeadTime={handleUpdateLeadTime}
                  onApplyTemplate={handleApplyTemplate}
                />
              </CardContent>
            </Card>
            )}

            {/* Product Specification - Only render when active */}
            {activeSection === 'product-specification' && (
            <ProductSpecificationSection
              inventoryData={inventoryData}
              selectedDocument={selectedDocument}
              isAssemblyDocDialogOpen={isAssemblyDocDialogOpen}
              isProductSpecOpen={isProductSpecOpen}
              onProductSpecOpenChange={setIsProductSpecOpen}
              documentInputRef={documentInputRef}
              onAssemblyRequirementChange={handleAssemblyRequirementChange}
              onAssemblyDialogClose={handleAssemblyDialogClose}
              onDocumentClick={handleDocumentClick}
              onDocumentUpload={handleDocumentUpload}
              onAssemblyDone={handleAssemblyDone}
              onRemoveDocument={removeDocument}
              getHighlightStyles={getHighlightStyles}
            />
            )}

            {/* Pricing & Inventory - Only render when active */}
            {activeSection === 'pricing-inventory' && (
              <PricingInventory
                taxList={inventoryData?.taxList}
                isLoadingData={isLoadingData}
                taxesOpen={taxesOpen}
                setTaxesOpen={setTaxesOpen}
                getHighlightStyles={getHighlightStyles}
              />
            )}

            {/* Logistics & Handling - Only render when active */}
            {activeSection === 'logistics-handling' && (
              <LogisticsHandling
                packageTypes={inventoryData?.packageTypes}
                boxTypes={inventoryData?.boxTypes}
              />
            )}

            {/* Product Options & Variants - Only render when active */}
            <div className={`${activeSection === 'product-options-variants' ? '' : 'hidden'}`}>
              <EditProductOptionsVariantsWrapper
                  getFormValues={getFormValues}
                  apiVariants={apiVariants}
                  variantOptions={inventoryData?.variantOptions}
                  onOptionsChange={(options: any) => handleInputChange('options', options)}
                  onVariantsChange={(variants: any) => handleInputChange('variants', variants)}
                  onSliderStateChange={onSliderStateChange}
                  selectedImages={selectedImages}
                  apiImageUrls={apiImageUrls}
                  isVariantChange={fieldChanges.is_variant_change}
                />
            </div>

            {/* Images & Documents - Only render when active */}
            {activeSection === 'images-documents' && (
            <ImagesDocumentsSection
              selectedImages={selectedImages}
              apiImageUrls={apiImageUrls}
              isDragOver={isDragOver}
              uploadError={uploadError}
              imageInputRef={imageInputRef}
              onImageClick={handleImageClick}
              onImageUpload={handleImageUpload}
              onRemoveImage={removeImage}
              onRemoveApiImage={handleRemoveApiImage}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onUploadErrorDismiss={() => setUploadError(null)}
              getHighlightStyles={getHighlightStyles}
            />
            )}
          </div>
        </form>
        </FormProvider>
        )}
        
        {/* Loading Modal */}
        <Dialog open={isSubmitting}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Processing...</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-center py-4">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-secondary-900" />
              </div>
              <p className="text-sm text-gray-600 text-center">Please wait while we submit your request.</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Error Modal */}
        <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-red-500" />
                <span>Error</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsErrorModalOpen(false)}
                  className="h-9 px-4 body-3 font-urbanist text-sm border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleRetry}
                  disabled={isSubmitting}
                  className="h-9 px-4 body-3 font-urbanist text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Retrying...' : 'Retry'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Approve Modal */}
        <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Approve Product</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Are you sure you want to approve this product?</p>
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelApprove}
                  className="h-9 px-4 body-3 font-urbanist text-sm border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleConfirmApprove}
                  disabled={isUpdatingStatus}
                  className="h-9 px-4 body-3 font-urbanist text-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Reject Product</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 ">
              <div className="space-y-2">
                <Label htmlFor="rejectReason">Reason for Rejection</Label>
                <Select value={rejectReason} onValueChange={setRejectReason}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="z-[101]">
                    <SelectItem value="incorrect Information">Incorrect Information</SelectItem>
                    <SelectItem value="Poor Quality">Poor Quality</SelectItem>
                    <SelectItem value="Missing Details">Missing Details</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejectDescription">Description</Label>
                <Textarea
                  id="rejectDescription"
                  value={rejectDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectDescription(e.target.value)}
                  placeholder="Provide additional details..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelReject}
                  className="h-9 px-4 body-3 font-urbanist text-sm border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleConfirmReject}
                  disabled={isUpdatingStatus || !rejectReason}
                  className="h-9 px-4 body-3 font-urbanist text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generate Description Modal */}
        {isGenerateDescriptionModalOpen && (
          <GenerateDescriptionModalWrapper
            open={isGenerateDescriptionModalOpen}
            onOpenChange={setIsGenerateDescriptionModalOpen}
            getFormValues={getFormValues}
            selectedImages={selectedImages}
            apiImageUrls={apiImageUrls}
            categories={inventoryData?.categories || []}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            setSelectedImages={setSelectedImages}
            setApiImageUrls={setApiImageUrls}
            onClose={() => setIsGenerateDescriptionModalOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default EditItemInventoryAdmin

