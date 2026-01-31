"use client"
import { useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info, Bell } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import PageHeader from '@/components/shared/layout/page-header'
import { FormProvider } from 'react-hook-form'
import ProductOptionsVariants from './shared/product-options-variants'
import LogisticsHandling from './shared/logistics-handling'
import PricingInventory from './shared/pricing-inventory'
import LeadTimeSection from './sections/lead-time-section'
import ProductInformationSection from './sections/product-information-section'
import ImagesDocumentsSection from './sections/images-documents-section'
import BasicInfoSection from './sections/basic-info-section'
import ProductSpecificationSection from './sections/product-specification-section'
import GenerateDescriptionModal from '../generate-description-modal'
import { useAddInventory } from '../../hooks/use-add-inventory'
import { toast } from 'sonner'

// Memoized wrapper to prevent re-renders when parent state changes
const ProductOptionsVariantsWrapper = memo(function ProductOptionsVariantsWrapper({
  getFormValues,
  variantOptions,
  onOptionsChange,
  onVariantsChange,
  onSliderStateChange,
  selectedImages,
}: any) {
  const formData = getFormValues()
  return (
    <ProductOptionsVariants
      options={formData.options || []}
      variants={formData.variants || []}
      variantOptions={variantOptions}
      onOptionsChange={onOptionsChange}
      onVariantsChange={onVariantsChange}
      onSliderStateChange={onSliderStateChange}
      productName={formData.name || ''}
      productPrice={formData.mrp || 0}
      productWeight={formData.product_dimension_weight || 0}
      productImage={selectedImages[0]}
    />
  )
})

// Memoized wrapper for GenerateDescriptionModal
const GenerateDescriptionModalWrapper = memo(function GenerateDescriptionModalWrapper({
  open,
  onOpenChange,
  getFormValues,
  selectedImages,
  categories,
  handleInputChange,
  handleArrayChange,
  setSelectedImages,
  onDescriptionGenerated,
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
      imageUrls={[]}
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
        handleInputChange('product_dimension_height_unit', dimensions.unit as 'mm' | 'cm' | 'm' | 'in' | 'ft')
      }}
      onImagesChange={(files: File[]) => setSelectedImages(files)}
      onDescriptionChange={(value: string) => {
        handleInputChange('description', value)
        onDescriptionGenerated()
      }}
    />
  )
})


export const AddItemInventory = ({ onClose, onSliderStateChange }: { onClose: () => void, onSliderStateChange?: (isOpen: boolean) => void }) => {
  const {
    state: {
      inventoryData,
      isLoadingData,
      dataError,
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
      isGenerateDescriptionModalOpen,
      selectedImages,
      selectedDocument,
      isDragOver,
      uploadError,
      errors,
    },
    refs: { imageInputRef, documentInputRef, formTopRef },
    form,
    getFormValues,
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
      setErrors,
      setSelectedImages,
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
      handleSubmit,
      handleRetry,
      getErrorCount,
    },
  } = useAddInventory({ onClose })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        <PageHeader title="Inventory" subTitle="Add Item" onTitleClick={onClose} />
        {isLoadingData && (
          <LoadingSpinner />
        )}
        {dataError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              {/* <Info className="h-4 w-4 text-red-600" /> */}
              <p className="text-sm text-red-600">{dataError}</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()} 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}
        {!isLoadingData && !dataError && (
        <FormProvider {...form}>
        <form 
          className={`${isLoadingData ? 'pointer-events-none opacity-50' : ''}`}
          onSubmit={handleSubmit}
        >
          <div ref={formTopRef}>
          
          {/* Top Header with Status and Action Buttons */}
          <div className="mt-[16px] mb-6 mx-[16px]">
            <div className="flex items-center justify-between">
              {/* Left: Status Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 body-3 font-urbanist text-sm">Status : </span>
                <Select value={getFormValues().item_status} onValueChange={(value) => handleInputChange('item_status', value as 'listed' | 'delisted' | 'draft')} disabled={localStorage.getItem('user_role') === 'admin' ? false : true}>
                  <SelectTrigger className="border-gray-300 h-[38px] w-[204px] body-3 font-urbanist text-sm text-neutral-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="listed">Listed</SelectItem>
                    <SelectItem value="delisted">Delisted</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Right: Action Buttons */}
              <div className="flex items-center space-x-4">
                <Button type="button" variant="outline" onClick={onClose} className="body-3 font-urbanist text-sm border-primary-900 text-primary-900 hover:text-primary-800 hover:bg-gray-100">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary-900 hover:bg-primary-800" 
                  disabled={isLoadingData || !!dataError || isSubmitting}
                >
                  {isSubmitting ? 'Adding Product...' : isLoadingData ? 'Loading...' : 'Add Product'}
                </Button>
              </div>
            </div>
          </div>

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

          {/* Product Information */}
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
                  onInputChange={handleInputChange}
                  onArrayChange={handleArrayChange}
                />
                <BasicInfoSection
                  inventoryData={inventoryData}
                  onGenerateDescription={() => setIsGenerateDescriptionModalOpen(true)}
                />
                <LeadTimeSection
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

          {/* Product Specification */}
          {activeSection === 'product-specification' && (
            <ProductSpecificationSection
              inventoryData={inventoryData}
              selectedDocument={selectedDocument}
              isAssemblyDocDialogOpen={isAssemblyDocDialogOpen}
              documentInputRef={documentInputRef}
              onAssemblyRequirementChange={handleAssemblyRequirementChange}
              onAssemblyDocDialogOpen={() => setIsAssemblyDocDialogOpen(true)}
              onAssemblyDialogClose={handleAssemblyDialogClose}
              onDocumentClick={handleDocumentClick}
              onDocumentUpload={handleDocumentUpload}
              onAssemblyDone={handleAssemblyDone}
              onRemoveDocument={removeDocument}
            />
          )}

          {/* Pricing & Inventory */}
          {activeSection === 'pricing-inventory' && (
          <PricingInventory
            taxList={inventoryData?.taxList}
            isLoadingData={isLoadingData}
            taxesOpen={taxesOpen}
            setTaxesOpen={setTaxesOpen}
          />
          )}

          {/* Logistics & Handling */}
          {activeSection === 'logistics-handling' && (
          <LogisticsHandling
            packageTypes={inventoryData?.packageTypes}
            boxTypes={inventoryData?.boxTypes}
            onWeightExceeded={setIsWeightExceeded}
          />
          )}

          {/* Product Options & Variants */}
          {activeSection === 'product-options-variants' && (
          <ProductOptionsVariantsWrapper
            getFormValues={getFormValues}
            variantOptions={inventoryData?.variantOptions}
            onOptionsChange={(options: any) => handleInputChange('options', options)}
            onVariantsChange={(variants: any) => handleInputChange('variants', variants)}
            onSliderStateChange={onSliderStateChange}
            selectedImages={selectedImages}
          />
          )}

          {/* Images & Documents Upload */}
          {activeSection === 'images-documents' && (
            <ImagesDocumentsSection
              isDragOver={isDragOver}
              selectedImages={selectedImages}
              uploadError={uploadError}
              onImageClick={handleImageClick}
              onImageUpload={handleImageUpload}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              onRemoveImage={removeImage}
              onDismissError={() => setUploadError(null)}
              imageInputRef={imageInputRef}
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
                  {/* <Info className="h-4 w-4 text-red-600" /> */}
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
            categories={inventoryData?.categories || []}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            setSelectedImages={setSelectedImages}
            onDescriptionGenerated={() => toast.success('Description generated successfully!')}
          />
        )}
      </div>
    </div>
  )
}

export default AddItemInventory