import type { Step1Props, FormData } from "@/types";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  step1BusinessProfileSchema, 
  type Step1BusinessProfileSchema 
} from "../schemas/partner-onboarding.schema";
import { useMemo, useEffect, useRef } from "react";
import { getErrorFieldLabels } from "../utils/field-labels";

export function Step1BusinessProfile({
  formData,
  updateFormData,
  onNext,
  onSaveDraft,
}: Step1Props) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<Step1BusinessProfileSchema>({
    resolver: zodResolver(step1BusinessProfileSchema),
    mode: 'onBlur', // Validate on blur to reduce re-renders
    shouldUnregister: false, // Keep form state when fields are unmounted
    defaultValues: {
      legalEntityName: formData.legalEntityName ?? "",
      brandName: formData.brandName ?? "",
      businessType: formData.businessType ?? "",
      businessTypeOther: formData.businessTypeOther ?? "",
      regAddress: formData.regAddress ?? {
        line1: "",
        line2: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India",
      },
      sameAsRegistered: formData.sameAsRegistered ?? true,
      principalAddress: formData.principalAddress ?? {
        line1: "",
        line2: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India",
      },
      contactPersonName: formData.contactPersonName ?? "",
      designation: formData.designation ?? "",
      mobileNumber: formData.mobileNumber ?? "",
      email: formData.email ?? "",
      alternateContact: formData.alternateContact ?? "",
    },
  });

  // Track if form has been initialized to prevent unnecessary resets
  const isInitializedRef = useRef(false);
  const lastFormDataRef = useRef<string>('');

  // Reset form when formData changes (e.g., from API load)
  // Only reset if formData actually changed (not just object reference)
  useEffect(() => {
    // Create a stable string representation of key form data
    const currentFormDataString = JSON.stringify({
      legalEntityName: formData.legalEntityName || '',
      brandName: formData.brandName || '',
      businessType: formData.businessType || '',
      regAddressLine1: formData.regAddress?.line1 || '',
      contactPersonName: formData.contactPersonName || '',
      designation: formData.designation || '',
      mobileNumber: formData.mobileNumber || '',
      email: formData.email || '',
    });

    // Only reset if data actually changed or if this is the first initialization
    // Skip reset if formData is mostly empty (user is filling the form)
    const hasSignificantData = formData.legalEntityName || formData.brandName || formData.contactPersonName;
    const sameAsRegistered = formData.sameAsRegistered ?? true;
    
    // If sameAsRegistered is true, use registered address for principal address
    const principalAddress = sameAsRegistered && formData.regAddress
      ? {
          line1: formData.regAddress.line1 ?? "",
          line2: formData.regAddress.line2 ?? "",
          city: formData.regAddress.city ?? "",
          state: formData.regAddress.state ?? "",
          pinCode: formData.regAddress.pinCode ?? "",
          country: formData.regAddress.country ?? "India",
        }
      : {
          line1: formData.principalAddress?.line1 ?? "",
          line2: formData.principalAddress?.line2 ?? "",
          city: formData.principalAddress?.city ?? "",
          state: formData.principalAddress?.state ?? "",
          pinCode: formData.principalAddress?.pinCode ?? "",
          country: formData.principalAddress?.country ?? "India",
        };
    
    if ((!isInitializedRef.current && hasSignificantData) || 
        (isInitializedRef.current && lastFormDataRef.current !== currentFormDataString && hasSignificantData)) {
      reset({
        legalEntityName: formData.legalEntityName ?? "",
        brandName: formData.brandName ?? "",
        businessType: formData.businessType ?? "",
        businessTypeOther: formData.businessTypeOther ?? "",
        regAddress: {
          line1: formData.regAddress?.line1 ?? "",
          line2: formData.regAddress?.line2 ?? "",
          city: formData.regAddress?.city ?? "",
          state: formData.regAddress?.state ?? "",
          pinCode: formData.regAddress?.pinCode ?? "",
          country: formData.regAddress?.country ?? "India",
        },
        sameAsRegistered,
        principalAddress,
        contactPersonName: formData.contactPersonName ?? "",
        designation: formData.designation ?? "",
        mobileNumber: formData.mobileNumber ?? "",
        email: formData.email ?? "",
        alternateContact: formData.alternateContact ?? "",
      }, { keepValues: false });
      
      isInitializedRef.current = true;
      lastFormDataRef.current = currentFormDataString;
    }
  }, [
    formData.legalEntityName,
    formData.brandName,
    formData.businessType,
    formData.regAddress?.line1,
    formData.contactPersonName,
    formData.designation,
    formData.mobileNumber,
    formData.email,
    reset,
  ]);

  // Use useWatch with specific field to prevent unnecessary re-renders
  // Only re-renders when sameAsRegistered or businessType changes
  const sameAsRegistered = useWatch({ control, name: "sameAsRegistered", defaultValue: formData.sameAsRegistered ?? true });
  const businessType = useWatch({ control, name: "businessType", defaultValue: formData.businessType ?? "" });
  
  // Memoize the conditional rendering check
  const showBusinessTypeOther = useMemo(() => businessType === "Other", [businessType]);

  // Track previous sameAsRegistered value to detect actual changes
  const prevSameAsRegisteredRef = useRef<boolean | undefined>(undefined);

  // When sameAsRegistered changes, sync principal address accordingly
  useEffect(() => {
    // Skip on initial mount - only react to actual changes
    if (prevSameAsRegisteredRef.current === undefined) {
      prevSameAsRegisteredRef.current = sameAsRegistered;
      return;
    }

    // Only proceed if the value actually changed
    if (prevSameAsRegisteredRef.current === sameAsRegistered) {
      return;
    }

    if (sameAsRegistered) {
      // Copy registered address to principal address when checked
      const regAddr = getValues("regAddress");
      if (regAddr && regAddr.line1) {
        setValue("principalAddress", {
          line1: regAddr.line1,
          line2: regAddr.line2 ?? "",
          city: regAddr.city ?? "",
          state: regAddr.state ?? "",
          pinCode: regAddr.pinCode ?? "",
          country: regAddr.country ?? "India",
        }, { shouldValidate: false });
      }
    } else {
      // Clear principal address when unchecked
      setValue("principalAddress", {
        line1: "",
        line2: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India",
      }, { shouldValidate: false });
    }

    // Update the ref for next comparison
    prevSameAsRegisteredRef.current = sameAsRegistered;
  }, [sameAsRegistered, setValue, getValues]);

  // Handler for Save as Draft that gets current form values
  const handleSaveDraftClick = () => {
    const currentValues = getValues();
    // Transform current form values to match FormData structure
    const currentFormData: Partial<FormData> = {
      legalEntityName: currentValues.legalEntityName,
      brandName: currentValues.brandName,
      businessType: currentValues.businessType,
      businessTypeOther: currentValues.businessTypeOther ?? "",
      regAddress: {
        line1: currentValues.regAddress.line1,
        line2: currentValues.regAddress.line2 ?? "",
        city: currentValues.regAddress.city ?? "",
        state: currentValues.regAddress.state ?? "",
        pinCode: currentValues.regAddress.pinCode ?? "",
        country: currentValues.regAddress.country ?? "India",
      },
      sameAsRegistered: !!currentValues.sameAsRegistered,
      principalAddress: {
        line1: currentValues.principalAddress.line1 ?? "",
        line2: currentValues.principalAddress.line2 ?? "",
        city: currentValues.principalAddress.city ?? "",
        state: currentValues.principalAddress.state ?? "",
        pinCode: currentValues.principalAddress.pinCode ?? "",
        country: currentValues.principalAddress.country ?? "India",
      },
      contactPersonName: currentValues.contactPersonName,
      designation: currentValues.designation,
      mobileNumber: currentValues.mobileNumber,
      email: currentValues.email,
      alternateContact: currentValues.alternateContact ?? "",
    };
    onSaveDraft(currentFormData);
  };

  const onValid = (values: Step1BusinessProfileSchema) => {
    // If sameAsRegistered is true, copy registered address to principal address
    const principalAddress = values.sameAsRegistered
      ? {
          line1: values.regAddress.line1,
          line2: values.regAddress.line2 ?? "",
          city: values.regAddress.city ?? "",
          state: values.regAddress.state ?? "",
          pinCode: values.regAddress.pinCode ?? "",
          country: values.regAddress.country ?? "India",
        }
      : {
          line1: values.principalAddress?.line1 ?? "",
          line2: values.principalAddress?.line2 ?? "",
          city: values.principalAddress?.city ?? "",
          state: values.principalAddress?.state ?? "",
          pinCode: values.principalAddress?.pinCode ?? "",
          country: values.principalAddress?.country ?? "India",
        };

    updateFormData({
      legalEntityName: values.legalEntityName,
      brandName: values.brandName,
      businessType: values.businessType,
      businessTypeOther: values.businessTypeOther ?? "",
      regAddress: {
        line1: values.regAddress.line1,
        line2: values.regAddress.line2 ?? "",
        city: values.regAddress.city ?? "",
        state: values.regAddress.state ?? "",
        pinCode: values.regAddress.pinCode ?? "",
        country: values.regAddress.country ?? "India",
      },
      sameAsRegistered: !!values.sameAsRegistered,
      principalAddress,
      contactPersonName: values.contactPersonName,
      designation: values.designation,
      mobileNumber: values.mobileNumber,
      email: values.email,
      alternateContact: values.alternateContact ?? "",
    });
    onNext();
  };

  const onInvalid = (errors: any) => {
    // Log errors for debugging
    
    // Get user-friendly field labels from errors
    const errorLabels = getErrorFieldLabels(errors);
    
    if (errorLabels.length > 0) {
      toast.error(`Please fill in: ${errorLabels.join(', ')}`);
    } else {
      toast.error("All mandatory fields required");
    }
    // stay on the same step; errors drive red borders
  };

  const inputBaseClass =
    "bg-[#fcfcfc] h-[38px] border rounded-[5px] px-[12px] py-[6px] font-urbanist font-semibold text-[14px] leading-[20px] focus:outline-none focus:ring-1 focus:ring-[#B04725]";

  const errClass = "border-red-500";
  return (
    <div className="px-[16px]">
      <div className="flex items-center justify-end gap-[8px] mb-[16px]">
        <button
          type="button"
          onClick={handleSaveDraftClick}
          className="px-[16px] py-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:text-[#212b36]"
        >
          Save as Draft
        </button>
        {/* Attach submit to the form below */}
        <button
          type="submit"
          form="step1-form"
          className="bg-[#B04725] px-[16px] py-[8px] rounded-[8px] font-urbanist font-bold text-[14px] text-white leading-[20px] tracking-[-0.16px] hover:bg-[#8e3519]"
        >
          Next: Registrations & Bank
        </button>
      </div>

      <div className="bg-white rounded-tl-[8px] rounded-tr-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] px-[8px] py-[16px]">
        <h2 className="font-urbanist font-semibold text-[16px] text-[#212b36] leading-[22px] tracking-[-0.18px]">
          Business Profile
        </h2>
      </div>

      {/* wrap inputs inside a form so handleSubmit reliably runs */}
      <form 
        id="step1-form" 
        onSubmit={handleSubmit(onValid, (errors) => {
          onInvalid(errors);
        })}
      >
        <div className="bg-white rounded-bl-[8px] rounded-br-[8px] border border-t-0 border-[#e6eaed] shadow-[0px_1px_1px_1px_rgba(198,198,198,0.2)] px-[8px] py-[20px]">
          <div className="space-y-[16px]">
            <div className="space-y-[16px]">
              <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                Business Details
              </h3>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Legal Entity Name *
                  </label>
                  <input
                    type="text"
                    {...register("legalEntityName")}
                    className={`${inputBaseClass} ${errors.legalEntityName ? errClass : "border-[#e8e8e8] text-[#606060]"}`}
                    placeholder="Enter legal entity name"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Brand / Trading Name *
                  </label>
                  <input
                    type="text"
                    {...register("brandName")}
                    className={`${inputBaseClass} ${errors.brandName ? errClass : "border-[#e8e8e8] text-[#606060]"}`}
                    placeholder="Name you sell under on the marketplace"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                  Business Type *
                </label>
                <div className="space-y-[8px]">
                  {[
                    "Private Limited Company",
                    "LLP",
                    "Partnership Firm",
                    "Sole Proprietorship",
                    "Other",
                  ].map((type) => (
                    <label key={type} className="flex items-center gap-[8px] cursor-pointer">
                      <input
                        type="radio"
                        {...register("businessType")}
                        value={type}
                        className="w-4 h-4 text-[#B04725]"
                      />
                      <span className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.businessType && (
                  <span className="text-red-500 text-[12px]">Required</span>
                )}
                {showBusinessTypeOther && (
                  <input
                    type="text"
                    {...register("businessTypeOther")}
                    className={`${inputBaseClass} ${errors.businessTypeOther ? errClass : "border-[#e8e8e8] mt-[8px]"}`}
                    placeholder="Please specify"
                  />
                )}
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                  Registered Office Address *
                </label>
                <input
                  type="text"
                  {...register("regAddress.line1")}
                  className={`${inputBaseClass} ${errors.regAddress?.line1 ? errClass : "border-[#e8e8e8]"}`}
                  placeholder="Address Line 1"
                />
              </div>

              <div className="flex flex-col gap-[4px]">
                <input
                  type="text"
                  {...register("regAddress.line2")}
                  className={`${inputBaseClass} border-[#e8e8e8]`}
                  placeholder="Address Line 2 (optional)"
                />
              </div>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Area Code
                  </label>
                  <input
                    type="text"
                    {...register("regAddress.pinCode")}
                    className={`${inputBaseClass} border-[#e8e8e8]`}
                    placeholder="Enter Area Pin code"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    City
                  </label>
                  <input
                    type="text"
                    {...register("regAddress.city")}
                    className={`${inputBaseClass} border-[#e8e8e8]`}
                    placeholder="Enter City"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    State
                  </label>
                  <input
                    type="text"
                    {...register("regAddress.state")}
                    className={`${inputBaseClass} border-[#e8e8e8]`}
                    placeholder="Select State"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("sameAsRegistered")}
                    className="w-4 h-4 text-[#B04725] rounded"
                  />
                  <span className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">
                    Principal place of business is same as registered office
                  </span>
                </label>
              </div>

              {!sameAsRegistered && (
                <>
                  <div className="flex flex-col gap-[4px]">
                    <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                      Principal Place of Business *
                    </label>
                    <input
                      type="text"
                      {...register("principalAddress.line1")}
                      className={`${inputBaseClass} ${errors.principalAddress?.line1 ? errClass : "border-[#e8e8e8]"}`}
                      placeholder="Address Line 1"
                    />
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <input
                      type="text"
                      {...register("principalAddress.line2")}
                      className={`${inputBaseClass} border-[#e8e8e8]`}
                      placeholder="Address Line 2 (optional)"
                    />
                  </div>
                  <div className="flex gap-[16px]">
                    <div className="flex-1 flex flex-col gap-[4px]">
                      <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                        Area Code
                      </label>
                      <input
                        type="text"
                        {...register("principalAddress.pinCode")}
                        className={`${inputBaseClass} border-[#e8e8e8]`}
                        placeholder="Enter Area Pin code"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-[4px]">
                      <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                        City
                      </label>
                      <input
                        type="text"
                        {...register("principalAddress.city")}
                        className={`${inputBaseClass} border-[#e8e8e8]`}
                        placeholder="Enter City"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-[4px]">
                      <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                        State
                      </label>
                      <input
                        type="text"
                        {...register("principalAddress.state")}
                        className={`${inputBaseClass} border-[#e8e8e8]`}
                        placeholder="Select State"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-[16px] pt-[16px] border-t border-[#e6eaed]">
              <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                Primary Contact
              </h3>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Authorised Contact Person Name *
                  </label>
                  <input
                    type="text"
                    {...register("contactPersonName")}
                    className={`${inputBaseClass} ${errors.contactPersonName ? errClass : "border-[#e8e8e8]"}`}
                    placeholder="Enter contact person name"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Designation *
                  </label>
                  <input
                    type="text"
                    {...register("designation")}
                    className={`${inputBaseClass} ${errors.designation ? errClass : "border-[#e8e8e8]"}`}
                    placeholder="Enter designation"
                  />
                </div>
              </div>

              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Mobile Number *
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
                      {...register("mobileNumber")}
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
                        setValue('mobileNumber', digitsOnly, { shouldValidate: true });
                      }}
                      className={`${inputBaseClass} ${errors.mobileNumber ? errClass : "border-[#e8e8e8]"}`}
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className={`${inputBaseClass} ${errors.email ? errClass : "border-[#e8e8e8]"}`}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                  Alternate Contact Number
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
                    {...register("alternateContact")}
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
                      setValue('alternateContact', digitsOnly, { shouldValidate: true });
                    }}
                    className={`${inputBaseClass} border-[#e8e8e8]`}
                    placeholder="Enter alternate contact (optional)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
