import { z } from 'zod'

// Lead Time Entry Schema
export const leadTimeEntrySchema = z.object({
  quantity_range: z.string(),
  lead_time_value: z.number().min(0, 'Lead time value must be non-negative'),
  lead_time_unit: z.enum(['days', 'weeks', 'months'], {
    errorMap: () => ({ message: 'Invalid lead time unit' }),
  }),
  start_qty: z.number().min(0),
  end_qty: z.number().min(0),
})

// Variant Schema
export const variantSchema = z.object({
  title: z.string().min(1, 'Variant title is required'),
  extra_charges: z.number().min(0, 'Extra charges must be non-negative'),
  stock_quantity: z.number().min(0, 'Stock quantity must be non-negative'),
  images: z.array(z.string()).min(1, 'At least one image is required for variant'),
  extra_lead_time: z.number().optional(),
  variant_product_length: z.number().optional(),
  variant_product_width: z.number().optional(),
  variant_product_height: z.number().optional(),
  variant_product_dimension_unit: z.string().optional(),
  variant_shopify_weight: z.string().optional(),
  variant_shopify_weight_unit: z.string().optional(),
})

// Option Schema
export const optionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
  values: z.array(z.string()).min(1, 'At least one value is required'),
  selectedValues: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).optional(),
})

// Main Inventory Form Schema
export const inventoryFormSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Product name is required').max(500, 'Product name is too long'),
  hsn_code: z.string()
    .default('')
    .refine(
      (val) => !val || /^\d{4,8}$/.test(val),
      { message: 'Enter a valid HSN/SAC (4-8 digits, numbers only)' }
    ),
  product_type: z.string().default(''),
  item_status: z.enum(['listed', 'delisted', 'draft'], {
    errorMap: () => ({ message: 'Invalid item status' }),
  }),
  
  // Category & Classification
  category: z.string().min(1, 'Category is required'),
  Sub_category: z.string().default(''),
  unit: z.number().min(1, 'Unit is required'),
  sku_item_code: z.string()
    .default('')
    .refine(
      (val) => !val || /^[A-Za-z0-9]+$/.test(val),
      { message: 'SKU must be alphanumeric only (no special characters)' }
    ),
  collections: z.array(z.string()).default([]),
  cad_3d_files: z.enum(['0', '1']).default('0'),
  description: z.string().default(''),
  
  // Product Specifications
  product_material: z.array(z.string()).default([]),
  finish: z.array(z.string()).default([]),
  usage_type: z.array(z.string()).default([]),
  
  // Product Dimensions
  product_dimension_length: z.number().min(0, 'Length must be non-negative').default(0),
  product_dimension_width: z.number().min(0, 'Width must be non-negative').default(0),
  product_dimension_height: z.number().min(0, 'Height must be non-negative').default(0),
  product_dimension_height_unit: z.enum(['mm', 'cm', 'm', 'in', 'ft']).default('cm'),
  product_dimension_weight: z.number().min(0, 'Weight must be non-negative').default(0),
  product_dimension_weight_unit: z.enum(['g', 'kg', 'lb', 'oz']).default('kg'),
  
  // Assembly
  assembly_requirement: z.enum(['yes', 'no']).default('no'),
  assembly_requirement_document: z.string().default(''),
  
  // Pricing & Inventory
  quantity: z.number().min(0, 'Quantity must be non-negative').default(0),
  mrp: z.number().min(0.01, 'MRP is required and must be greater than 0'),
  taxes: z.array(z.number()).default([]),
  discount_type: z.enum(['percentage', 'fixed']).default('percentage'),
  discount_value: z.union([
    z.number().min(0, 'Discount value must be non-negative'),
    z.string().refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
      },
      { message: 'Invalid discount value' }
    ),
  ]).default(0),
  price_after_discount: z.number().min(0, 'Price after discount must be non-negative').default(0),
  low_stock_value: z.number().min(0, 'Low stock value must be non-negative').default(0),
  low_stock_alert: z.boolean().default(true),
  
  // Package Dimensions
  package_length: z.number().min(0, 'Package length must be non-negative').default(0),
  package_width: z.number().min(0, 'Package width must be non-negative').default(0),
  package_height: z.number().min(0, 'Package height must be non-negative').default(0),
  package_height_unit: z.enum(['mm', 'cm', 'm', 'in', 'ft']).default('mm'),
  package_weight: z.number().min(0, 'Package weight must be non-negative').default(0),
  package_weight_unit: z.enum(['g', 'kg', 'lb', 'oz']).default('kg'),
  package_type: z.array(z.string()).default([]),
  box_type: z.string().default(''),
  
  // Logistics & Handling
  handling_instructions: z.string().default(''),
  courier_feasibility: z.enum(['standard', 'special']).default('standard'),
  fragility_indicator: z.boolean().default(true),
  
  // Lead Times
  lead_time: z.number().default(0),
  lead_time_unit: z.string().default('days'),
  quantity_range: z.string().default(''),
  lead_time_value: z.number().default(0),
  manufacture_lead_times: z.array(leadTimeEntrySchema).default([]),
  
  // Options & Variants
  options: z.array(optionSchema).default([]),
  variants: z.array(variantSchema).default([]),
  
  // Images
  images: z.array(z.string()).default([]),
  
  // System fields
  operation_status: z.string().default('pending'),
  shopify_status: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  features: z.union([z.string(), z.array(z.string())]).optional(),
  additional_info: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate discount value based on type
  if (data.discount_type === 'percentage') {
    const discountValue = typeof data.discount_value === 'string' 
      ? parseFloat(data.discount_value) 
      : data.discount_value
    if (discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount percentage cannot exceed 100%',
        path: ['discount_value'],
      })
    }
  }
  
  // Validate price after discount is not negative
  if (data.price_after_discount < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Price after discount cannot be negative',
      path: ['price_after_discount'],
    })
  }
  
  // Validate lead times if item is not draft
  if (data.item_status !== 'draft' && data.manufacture_lead_times.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one lead time entry is required for non-draft items',
      path: ['manufacture_lead_times'],
    })
  }
  
  // Validate images are required only for non-draft items
  if (data.item_status !== 'draft' && data.images.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one image is required for listed/delisted items',
      path: ['images'],
    })
  }
  
  // Validate variants have images if variants exist
  if (data.variants.length > 0) {
    data.variants.forEach((variant, index) => {
      if (!variant.images || variant.images.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each variant must have at least one image',
          path: ['variants', index, 'images'],
        })
      }
    })
  }
})

