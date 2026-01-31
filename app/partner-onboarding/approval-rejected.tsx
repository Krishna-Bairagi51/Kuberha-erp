'use client';

import React, { useState } from 'react';
import { XCircle, ArrowRight, Loader2 } from 'lucide-react';
import type { PendingApprovalProps } from '@/types';
import { updateSellerState } from '@/lib/api/endpoints/seller';
import { toast } from 'sonner';
import { getAuthData } from '@/lib/api/helpers/auth';
import Image from 'next/image';

/**
 * ApprovalRejected
 * A simple component showing rejection details and a "Retry" (logout) action.
 * Built using the PendingApproval's rejected UI as the reference, but isolated for clarity.
 */
export function ApprovalRejected({ onLogout }: PendingApprovalProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const rejectionReasons = [
    'Missing or wrong data provided in Step 1',
    'Bank proof document is unclear or invalid',
    'Other: Discrepancy in GSTIN and Trade Name',
  ];

  const handleRetry = async () => {
    if (isRetrying) return;

    try {
      setIsRetrying(true);

      // Get seller_id from authData (uid) or localStorage
      const authData = getAuthData();
      const sellerId = authData?.uid || localStorage.getItem('uid');

      if (!sellerId) {
        toast.error('Unable to retrieve seller information. Please log out and try again.');
        return;
      }

      // Call update_seller_state API to set seller_state to "draft"
      const res = await updateSellerState(sellerId, 'draft');

      if (res.status_code !== 200) {
        toast.error(res.message || 'Failed to update seller state. Please try again.');
        return;
      }

      // Update localStorage to reflect the new state
      localStorage.setItem('seller_state', 'draft');

      // Show success message
      toast.success('Application reset to draft. You can now edit and resubmit.');

      // Call logout logic
      onLogout();
    } catch (err) {
      toast.error('Failed to reset application. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <>
      {/* Logo/Header */}
      <div className="relative flex items-center justify-center gap-3 my-[52px] w-[500px] inline-flex justify-center">
            <Image
                src="/images/Logo_Casa Carigar_TERRACOTTA 1.png"
                alt="Casa Carigar Logo"
                width={320}
                height={320}
                className="object-contain absolute left-6"
                priority
            />
            <h1 className="font-urbanist font-bold text-[28px] text-[#212b36] leading-[36px] tracking-[-0.32px] text-nowrap absolute right-0">
                Partner Onboarding
            </h1>
        </div>

      <div className="bg-white rounded-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] p-[40px]">
      <div className="flex justify-center mb-[24px]">
        <div className="w-[80px] h-[80px] bg-[#fef3f2] rounded-full flex items-center justify-center">
          <XCircle className="w-[40px] h-[40px] text-[#d92d20]" />
        </div>
      </div>

      <h2 className="font-urbanist font-bold text-[24px] text-[#212b36] leading-[32px] text-center mb-[12px]">
        Application Rejected
      </h2>

      <p className="font-urbanist font-semibold text-[16px] text-[#606060] leading-[24px] text-center mb-[24px]">
        Unfortunately, we could not approve your application at this time.
      </p>

      <div className="bg-[#fef3f2] border border-[#fecdca] rounded-[8px] p-[24px] mb-[32px]">
        <h3 className="font-urbanist font-bold text-[14px] text-[#b42318] mb-[12px]">
          Reasons for rejection:
        </h3>
        <ul className="space-y-3">
          {rejectionReasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2 text-[14px] text-[#b42318] font-urbanist font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-[#b42318] mt-2 shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center font-urbanist font-medium text-[14px] text-[#606060] mb-[24px]">
      Please update your application with the correct details and submit again.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onLogout}
          className="flex-1 px-[24px] py-[12px] border border-[#e8e8e8] rounded-[8px] font-urbanist font-semibold text-[14px] text-[#606060] hover:bg-[#fafbfc] transition-colors"
        >
          Log Out
        </button>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex-1 bg-[#B04725] px-[24px] py-[12px] rounded-[8px] font-urbanist font-bold text-[14px] text-white hover:bg-[#8e3519] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              Retry
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      </div>
    </>
  );
}
