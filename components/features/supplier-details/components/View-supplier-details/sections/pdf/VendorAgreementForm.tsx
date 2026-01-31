'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Building2, MapPin, Receipt, Calendar, User, Briefcase, Mail, Percent } from 'lucide-react';

// Zod validation schema
const vendorFormSchema = z.object({
  vendorName: z.string().min(2, 'Vendor name must be at least 2 characters'),
  vendorType: z.string().min(1, 'Please select a company type'),
  registeredOffice: z.string().min(10, 'Registered office address must be at least 10 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  gstNumber: z.string()
    .min(15, 'GST number must be exactly 15 characters')
    .max(15, 'GST number must be exactly 15 characters')
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format'),
  date: z.string().min(1, 'Agreement date is required'),
  supplierNoticeEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  vendorSignatureName: z.string().min(2, 'Signatory name must be at least 2 characters'),
  vendorDesignation: z.string().min(2, 'Designation must be at least 2 characters'),
  commissionPercentage: z.string()
    .min(1, 'Commission percentage is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 100;
    }, 'Commission must be between 0 and 100'),
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

interface VendorAgreementFormProps {
  onSubmit: (data: VendorFormData) => void;
  initialData?: Partial<VendorFormData>;
}

const companyTypes = [
  { value: 'private limited company', label: 'Private Limited Company' },
  { value: 'public limited company', label: 'Public Limited Company' },
  { value: 'limited liability partnership', label: 'Limited Liability Partnership' },
  { value: 'partnership firm', label: 'Partnership Firm' },
  { value: 'sole proprietorship', label: 'Sole Proprietorship' },
];

const VendorAgreementForm: React.FC<VendorAgreementFormProps> = ({ 
  onSubmit, 
  initialData = {} 
}) => {
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendorName: initialData.vendorName || '',
      vendorType: initialData.vendorType || '',
      registeredOffice: initialData.registeredOffice || '',
      city: initialData.city || '',
      gstNumber: initialData.gstNumber || '',
      date: initialData.date || new Date().toLocaleDateString('en-GB'),
      supplierNoticeEmail: initialData.supplierNoticeEmail || '',
      vendorSignatureName: initialData.vendorSignatureName || '',
      vendorDesignation: initialData.vendorDesignation || '',
      commissionPercentage: initialData.commissionPercentage || '',
    },
    mode: 'onChange',
  });

  const handleFormSubmit = (data: VendorFormData) => {
    onSubmit(data);
  };

  const watchSignatoryName = form.watch('vendorSignatureName');
  const watchDesignation = form.watch('vendorDesignation');

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Company Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Building2 className="w-5 h-5 text-primary-800" />
              <h3 className="text-lg font-semibold text-gray-800">Company Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      Vendor Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter vendor company name" 
                        {...field} 
                        className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      Company Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="registeredOffice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Registered Office Address
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter complete registered office address"
                      rows={3}
                      {...field}
                      className="resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      City
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter city name" 
                        {...field}
                        className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-gray-500" />
                      GST Registration Number
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 22AAAAA0000A1Z5" 
                        {...field}
                        className="uppercase focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Agreement Date
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="DD.MM.YYYY" 
                      {...field}
                      className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Format: DD.MM.YYYY (e.g., 02.12.2025)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Signatory Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <User className="w-5 h-5 text-primary-800" />
              <h3 className="text-lg font-semibold text-gray-800">Signatory Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendorSignatureName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      Signatory Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter signatory's full name" 
                        {...field}
                        className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendorDesignation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      Designation
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Director, CEO" 
                        {...field}
                        className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supplierNoticeEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Email address (optional)" 
                      {...field}
                      className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Attention will be: {watchSignatoryName && watchDesignation 
                      ? `${watchSignatoryName} (${watchDesignation})` 
                      : 'Name (Designation)'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Commission Structure Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Percent className="w-5 h-5 text-primary-800" />
              <h3 className="text-lg font-semibold text-gray-800">Commission Structure</h3>
            </div>

            <FormField
              control={form.control}
              name="commissionPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-gray-500" />
                    Commission Percentage (%)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g., 15" 
                        {...field}
                        className="pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Enter the commission percentage for products sold through the platform
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary-800 hover:bg-primary-900 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FileText className="w-5 h-5 mr-2" />
            Generate Agreement
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default VendorAgreementForm;
