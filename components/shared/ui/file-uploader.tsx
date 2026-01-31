"use client";
import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Upload, Download, RotateCcw, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import DocumentPreviewModal from "@/components/features/supplier-details/components/View-supplier-details/DocumentPreviewModal";

interface FileUploaderProps {
  label: string;
  value?: File | null;
  formatInstructions?: string;
  onFileChange: (file: File | null) => void;
  allowedTypes?: string[];
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  value,
  formatInstructions="PDF, JPG, or PNG",
  onFileChange,
  allowedTypes = ["application/pdf", "image/png", "image/jpeg"],
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {  
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Only ${formatInstructions} allowed.`);
      e.target.value = "";
      return;
    }

    onFileChange(file);
  };

  return (
    <div className="border rounded-lg bg-gray-50 shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Label className="text-gray-800 font-medium text-sm">{label}</Label>
          {formatInstructions && <p className="text-[11px] text-gray-500 mt-0.5">{formatInstructions}</p>}
        </div>

        {value && (
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md shrink-0">
            Uploaded
          </span>
        )}
      </div>

      {/* Main Area */}
      {!value ? (
        // Upload button initial state
        <div className="flex items-center justify-between bg-white border rounded-lg">
          <span className="text-sm text-gray-700 truncate p-2">
            No file chosen
          </span>

          <label className={`flex justify-center items-center py-3 text-green-600 font-semibold text-xs p-2 ${disabled ? 'cursor-default opacity-100' : 'cursor-pointer'}`}>
            <Upload size={14} className="mr-1" /> Upload
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes.join(",")}
              className="hidden"
              onChange={handleUpload}
              disabled={disabled}
            />
          </label>
        </div>
      ) : (
        // File preview & actions
        <div className="flex items-center justify-between border rounded-md bg-white px-4 py-3">
          <span className="text-sm text-gray-700 truncate pr-4">
            {value.name}
          </span>

          <div className="flex items-center gap-4">
            {disabled ? (
              // When disabled, show only view button
              <button
                type="button"
                aria-label="View file"
                onClick={() => setIsModalOpen(true)}
                className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 text-gray-700" />
              </button>
            ) : (
              // When enabled, show all action buttons
              <>
                {/* Download */}
                <button
                  type="button"
                  aria-label="Download file"
                  onClick={() =>
                    toast.info("Integrate your file download functionality here!")
                  }
                >
                  <Download
                    size={18}
                    className="text-gray-600 transition hover:text-black"
                  />
                </button>

                {/* Replace */}
                <label className="cursor-pointer">
                  <RotateCcw
                    size={18}
                    className="text-gray-600 transition hover:text-black"
                  />
                  <input
                    type="file"
                    accept={allowedTypes.join(",")}
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>

                {/* Delete */}
                <button
                  type="button"
                  aria-label="Delete file"
                  onClick={() => onFileChange(null)}
                >
                  <Trash2
                    size={18}
                    className="text-gray-600 transition hover:text-red-600"
                  />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Document Preview Modal (only when disabled and file exists) */}
      {disabled && value && (
        <DocumentPreviewModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          file={value}
          fileName={value.name}
          label={label}
        />
      )}
    </div>
  );
};

export default FileUploader;
