"use client";
import { useFormContext } from "react-hook-form";
import { BusinessProfileData } from "./index"; // update path based on your structure
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getIndianStates } from "@/utils/component-utils";

export default function BusinessProfile() {
  const { register, watch, setValue } = useFormContext<{
    businessProfile: BusinessProfileData;
  }>();

  const value = watch("businessProfile");

  const states = getIndianStates();

  // Cleaner, reusable update for dependent fields
  const syncPrincipalAddress = (checked: boolean) => {
    setValue("businessProfile.sameAsRegistered", checked);

    if (checked) {
      setValue("businessProfile.prinAddress1", value.regAddress1);
      setValue("businessProfile.prinAddress2", value.regAddress2 ?? "");
      setValue("businessProfile.prinPin", value.regPin);
      setValue("businessProfile.prinCity", value.regCity);
      setValue("businessProfile.prinState", value.regState);
    }
  };

  return (
    <form className="font-urbanist font-semibold space-y-8">

      {/* Legal Entity + Brand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label className="mb-1 block">
            Legal Entity Name <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register("businessProfile.legalEntityName")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="Enter legal entity name"
          />
        </div>

        <div>
          <Label className="mb-1 block">
            Brand / Trading Name <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register("businessProfile.brandName")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="Name you sell under"
          />
        </div>
      </div>

      {/* Business Type */}
      <div>
        <Label className="mb-2 block">
          Business Type <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-[8px]">
          {[
            { label: "Private Limited Company", value: "private" },
            { label: "LLP", value: "llp" },
            { label: "Partnership Firm", value: "partnership" },
            { label: "Sole Proprietorship", value: "sole" },
            { label: "Other", value: "other" },
          ].map((type) => (
            <label key={type.value} className="flex items-center gap-[8px] cursor-pointer">
              <input
                type="radio"
                {...register("businessProfile.businessType")}
                value={type.value}
                disabled
                className="w-4 h-4 text-[#B04725] disabled:opacity-100 disabled:cursor-default"
              />
              <span className="font-['Urbanist:SemiBold',sans-serif] font-semibold text-[14px] text-[#606060] leading-[20px]">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Registered Address */}
      <div className="space-y-3">
        <Label>
          Registered Office Address <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("businessProfile.regAddress1")}
          disabled
          className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
          placeholder="Address Line 1"
        />
        <Input
          {...register("businessProfile.regAddress2")}
          disabled
          className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
          placeholder="Address Line 2"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            {...register("businessProfile.regPin")}
            maxLength={6}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="Pin Code"
          />
          <Input
            {...register("businessProfile.regCity")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="City"
          />

          <Select
            value={value.regState}
            onValueChange={(v) => setValue("businessProfile.regState", v)}
            disabled
          >
            <SelectTrigger className="bg-gray-50 disabled:opacity-100 disabled:cursor-default">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Same address checkbox */}
      <div className="flex items-center gap-2 mt-2">
        <Checkbox
          checked={value.sameAsRegistered}
          onCheckedChange={(checked) => syncPrincipalAddress(Boolean(checked))}
          disabled
          className="disabled:opacity-100 disabled:cursor-default"
        />
        <span className="text-sm text-gray-800">
          Principal address same as registered
        </span>
      </div>

      {/* Principal Address - Only show when sameAsRegistered is false (not checked) */}
      {!value.sameAsRegistered && (
        <div className="space-y-3">
          <Label>
            Principal Place of Business <span className="text-red-500">*</span>
          </Label>

          <Input
            {...register("businessProfile.prinAddress1")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="Address Line 1"
          />
          <Input
            {...register("businessProfile.prinAddress2")}
            disabled
            className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            placeholder="Address Line 2"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register("businessProfile.prinPin")}
              maxLength={6}
              disabled
              className="disabled:opacity-100 disabled:cursor-default"
              placeholder="Pin Code"
            />

            <Input
              {...register("businessProfile.prinCity")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="City"
            />

            <Select
              disabled
              value={value.prinState}
              onValueChange={(v) => setValue("businessProfile.prinState", v)}
            >
              <SelectTrigger className="bg-gray-50 disabled:opacity-100 disabled:cursor-default">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Primary Contact */}
      <div className="pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Primary Contact</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label className="mb-1 block">
              Contact Name <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register("businessProfile.primaryContactName")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Enter Contact Person name"
            />
          </div>

          <div>
            <Label className="mb-1 block">
              Designation <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register("businessProfile.primaryDesignation")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Enter designation"
            />
          </div>
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label className="mb-1 block">
              Mobile <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm font-medium select-none">
                +91
              </div>
              <Input
                {...register("businessProfile.primaryMobile")}
                maxLength={10}
                disabled
                className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
                placeholder="Enter mobile number"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register("businessProfile.primaryEmail")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Enter email address"
            />
          </div>
        </div>

        {/* Alternate Contact */}
        <div>
          <Label className="mb-1 block">Alternate Contact Number</Label>
          <div className="flex gap-2">
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm select-none">
              +91
            </div>
            <Input
              {...register("businessProfile.altMobile")}
              maxLength={10}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
