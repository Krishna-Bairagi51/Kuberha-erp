'use client';

import React, { useState, useCallback } from 'react';
import VendorAgreementForm, { VendorFormData } from './VendorAgreementForm';
import VendorAgreementViewer from './VendorAgreementViewer';
import { toast } from 'sonner';

const Page = () => {
  const [formData, setFormData] = useState<VendorFormData | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const handleFormSubmit = (data: VendorFormData) => {
    setFormData(data);
    setShowViewer(true);
  };

  const handleBackToForm = () => {
    setShowViewer(false);
  };

  const handlePreviewReady = useCallback(() => {
    toast.success("Generated successfully");
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {!showViewer ? (
          <>
            <VendorAgreementForm onSubmit={handleFormSubmit} />
            {formData && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowViewer(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
                >
                  View Filled Agreement
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleBackToForm}
              className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              ← Back to Form
            </button>
            {formData && <VendorAgreementViewer formData={formData} onPreviewReady={handlePreviewReady} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Page;