export type InventoryFormData = z.infer<typeof inventoryFormSchema>

// Default values for the form
export const defaultInventoryFormValues: InventoryFormData = {
  name: '',
  hsn_code: '',
  product_type: '',
  item_status: 'draft',
  category: '',
  Sub_category: '',
  unit: 1,
  sku_item_code: '',
  collections: [],
  cad_3d_files: '0',
  description: '',
  product_material: [],
  finish: [],
  usage_type: [],
  product_dimension_length: 0,
  product_dimension_width: 0,
  product_dimension_height: 0,
  product_dimension_height_unit: 'cm',
  product_dimension_weight: 0,
  product_dimension_weight_unit: 'kg',
  assembly_requirement: 'no',
  assembly_requirement_document: '',
  quantity: 0,
  mrp: 0,
  taxes: [],
  discount_type: 'percentage',
  discount_value: 0,
  price_after_discount: 0,
  low_stock_value: 0,
  low_stock_alert: true,
  package_length: 0,
  package_width: 0,
  package_height: 0,
  package_height_unit: 'mm',
  package_weight: 0,
  package_weight_unit: 'kg',
  package_type: [],
  box_type: '',
  handling_instructions: '',
  courier_feasibility: 'standard',
  fragility_indicator: true,
  lead_time: 0,
  lead_time_unit: 'days',
  quantity_range: '',
  lead_time_value: 0,
  manufacture_lead_times: [],
  options: [],
  variants: [],
  images: [],
  operation_status: 'pending',
}

