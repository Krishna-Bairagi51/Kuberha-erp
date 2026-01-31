'use client';

import { useEffect, useState, useRef } from 'react';
import { PendingApproval } from './pending-approval';
import { TopPanel } from './top-panel';
import { FormPanel } from './form-panel';
import { updateSellerInfo, getSellerInfo, updateSellerState } from '@/lib/api/endpoints/seller';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getAuthData } from '@/lib/api/helpers/auth';
import { redirectToLogin } from '@/lib/services/auth-redirect';
import { useQueryClient } from '@tanstack/react-query';
import { ApprovalRejected } from './approval-rejected';
import type { FormData } from '@/types';
import { inferStepFromSellerData } from '@/lib/api/helpers/onboarding';
import { transformSellerInfoToFormData } from '@/lib/api/helpers/onboarding';
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner';
import { useUserType } from '@/hooks/use-user-type';

/**
 * PartnerOnboarding page:
 * - Deterministic, data-driven behavior using authData stored in localStorage.
 * - No dummy login mounting. If user not authenticated, redirect to /login.
 * - Handles seller_state values:
 *    - approved -> redirect to /seller-dashboard
 *    - rejected -> redirect to /supplier-dashboard (per requirement), leaving seller_state in storage
 *    - pending -> render PendingApproval (with logout)
 *    - draft -> render onboarding form, prefilling with seller_data when present
 *
 * Minimal, non-invasive changes; uses seller_data to prefill the form if provided by backend.
 */

