// src/components/file-uploader.tsx
import React, { useRef } from 'react';
import { Upload, FileText, Download, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FileUploaderProps } from '@/types';
import { normalizeBase64, base64ToDataUrl, detectMimeTypeFromBase64 } from '@/lib/api/helpers/base64';

export function FileUploader({
  label,
  subLabel,
  fileName,
  fileBase64,
  required = false,
  onUpload,
  onDelete,
  showAddMore = false,
  onAddMore,
  accept = 'any',
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
  const isImage = (f: File) => {
    const name = f.name.toLowerCase();
    return (
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      f.type.startsWith('image/')
    );
  };

  const isJpgOrPng = (f: File) => {
    const name = f.name.toLowerCase();
    return (
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.png') ||
      f.type === 'image/jpeg' ||
      f.type === 'image/jpg' ||
      f.type === 'image/png'
    );
  };

  const validateFileForMode = (file: File) => {
    if (accept === 'pdf' && !isPdf(file)) {
      toast.error('Please upload file in PDF format');
      return false;
    }
    if (accept === 'image' && !isImage(file)) {
      toast.error('Please upload in any image format');
      return false;
    }
    if (accept === 'pdf-or-image' && !isPdf(file) && !isJpgOrPng(file)) {
      toast.error('Please upload only PDF, JPG, or PNG files');
      return false;
    }
    return true;
  };

  const openFileDialog = () => inputRef.current?.click();

  const handleFileSelected = (file: File | null) => {
    if (!file) return;

    if (!validateFileForMode(file)) return;

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      // strip "data:application/pdf;base64," prefix
      const base64 = result.includes(',') ? result.split(',')[1] : result;

      onUpload?.(base64, file.name);
    };

    reader.onerror = () => {
      onUpload?.('', file.name);
    };

    reader.readAsDataURL(file);
  };

  const getMime = () => {
    if (accept === 'pdf') return 'application/pdf';
    if (accept === 'image') return 'image/png';
    return 'application/octet-stream';
  };

  const getAcceptAttribute = () => {
    if (accept === 'pdf') return 'application/pdf';
    if (accept === 'image') return 'image/*';
    if (accept === 'pdf-or-image') return 'application/pdf,image/jpeg,image/jpg,image/png,.pdf,.jpg,.jpeg,.png';
    return undefined; // 'any' - no restriction
  };

  return (
    <div className="border border-[#e8e8e8] rounded-[5px] p-[12px] bg-[#fcfcfc]">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={getAcceptAttribute()}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          handleFileSelected(f);
          e.target.value = '';
        }}
      />

      <div className="flex items-center justify-between mb-[8px]">
        <div>
          {label && (
            <p className="font-urbanist font-semibold text-[14px] text-[#606060]">
              {label}
            </p>
          )}
          {subLabel && (
            <p className="font-urbanist font-semibold text-[12px] text-[#a4a4a4]">
              {subLabel}
            </p>
          )}
        </div>

        {required && !fileName && (
          <span className="font-urbanist font-semibold text-[12px] leading-[16px] px-[8px] py-[4px] rounded-[4px] text-red-700">
            Required
          </span>
        )}

        {!required && !fileName && (
          <span className="font-urbanist font-semibold text-[12px] leading-[16px] px-[8px] py-[4px] rounded-[4px] bg-gray-100 text-gray-600">
            Optional
          </span>
        )}

        {fileName && (
          <span className="font-urbanist font-semibold text-[12px] leading-[16px] px-[8px] py-[4px] rounded-[4px] bg-green-100 text-green-700 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Uploaded
          </span>
        )}
      </div>

      {fileName ? (
        <div className="flex items-center justify-between bg-white border border-[#e8e8e8] rounded-[5px] px-[12px] py-[8px]">
          <span className="truncate max-w-[200px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">{fileName}</span>

          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              className="p-1 text-[#606060] hover:text-[#B04725]"
              title="Download"
              onClick={() => {
                if (!fileBase64) {
                  toast.error('File not available for download');
                  return;
                }
                // Normalize base64 string using unified utility
                const normalized = normalizeBase64(fileBase64);
                if (!normalized) {
                  toast.error('Invalid file data');
                  return;
                }
                const dataUrl = base64ToDataUrl(normalized, getMime());
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="p-1 text-[#606060] hover:text-[#B04725]"
              title="Replace"
              onClick={openFileDialog}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onDelete && (
              <button
                type="button"
                className="p-1 text-[#606060] hover:text-red-600"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openFileDialog}
          className="flex items-center gap-[8px] px-[12px] py-[6px] border border-[#e8e8e8] rounded-[5px] bg-white hover:bg-gray-50 font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]"
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
      )}

      {showAddMore && onAddMore && (
        <div className="mt-3 pt-3 border-t border-[#e8e8e8]">
          <button
            type="button"
            onClick={onAddMore}
            className="flex items-center gap-[8px] font-urbanist font-semibold text-[14px] text-[#B04725] leading-[20px] hover:text-[#8e3519]"
          >
            <Plus className="w-4 h-4" />
            Add Another Document
          </button>
        </div>
      )}
    </div>
  );
}
