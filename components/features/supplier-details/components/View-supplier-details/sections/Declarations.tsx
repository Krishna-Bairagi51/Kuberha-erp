"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { DeclarationsData } from "./index";

export default function Declarations() {
  const { register, control } =
    useFormContext<{ declarations: DeclarationsData }>();

  return (
    <div className="font-urbanist space-y-10">
      {/* Declaration Text */}
      <div className="space-y-4 border p-4 rounded-lg bg-gray-50 shadow-sm">
        <p className="text-sm font-semibold text-gray-500">
          Please read and scroll to the end
        </p>

        <div className="text-sm text-gray-700 space-y-4 rounded-lg bg-gray-50">
          {[
            {
              title: "1. Accuracy of Information:",
              text:
                "I/We hereby declare that all information provided in this onboarding form is true, accurate, and complete to the best of my/our knowledge. I/We understand that any false or misleading information may result in the rejection of this application or termination of the supplier agreement.",
            },
            {
              title: "2. Compliance with Laws:",
              text:
                "I/We confirm that our business operations comply with all applicable laws, regulations, and standards including but not limited to tax laws, labor laws, environmental regulations, and consumer protection laws in India.",
            },
            {
              title: "3. Product Authenticity:",
              text:
                "I/We guarantee that all products supplied through the marketplace are genuine, authentic, and not counterfeit. We confirm that we have the necessary rights, licenses, and authorizations to sell these products.",
            },
            {
              title: "4. Intellectual Property:",
              text:
                "I/We confirm that we either own or have obtained proper authorization to use all brand names, trademarks, designs, images, and other intellectual property associated with the products we intend to sell on the marketplace.",
            },
            {
              title: "5. Disclosure Obligations:",
              text:
                "I/We agree to promptly inform the marketplace of any material changes to the information provided in this form, including changes to business registration, ownership, contact details, or compliance status.",
            },
            {
              title: "6. Indemnity:",
              text:
                "I/We agree to indemnify and hold harmless the marketplace platform, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from any breach of these declarations or violation of any applicable laws or third-party rights.",
            },
          ].map((item, idx) => (
            <div key={idx}>
              <p className="font-medium text-black">{item.title}</p>
              <p className="text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Acceptance Checkbox */}
      <div className="flex items-start gap-3 p-3 border bg-orange-50 rounded-md">
        <Controller
          name="declarations.accepted"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={(c) => field.onChange(Boolean(c))}
              disabled
              className="disabled:opacity-100 disabled:cursor-default"
            />
          )}
        />
        <span className="text-sm text-gray-800">
          I/We agree to all the above declarations.{" "}
          <span className="text-red-500">*</span>
        </span>
      </div>

      {/* Signatory Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Authorised Signatory
        </h3>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Label>Authorised Signatory Name</Label>
            <Input
              {...register("declarations.signatoryName")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Enter name"
            />
          </div>

          <div>
            <Label>Designation</Label>
            <Input
              {...register("declarations.designation")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="Director / Owner / Partner"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Label>Place</Label>
            <Input
              {...register("declarations.place")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="City"
            />
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              {...register("declarations.date")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Label>Signatory Mobile Number</Label>
            <div className="flex gap-2">
              <div className="px-4 py-2 border rounded-md bg-gray-100 text-sm select-none">
                +91
              </div>
              <Input
                {...register("declarations.signatoryMobile")}
                disabled
                className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
                placeholder="10 digit number"
              />
            </div>
          </div>

          <div>
            <Label>Signatory Email</Label>
            <Input
              {...register("declarations.signatoryEmail")}
              disabled
              className="bg-gray-50 disabled:opacity-100 disabled:cursor-default"
              placeholder="valid email"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
