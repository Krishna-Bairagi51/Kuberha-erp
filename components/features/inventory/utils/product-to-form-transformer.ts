/**
 * Utility functions to transform product API data to form schema format
 * Used for edit inventory forms
 */

import type { InventoryFormData } from '../schemas/inventory-form.schema'
import { transformLeadTimes } from './form-data-transformers'
import { extractNames, extractIds } from './form-data-transformers'

/**
 * Transforms product API response to InventoryFormData format
 * Handles all type conversions and data normalization
 */
export function transformProductToFormData(productRecord: any): InventoryFormData {
  // Transform manufacture_lead_time from API to internal format
  const leadTimesRaw = transformLeadTimes(productRecord.manufacture_lead_time || [])
  // Cast lead_time_unit to the correct enum type
  const leadTimes = leadTimesRaw.map(lt => ({
    ...lt,
    lead_time_unit: (['days', 'weeks', 'months'].includes(lt.lead_time_unit) 
      ? lt.lead_time_unit 
      : 'days') as 'days' | 'weeks' | 'months'
  }))
  
  // Handle features - can be string or array
  let features: string | string[] | undefined = undefined
  if (productRecord.features) {
    if (Array.isArray(productRecord.features)) {
      features = productRecord.features
    } else if (typeof productRecord.features === 'string') {
      features = productRecord.features
    }
  }

  // Handle box_type - can be string, number, or array
  let boxType = ''
  if (productRecord.box_type) {
    if (Array.isArray(productRecord.box_type) && productRecord.box_type.length > 0) {
      boxType = typeof productRecord.box_type[0] === 'string' 
        ? productRecord.box_type[0] 
        : productRecord.box_type[0].id.toString()
    } else if (typeof productRecord.box_type === 'string' || typeof productRecord.box_type === 'number') {
      boxType = String(productRecord.box_type)
    }
  }

  // Handle assembly_requirement - normalize to 'yes' | 'no'
  const assemblyRequirement = 
    productRecord.assembly_requirement === "1" || 
    productRecord.assembly_requirement === "yes" || 
    productRecord.assembly_requirement === true 
      ? "yes" as const
      : "no" as const

  // Handle item_status - ensure it's one of the enum values
  const itemStatus = 
    productRecord.item_status === "listed" || 
    productRecord.item_status === "delisted" || 
    productRecord.item_status === "draft"
      ? productRecord.item_status as "listed" | "delisted" | "draft"
      : "draft" as const

  // Handle cad_3d_files - normalize to '0' | '1'
  const cad3dFiles = productRecord.cad_3d_files === "1" || productRecord.cad_3d_files === 1 || productRecord.cad_3d_files === true
    ? "1" as const
    : "0" as const

  // Handle discount_type - ensure it's one of the enum values
  const discountType = 
    productRecord.discount_type === "fixed" || productRecord.discount_type === "percentage"
      ? productRecord.discount_type as "fixed" | "percentage"
      : "percentage" as const

  // Handle courier_feasibility - ensure it's one of the enum values
  const courierFeasibility = 
    productRecord.courier_feasibility === "special" || productRecord.courier_feasibility === "standard"
      ? productRecord.courier_feasibility as "special" | "standard"
      : "standard" as const

  // Handle dimension units - ensure they're valid enum values
  const productDimensionHeightUnit = 
    ['mm', 'cm', 'm', 'in', 'ft'].includes(productRecord.product_dimension_height_unit)
      ? productRecord.product_dimension_height_unit as 'mm' | 'cm' | 'm' | 'in' | 'ft'
      : 'cm' as const

  const productDimensionWeightUnit = 
    ['g', 'kg', 'lb', 'oz'].includes(productRecord.product_dimension_weight_unit)
      ? productRecord.product_dimension_weight_unit as 'g' | 'kg' | 'lb' | 'oz'
      : 'kg' as const

  const packageHeightUnit = 
    ['mm', 'cm', 'm', 'in', 'ft'].includes(productRecord.package_height_unit)
      ? productRecord.package_height_unit as 'mm' | 'cm' | 'm' | 'in' | 'ft'
      : 'mm' as const

  const packageWeightUnit = 
    ['g', 'kg', 'lb', 'oz'].includes(productRecord.package_weight_unit)
      ? productRecord.package_weight_unit as 'g' | 'kg' | 'lb' | 'oz'
      : 'kg' as const

  return {
    name: productRecord.name || "",
    hsn_code: productRecord.hsn_code || "",
    product_type: productRecord.product_type || "",
    item_status: itemStatus,
    category: productRecord.category || "",
    Sub_category: productRecord.sub_category || "",
    unit: productRecord.unit_id || productRecord.unit || 1,
    sku_item_code: productRecord.sku_code || "",
    collections: extractNames(productRecord.collections),
    cad_3d_files: cad3dFiles,
    description: productRecord.description || "",
    product_material: extractNames(productRecord.product_material),
    finish: extractNames(productRecord.finish),
    package_weight: productRecord.package_weight || 0,
    package_weight_unit: packageWeightUnit,
    product_dimension_length: productRecord.product_dimension_length || 0,
    product_dimension_width: productRecord.product_dimension_width || 0,
    product_dimension_height: productRecord.product_dimension_height || 0,
    product_dimension_height_unit: productDimensionHeightUnit,
    product_dimension_weight: productRecord.product_dimension_weight || 0,
    product_dimension_weight_unit: productDimensionWeightUnit,
    assembly_requirement: assemblyRequirement,
    usage_type: extractNames(productRecord.usage_type),
    quantity: productRecord.quantity || 0,
    mrp: productRecord.mrp || 0,
    taxes: extractIds(productRecord.taxes),
    discount_type: discountType,
    discount_value: productRecord.discount_value || 0,
    price_after_discount: productRecord.price_after_discount || 0,
    low_stock_value: productRecord.low_stock_value || 0,
    low_stock_alert: productRecord.low_stock_alert === 1 || productRecord.low_stock_alert === true,
    package_length: productRecord.package_length || 0,
    package_width: productRecord.package_width || 0,
    package_height: productRecord.package_height || 0,
    package_height_unit: packageHeightUnit,
    package_type: extractNames(productRecord.package_type),
    box_type: boxType,
    handling_instructions: productRecord.handling_instructions || "",
    courier_feasibility: courierFeasibility,
    fragility_indicator: productRecord.fragility_indicator === 1 || productRecord.fragility_indicator === true,
    lead_time: 0,
    lead_time_unit: "days",
    quantity_range: "",
    lead_time_value: 0,
    manufacture_lead_times: leadTimes,
    options: productRecord.options || [],
    variants: productRecord.variants || [],
    assembly_requirement_document: productRecord.assembly_requirement_document || "",
    images: productRecord.images || [],
    operation_status: productRecord.operation_status || "pending",
    shopify_status: productRecord.shopify_status,
    brand: productRecord.brand,
    color: productRecord.color,
    features: features,
    additional_info: productRecord.additional_info,
  }
}

