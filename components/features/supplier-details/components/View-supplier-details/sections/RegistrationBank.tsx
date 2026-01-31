"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye } from "lucide-react";
import DocumentPreviewModal from "../DocumentPreviewModal";
import type { RegistrationBankData } from "./index";

export default function RegistrationBank() {
  const { register, watch, setValue, control } =
    useFormContext<{ registrationBank: RegistrationBankData }>();

  const value = watch("registrationBank");
  
  // Watch file fields explicitly to ensure they're populated when base64 data is converted to File objects
  const incCertFile = watch("registrationBank.incCertFile");
  const gstCertFile = watch("registrationBank.gstCertFile");
  const panCardFile = watch("registrationBank.panCardFile");
  const shopsCertFile = watch("registrationBank.shopsCertFile");
  const cancelledChequeFile = watch("registrationBank.cancelledChequeFile");

  // Modal state for each document
  const [modalState, setModalState] = useState<{
    open: boolean;
    file: File | null;
    fileName?: string;
    label?: string;
  }>({
    open: false,
    file: null,
  });

  const openModal = (file: File | null, fileName?: string, label?: string) => {
    setModalState({ open: true, file, fileName, label });
  };

  const closeModal = () => {
    setModalState({ open: false, file: null });
  };

  return (
    <div className="font-urbanist space-y-10">
      {/* TITLE */}
      <h3 className="text-sm font-semibold text-gray-800">
        Business Registrations
      </h3>

      {/* CIN + PAN + GST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label>CIN / Registration Number</Label>
          <Input
            {...register("registrationBank.cin")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="Leave blank if not applicable"
          />
        </div>

        <div>
          <Label>
            GSTIN <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register("registrationBank.gstin")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="Enter GSTIN"
            onChange={(e) =>
              setValue("registrationBank.gstin", e.target.value.toUpperCase())
            }
          />
        </div>

        <div>
          <Label>
            PAN <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register("registrationBank.pan")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="ABCDE1234F"
            onChange={(e) =>
              setValue("registrationBank.pan", e.target.value.toUpperCase())
            }
          />
        </div>
      </div>

      {/* Shops Registration No */}
      <div>
        <Label>Shops & Establishments Reg. No.</Label>
        <Input
          {...register("registrationBank.shopsRegNo")}
          disabled
          className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
          placeholder="Optional"
        />
      </div>

      {/* Document Uploads */}
      <div className="space-y-6">
        <p className="text-sm font-semibold text-gray-800">
          Registration Documents
        </p>

        {/* Certificate of Incorporation */}
        <div className="flex items-center justify-between border rounded-lg bg-gray-50 shadow-sm p-4">
          <div>
            <Label className="text-gray-800 font-medium text-sm">
              Certificate of Incorporation / Registration
            </Label>
            <p className="text-[11px] text-gray-500 mt-0.5">PDF, JPG, or PNG</p>
          </div>
          {incCertFile ? (
            <button
              type="button"
              onClick={() =>
                openModal(
                  incCertFile,
                  incCertFile.name,
                  "Certificate of Incorporation / Registration"
                )
              }
              className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
          ) : (
            <span className="text-xs text-gray-400">No file</span>
          )}
        </div>

        {/* GST Certificate */}
        <div className="flex items-center justify-between border rounded-lg bg-gray-50 shadow-sm p-4">
          <div>
            <Label className="text-gray-800 font-medium text-sm">
              GST Registration Certificate
            </Label>
            <p className="text-[11px] text-gray-500 mt-0.5">PDF, JPG, or PNG</p>
          </div>
          {gstCertFile ? (
            <button
              type="button"
              onClick={() =>
                openModal(
                  gstCertFile,
                  gstCertFile.name,
                  "GST Registration Certificate"
                )
              }
              className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
          ) : (
            <span className="text-xs text-gray-400">No file</span>
          )}
        </div>

        {/* PAN Card */}
        <div className="flex items-center justify-between border rounded-lg bg-gray-50 shadow-sm p-4">
          <div>
            <Label className="text-gray-800 font-medium text-sm">PAN Card</Label>
            <p className="text-[11px] text-gray-500 mt-0.5">PDF, JPG, or PNG</p>
          </div>
          {panCardFile ? (
            <button
              type="button"
              onClick={() =>
                openModal(panCardFile, panCardFile.name, "PAN Card")
              }
              className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
          ) : (
            <span className="text-xs text-gray-400">No file</span>
          )}
        </div>

        {/* Shops Certificate */}
        <div className="flex items-center justify-between border rounded-lg bg-gray-50 shadow-sm p-4">
          <div>
            <Label className="text-gray-800 font-medium text-sm">
              Shops & Establishments Certificate
            </Label>
            <p className="text-[11px] text-gray-500 mt-0.5">PDF, JPG, or PNG</p>
          </div>
          {shopsCertFile ? (
            <button
              type="button"
              onClick={() =>
                openModal(
                  shopsCertFile,
                  shopsCertFile.name,
                  "Shops & Establishments Certificate"
                )
              }
              className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
          ) : (
            <span className="text-xs text-gray-400">No file</span>
          )}
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-800">Bank Details</h3>

        <div>
          <Label>
            Account Holder Name <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register("registrationBank.accountHolderName")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="As per bank records"
          />
        </div>

        {/* Account + Confirm */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Label>Account Number *</Label>
            <Input
              {...register("registrationBank.accountNumber")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Enter account number"
            />
          </div>

          <div>
            <Label>Confirm Account Number *</Label>
            <Input
              {...register("registrationBank.confirmAccountNumber")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Re-enter account number"
            />
          </div>
        </div>

        {/* IFSC + Bank Name */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Label>IFSC Code *</Label>
            <Input
              {...register("registrationBank.ifscCode")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Enter IFSC Code"
              onChange={(e) =>
                setValue(
                  "registrationBank.ifscCode",
                  e.target.value.toUpperCase()
                )
              }
            />
          </div>

          <div>
            <Label>Bank Name *</Label>
            <Input
              {...register("registrationBank.bankName")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Enter bank name"
            />
          </div>
        </div>

        {/* Branch + Account Type */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Label>Branch Name *</Label>
            <Input
              {...register("registrationBank.branchName")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Enter branch name"
            />
          </div>

          <div>
            <Label>Account Type *</Label>
            <Controller
              control={control}
              name="registrationBank.accountType"
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(v) => field.onChange(v)}
                  disabled
                >
                  <SelectTrigger className="bg-gray-50 disabled:opacity-100 disabled:cursor-default">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saving">Saving</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Cancelled Cheque Upload */}
      <div className="flex items-center justify-between border rounded-lg bg-gray-50 shadow-sm p-4">
        <div>
          <Label className="text-gray-800 font-medium text-sm">
            Cancelled Cheque / Bank Statement
          </Label>
          <p className="text-[11px] text-gray-500 mt-0.5">PDF, JPG, or PNG</p>
        </div>
        {cancelledChequeFile ? (
          <button
            type="button"
            onClick={() =>
              openModal(
                cancelledChequeFile,
                cancelledChequeFile.name,
                "Cancelled Cheque / Bank Statement"
              )
            }
            className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-700" />
          </button>
        ) : (
          <span className="text-xs text-gray-400">No file</span>
        )}
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={modalState.open}
        onOpenChange={closeModal}
        file={modalState.file}
        fileName={modalState.fileName}
        label={modalState.label}
      />
    </div>
  );
}
