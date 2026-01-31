// src/components/Step3BrandIP.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { FileUploader } from './file-uploader';
import type { Step3Props, FormData } from '@/types';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { 
  step3BrandIPSchema, 
  type Step3BrandIPSchema 
} from '../schemas/partner-onboarding.schema';
import { getErrorFieldLabels } from '../utils/field-labels';

export function Step3BrandIP({ formData, updateFormData, onNext, onBack, onSaveDraft }: Step3Props) {
  // Prepare normalized defaults for arrays to avoid undefined issues
  // Use useMemo to prevent creating new references on every render
  // IMPORTANT: Filter out invalid/empty designs to prevent hundreds of items issue
  const normalizedDesigns = useMemo(() => {
    // If hasDesignRegistration is false, always return empty array
    if (!formData.hasDesignRegistration) {
      return [];
    }
    
    // Filter out invalid/empty designs - only include those with at least a non-empty name OR registration number
    return (formData.designs || [])
      .filter((d) => {
        const hasName = d.name && typeof d.name === 'string' && d.name.trim().length > 0;
        const hasRegNumber = d.registrationNumber && typeof d.registrationNumber === 'string' && d.registrationNumber.trim().length > 0;
        return hasName || hasRegNumber;
      })
      .map((d) => ({
        name: (d.name && typeof d.name === 'string') ? d.name.trim() : '',
        registrationNumber: (d.registrationNumber && typeof d.registrationNumber === 'string') ? d.registrationNumber.trim() : '',
        fileName: d.fileName ?? '',
        fileBase64: d.fileBase64 ?? '',
      }));
  }, [formData.designs, formData.hasDesignRegistration]);

  const normalizedNocs = useMemo(() => {
    return (formData.nocDocuments || []).map((d) => ({
      fileName: d.fileName ?? '',
      fileBase64: d.fileBase64 ?? '',
      uploadedAt: d.uploadedAt ?? new Date().toISOString(),
    }));
  }, [formData.nocDocuments]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    clearErrors,
    getValues,
    reset,
    formState: { errors },
  } = useForm<Step3BrandIPSchema>({
    resolver: zodResolver(step3BrandIPSchema),
    mode: 'onBlur', // Validate on blur to reduce re-renders
    shouldUnregister: false, // Keep form state when fields are unmounted
    defaultValues: {
      hasTrademark: !!formData.hasTrademark,
      trademarkBrandName: formData.trademarkBrandName ?? '',
      trademarkNumber: formData.trademarkNumber ?? '',
      trademarkClass: formData.trademarkClass ?? '',
      trademarkOwner: formData.trademarkOwner ?? '',

      hasDesignRegistration: !!formData.hasDesignRegistration,
      designs: normalizedDesigns.length ? normalizedDesigns : [],

      hasThirdPartyContent: !!formData.hasThirdPartyContent,
      thirdPartyDescription: formData.thirdPartyDescription ?? '',
      nocDocuments: normalizedNocs.length ? normalizedNocs : [],

      brandIPConfirmation: !!formData.brandIPConfirmation,
    },
  });

  // Reset form when formData changes (e.g., from API load)
  // Use normalized values to ensure consistency
  useEffect(() => {
    reset({
      hasTrademark: !!formData.hasTrademark,
      trademarkBrandName: formData.trademarkBrandName ?? '',
      trademarkNumber: formData.trademarkNumber ?? '',
      trademarkClass: formData.trademarkClass ?? '',
      trademarkOwner: formData.trademarkOwner ?? '',
      hasDesignRegistration: !!formData.hasDesignRegistration,
      designs: normalizedDesigns,
      hasThirdPartyContent: !!formData.hasThirdPartyContent,
      thirdPartyDescription: formData.thirdPartyDescription ?? '',
      nocDocuments: normalizedNocs,
      brandIPConfirmation: !!formData.brandIPConfirmation,
    });
  }, [
    formData.hasTrademark,
    formData.trademarkBrandName,
    formData.trademarkNumber,
    formData.trademarkClass,
    formData.trademarkOwner,
    formData.hasDesignRegistration,
    normalizedDesigns,
    formData.hasThirdPartyContent,
    formData.thirdPartyDescription,
    normalizedNocs,
    formData.brandIPConfirmation,
    reset,
  ]);

  // useFieldArray for designs and nocDocuments so we avoid watch(undefined) and can map safely
  const {
    fields: designFields,
    append: appendDesign,
    remove: removeDesignField,
  } = useFieldArray({ control, name: 'designs' as const });

  const {
    fields: nocFields,
    append: appendNoc,
    remove: removeNocField,
  } = useFieldArray({ control, name: 'nocDocuments' as const });

  // Use useWatch with specific fields to prevent unnecessary re-renders
  // Only re-renders when these specific fields change
  const hasTrademark = useWatch({ control, name: 'hasTrademark', defaultValue: !!formData.hasTrademark });
  const hasDesignRegistration = useWatch({ control, name: 'hasDesignRegistration', defaultValue: !!formData.hasDesignRegistration });
  const hasThirdPartyContent = useWatch({ control, name: 'hasThirdPartyContent', defaultValue: !!formData.hasThirdPartyContent });
  const brandIPConfirmation = useWatch({ control, name: 'brandIPConfirmation', defaultValue: !!formData.brandIPConfirmation });

  const inputBaseClass =
    "bg-[#fcfcfc] h-[38px] border rounded-[5px] px-[12px] py-[6px] font-urbanist font-semibold text-[14px] leading-[20px] focus:outline-none focus:ring-1 focus:ring-[#B04725]";
  const errClass = 'border-red-500';
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);

  const onValid = (values: Step3BrandIPSchema) => {
    // Normalize arrays before calling updateFormData to avoid TS mismatches
    const designs = (values.designs || []).map((d) => ({
      name: d?.name ?? '',
      registrationNumber: d?.registrationNumber ?? '',
      fileName: d?.fileName ?? '',
      fileBase64: d?.fileBase64 ?? '',
    }));
    const nocDocuments = (values.nocDocuments || []).map((n) => ({
      fileName: n?.fileName ?? '',
      fileBase64: n?.fileBase64 ?? '',
      uploadedAt: n?.uploadedAt ?? new Date().toISOString(),
    }));

    updateFormData({
      hasTrademark: !!values.hasTrademark,
      trademarkBrandName: values.trademarkBrandName ?? '',
      trademarkNumber: values.trademarkNumber ?? '',
      trademarkClass: values.trademarkClass ?? '',
      trademarkOwner: values.trademarkOwner ?? '',

      hasDesignRegistration: !!values.hasDesignRegistration,
      designs,

      hasThirdPartyContent: !!values.hasThirdPartyContent,
      thirdPartyDescription: values.thirdPartyDescription ?? '',
      nocDocuments,

      brandIPConfirmation: !!values.brandIPConfirmation,
    });

    onNext();
  };

  const onInvalid = (errors: any) => {
    const errorLabels = getErrorFieldLabels(errors);
    if (errorLabels.length > 0) {
      toast.error(`Please fill in: ${errorLabels.join(', ')}`);
    } else {
      toast.error('All mandatory fields are required');
    }
  };

  const handleNextClick = () => {
    const confirmed = getValues('brandIPConfirmation');
    if (confirmed) {
      void handleSubmit(onValid, onInvalid)();
      return;
    }
    setShowDeclarationModal(true);
  };

  const handleModalConfirm = () => {
    setValue('brandIPConfirmation', true);
    updateFormData({ brandIPConfirmation: true });
    clearErrors('brandIPConfirmation');
    setShowDeclarationModal(false);
    void handleSubmit(onValid, onInvalid)();
  };

  const handleModalToggle = (checked: boolean) => {
    setValue('brandIPConfirmation', checked);
    updateFormData({ brandIPConfirmation: checked });
    if (checked) {
      clearErrors('brandIPConfirmation');
    }
  };

  // Handler for Save as Draft that gets current form values
  const handleSaveDraftClick = () => {
    const currentValues = getValues();
    
    // If hasDesignRegistration is false, explicitly set designs to empty array
    // Otherwise, filter out empty/invalid designs
    let designs: Array<{ name: string; registrationNumber: string; fileName?: string; fileBase64?: string }> = [];
    if (currentValues.hasDesignRegistration && Array.isArray(currentValues.designs) && currentValues.designs.length > 0) {
      designs = (currentValues.designs || [])
        .filter((d) => {
          // Only include designs with at least a non-empty name OR non-empty registration number
          const hasName = d?.name && typeof d.name === 'string' && d.name.trim().length > 0;
          const hasRegNumber = d?.registrationNumber && typeof d.registrationNumber === 'string' && d.registrationNumber.trim().length > 0;
          return hasName || hasRegNumber;
        })
        .map((d) => ({
          name: (d?.name && typeof d.name === 'string') ? d.name.trim() : '',
          registrationNumber: (d?.registrationNumber && typeof d.registrationNumber === 'string') ? d.registrationNumber.trim() : '',
          fileName: d?.fileName ?? '',
          fileBase64: d?.fileBase64 ?? '',
        }));
    }
    
    const nocDocuments = (currentValues.nocDocuments || []).map((n) => ({
      fileName: n?.fileName ?? '',
      fileBase64: n?.fileBase64 ?? '',
      uploadedAt: n?.uploadedAt ?? new Date().toISOString(),
    }));

    // Transform current form values to match FormData structure
    const currentFormData: Partial<FormData> = {
      hasTrademark: !!currentValues.hasTrademark,
      trademarkBrandName: currentValues.trademarkBrandName ?? '',
      trademarkNumber: currentValues.trademarkNumber ?? '',
      trademarkClass: currentValues.trademarkClass ?? '',
      trademarkOwner: currentValues.trademarkOwner ?? '',
      hasDesignRegistration: !!currentValues.hasDesignRegistration,
      designs, // This will be empty array if hasDesignRegistration is false
      hasThirdPartyContent: !!currentValues.hasThirdPartyContent,
      thirdPartyDescription: currentValues.thirdPartyDescription ?? '',
      nocDocuments,
      brandIPConfirmation: !!currentValues.brandIPConfirmation,
      // Include documents from formData (trademark cert is stored there)
      documents: formData.documents,
    };
    onSaveDraft(currentFormData);
  };

  // helpers that operate on both RHF arrays and global formData
  const addDesign = () => {
    appendDesign({ name: '', registrationNumber: '', fileName: '', fileBase64: '' });
    updateFormData({ designs: [...(formData.designs || []), { name: '', registrationNumber: '', fileName: '', fileBase64: '' }] });
  };

  const removeDesign = (index: number) => {
    removeDesignField(index);
    updateFormData({ designs: (formData.designs || []).filter((_, i) => i !== index) });
  };

  const updateDesignFile = (index: number, fileBase64: string, fileName: string) => {
    // Update global formData designs fileName + base64
    const newDesigns = [...(formData.designs || [])];
    newDesigns[index] = {
      ...(newDesigns[index] || { name: '', registrationNumber: '' }),
      fileName: fileName ?? '',
      fileBase64: fileBase64 ?? '',
    };
    updateFormData({ designs: newDesigns });

    // Also set value in RHF array so future validation/submit has it
    const currentDesigns = getValues('designs') || [];
    const arr = [...currentDesigns];
    arr[index] = { ...(arr[index] || {}), fileName: fileName ?? '', fileBase64: fileBase64 ?? '' };
    setValue('designs', arr, { shouldValidate: false }); // Don't trigger validation on file update
  };

  const addNoc = () => {
    const newNocItem = { fileName: '', fileBase64: '', uploadedAt: new Date().toISOString() };
    appendNoc(newNocItem);
    updateFormData({ nocDocuments: [...(formData.nocDocuments || []), newNocItem] });
  };

  const removeNoc = (index: number) => {
    removeNocField(index);
    const newDocs = [...(formData.nocDocuments || [])];
    newDocs.splice(index, 1);
    updateFormData({ nocDocuments: newDocs });
  };

  const updateNocFile = (index: number, fileBase64: string, fileName: string) => {
    const newDocs = [...(formData.nocDocuments || [])];
    newDocs[index] = { ...(newDocs[index] || {}), fileName: fileName ?? '', fileBase64: fileBase64 ?? '', uploadedAt: new Date().toISOString() };
    updateFormData({ nocDocuments: newDocs });

    const currentNocs = getValues('nocDocuments') || [];
    const arr = [...currentNocs];
    arr[index] = { ...(arr[index] || {}), fileName: fileName ?? '', fileBase64: fileBase64 ?? '', uploadedAt: new Date().toISOString() };
    setValue('nocDocuments', arr, { shouldValidate: false }); // Don't trigger validation on file update
  };

  // trademark certificate upload (not part of RHF fields, lives in documents)
  const onTrademarkCertUpload = (fileBase64: string, name: string) => {
    const newDocs = { ...(formData.documents || {}) };
    newDocs['trademark_certificate'] = { fileName: name, fileBase64, uploadedAt: new Date().toISOString() };
    updateFormData({ documents: newDocs });
  };

  const onTrademarkCertDelete = () => {
    const newDocs = { ...(formData.documents || {}) };
    delete newDocs['trademark_certificate'];
    updateFormData({ documents: newDocs });
  };

  return (
    <div className="px-[16px]">
      <div className="flex items-center justify-between mb-[16px]">
        <button
          type="button"
          onClick={onBack}
          className="px-[16px] py-[8px] border border-[#e8e8e8] rounded-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:bg-white"
        >
          Back: Registrations & Bank
        </button>

        <div className="flex items-center gap-[8px]">
          <button type="button" onClick={handleSaveDraftClick} className="px-[16px] py-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:text-[#212b36]">
            Save as Draft
          </button>

          <button
            type="button"
            onClick={handleNextClick}
            className="bg-[#B04725] px-[16px] py-[8px] rounded-[8px] font-urbanist font-bold text-[14px] text-white"
          >
            Next: Declarations
          </button>
        </div>
      </div>

      <div className="bg-white rounded-tl-[8px] rounded-tr-[8px] border border-[#e6eaed] shadow px-[8px] py-[16px]">
        <h2 className="font-urbanist font-semibold text-[16px] text-[#212b36]">Brand & IP</h2>
      </div>

      <form id="step3-form" onSubmit={handleSubmit(onValid, onInvalid)}>
        <div className="bg-white rounded-bl-[8px] rounded-br-[8px] border border-t-0 border-[#e6eaed] shadow px-[8px] py-[20px]">
          <div className="space-y-[16px]">
            {/* Trademark */}
            <div className="space-y-[8px]">
              <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Trademark</h3>

              <div className="flex flex-col gap-[8px]">
                <p className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">Do you have a registered trademark for your brand?</p>
                <div className="flex gap-[16px]">
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="radio"
                      name="hasTrademark"
                      checked={!!hasTrademark}
                      onChange={() => {
                        setValue('hasTrademark', true);
                        updateFormData({ hasTrademark: true });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">Yes</span>
                  </label>

                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="radio"
                      name="hasTrademark"
                      checked={!hasTrademark}
                      onChange={() => {
                        setValue('hasTrademark', false);
                        updateFormData({
                          hasTrademark: false,
                          trademarkBrandName: '',
                          trademarkNumber: '',
                          trademarkClass: '',
                          trademarkOwner: '',
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">No</span>
                  </label>
                </div>
              </div>

              {hasTrademark ? (
                <div className="space-y-[16px] p-[12px] bg-[#fcfcfc] rounded-[5px] border border-[#e8e8e8]">
                  <div className="flex gap-[16px]">
                    <div className="flex-1 flex flex-col gap-[4px]">
                      <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Brand Name (as registered) *</label>
                      <input
                        {...register('trademarkBrandName')}
                        placeholder="Enter registered brand name"
                        className={`${inputBaseClass} ${errors.trademarkBrandName ? errClass : 'border-[#e8e8e8]'}`}
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-[4px]">
                      <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Trademark Registration Number *</label>
                      <input
                        {...register('trademarkNumber')}
                        placeholder="Enter registration number"
                        className={`${inputBaseClass} ${errors.trademarkNumber ? errClass : 'border-[#e8e8e8]'}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-[16px]">
                    <div className="flex-1 flex flex-col gap-[4px]">
                      <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Trademark Class *</label>
                      <input
                        {...register('trademarkClass')}
                        placeholder="e.g., Class 20 - Furniture"
                        className={`${inputBaseClass} ${errors.trademarkClass ? errClass : 'border-[#e8e8e8]'}`}
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-[4px]">
                      <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Trademark Owner Name *</label>
                      <input
                        {...register('trademarkOwner')}
                        placeholder="Enter owner name"
                        className={`${inputBaseClass} ${errors.trademarkOwner ? errClass : 'border-[#e8e8e8]'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <FileUploader
                      label="Trademark Registration Certificate"
                      // many trademark certs are PDFs — enforce PDF
                      accept="pdf"
                      required={false}
                      fileName={formData.documents?.['trademark_certificate']?.fileName}
                      fileBase64={formData.documents?.['trademark_certificate']?.fileBase64}
                      onUpload={(base64, name) => onTrademarkCertUpload(base64, name)}
                      onDelete={() => onTrademarkCertDelete()}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-[12px] bg-[#fef3f0] border border-[#e8bfb3] rounded-[5px]">
                  <p className="font-urbanist font-semibold text-[14px] text-[#8e2e17] leading-[20px]">You confirm you have rights to use this brand name on the marketplace.</p>
                </div>
              )}
            </div>

            {/* Design Registration */}
            <div className="space-y-[8px] pt-[16px] border-t border-[#e6eaed]">
              <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Design Registration</h3>

              <div className="flex flex-col gap-[8px]">
                <p className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">Do you have any registered designs for your products?</p>
                <div className="flex gap-[16px]">
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="radio"
                      name="hasDesignRegistration"
                      checked={!!hasDesignRegistration}
                      onChange={() => {
                        setValue('hasDesignRegistration', true);
                        const currentDesigns = getValues('designs') || [];
                        
                        // Clear any existing invalid/empty designs first to prevent hundreds of items
                        // Remove all fields from RHF array safely by removing from the end
                        for (let i = currentDesigns.length - 1; i >= 0; i--) {
                          removeDesignField(i);
                        }
                        // Explicitly set designs to empty array to ensure clean state
                        setValue('designs', []);
                        
                        // Now add one fresh design field
                        appendDesign({ name: '', registrationNumber: '', fileName: '', fileBase64: '' });
                        
                        // Update formData - ensure designs array is clean with just one empty item
                        updateFormData({ 
                          hasDesignRegistration: true, 
                          designs: [{ name: '', registrationNumber: '', fileName: '', fileBase64: '' }] 
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">Yes</span>
                  </label>

                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="radio"
                      name="hasDesignRegistration"
                      checked={!hasDesignRegistration}
                      onChange={() => {
                        setValue('hasDesignRegistration', false);
                        // Remove all fields from RHF array safely by removing from the end
                        const currentDesigns = getValues('designs') || [];
                        for (let i = currentDesigns.length - 1; i >= 0; i--) {
                          removeDesignField(i);
                        }
                        // Explicitly set designs to empty array to ensure it's cleared
                        setValue('designs', []);
                        updateFormData({ hasDesignRegistration: false, designs: [] });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">No</span>
                  </label>
                </div>
              </div>

              {hasDesignRegistration && (
                <div className="space-y-[8px]">
                  {designFields.map((field, index) => (
                    <div key={field.id} className="p-[12px] border border-[#e8e8e8] rounded-[5px] bg-[#fcfcfc] relative">
                      {designFields.length > 1 && (
                        <button type="button" onClick={() => removeDesign(index)} className="absolute top-[8px] right-[8px] p-[4px] hover:bg-gray-200 rounded">
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      )}

                      <div className="space-y-[12px]">
                        <div className="flex flex-col gap-[4px]">
                          <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Design Name / Description</label>
                          <input
                            {...register(`designs.${index}.name` as const)}
                            placeholder="e.g., Ergonomic Chair Design"
                            className="bg-white h-[38px] border border-[#e8e8e8] rounded-[5px] px-[12px] py-[6px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]"
                            onBlur={() => {
                              // Sync to formData only on blur to avoid re-renders during typing
                              const currentDesigns = getValues('designs') || [];
                              const normalizedDesigns = currentDesigns.map((d) => ({
                                name: d?.name ?? '',
                                registrationNumber: d?.registrationNumber ?? '',
                                fileName: d?.fileName ?? '',
                                fileBase64: d?.fileBase64 ?? '',
                              }));
                              updateFormData({ designs: normalizedDesigns });
                            }}
                          />
                        </div>

                        <div className="flex flex-col gap-[4px]">
                          <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Design Registration Number</label>
                          <input
                            {...register(`designs.${index}.registrationNumber` as const)}
                            placeholder="Enter registration number"
                            className="bg-white h-[38px] border border-[#e8e8e8] rounded-[5px] px-[12px] py-[6px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]"
                            onBlur={() => {
                              // Sync to formData only on blur to avoid re-renders during typing
                              const currentDesigns = getValues('designs') || [];
                              const normalizedDesigns = currentDesigns.map((d) => ({
                                name: d?.name ?? '',
                                registrationNumber: d?.registrationNumber ?? '',
                                fileName: d?.fileName ?? '',
                                fileBase64: d?.fileBase64 ?? '',
                              }));
                              updateFormData({ designs: normalizedDesigns });
                            }}
                          />
                        </div>

                        <FileUploader
                          label="Design Registration Certificate"
                          // design certs might be PDFs — keep accept='pdf' to be strict
                          accept="pdf"
                          required={false}
                          fileName={formData.designs?.[index]?.fileName ?? ''}
                          fileBase64={formData.designs?.[index]?.fileBase64 ?? ''}
                          onUpload={(base64, name) => updateDesignFile(index, base64, name)}
                          onDelete={() => updateDesignFile(index, '', '')}
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addDesign}
                    className="flex items-center justify-center gap-[8px] px-[12px] py-[8px] border-2 border-dashed border-[#B04725] rounded-[8px] hover:bg-[#fef3f0] w-full font-urbanist font-semibold text-[14px] text-[#B04725] leading-[20px]"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Design
                  </button>
                </div>
              )}
            </div>

            {/* Third-party Content */}
            <div className="space-y-[8px] pt-[16px] border-t border-[#e6eaed]">
              <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Third-party Content</h3>

              <div className="flex flex-col gap-[8px]">
                <p className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">Do you use any third-party images, manuals or content?</p>

                <div className="flex gap-[16px]">
                  <label className="flex items-center gap-[8px]">
                    <input
                      type="radio"
                      name="hasThirdPartyContent"
                      checked={!!hasThirdPartyContent}
                      onChange={() => {
                        setValue('hasThirdPartyContent', true);
                        const currentNocs = getValues('nocDocuments') || [];
                        if (currentNocs.length === 0) {
                          const newNocItem = { fileName: '', fileBase64: '', uploadedAt: new Date().toISOString() };
                          appendNoc(newNocItem);
                        }
                        updateFormData({ hasThirdPartyContent: true });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">Yes</span>
                  </label>

                  <label className="flex items-center gap-[8px]">
                    <input
                      type="radio"
                      name="hasThirdPartyContent"
                      checked={!hasThirdPartyContent}
                      onChange={() => {
                        setValue('hasThirdPartyContent', false);
                        // Remove all fields from RHF array safely by removing from the end
                        const currentNocs = getValues('nocDocuments') || [];
                        for (let i = currentNocs.length - 1; i >= 0; i--) {
                          removeNocField(i);
                        }
                        updateFormData({ hasThirdPartyContent: false, thirdPartyDescription: '', nocDocuments: [] });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">No</span>
                  </label>
                </div>
              </div>

              {hasThirdPartyContent && (
                <div className="space-y-[12px] p-[12px] bg-[#fcfcfc] rounded-[5px] border border-[#e8e8e8]">
                  <div className="flex flex-col gap-[4px]">
                    <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">Describe the third-party content</label>
                    <textarea
                      {...register('thirdPartyDescription')}
                      className="bg-white border border-[#e8e8e8] rounded-[5px] px-[12px] py-[6px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]"
                      rows={3}
                      placeholder="Please describe what third-party content you use"
                    />
                  </div>

                  <div>
                    <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px] mb-[8px] block">NOC / License Document</label>
                    <p className="font-urbanist font-semibold text-[12px] text-[#a4a4a4] leading-[16px] mb-[8px]">You can upload multiple files</p>

                    <div className="space-y-[8px]">
                      {nocFields.map((field, index) => (
                        <FileUploader
                          key={field.id}
                          accept="pdf"
                          required={false}
                          fileName={formData.nocDocuments?.[index]?.fileName ?? ''}
                          fileBase64={formData.nocDocuments?.[index]?.fileBase64 ?? ''}
                          onUpload={(base64, name) => updateNocFile(index, base64, name)}
                          onDelete={() => updateNocFile(index, '', '')}
                        />
                      ))}
                    </div>

                    {formData.nocDocuments && formData.nocDocuments.length > 0 && formData.nocDocuments[formData.nocDocuments.length - 1]?.fileName && (
                      <button type="button" onClick={addNoc} className="mt-[8px] font-urbanist font-semibold text-[14px] text-[#B04725] leading-[20px]">
                        <Plus className="w-4 h-4 inline-block" /> Add Another Document
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Declaration */}
            <div className="p-[12px] rounded-[5px] border border-[#e6eaed] bg-[#fcfcfc]">
              {/* keep field registered via hidden input so RHF validation still runs */}
              <input type="hidden" {...register('brandIPConfirmation')} />
              <div className="flex items-start justify-between gap-[12px]">
                <span className="font-urbanist font-semibold text-[14px] text-gray-800 leading-[20px]">
                  We confirm we own or are authorised to use the brand names, images and content provided above. <span className="text-red-500 font-bold">*</span>
                </span>
                {/* <button
                  type="button"
                  onClick={() => setShowDeclarationModal(true)}
                  className="px-[12px] py-[6px] border border-[#B04725] text-[#B04725] rounded-[8px] font-urbanist font-semibold text-[13px]"
                >
                  Review & Confirm
                </button> */}
              </div>
              {errors.brandIPConfirmation && (
                <p className="font-urbanist font-semibold text-red-500 text-[12px] leading-[16px] mt-[4px]">Please confirm to proceed</p>
              )}
              {brandIPConfirmation && (
                <p className="font-urbanist font-semibold text-[12px] text-green-700 leading-[16px] mt-[4px]">Declaration confirmed</p>
              )}
            </div>
          </div>
        </div>
      </form>

      {showDeclarationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-[12px] shadow-lg max-w-[520px] w-full p-[20px]">
            <div className="flex items-start justify-between mb-[12px]">
              <h3 className="font-urbanist font-semibold text-[16px] text-[#212b36] leading-[22px]">Declaration</h3>
              <button type="button" onClick={() => setShowDeclarationModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-start gap-[8px] cursor-pointer">
              <input
                type="checkbox"
                checked={!!brandIPConfirmation}
                className={`w-4 h-4 mt-[2px] ${errors.brandIPConfirmation ? errClass : ''}`}
                onChange={(e) => handleModalToggle(e.target.checked)}
              />
              <span className="font-urbanist font-semibold text-[14px] text-gray-800 leading-[20px]">
                We confirm we own or are authorised to use the brand names, images and content provided above. <span className="text-red-500 font-bold">*</span>
              </span>
            </label>

            {errors.brandIPConfirmation && (
              <p className="font-urbanist font-semibold text-red-500 text-[12px] leading-[16px] mt-[6px]">Please check this box to continue.</p>
            )}

            <div className="flex justify-end gap-[8px] mt-[16px]">
              <button
                type="button"
                onClick={() => setShowDeclarationModal(false)}
                className="px-[12px] py-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] border border-[#e8e8e8] rounded-[8px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalConfirm}
                disabled={!brandIPConfirmation}
                className={`px-[16px] py-[8px] rounded-[8px] font-urbanist font-bold text-[14px] text-white ${brandIPConfirmation ? 'bg-[#B04725]' : 'bg-[#e2cfc8]'}`}
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
