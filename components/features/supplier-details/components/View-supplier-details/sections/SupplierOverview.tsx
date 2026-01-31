import React, { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Download,
  Info,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  FileText,
  X,
  ArrowLeft,
  Sparkles,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import VendorAgreementForm, { VendorFormData } from './pdf/VendorAgreementForm';
import VendorAgreementViewer from './pdf/VendorAgreementViewer';
import { useFormContext } from 'react-hook-form';
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { useGenerateVendorAgreementMutation } from '@/components/features/supplier-details/hooks/use-supplier-query';
import { uploadSignedDocument } from "@/lib/api/endpoints/seller";

type AgreementStatus = "initial" | "unsigned" | "signed" | "";

export default function SupplierOverview(props: { supplier: any; vendorId?: number | string }) {
  const { supplier, vendorId }: { supplier: any; vendorId?: number | string } = props;
  
  // TanStack Query mutation
  const generateAgreementMutation = useGenerateVendorAgreementMutation()
  
  const [status, setStatus] = useState<AgreementStatus>(supplier.agreementStatus || "initial");
  const [agreementUrl, setAgreementUrl] = useState<string | undefined>(supplier.agreement_url);
  const [hasGeneratedAgreement, setHasGeneratedAgreement] = useState<boolean>(!!supplier.agreement_url);
  const [signedAgreementUrl, setSignedAgreementUrl] = useState<string | undefined>(
    (supplier as any)?.signed_agreement_url || (supplier as any)?.agreement_url || undefined
  );
  const [hasSignedAgreement, setHasSignedAgreement] = useState<boolean>(
    !!(supplier as any)?.signed_agreement_url || !!(supplier as any)?.agreement_url
  );

  // Sync agreement_url from supplier prop when it changes
  useEffect(() => {
    if (supplier.agreement_url) {
      setAgreementUrl(supplier.agreement_url);
      setHasGeneratedAgreement(true);
    }
    // Sync signed agreement URL if available
    const signedUrl = (supplier as any)?.signed_agreement_url || (supplier as any)?.agreement_url;
    if (signedUrl) {
      setSignedAgreementUrl(signedUrl);
      setHasSignedAgreement(true);
    } else {
      setHasSignedAgreement(false);
    }
  }, [supplier]);
  
  // Dialog / PDF generation state
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [vendorFormData, setVendorFormData] = useState<VendorFormData | null>(null);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);

  // Upload signed document state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [commissionValue, setCommissionValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read seller form data from surrounding FormProvider (if present)
  let formValuesGetter: any = null;
  try {
    // useFormContext will throw when not inside a provider, guard with try/catch
    // eslint-disable-next-line react-hooks/rules-of-hooks
    formValuesGetter = useFormContext();
  } catch (e) {
    formValuesGetter = null;
  }

  // Prepare initial form data from supplier and form context
  const prepareInitialFormData = useCallback((): Partial<VendorFormData> => {
    const initial: Partial<VendorFormData> = {};

    if (formValuesGetter && typeof formValuesGetter.getValues === 'function') {
      try {
        const bp = formValuesGetter.getValues('businessProfile') || {};
        const rb = formValuesGetter.getValues('registrationBank') || {};
        const dec = formValuesGetter.getValues('declarations') || {};

        initial.vendorName = bp.brandName || bp.legalEntityName || supplier?.name || '';
        initial.vendorType = bp.businessType || supplier?.companyType || '';
        // Compose registered office from regAddress fields
        const regParts = [bp.regAddress1, bp.regAddress2, bp.regCity, bp.regState, bp.regPin].filter(Boolean);
        initial.registeredOffice = regParts.join(', ') || '';
        initial.city = bp.regCity || bp.prinCity || supplier?.city || '';
        initial.gstNumber = rb.gstin || rb.gst || '';
        initial.date = new Date().toLocaleDateString('en-GB');
        initial.supplierNoticeEmail = bp.primaryEmail || '';
        initial.vendorSignatureName = dec.signatoryName || bp.primaryContactName || '';
        initial.vendorDesignation = dec.designation || bp.primaryDesignation || '';
        initial.commissionPercentage = '';
      } catch (err) {
        // Fallback to supplier minimal data
        initial.vendorName = supplier?.name || '';
        initial.vendorType = supplier?.companyType || '';
        initial.city = supplier?.city || '';
        initial.registeredOffice = `${supplier?.city || ''}, ${supplier?.state || ''}`;
        initial.date = new Date().toLocaleDateString('en-GB');
      }
    } else {
      initial.vendorName = supplier?.name || '';
      initial.vendorType = supplier?.companyType || '';
      initial.city = supplier?.city || '';
      initial.registeredOffice = `${supplier?.city || ''}, ${supplier?.state || ''}`;
      initial.date = new Date().toLocaleDateString('en-GB');
    }

    return initial;
  }, [formValuesGetter, supplier]);

  const handleOpenAgreementModal = useCallback(() => {
    const initialData = prepareInitialFormData();
    setVendorFormData(initialData as VendorFormData);
    setViewerVisible(false);
    setIsAgreementOpen(true);
  }, [prepareInitialFormData]);

  const handleFormSubmit = useCallback((data: VendorFormData) => {
    setVendorFormData(data);
    setViewerVisible(true);
  }, []);

  const handleBackToForm = useCallback(() => {
    setViewerVisible(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAgreementOpen(false);
    setViewerVisible(false);
  }, []);

  const handlePrintOrDownload = useCallback(() => {
    // Update status to show unsigned agreement has been generated
    setStatus('unsigned');
    // Close the modal after print/download
    setIsAgreementOpen(false);
    setViewerVisible(false);
  }, []);

  const handlePreviewReady = useCallback(() => {
    toast.success("Generated successfully");
  }, []);

  const handleDownloadUnsigned = useCallback(() => {
    // Open agreement URL if available
    if (agreementUrl) {
      window.open(agreementUrl, '_blank');
    } else if (vendorFormData) {
      // Fallback to modal viewer if no URL but form data exists
      setViewerVisible(true);
      setIsAgreementOpen(true);
    }
  }, [agreementUrl, vendorFormData]);

  const handleUploadSigned = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  // File upload handlers
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, []);

  const validateAndSetFile = useCallback((file: File) => {
    // Check if file is PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload file with valid pdf format');
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, [validateAndSetFile]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleUploadSubmit = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadSignedDocument(selectedFile);
      // Update status to show signed agreement has been uploaded
      setStatus('signed');
      
      // Store signed agreement URL from response if available
      const responseData = response?.data as any;
      if (responseData) {
        const signedUrl = responseData.signed_agreement_url || responseData.url || responseData.signed_url;
        if (signedUrl) {
          setSignedAgreementUrl(signedUrl);
          setHasSignedAgreement(true);
        }
      }
      
      handleCloseUploadModal();
      toast.success('Agreement submitted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload agreement. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, handleCloseUploadModal]);

  const handleRegenerate = useCallback(() => {
    // Reset to initial state and open the modal
    setStatus('initial');
    setVendorFormData(null);
    handleOpenAgreementModal();
  }, [handleOpenAgreementModal]);

  // Reupload signed agreement handler (reuses existing upload modal)
  const handleReuploadSigned = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  // Delete signed agreement handler (frontend only)
  const handleDeleteSigned = useCallback(() => {
    // Reset status to unsigned and clear signed URL
    setStatus('unsigned');
    setSignedAgreementUrl(undefined);
    setHasSignedAgreement(false);
    toast.success('Signed agreement removed');
  }, []);

  const handleOpenCommissionModal = useCallback(() => {
    if (!vendorId) {
      toast.error('Vendor ID is required to generate agreement');
      return;
    }
    setCommissionValue('');
    setIsCommissionModalOpen(true);
  }, [vendorId]);

  const handleCloseCommissionModal = useCallback(() => {
    setIsCommissionModalOpen(false);
    setCommissionValue('');
  }, []);

  // Generate vendor agreement using TanStack Query mutation
  const handleGenerateAgreement = useCallback(async () => {
    if (!vendorId) {
      toast.error('Vendor ID is required to generate agreement');
      return;
    }

    const commissionTrimmed = commissionValue.toString().trim();
    if (!commissionTrimmed) {
      toast.error('Please enter a commission amount');
      return;
    }

    const commissionNumber = Number(commissionTrimmed);
    if (Number.isNaN(commissionNumber)) {
      toast.error('Commission must be a valid number');
      return;
    }

    try {
      setIsGenerating(true);
      
      const result = await generateAgreementMutation.mutateAsync({
        vendorId,
        commission: commissionNumber
      });
      
      // Update agreement_url if provided in response
      if (result.agreement_url) {
        setAgreementUrl(result.agreement_url);
        // Open the agreement URL in a new tab
        window.open(result.agreement_url, '_blank');
      }
      
      // Set flag to show both buttons after successful generation
      setHasGeneratedAgreement(true);
      
      // Update status to show unsigned agreement has been generated
      setStatus('unsigned');
      setIsCommissionModalOpen(false);
      
      toast.success('Agreement generated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate agreement. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [vendorId, commissionValue, generateAgreementMutation]);

  return (
    <div className="w-full bg-white rounded-lg border border-[#E4E4E7] shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center p-3">
        <div className="flex items-center gap-1">
          <h2 className="text-[17px] font-bold text-[#3f3f46]">
            Supplier Overview
          </h2>
          {/* <Info size={16} className="text-gray-400" /> */}
        </div>

        {/* Actions based on agreement_url or hasGeneratedAgreement flag */}
        {status !== "signed" && (
          <div className="flex items-center gap-3">
            {/* Show Generate button only when agreement hasn't been generated */}
            {!hasGeneratedAgreement && (
              <Button
                className="rounded-xl bg-primary-800 hover:bg-primary-900 text-white px-5 py-2 text-[15px] flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                onClick={handleOpenCommissionModal}
                disabled={generateAgreementMutation.isPending || isGenerating || !vendorId}
              >
                <FileText size={16} />
                {(generateAgreementMutation.isPending || isGenerating) ? 'Generating...' : 'Generate Unsigned Agreement'}
              </Button>
            )}

            {/* Show Unsigned Agreement badge with download when agreement has been generated */}
            {hasGeneratedAgreement && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 rounded-lg border border-green-200 shadow-sm">
                <span className="pl-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="font-medium">Unsigned Agreement Generated</span>
                </span>
                <Button
                  size="icon"
                  className="bg-primary-800 text-white rounded-none rounded-r-lg hover:bg-primary-900 h-9 w-9"
                  onClick={() => window.open(agreementUrl, '_blank')}
                  title="Download unsigned agreement"
                >
                  <Download size={18} />
                </Button>
              </div>
            )}

            {/* Upload Signed Agreement button - check if agreement_url exists */}
            {hasSignedAgreement && signedAgreementUrl ? (
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 shadow-sm">
                <span className="pl-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="font-medium">Signed Agreement Uploaded</span>
                </span>
                <Button
                  size="icon"
                  className="bg-primary-800 text-white rounded-none rounded-r-lg hover:bg-primary-900 h-9 w-9"
                  onClick={() => window.open(signedAgreementUrl, '_blank')}
                  title="Download signed agreement"
                >
                  <Download size={18} />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="rounded-xl border-2 border-gray-300 text-gray-700 px-4 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200"
                onClick={handleUploadSigned}
              >
                <Upload size={16} className="mr-2" />
                Upload Signed Agreement
              </Button>
            )}
          </div>
        )}

        {status === "signed" && (
          <div className="flex items-center gap-3">
            {/* Unsigned Agreement Badge */}
            <div className="flex items-center gap-2 bg-green-100 text-green-800 rounded-lg border border-green-200 shadow-sm">
              <span className="pl-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="font-medium">Unsigned Agreement Generated</span>
              </span>
              <Button
                size="icon"
                className="bg-primary-800 text-white rounded-none rounded-r-lg hover:bg-primary-900 h-9 w-9"
                onClick={() => window.open(agreementUrl, '_blank')}
                title="Download unsigned agreement"
              >
                <Download size={18} />
              </Button>
            </div>

            {/* Signed Agreement Badge */}
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 shadow-sm">
              <span className="pl-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="font-medium">Signed Agreement Uploaded</span>
              </span>
              <div className="flex">
                <Button
                  size="icon"
                  className="bg-primary-800 text-white rounded-none hover:bg-primary-900 h-9 w-9"
                  onClick={handleReuploadSigned}
                  title="Replace signed agreement"
                >
                  <RefreshCw size={18} />
                </Button>
                <Button
                  size="icon"
                  className="bg-primary-800 text-white rounded-none rounded-r-lg hover:bg-primary-900 h-9 w-9"
                  onClick={handleDeleteSigned}
                  title="Remove signed agreement"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Commission Prompt Modal */}
      <Dialog open={isCommissionModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseCommissionModal();
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 px-6 py-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Generate Unsigned Agreement
                  </DialogTitle>
                  <p className="text-sm text-white/70 mt-1">
                    Enter the commission amount to generate the agreement.
                  </p>
                </div>
                <DialogClose asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/90 hover:text-white hover:bg-white/10 rounded-full"
                  >
                    <X size={20} />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-gray-700">
                Commission Amount <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter commission amount"
              />
            </label>
          </div>

          <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseCommissionModal}
              className="rounded-xl"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateAgreement}
              disabled={isGenerating || !commissionValue.trim()}
              className="rounded-xl bg-primary-800 hover:bg-primary-900 text-white"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agreement Modal */}
      <Dialog open={isAgreementOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseModal();
        }
      }}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] bg-gradient-to-br from-white to-gray-50 p-0 overflow-hidden border-0 shadow-2xl">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 px-6 py-4">
            <DialogHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {viewerVisible && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToForm}
                      className="text-white/90 hover:text-white hover:bg-white/10 rounded-full"
                    >
                      <ArrowLeft size={20} />
                    </Button>
                  )}
                  <div>
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      {viewerVisible ? 'Vendor Agreement Preview' : 'Generate Vendor Agreement'}
                    </DialogTitle>
                    <p className="text-sm text-white/70 mt-1">
                      {viewerVisible 
                        ? 'Review, print, or download the generated agreement' 
                        : 'Fill in the details below to generate the agreement'}
                    </p>
                  </div>
                </div>
                <DialogClose asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white/90 hover:text-white hover:bg-white/10 rounded-full"
                  >
                    <X size={20} />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
            {!viewerVisible ? (
              // Form View
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <VendorAgreementForm
                  onSubmit={handleFormSubmit}
                  initialData={vendorFormData || undefined}
                />
              </div>
            ) : (
              // Viewer View
              <div>
                {vendorFormData && (
                  <VendorAgreementViewer 
                    formData={vendorFormData} 
                    onPrintOrDownload={handlePrintOrDownload}
                    onPreviewReady={handlePreviewReady}
                  />
                )}
              </div>
            )}
          </div>

          {/* Modal Footer - Only shown in form view */}
          {!viewerVisible && (
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  {/* <Info size={14} /> */}
                  Fill all required fields to generate the agreement
                </p>
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl">
                    Cancel
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Signed Document Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseUploadModal();
        }
      }}>
        <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden border-0 shadow-2xl">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 px-6 py-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Signed Document
                  </DialogTitle>
                  <p className="text-sm text-white/70 mt-1">
                    Upload the signed vendor agreement document (PDF only)
                  </p>
                </div>
                <DialogClose asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white/90 hover:text-white hover:bg-white/10 rounded-full"
                  >
                    <X size={20} />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                ${isDragOver 
                  ? 'border-primary-500 bg-primary-50 scale-[1.02]' 
                  : selectedFile
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 bg-gray-50/50 hover:border-primary-400 hover:bg-primary-50/30'
                }
              `}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <File className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-semibold text-gray-700">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="mt-2"
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center transition-colors
                    ${isDragOver ? 'bg-primary-200' : 'bg-gray-100'}
                  `}>
                    <Upload className={`w-10 h-10 ${isDragOver ? 'text-primary-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-base font-semibold text-gray-700">
                      {isDragOver ? 'Drop your PDF file here' : 'Drag & drop your PDF file here'}
                    </p>
                    <p className="text-sm text-gray-500">or</p>
                    <Button
                      variant="outline"
                      onClick={handleBrowseClick}
                      className="mt-2 border-primary-500 text-primary-600 hover:bg-primary-50"
                    >
                      Browse from My Computer
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      Only PDF files are accepted
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseUploadModal}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={!selectedFile || isUploading}
              className="rounded-xl bg-primary-800 hover:bg-primary-900 text-white"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Separator />

      {/* Supplier Info */}
      <div className="flex items-center p-3 gap-3">
        <div className="relative w-10 h-10">
          <Image
            src="/placeholder-user-icon.png"
            alt="avatar"
            fill
            className="rounded-full object-cover"
          />
        </div>

        <div>
          <p className="text-lg font-semibold text-gray-700 leading-tight">
            <span className="text-black">{supplier.name}</span> •{" "}
            {supplier.companyType}
          </p>
          <p className="text-[15px] text-gray-500 leading-tight">
            +91-{supplier.phone} • {supplier.city} • {supplier.state}
            {(supplier as any)?.authorised_person_email && ` • ${(supplier as any).authorised_person_email}`}
          </p>
        </div>
      </div>
    </div>
  );
}
