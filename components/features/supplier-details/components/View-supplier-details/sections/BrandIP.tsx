"use client";

import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import FileUploader from "@/components/shared/ui/file-uploader";
import type { SupplierFormData } from "./index";

export default function BrandIP() {
  const { control, watch, register, setValue } = useFormContext<SupplierFormData>();
  const brandIP = watch("brandIP");

  const {
    fields: designFields,
    append: addDesign,
    remove: removeDesign,
  } = useFieldArray({
    control,
    name: "brandIP.designs" as const,
  });

  const {
    fields: nocFields,
    append: addNocFile,
    remove: removeNocFile,
  } = useFieldArray({
    control,
    // cast to any to avoid a TypeScript inference collision with the other useFieldArray call
    name: "brandIP.nocFiles" as any,
  });

  return (
    <div className="font-urbanist space-y-10">
      {/* TRADEMARK */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Trademark</h3>

        <Label>Do you have a registered trademark?</Label>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="radio"
              name="brandIP.hasTrademark"
              checked={brandIP.hasTrademark === true}
              onChange={() => setValue("brandIP.hasTrademark", true)}
              disabled
              className="w-4 h-4 text-[#B04725] disabled:opacity-100 disabled:cursor-default"
            />
            <span className="font-['Urbanist:SemiBold',sans-serif] font-semibold text-[14px] text-[#606060] leading-[20px]">
              Yes
            </span>
          </label>
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="radio"
              name="brandIP.hasTrademark"
              checked={brandIP.hasTrademark === false}
              onChange={() => setValue("brandIP.hasTrademark", false)}
              disabled
              className="w-4 h-4 text-[#B04725] disabled:opacity-100 disabled:cursor-default"
            />
            <span className="font-['Urbanist:SemiBold',sans-serif] font-semibold text-[14px] text-[#606060] leading-[20px]">
              No
            </span>
          </label>
        </div>

        {brandIP.hasTrademark && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <Label>Brand Name</Label>
                <Input {...register("brandIP.brandName")} disabled className="disabled:opacity-100 disabled:cursor-default" />
              </div>

              <div>
                <Label>Trademark Number</Label>
                <Input {...register("brandIP.trademarkNumber")} disabled className="disabled:opacity-100 disabled:cursor-default" />
              </div>

              <div>
                <Label>Trademark Class</Label>
                <Input {...register("brandIP.trademarkClass")} disabled className="disabled:opacity-100 disabled:cursor-default" />
              </div>

              <div>
                <Label>Owner Name</Label>
                <Input {...register("brandIP.trademarkOwner")} disabled className="disabled:opacity-100 disabled:cursor-default" />
              </div>
            </div>

            <Controller
              control={control}
              name="brandIP.trademarkCert"
              render={({ field }) => (
                <FileUploader
                  label="Trademark Certificate *"
                  value={field.value}
                  onFileChange={field.onChange}
                  disabled
                />
              )}
            />
          </div>
        )}
      </section>

      {/* DESIGN REGISTRATION */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Design Registration
        </h3>

        <Label>Do you have any registered designs for your products?</Label>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="radio"
              name="brandIP.hasDesigns"
              checked={brandIP.hasDesigns === true}
              onChange={() => setValue("brandIP.hasDesigns", true)}
              disabled
              className="w-4 h-4 text-[#B04725] disabled:opacity-100 disabled:cursor-default"
            />
            <span className="font-['Urbanist:SemiBold',sans-serif] font-semibold text-[14px] text-[#606060] leading-[20px]">
              Yes
            </span>
          </label>
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="radio"
              name="brandIP.hasDesigns"
              checked={brandIP.hasDesigns === false}
              onChange={() => setValue("brandIP.hasDesigns", false)}
              disabled
              className="w-4 h-4 text-[#B04725] disabled:opacity-100 disabled:cursor-default"
            />
            <span className="font-['Urbanist:SemiBold',sans-serif] font-semibold text-[14px] text-[#606060] leading-[20px]">
              No
            </span>
          </label>
        </div>

        {brandIP.hasDesigns &&
          designFields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-4 p-4 border bg-gray-50 rounded-lg relative"
            >
              <button
                type="button"
                className="absolute top-2 right-2 text-sm text-gray-400 cursor-default"
                onClick={() => removeDesign(index)}
                disabled
              >
                ✕
              </button>

              <div>
                <Label>Design Name / Description</Label>
                <Input {...register(`brandIP.designs.${index}.name`)} disabled className="disabled:opacity-100 disabled:cursor-default" />
              </div>

              <div>
                <Label>Design Registration Number</Label>
                <Input {...register(`brandIP.designs.${index}.number`)} disabled className="disabled:opacity-100 disabled:cursor-default" />
              </div>

              <Controller
                control={control}
                name={`brandIP.designs.${index}.certFile`}
                render={({ field }) => (
                  <FileUploader
                    label="Design Certificate"
                    value={field.value}
                    onFileChange={field.onChange}
                    disabled
                  />
                )}
              />
            </div>
          ))}

        {brandIP.hasDesigns && (
          <Button
            type="button"
            variant="outline"
            onClick={() => addDesign({ name: "", number: "", certFile: null })}
            className="w-full text-primary-600 border border-primary-600 disabled:opacity-100 disabled:cursor-default"
            disabled
          >
            + Add Design
          </Button>
        )}
      </section>

      {/* THIRD-PARTY CONTENT */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Third-party Content
        </h3>

        <Label>Do you use third-party content?</Label>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="radio"
              name="brandIP.hasThirdPartyContent"
              checked={brandIP.hasThirdPartyContent === true}
              onChange={() => setValue("brandIP.hasThirdPartyContent", true)}
              disabled
              className="w-4 h-4 text-[#B04725] disabled:opacity-100 disabled:cursor-default"
            />
            <span className="font-['Urbanist:SemiBold',sans-serif] font-semibold text-[14px] text-[#606060] leading-[20px]">
              Yes
            </span>
          </label>
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="radio"
              name="brandIP.hasThirdPartyContent"
              checked={brandIP.hasThirdPartyContent === false}
              onChange={() => setValue("brandIP.hasThirdPartyContent", false)}
              disabled
              className="w-4 h-4 text-[#B04725] disabled:opacity-100 disabled:cursor-default"
            />
            <span className="font-['Urbanist:SemiBold',sans-serif] font-semibold text-[14px] text-[#606060] leading-[20px]">
              No
            </span>
          </label>
        </div>

        {brandIP.hasThirdPartyContent && (
          <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
            <div>
              <Label>Describe the third-party content</Label>
              <Textarea placeholder="Please describe what third-party content you use" {...register("brandIP.thirdPartyDescription")} disabled className="disabled:opacity-100 disabled:cursor-default" />
            </div>

            {nocFields.map((field, index) => (
              <Controller
                key={field.id}
                control={control}
                name={`brandIP.nocFiles.${index}`}
                render={({ field }) => (
                  <FileUploader
                    label=""
                    value={field.value}
                    onFileChange={field.onChange}
                    disabled
                  />
                )}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => addNocFile(null as any)}
              className="w-full text-primary-600 border border-primary-600 disabled:opacity-100 disabled:cursor-default"
              disabled
            >
              + Add File
            </Button>
          </div>
        )}
      </section>

      {/* CONFIRMATION */}
      <div className="flex items-start gap-3 p-3 bg-orange-50 border rounded-md">
        <Controller
          control={control}
          name="brandIP.confirmation"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={(c) => field.onChange(Boolean(c))}
              disabled
              className="disabled:opacity-100 disabled:cursor-default"
            />
          )}
        />
        <span className="text-xs text-gray-700">
          We are authorised to use the brand names, images and IP above. *
        </span>
      </div>
    </div>
  );
}
