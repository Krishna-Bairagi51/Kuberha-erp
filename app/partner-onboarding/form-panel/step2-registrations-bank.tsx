// src/components/step2-registrations-bank.tsx
import type { Step2Props, FormData as SupplierFormData } from '@/types';
import { FileUploader } from './file-uploader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { 
  step2RegistrationsBankSchema, 
  type Step2RegistrationsBankSchema 
} from '../schemas/partner-onboarding.schema';
import { getErrorFieldLabels } from '../utils/field-labels';

export function Step2RegistrationsBank({
  formData,
  updateFormData,
  onNext,
  onBack,
  onSaveDraft,
}: Step2Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<Step2RegistrationsBankSchema>({
    resolver: zodResolver(step2RegistrationsBankSchema),
    mode: 'onBlur', // Validate on blur to reduce re-renders
    shouldUnregister: false, // Keep form state when fields are unmounted
    defaultValues: {
      cin: formData.cin ?? '',
      gstin: formData.gstin ?? '',
      pan: formData.pan ?? '',
      shopsEstablishment: formData.shopsEstablishment ?? '',
      accountHolderName: formData.accountHolderName ?? '',
      accountNumber: formData.accountNumber ?? '',
      confirmAccountNumber: formData.confirmAccountNumber ?? '',
      ifscCode: formData.ifscCode ?? '',
      bankName: formData.bankName ?? '',
      branchName: formData.branchName ?? '',
      accountType: formData.accountType ?? '',
    },
  });

  // Reset form when formData changes (e.g., from API load)
  useEffect(() => {
    reset({
      cin: formData.cin ?? '',
      gstin: formData.gstin ?? '',
      pan: formData.pan ?? '',
      shopsEstablishment: formData.shopsEstablishment ?? '',
      accountHolderName: formData.accountHolderName ?? '',
      accountNumber: formData.accountNumber ?? '',
      confirmAccountNumber: formData.confirmAccountNumber ?? '',
      ifscCode: formData.ifscCode ?? '',
      bankName: formData.bankName ?? '',
      branchName: formData.branchName ?? '',
      accountType: formData.accountType ?? '',
    });
  }, [
    formData.cin,
    formData.gstin,
    formData.pan,
    formData.shopsEstablishment,
    formData.accountHolderName,
    formData.accountNumber,
    formData.confirmAccountNumber,
    formData.ifscCode,
    formData.bankName,
    formData.branchName,
    formData.accountType,
    reset,
  ]);

  // Handler for Save as Draft that gets current form values
  const handleSaveDraftClick = () => {
    const currentValues = getValues();
    // Transform current form values to match FormData structure
    const currentFormData: Partial<SupplierFormData> = {
      cin: currentValues.cin ?? '',
      gstin: currentValues.gstin,
      pan: currentValues.pan,
      shopsEstablishment: currentValues.shopsEstablishment ?? '',
      accountHolderName: currentValues.accountHolderName,
      accountNumber: currentValues.accountNumber,
      confirmAccountNumber: currentValues.confirmAccountNumber,
      ifscCode: currentValues.ifscCode,
      bankName: currentValues.bankName,
      branchName: currentValues.branchName,
      accountType: currentValues.accountType,
      // Include documents from formData (they're not in the form schema)
      documents: formData.documents,
    };
    onSaveDraft(currentFormData);
  };

  const onValid = (values: Step2RegistrationsBankSchema) => {
    const docs = formData.documents ?? {};
    const missingDocs = [
      !docs['gst_certificate']?.fileBase64 && 'GST Registration Certificate',
      !docs['pan_image']?.fileBase64 && 'PAN Card',
      !docs['cancelled_cheque_image']?.fileBase64 && 'Cancelled Cheque / First Page of Bank Statement',
    ].filter(Boolean) as string[];

    if (missingDocs.length) {
      toast.error(`Please upload: ${missingDocs.join(', ')}`);
      return;
    }

    updateFormData({
      cin: values.cin ?? '',
      gstin: values.gstin ?? '',
      pan: values.pan ?? '',
      shopsEstablishment: values.shopsEstablishment ?? '',
      accountHolderName: values.accountHolderName,
      accountNumber: values.accountNumber,
      confirmAccountNumber: values.confirmAccountNumber,
      ifscCode: values.ifscCode,
      bankName: values.bankName,
      branchName: values.branchName,
      accountType: values.accountType,
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

  const inputBaseClass =
    'bg-[#fcfcfc] h-[38px] border rounded-[5px] px-[12px] py-[6px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] focus:outline-none focus:ring-1 focus:ring-[#B04725]';
  const errClass = 'border-red-500';

  return (
    <div className="px-[16px]">
      <div className="flex items-center justify-between mb-[16px]">
        <button
          type="button"
          onClick={onBack}
          className="px-[16px] py-[8px] border border-[#e8e8e8] rounded-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:bg-white"
        >
          Back: Business Profile
        </button>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={handleSaveDraftClick}
            className="px-[16px] py-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:text-[#212b36]"
          >
            Save as Draft
          </button>
          {/* submit triggers validation */}
          <button
            type="submit"
            form="step2-form"
            className="bg-[#B04725] px-[16px] py-[8px] rounded-[8px] font-urbanist font-bold text-[14px] text-white leading-[20px] tracking-[-0.16px] hover:bg-[#8e3519]"
          >
            Next: Brand & IP
          </button>
        </div>
      </div>

      <div className="bg-white rounded-tl-[8px] rounded-tr-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] px-[8px] py-[16px]">
        <h2 className="font-urbanist font-semibold text-[16px] text-[#212b36] leading-[22px] tracking-[-0.18px]">
          Registrations & Bank
        </h2>
      </div>

      <form id="step2-form" onSubmit={handleSubmit(onValid, onInvalid)}>
        <div className="bg-white rounded-bl-[8px] rounded-br-[8px] border border-t-0 border-[#e6eaed] shadow-[0px_1px_1px_1px_rgba(198,198,198,0.2)] px-[8px] py-[20px]">
          <div className="space-y-[16px]">
            <div className="space-y-[16px]">
              <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                Business Registrations
              </h3>

              <div className="flex flex-col gap-[4px]">
                <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                  CIN / Registration Number
                </label>
                <input
                  type="text"
                  {...register('cin')}
                  className={`${inputBaseClass} ${errors.cin ? errClass : 'border-[#e8e8e8]'}`}
                  placeholder="For companies/LLPs; leave blank if not applicable"
                />
              </div>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    GSTIN *
                  </label>
                  <input
                    type="text"
                    {...register('gstin')}
                    className={`${inputBaseClass} ${errors.gstin ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    PAN *
                  </label>
                  <input
                    type="text"
                    {...register('pan')}
                    className={`${inputBaseClass} ${errors.pan ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                  Shops & Establishments Registration No.
                </label>
                <input
                  type="text"
                  {...register('shopsEstablishment')}
                  className={`${inputBaseClass} ${errors.shopsEstablishment ? errClass : 'border-[#e8e8e8]'}`}
                  placeholder="Enter registration number (optional)"
                />
              </div>

              <div className="space-y-[8px]">
                <h4 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                  Registration Documents
                </h4>

                <FileUploader
                  label="Certificate of Incorporation / Registration"
                  subLabel="PDF, JPG, or PNG"
                  required={false}
                  accept="pdf-or-image"
                  fileName={formData.documents?.['registration_certificate']?.fileName}
                  fileBase64={formData.documents?.['registration_certificate']?.fileBase64}
                  onUpload={(base64, name) =>
                    updateFormData({
                      documents: {
                        ...formData.documents,
                        registration_certificate: { fileName: name, fileBase64: base64, uploadedAt: new Date().toISOString() },
                      },
                    })
                  }
                  onDelete={() => {
                    const newDocs = { ...formData.documents };
                    delete newDocs['registration_certificate'];
                    updateFormData({ documents: newDocs });
                  }}
                />

                <FileUploader
                  label="GST Registration Certificate"
                  subLabel="PDF, JPG, or PNG"
                  required
                  accept="pdf-or-image"
                  fileName={formData.documents?.['gst_certificate']?.fileName}
                  fileBase64={formData.documents?.['gst_certificate']?.fileBase64}
                  onUpload={(base64, name) =>
                    updateFormData({
                      documents: {
                        ...formData.documents,
                        gst_certificate: { fileName: name, fileBase64: base64, uploadedAt: new Date().toISOString() },
                      },
                    })
                  }
                  onDelete={() => {
                    const newDocs = { ...formData.documents };
                    delete newDocs['gst_certificate'];
                    updateFormData({ documents: newDocs });
                  }}
                />

                <FileUploader
                  label="PAN Card"
                  subLabel="PDF, JPG, or PNG"
                  required
                  accept="pdf-or-image"
                  fileName={formData.documents?.['pan_image']?.fileName}
                  fileBase64={formData.documents?.['pan_image']?.fileBase64}
                  onUpload={(base64, name) =>
                    updateFormData({
                      documents: {
                        ...formData.documents,
                        pan_image: { fileName: name, fileBase64: base64, uploadedAt: new Date().toISOString() },
                      },
                    })
                  }
                  onDelete={() => {
                    const newDocs = { ...formData.documents };
                    delete newDocs['pan_image'];
                    updateFormData({ documents: newDocs });
                  }}
                />

                <FileUploader
                  label="Shops & Establishments Certificate"
                  subLabel="PDF, JPG, or PNG"
                  required={false}
                  accept="pdf-or-image"
                  fileName={formData.documents?.['shops_certificate']?.fileName}
                  fileBase64={formData.documents?.['shops_certificate']?.fileBase64}
                  onUpload={(base64, name) =>
                    updateFormData({
                      documents: {
                        ...formData.documents,
                        shops_certificate: { fileName: name, fileBase64: base64, uploadedAt: new Date().toISOString() },
                      },
                    })
                  }
                  onDelete={() => {
                    const newDocs = { ...formData.documents };
                    delete newDocs['shops_certificate'];
                    updateFormData({ documents: newDocs });
                  }}
                />
              </div>
            </div>

            <div className="space-y-[16px] pt-[16px] border-t border-[#e6eaed]">
              <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                Bank Details
              </h3>

              <div className="flex flex-col gap-[4px]">
                <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  {...register('accountHolderName')}
                  className={`${inputBaseClass} ${errors.accountHolderName ? errClass : 'border-[#e8e8e8]'}`}
                  placeholder="As per bank records"
                />
              </div>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    {...register('accountNumber')}
                    className={`${inputBaseClass} ${errors.accountNumber ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    {...register('confirmAccountNumber')}
                    className={`${inputBaseClass} ${errors.confirmAccountNumber ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="Re-enter account number"
                  />
                </div>
              </div>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    {...register('ifscCode')}
                    className={`${inputBaseClass} ${errors.ifscCode ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="ABCD0123456"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    {...register('bankName')}
                    className={`${inputBaseClass} ${errors.bankName ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="Enter bank name"
                  />
                </div>
              </div>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    {...register('branchName')}
                    className={`${inputBaseClass} ${errors.branchName ? errClass : 'border-[#e8e8e8]'}`}
                    placeholder="Enter branch name"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Account Type *
                  </label>
                  <select
                    {...register('accountType')}
                    className={`${inputBaseClass} ${errors.accountType ? errClass : 'border-[#e8e8e8]'}`}
                  >
                    <option value="">Select account type</option>
                    <option value="Current">Current</option>
                    <option value="Savings">Savings</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <FileUploader
                label="Cancelled Cheque / First Page of Bank Statement"
                subLabel="Upload a cancelled cheque or first page of your bank statement (PDF/JPG/PNG)"
                required
                accept="pdf-or-image"
                fileName={formData.documents?.['cancelled_cheque_image']?.fileName}
                fileBase64={formData.documents?.['cancelled_cheque_image']?.fileBase64}
                onUpload={(base64, name) =>
                  updateFormData({
                    documents: {
                      ...formData.documents,
                      cancelled_cheque_image: { fileName: name, fileBase64: base64, uploadedAt: new Date().toISOString() },
                    },
                  })
                }
                onDelete={() => {
                  const newDocs = { ...formData.documents };
                  delete newDocs['cancelled_cheque_image'];
                  updateFormData({ documents: newDocs });
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