export default function PartnerOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userType } = useUserType();
  const [mounted, setMounted] = useState(false);

  // current step + form data for onboarding form
  // Initialize currentStep as null to prevent rendering wrong step before data loads
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingSellerInfo, setIsLoadingSellerInfo] = useState(true);
  const [isFormDataReady, setIsFormDataReady] = useState(false);
  // Track seller_state from API - this is the source of truth
  const [sellerState, setSellerState] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    legalEntityName: '',
    brandName: '',
    businessType: '',
    businessTypeOther: '',
    regAddress: { line1: '', line2: '', city: '', state: '', pinCode: '', country: 'India' },
    sameAsRegistered: true,
    principalAddress: { line1: '', line2: '', city: '', state: '', pinCode: '', country: 'India' },
    contactPersonName: '',
    designation: '',
    mobileNumber: '',
    email: '',
    alternateContact: '',
    cin: '',
    gstin: '',
    pan: '',
    shopsEstablishment: '',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: '',
    hasTrademark: false,
    trademarkBrandName: '',
    trademarkNumber: '',
    trademarkClass: '',
    trademarkOwner: '',
    hasDesignRegistration: false,
    designs: [],
    hasThirdPartyContent: false,
    thirdPartyDescription: '',
    nocDocuments: [],
    brandIPConfirmation: false,
    declarationAgreed: false,
    signatoryName: '',
    signatoryDesignation: '',
    signatoryPlace: '',
    signatoryDate: new Date().toISOString().split('T')[0],
    signatoryMobile: '',
    signatoryEmail: '',
    documents: {},
  });

  const steps = [
    { id: 1, label: 'Business Profile' },
    { id: 2, label: 'Registrations & Bank' },
    { id: 3, label: 'Brand & IP' },
    { id: 4, label: 'Declarations' },
    { id: 5, label: 'Review & Submit' },
  ];


  // Ensure we're on client side before accessing localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track if API call has been initiated to prevent duplicate calls
  const apiCallInitiatedRef = useRef(false);
  // Track if form data has been loaded and step is ready
  const formReadyRef = useRef(false);

  // On mount: derive view from real authData.seller_state in localStorage.
  // Only runs after authentication is verified
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    // Prevent duplicate API calls
    if (apiCallInitiatedRef.current) return;
    apiCallInitiatedRef.current = true;

    // Check authentication
    const authRaw = localStorage.getItem('authData');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const accessToken = localStorage.getItem('accessToken');
    const sessionId = localStorage.getItem('sessionId');

    if (!isAuthenticated || !authRaw || userType !== 'seller' || !accessToken || !sessionId) {
      router.push('/login');
      setIsLoadingSellerInfo(false);
      return;
    }

    // Parse authData and decide
    try {
      const authData = JSON.parse(authRaw);
      
      // Get seller_id from authData (uid) or localStorage
      const sellerId = authData?.uid || authData?.seller_id || localStorage.getItem('uid');
      
      if (sellerId) {
        // Always fetch from API to get latest data - this is the source of truth
        getSellerInfo(sellerId)
            .then((response) => {
              if (response.status_code === 200) {
                // Extract seller data from response (could be in data or record field)
                const sellerData = response?.message?.record[0] || null;

                if (sellerData && typeof sellerData === 'object') {
                  // Check seller_state from API response - this is the source of truth
                  const apiSellerState = sellerData.seller_state || sellerData.seller_status || 'draft';
                  
                  // Set seller state from API
                  setSellerState(apiSellerState);
                  
                  // If API says pending, show PendingApproval
                  if (apiSellerState === 'pending') {
                    setIsLoadingSellerInfo(false);
                    return;
                  }
                  
                  // If API says rejected, show ApprovalRejected
                  if (apiSellerState === 'rejected') {
                    setIsLoadingSellerInfo(false);
                    return;
                  }
                  
                  // If API says approved, redirect to seller dashboard
                  if (apiSellerState === 'approved') {
                    setIsLoadingSellerInfo(false);
                    router.push('/seller-dashboard');
                    return;
                  }
                  
                  // Only if seller_state is 'draft' or missing, proceed with form prefilling
                  if (apiSellerState === 'draft' || !apiSellerState) {
                    // Transform API response to FormData format
                    const transformedData = transformSellerInfoToFormData(sellerData);
                    
                    // Merge with existing formData
                    setFormData((prev) => ({ ...prev, ...transformedData }));
                    
                    // Determine step based on last filled field
                    let inferredStep = 1;
                    try {
                      inferredStep = inferStepFromSellerData(sellerData);
                    } catch (e) {
                      inferredStep = 1;
                    }
                    
                    // Set step and state together
                    setCurrentStep(inferredStep);
                    
                    // Mark form as ready - loading will be hidden in useEffect after render
                    formReadyRef.current = true;
                    setIsFormDataReady(true);
                  } else {
                    // Unknown state, default to draft
                    setCurrentStep(1);
                    formReadyRef.current = true;
                    setIsFormDataReady(true);
                  }
                } else {
                  // No seller data, default to draft
                  setSellerState('draft');
                  setCurrentStep(1);
                  formReadyRef.current = true;
                  setIsFormDataReady(true);
                }
              } else {
                // API call failed, default to draft
                setSellerState('draft');
                setCurrentStep(1);
                formReadyRef.current = true;
                setIsFormDataReady(true);
              }
            })
            .catch((err) => {
              // Check if it's an auth error - redirect to login
              const isAuthError = err instanceof Error && (
                err.message.includes('token') || 
                err.message.includes('session') || 
                err.message.includes('401') ||
                (err as any)?.status === 401
              );
              
              if (isAuthError) {
                router.push('/login');
                setIsLoadingSellerInfo(false);
                return;
              }
              
              // Fallback to localStorage seller_data if API fails
              const raw = localStorage.getItem('seller_data');
              if (raw) {
                try {
                  const sellerData = JSON.parse(raw);
                  if (sellerData && typeof sellerData === 'object') {
                    // Check seller_state in fallback data too
                    const fallbackState = sellerData.seller_state || sellerData.seller_status || 'draft';
                    setSellerState(fallbackState);
                    
                    if (fallbackState === 'pending') {
                      setIsLoadingSellerInfo(false);
                      return;
                    }
                    if (fallbackState === 'rejected') {
                      setIsLoadingSellerInfo(false);
                      return;
                    }
                    const transformedData = transformSellerInfoToFormData(sellerData);
                    setFormData((prev) => ({ ...prev, ...transformedData }));
                    let inferredStep = 1;
                    try {
                      inferredStep = inferStepFromSellerData(sellerData);
                    } catch (e) {
                      inferredStep = 1;
                    }
                    setCurrentStep(inferredStep);
                    formReadyRef.current = true;
                    setIsFormDataReady(true);
                  } else {
                    setSellerState('draft');
                    setCurrentStep(1);
                    formReadyRef.current = true;
                    setIsFormDataReady(true);
                  }
                } catch (e) {
                  setSellerState('draft');
                  setCurrentStep(1);
                  formReadyRef.current = true;
                  setIsFormDataReady(true);
                }
              } else {
                setSellerState('draft');
                setCurrentStep(1);
                formReadyRef.current = true;
                setIsFormDataReady(true);
              }
            });
      } else {
        // No seller_id, redirect to login so flow is explicit
        router.push('/login');
        setIsLoadingSellerInfo(false);
      }
    } catch (err) {
      router.push('/login');
      setIsLoadingSellerInfo(false);
    }
  }, [mounted, router, userType]);

  // Hide loading spinner only after form data is ready and step is determined
  // Since we prevent FormPanel from rendering until currentStep is set, we can safely hide the loader
  useEffect(() => {
    if (isFormDataReady && formReadyRef.current && currentStep !== null) {
      // Use requestAnimationFrame to ensure React has finished rendering
      const frameId = requestAnimationFrame(() => {
        setIsLoadingSellerInfo(false);
      });
      
      return () => cancelAnimationFrame(frameId);
    }
  }, [isFormDataReady, currentStep]);

  const handleLogout = () => {
    // Use centralized redirect utility which handles:
    // - Clearing ALL localStorage and sessionStorage (auth data, user info, seller data, etc.)
    // - Clearing all query cache (prevents data leakage)
    // - Notifying other tabs
    // - Redirecting to login
    redirectToLogin({
      router,
      queryClient,
      invalidateQueries: true,
      clearStorage: true,
      notifyTabs: true,
    });
  };

  const handleNext = () => {
    if (currentStep !== null && currentStep < steps.length) {
      setCurrentStep((s) => (s ?? 1) + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep !== null && currentStep > 1) {
      setCurrentStep((s) => (s ?? 1) - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveDraft = async (currentFormValues?: Partial<FormData>) => {
    // Prevent multiple simultaneous saves
    if (isSavingDraft) return;

    try {
      setIsSavingDraft(true);
      
      // Merge current form values with existing formData
      // This ensures we capture values from react-hook-form that haven't been synced yet
      const dataToSave = currentFormValues 
        ? { ...formData, ...currentFormValues }
        : formData;
      
      // Update formData state with current values
      if (currentFormValues) {
        setFormData((prev) => ({ ...prev, ...currentFormValues }));
      }
      
      // Call updateSellerInfo API with merged data
      // The API will filter out empty values
      const res = await updateSellerInfo(dataToSave);

      if (res.status_code !== 200) {
        toast.error(res.message || "Failed to save draft");
        return;
      }

      toast.success("Draft saved successfully!");
    } catch (err) {
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Pass isSubmission: true to include seller_status in the payload
      const res = await updateSellerInfo(formData, { isSubmission: true })

      if (res.status_code !== 200) {
        toast.error(res.message || "Failed to submit")
        return
      }

      // Get seller_id from authData (uid) or localStorage
      const authData = getAuthData();
      const sellerId = authData?.uid || localStorage.getItem('uid');

      if (!sellerId) {
        toast.error("Unable to retrieve seller information. Please try again.");
        return;
      }

      // Update seller state to pending
      const stateRes = await updateSellerState(sellerId, 'pending');

      if (stateRes.status_code !== 200) {
        toast.error(stateRes.message || "Failed to update seller state. Please try again.");
        return;
      }

      // Update seller state to pending (will be reflected on next page load via API)
      setSellerState('pending');
      router.replace('/partner-onboarding')
    } catch (err) {
      toast.error("Submission failed. Try again.")
    }
  }

  // Show loading spinner while fetching seller info OR until form data is ready AND step is determined
  // Also show loader if sellerState is null (still loading from API)
  if (isLoadingSellerInfo || sellerState === null) {
    return (
      <LoadingSpinner className="bg-[#fbfbfb]" />
    );
  }

  // If sellerState is pending, show PendingApproval component
  if (sellerState === 'pending') {
    return (
      <div className="min-h-screen bg-[#fbfbfb] overflow-x-hidden">
        <div className="flex justify-center">
          <div className="w-full max-w-[640px] px-4 py-8">
            <PendingApproval onLogout={handleLogout} />
          </div>
        </div>
      </div>
    );
  }

  // If sellerState is rejected, show ApprovalRejected component
  if (sellerState === 'rejected') {
    return (
      <div className="min-h-screen bg-[#fbfbfb] overflow-x-hidden">
        <div className="flex justify-center">
          <div className="w-full max-w-[640px] px-4 py-8">
            <ApprovalRejected onLogout={handleLogout} />
          </div>
        </div>
      </div>
    );
  }

  // For 'draft' state, show onboarding form with TopPanel
  // Also show loader if form data is not ready or step is not determined
  if (!isFormDataReady || currentStep === null) {
    return (
      <LoadingSpinner className="bg-[#fbfbfb]" />
    );
  }

  // For 'draft' state, show onboarding form with TopPanel
  return (
    <div className="min-h-screen bg-[#fbfbfb] overflow-x-hidden">
      <TopPanel steps={steps} currentStep={currentStep} onLogout={handleLogout} />

      <main className="flex justify-center">
        <div className="w-full max-w-[1100px] px-4 py-8">
          <FormPanel
            currentStep={currentStep}
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            goToStep={goToStep}
          />
        </div>
      </main>
    </div>
  );
}

