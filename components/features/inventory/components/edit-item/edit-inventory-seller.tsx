"use client"
import React, { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Image as ImageIcon, Bell, Info } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import PageHeader from '@/components/shared/layout/page-header'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { deleteProductImage } from '../../services/inventory.service'
import { useEditInventorySeller } from '../../hooks/use-edit-inventory-seller'
import ProductInformationSection from './sections/product-information-section'
import ProductSpecificationSection from './sections/product-specification-section'
import ImagesDocumentsSection from './sections/images-documents-section'
import GenerateDescriptionModal from '../generate-description-modal'

// Lazy load heavy components
const EditProductOptionsVariants = dynamic(() => import('./edit-variants-options-seller').then(m => ({ default: m.default })), {
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

export const EditItemInventory = ({ onClose, onSliderStateChange, selectedProductId }: { onClose: () => void, onSliderStateChange?: (isOpen: boolean) => void, selectedProductId: number }) => {
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
      isWeightExceeded,
      isGenerateDescriptionModalOpen,
      selectedImages,
      apiImageUrls,
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
    form,
    getFormValues,
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
      setErrors,
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
      handleSubmit,
      handleSaveAsDraft,
      handleRetry,
      getErrorCount,
    },
  } = useEditInventorySeller({ onClose, selectedProductId })

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
          const formData = getFormValues()
          const originalApiStatus = productDetailsResponse?.record?.item_status as string
          const isRejected = originalApiStatus === 'rejected'
          return isRejected && rejectionNotes ? (
            <div className="mx-[16px] mt-3 mb-3 bg-red-50 border-l-4 border-red-500 rounded px-3 py-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-red-900 font-urbanist mr-2">Rejection Reason:</span>
                  <span className="text-xs text-red-700 font-urbanist whitespace-pre-wrap">{rejectionNotes}</span>
                </div>
              </div>
            </div>
          ) : null
        })()}
        
        {/* Only show loading spinner on initial load, not when data is cached */}
        {((isLoadingData && !inventoryData) || (isLoadingProduct && !productDetailsResponse) || !isFormDataPopulated) ? (
          <LoadingSpinner />
        ) : null}
        {(dataError || productError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-red-600">
                {dataError || productError || 'Failed to load data'}
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
        {/* Render form immediately if we have cached data */}
        <FormProvider {...form}>
          <form className={`${isLoadingData ? 'pointer-events-none opacity-50' : ''} py-[24px] px-4`} suppressHydrationWarning onSubmit={handleSubmit}>
            {isFormDataPopulated && (
              <>
                <div ref={formTopRef}>
                  {/* Action Buttons - Always visible */}
                  {(() => {
                    // Use original API status for button text and dropdown disabled state (not current dropdown value)
                    const originalApiStatus = productDetailsResponse?.record?.item_status as string
                    const isOriginalListedOrDelisted = originalApiStatus === 'archive' || originalApiStatus === 'unarchive'
                    
                    // Dropdown is disabled if original API status is draft or rejected (or empty/undefined)
                    const isDraftOrRejected = !originalApiStatus || originalApiStatus === 'draft' || originalApiStatus === 'rejected' || originalApiStatus === ''
                    
                    return (
                      <div className="flex justify-between items-center mx-[16px] my-[16px] mb-6">
                        {/* Left side: Status Dropdown */}
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 body-3 font-urbanist text-sm">Status : </span>
                          <Select 
                            value={(() => {
                              const status = getFormValues().item_status as string
                              // Transform schema values to UI values: delisted -> archive, listed -> unarchive, rejected -> draft
                              if (status === 'rejected') return 'draft'
                              if (status === 'delisted') return 'archive'
                              if (status === 'listed') return 'unarchive'
                              return status
                            })()} 
                            onValueChange={(value) => {
                              // Transform UI values to schema values: archive -> delisted, unarchive -> listed
                              const schemaValue = value === 'archive' 
                                ? 'delisted' 
                                : value === 'unarchive' 
                                  ? 'listed' 
                                  : value
                              handleInputChange('item_status', schemaValue)
                            }}
                            disabled={isDraftOrRejected}
                          >
                            <SelectTrigger className={`w-[180px] h-[38px] body-3 font-urbanist text-sm text-neutral-900 ${errors.item_status ? 'border-red-500' : 'border-gray-300'}`}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {isDraftOrRejected && <SelectItem value="draft">Draft</SelectItem>}
                              <SelectItem value="unarchive">Listed</SelectItem>
                              <SelectItem value="archive">Delisted</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.item_status && (
                            <p className="text-red-500 text-xs">{errors.item_status}</p>
                          )}
                        </div>
                        
                        {/* Right side: Save as Draft and Submit for Approval - Always visible */}
                        <div className="flex space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleSaveAsDraft}
                            disabled={isSubmitting}
                            className="h-[38px] body-3 font-urbanist text-sm border-primary-900 text-neutral-900 hover:bg-gray-50"
                          >
                            {isSubmitting ? 'Saving...' : 'Save as Draft'}
                          </Button>
                          <Button 
                            type="button" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="h-[38px] body-3 font-urbanist text-sm bg-primary-900 text-white hover:bg-primary-800"
                          >
                            {isSubmitting 
                              ? (isOriginalListedOrDelisted ? 'Updating...' : 'Submitting...')
                              : (isOriginalListedOrDelisted 
                                  ? 'Update & Submit for Approval' 
                                  : 'Submit for Approval')}
                          </Button>
                        </div>
                      </div>
                    )
                  })()}

            {/* Tab Navigation */}
            <div className="mx-[16px] bg-white border border-gray-200 rounded-lg shadow-sm px-2 border-b-0 rounded-b-none">
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
            <Card className="bg-white border border-gray-200 rounded-lg rounded-t-none shadow-sm mx-[16px] mb-4">
              <CardContent className="space-y-3 px-2 py-5">
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
            />
            )}

            {/* Pricing & Inventory - Only render when active */}
            {activeSection === 'pricing-inventory' && (
              <PricingInventory
                taxList={inventoryData?.taxList}
                isLoadingData={isLoadingData}
                taxesOpen={taxesOpen}
                setTaxesOpen={setTaxesOpen}
              />
            )}

            {/* Logistics & Handling - Only render when active */}
            {activeSection === 'logistics-handling' && (
              <LogisticsHandling
                packageTypes={inventoryData?.packageTypes}
                boxTypes={inventoryData?.boxTypes}
                onWeightExceeded={setIsWeightExceeded}
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
            />
            )}
                </div>
              </>
            )}
          </form>
        </FormProvider>
        
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

export default EditItemInventory
