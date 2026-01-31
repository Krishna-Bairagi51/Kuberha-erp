// src/components/Step4Declarations.tsx
import { FormData, Step4Props } from '@/types';
import { useRef, useEffect } from 'react';
import { FileUploader } from './file-uploader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { 
  step4DeclarationsSchema, 
  type Step4DeclarationsSchema 
} from '../schemas/partner-onboarding.schema';
import { getErrorFieldLabels } from '../utils/field-labels';

export function Step4Declarations({
  formData,
  updateFormData,
  onNext,
  onBack,
  onSaveDraft,
}: Step4Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    reset,
  } = useForm<Step4DeclarationsSchema>({
    resolver: zodResolver(step4DeclarationsSchema),
    mode: 'onBlur', // Validate on blur to reduce re-renders
    shouldUnregister: false, // Keep form state when fields are unmounted
    defaultValues: {
      declarationAgreed: formData.declarationAgreed ?? false,
      signatoryName: formData.signatoryName ?? '',
      signatoryDesignation: formData.signatoryDesignation ?? '',
      signatoryPlace: formData.signatoryPlace ?? '',
      signatoryDate: formData.signatoryDate ?? new Date().toISOString().split('T')[0],
      signatoryMobile: formData.signatoryMobile ?? '',
      signatoryEmail: formData.signatoryEmail ?? '',
    },
  });

  // Reset form when formData changes (e.g., from API load)
  useEffect(() => {
    reset({
      declarationAgreed: formData.declarationAgreed ?? false,
      signatoryName: formData.signatoryName ?? '',
      signatoryDesignation: formData.signatoryDesignation ?? '',
      signatoryPlace: formData.signatoryPlace ?? '',
      signatoryDate: formData.signatoryDate ?? new Date().toISOString().split('T')[0],
      signatoryMobile: formData.signatoryMobile ?? '',
      signatoryEmail: formData.signatoryEmail ?? '',
    });
  }, [
    formData.declarationAgreed,
    formData.signatoryName,
    formData.signatoryDesignation,
    formData.signatoryPlace,
    formData.signatoryDate,
    formData.signatoryMobile,
    formData.signatoryEmail,
    reset,
  ]);

  const onValid = (values: Step4DeclarationsSchema) => {
    // normalize to match FormData fields (no undefined / unknown)
    updateFormData({
      declarationAgreed: !!values.declarationAgreed,
      signatoryName: values.signatoryName ?? '',
      signatoryDesignation: values.signatoryDesignation ?? '',
      signatoryPlace: values.signatoryPlace ?? '',
      signatoryDate: values.signatoryDate ?? new Date().toISOString().split('T')[0],
      signatoryMobile: values.signatoryMobile ?? '',
      signatoryEmail: values.signatoryEmail ?? '',
    });
    onNext();
  };

  const onInvalid = (errors: any) => {
    const errorLabels = getErrorFieldLabels(errors);
    if (errorLabels.length > 0) {
      toast.error(`Please fill in: ${errorLabels.join(', ')}`);
    } else {
      toast.error('All mandatory fields required');
    }
  };

  // Handler for Save as Draft that gets current form values
  const handleSaveDraftClick = () => {
    const currentValues = getValues();
    // Transform current form values to match FormData structure
    const currentFormData: Partial<FormData> = {
      declarationAgreed: !!currentValues.declarationAgreed,
      signatoryName: currentValues.signatoryName ?? '',
      signatoryDesignation: currentValues.signatoryDesignation ?? '',
      signatoryPlace: currentValues.signatoryPlace ?? '',
      signatoryDate: currentValues.signatoryDate ?? new Date().toISOString().split('T')[0],
      signatoryMobile: currentValues.signatoryMobile ?? '',
      signatoryEmail: currentValues.signatoryEmail ?? '',
    };
    onSaveDraft(currentFormData);
  };

  const inputBaseClass =
    "bg-[#fcfcfc] h-[38px] border rounded-[5px] px-[12px] py-[6px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] focus:outline-none focus:ring-1 focus:ring-[#B04725]";
  const errClass = 'border-red-500';

  // No need to watch declarationChecked - errors object will handle validation display

  return (
    <div className="px-[16px]">
      {/* Navigation - Above Card */}
      <div className="flex items-center justify-between mb-[16px]">
        <button
          type="button"
          onClick={onBack}
          className="px-[16px] py-[8px] border border-[#e8e8e8] rounded-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:bg-white"
        >
          Back: Brand & IP
        </button>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={handleSaveDraftClick}
            className="px-[16px] py-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:text-[#212b36]"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            form="step4-form"
            className="bg-[#B04725] px-[16px] py-[8px] rounded-[8px] font-urbanist font-bold text-[14px] text-white leading-[20px] tracking-[-0.16px] hover:bg-[#8e3519]"
          >
            Next: Review & Submit
          </button>
        </div>
      </div>

      {/* Card Header */}
      <div className="bg-white rounded-tl-[8px] rounded-tr-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] px-[8px] py-[16px]">
        <h2 className="font-urbanist font-semibold text-[16px] text-[#212b36] leading-[22px] tracking-[-0.18px]">
          Declarations
        </h2>
      </div>

      {/* form wrapper */}
      <form id="step4-form" onSubmit={handleSubmit(onValid, onInvalid)}>
        {/* Card Content */}
        <div className="bg-white rounded-bl-[8px] rounded-br-[8px] border border-t-0 border-[#e6eaed] shadow-[0px_1px_1px_1px_rgba(198,198,198,0.2)] px-[8px] py-[20px]">
          <div className="space-y-[16px]">
            {/* Declarations Block */}
            <div>
              <div className="border border-[#e8e8e8] rounded-[5px] p-[16px] max-h-[320px] overflow-y-auto bg-[#fcfcfc]">
                <h3 className="font-urbanist font-semibold text-[14px] text-[#a4a4a4] leading-[20px] mb-[12px]">
                  Please read and scroll to the end
                </h3>
                <div className="space-y-[12px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">
                  <div>
                    <p>
                      <strong className="text-[#212b36]">1. Accuracy of Information:</strong> I/We hereby declare that all
                      information provided in this onboarding form is true, accurate, and complete to
                      the best of my/our knowledge. I/We understand that any false or misleading
                      information may result in the rejection of this application or termination of the
                      partner agreement.
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong className="text-[#212b36]">2. Compliance with Laws:</strong> I/We confirm that our business
                      operations comply with all applicable laws, regulations, and standards including
                      but not limited to tax laws, labor laws, environmental regulations, and consumer
                      protection laws in India.
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong className="text-[#212b36]">3. Product Authenticity:</strong> I/We guarantee that all products
                      supplied through the marketplace are genuine, authentic, and not counterfeit. We
                      confirm that we have the necessary rights, licenses, and authorizations to sell
                      these products.
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong className="text-[#212b36]">4. Intellectual Property:</strong> I/We confirm that we either own or
                      have obtained proper authorization to use all brand names, trademarks, designs,
                      images, and other intellectual property associated with the products we intend to
                      sell on the marketplace.
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong className="text-[#212b36]">5. Disclosure Obligations:</strong> I/We agree to promptly inform the
                      marketplace of any material changes to the information provided in this form,
                      including changes to business registration, ownership, contact details, or
                      compliance status.
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong className="text-[#212b36]">6. Indemnity:</strong> I/We agree to indemnify and hold harmless the
                      marketplace platform, its officers, directors, employees, and agents from any
                      claims, damages, losses, liabilities, and expenses arising from any breach of
                      these declarations or violation of any applicable laws or third-party rights.
                    </p>
                  </div>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="mt-[12px] p-[12px] border-2 border-[#e8bfb3] bg-[#fef3f0] rounded-[5px]">
                <label className="flex items-start gap-[8px] cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('declarationAgreed')}
                    className={`w-4 h-4 text-[#B04725] mt-[2px] shrink-0 ${errors.declarationAgreed ? errClass : ''}`}
                  />
                  <span className="font-urbanist font-semibold text-[14px] text-gray-800 leading-[20px]">
                    I/We have read and agree to all the declarations above.{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Authorised Signatory Section */}
            <div className="space-y-[16px] pt-[16px] border-t border-[#e6eaed]">
              <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                Authorised Signatory
              </h3>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Authorised Signatory Name *
                  </label>
                  <input
                    type="text"
                    {...register('signatoryName')}
                    className={`${inputBaseClass} ${errors.signatoryName ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="Enter signatory name"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Designation *
                  </label>
                  <input
                    type="text"
                    {...register('signatoryDesignation')}
                    className={`${inputBaseClass} ${errors.signatoryDesignation ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="Enter designation"
                  />
                </div>
              </div>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Place
                  </label>
                  <input
                    type="text"
                    {...register('signatoryPlace')}
                    className={`${inputBaseClass} ${errors.signatoryPlace ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="Enter place"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register('signatoryDate')}
                    className={`${inputBaseClass} ${errors.signatoryDate ? errClass : 'border-[#e8e8e8]'}`}
                  />
                </div>
              </div>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Signatory Mobile Number
                  </label>
                  <div className="flex gap-[8px]">
                    <input
                      type="text"
                      value="+91"
                      disabled
                      className="w-16 bg-[#f5f5f5] h-[38px] border border-[#e8e8e8] rounded-[5px] px-[12px] py-[6px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] text-center"
                    />
                    <input
                      type="tel"
                      {...register('signatoryMobile')}
                      maxLength={10}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        // Allow: backspace, delete, tab, escape, enter
                        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                          return;
                        }
                        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                          return;
                        }
                        // Allow: home, end, left, right, arrow keys
                        if (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          return;
                        }
                        // Only allow digits 0-9
                        if (!/^[0-9]$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        // Filter out non-digit characters
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
                        const digitsOnly = paste.replace(/[^0-9]/g, '').slice(0, 10);
                        setValue('signatoryMobile', digitsOnly, { shouldValidate: true });
                      }}
                      className={`${inputBaseClass} ${errors.signatoryMobile ? errClass : 'border-[#e8e8e8]'}`}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Signatory Email
                  </label>
                  <input
                    type="email"
                    {...register('signatoryEmail')}
                    className={`${inputBaseClass} ${errors.signatoryEmail ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="sample@gmail.com"
                  />
                </div>
              </div>
            </div>

            {/* Signature & Stamp Area */}
            <div className="space-y-[16px] pt-[16px] border-t border-[#e6eaed]">

              <div>
                <FileUploader
                  label="Upload Firm Stamp (optional)"
                  accept="image"
                  required={false}
                  fileName={formData.documents?.['firm_stamp']?.fileName}
                  fileBase64={formData.documents?.['firm_stamp']?.fileBase64}
                  onUpload={(base64, name) =>
                    updateFormData({
                      documents: {
                        ...formData.documents,
                        firm_stamp: { fileName: name, fileBase64: base64, uploadedAt: new Date().toISOString() },
                      },
                    })
                  }
                  onDelete={() => {
                    const newDocs = { ...formData.documents };
                    delete newDocs['firm_stamp'];
                    updateFormData({ documents: newDocs });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
