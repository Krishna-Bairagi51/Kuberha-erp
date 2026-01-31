"use client"

import { z } from 'zod'

// Lead Time Entry Schema
const leadTimeEntrySchema = z.object({
  quantity_range: z.string(),
  lead_time_value: z.number().min(0, 'Lead time value must be non-negative'),
  lead_time_unit: z.enum(['days', 'weeks', 'months'], {
    errorMap: () => ({ message: 'Invalid lead time unit' }),
  }),
  start_qty: z.number().min(0),
  end_qty: z.number().min(0),
})

// Variant Schema
const variantSchema = z.object({
  title: z.string().min(1, 'Variant title is required'),
  extra_charges: z.number().min(0, 'Extra charges must be non-negative'),
  stock_quantity: z.number().min(0, 'Stock quantity must be non-negative'),
  images: z.array(z.string()).optional(),
  extra_lead_time: z.number().optional(),
  variant_product_length: z.number().optional(),
  variant_product_width: z.number().optional(),
  variant_product_height: z.number().optional(),
  variant_product_dimension_unit: z.string().optional(),
  variant_shopify_weight: z.string().optional(),
  variant_shopify_weight_unit: z.string().optional(),
})

// Option Schema
const optionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
  values: z.array(z.string()).min(1, 'At least one option value is required'),
  selectedValues: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).optional(),
})

// Main Inventory Form Schema
export const inventoryFormSchema = z.object({
  // Product Information
  name: z.string().min(1, 'Product name is required').max(200, 'Product name must be less than 200 characters'),
  hsn_code: z.string()
    .optional()
    .refine(
      (val) => !val || /^\d{4,8}$/.test(val.trim()),
      'Enter a valid HSN/SAC (4-8 digits, numbers only)'
    ),
  product_type: z.string().optional(),
  item_status: z.enum(['listed', 'delisted', 'draft'], {
    errorMap: () => ({ message: 'Invalid item status' }),
  }),
  category: z.string().min(1, 'Category is required'),
  Sub_category: z.string().optional(),
  unit: z.number().min(1, 'Unit is required'),
  sku_item_code: z.string()
    .optional()
    .refine(
      (val) => !val || /^[A-Za-z0-9]+$/.test(val.trim()),
      'SKU must be alphanumeric only (no special characters)'
    ),
  collections: z.array(z.string()).optional(),
  cad_3d_files: z.enum(['0', '1'], {
    errorMap: () => ({ message: 'Invalid CAD/3D files value' }),
  }),
  description: z.string().optional(),
  
  // Product Specification
  product_material: z.array(z.string()).optional(),
  finish: z.array(z.string()).optional(),
  product_dimension_length: z.number().min(0, 'Length must be non-negative').optional(),
  product_dimension_width: z.number().min(0, 'Width must be non-negative').optional(),
  product_dimension_height: z.number().min(0, 'Height must be non-negative').optional(),
  product_dimension_height_unit: z.enum(['mm', 'cm', 'm', 'in', 'ft'], {
    errorMap: () => ({ message: 'Invalid dimension unit' }),
  }),
  product_dimension_weight: z.number().min(0, 'Weight must be non-negative').optional(),
  product_dimension_weight_unit: z.enum(['g', 'kg', 'lb', 'oz'], {
    errorMap: () => ({ message: 'Invalid weight unit' }),
  }),
  assembly_requirement: z.enum(['yes', 'no'], {
    errorMap: () => ({ message: 'Invalid assembly requirement' }),
  }).optional(),
  assembly_requirement_document: z.string().optional(),
  usage_type: z.array(z.string()).optional(),
  
  // Lead Times
  lead_time: z.number().min(0).optional(),
  lead_time_unit: z.string().optional(),
  quantity_range: z.string().optional(),
  lead_time_value: z.number().min(0).optional(),
  manufacture_lead_times: z.array(leadTimeEntrySchema).optional(),
  
  // Pricing & Inventory
  quantity: z.number().min(0, 'Quantity must be non-negative').optional(),
  mrp: z.number().min(0.01, 'MRP is required and must be greater than 0'),
  taxes: z.array(z.number()).optional(),
  discount_type: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: 'Invalid discount type' }),
  }),
  discount_value: z.union([z.number(), z.string()])
    .refine(
      (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val
        return !isNaN(num) && num >= 0 && num <= 100
      },
      'Discount value must be between 0 and 100'
    )
    .optional(),
  price_after_discount: z.number().min(0, 'Price after discount must be non-negative').optional(),
  low_stock_value: z.number().min(0, 'Low stock value must be non-negative').optional(),
  low_stock_alert: z.boolean().optional(),
  
  // Logistics & Handling
  package_length: z.number().min(0, 'Package length must be non-negative').optional(),
  package_width: z.number().min(0, 'Package width must be non-negative').optional(),
  package_height: z.number().min(0, 'Package height must be non-negative').optional(),
  package_height_unit: z.enum(['mm', 'cm', 'm', 'in', 'ft'], {
    errorMap: () => ({ message: 'Invalid package height unit' }),
  }),
  package_weight: z.number().min(0, 'Package weight must be non-negative').optional(),
  package_weight_unit: z.enum(['g', 'kg', 'lb', 'oz'], {
    errorMap: () => ({ message: 'Invalid package weight unit' }),
  }),
  package_type: z.array(z.string()).optional(),
  box_type: z.string().optional(),
  handling_instructions: z.string().optional(),
  courier_feasibility: z.enum(['standard', 'express', 'overnight'], {
    errorMap: () => ({ message: 'Invalid courier feasibility' }),
  }).optional(),
  fragility_indicator: z.boolean().optional(),
  
  // Product Options & Variants
  options: z.array(optionSchema).optional(),
  variants: z.array(variantSchema).optional(),
  
  // Images
  images: z.array(z.string()).optional(),
  
  // Operation Status
  operation_status: z.string().optional(),
}).refine(
  (data) => {
    // If assembly_requirement is 'yes', document should be provided
    if (data.assembly_requirement === 'yes' && !data.assembly_requirement_document) {
      return false
    }
    return true
  },
  {
    message: 'Assembly requirement document is required when assembly is required',
    path: ['assembly_requirement_document'],
  }
).refine(
  (data) => {
    // Validate discount_value based on discount_type
    if (data.discount_type === 'percentage') {
      const discount = typeof data.discount_value === 'string' 
        ? parseFloat(data.discount_value) 
        : data.discount_value
      if (discount !== undefined && (discount < 0 || discount > 100)) {
        return false
      }
    }
    return true
  },
  {
    message: 'Discount percentage must be between 0 and 100',
    path: ['discount_value'],
  }
)

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>

