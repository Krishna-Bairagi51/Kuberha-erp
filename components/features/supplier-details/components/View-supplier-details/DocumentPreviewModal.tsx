"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, Image as ImageIcon } from "lucide-react";
import { base64ToDataUrl, detectMimeTypeFromBase64, normalizeBase64, isS3Link, detectMimeTypeFromS3Url } from "@/lib/api/helpers/base64";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  fileBase64?: string;
  file?: File | null;
  fileUrl?: string;
  label?: string;
}

/**
 * Convert base64 string to Blob URL for better PDF rendering.
 * Browsers have security restrictions on data URLs in iframes,
 * but Blob URLs work correctly for PDF preview.
 */
function base64ToBlobUrl(base64: string, mimeType: string): string {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    return "";
  }
}

export default function DocumentPreviewModal({
  open,
  onOpenChange,
  fileName,
  fileBase64,
  file,
  fileUrl,
  label,
}: DocumentPreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Compute document metadata (mimeType, etc.) without creating URLs
  const documentMeta = useMemo(() => {
    // Check if file has S3 URL stored in custom property
    const s3UrlFromFile = file && (file as any).__s3Url ? (file as any).__s3Url : null;
    const effectiveUrl = fileUrl || s3UrlFromFile;
    
    if (effectiveUrl && isS3Link(effectiveUrl)) {
      const mimeType = detectMimeTypeFromS3Url(effectiveUrl);
      return { source: "url" as const, mimeType, url: effectiveUrl };
    } else if (file) {
      const mimeType = file.type || "application/pdf";
      return { source: "file" as const, mimeType, file };
    } else if (fileBase64) {
      const normalized = normalizeBase64(fileBase64);
      if (!normalized) return null;
      const mimeType = detectMimeTypeFromBase64(normalized);
      return { source: "base64" as const, mimeType, normalized };
    }
    return null;
  }, [file, fileBase64, fileUrl]);

  // Create/cleanup Blob URL when modal opens or source changes
  useEffect(() => {
    if (!open || !documentMeta) {
      return;
    }

    let url: string;

    if (documentMeta.source === "url") {
      // For S3 URLs, use the URL directly
      url = documentMeta.url;
      setBlobUrl(url);
      // No cleanup needed for external URLs
      return;
    } else if (documentMeta.source === "file") {
      // Create object URL from File
      url = URL.createObjectURL(documentMeta.file);
    } else {
      // For base64, always use Blob URL (works for both PDFs and images)
      url = base64ToBlobUrl(documentMeta.normalized, documentMeta.mimeType);
    }

    setBlobUrl(url);

    // Cleanup on unmount or when dependencies change
    return () => {
      // Only revoke blob URLs (not S3 URLs which are external)
      if (url && (documentMeta.source === "file" || documentMeta.source === "base64")) {
        URL.revokeObjectURL(url);
      }
      setBlobUrl(null);
    };
  }, [open, documentMeta]);

  const displayFileName = fileName || file?.name || "Document";
  const isPdf = documentMeta?.mimeType === "application/pdf";
  const isImage = documentMeta?.mimeType?.startsWith("image/");

  const handleDownload = () => {
    if (!blobUrl) return;

    setIsDownloading(true);
    try {
      // For S3 URLs, open in new tab or download directly
      if (documentMeta?.source === "url") {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = displayFileName;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // For blob URLs (base64 or File), download normally
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = displayFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!documentMeta) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPdf ? (
                <FileText className="w-5 h-5 text-red-600" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5 text-blue-600" />
              ) : (
                <FileText className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-800">
                  {label || "Document Preview"}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">{displayFileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {!blobUrl ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              className="w-full h-[70vh] border border-gray-300 rounded-lg bg-white"
              title={displayFileName}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={blobUrl}
                alt={displayFileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Preview not available for this file type</p>
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="mt-4"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download to view
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


