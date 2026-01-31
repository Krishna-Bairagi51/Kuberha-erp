/**
 * Shipping Details Component
 * 
 * Displays shipping information for an order including:
 * - Shipment details (AWB, tracking, courier)
 * - Download links (label, manifest, invoice)
 * - Pickup and delivery addresses
 * - Product details in the shipment
 */

'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download } from 'lucide-react'

export interface ShippingDetailsProps {
  shippingData: any
  isLoadingShipping: boolean
}

export const ShippingDetails: React.FC<ShippingDetailsProps> = ({
  shippingData,
  isLoadingShipping
}) => {
  // Loading state
  if (isLoadingShipping) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-[8px] py-[8px] mb-[16px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-urbanist body-3">Loading shipping details...</p>
      </div>
    )
  }

  // Empty state
  if (!shippingData || !shippingData.record || shippingData.record.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-[8px] py-[8px] mb-[16px]">
        <img src="/images/svg/image 4.png" alt="Shipping illustration" className="w-[200px] h-[120px] rounded-lg" />
        <div className="text-center">
          <div className="font-bold text-gray-800 font-urbanist mb-2 heading-6">No shipping detail yet</div>
          <p className="text-gray-700 font-urbanist body-3">One or more items in the order are not packaging QC approved yet.</p>
          <p className="text-gray-700 font-urbanist body-3">Kindly update status and Create Shipping Order.</p>
        </div>
      </div>
    )
  }

  // Display shipping data
  return (
    <div className="space-y-4 mx-[8px] my-[4px]">
      {shippingData.record.map((shipData: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Download Buttons */}
          {(shipData.label_url || shipData.manifest_url || shipData.invoice_url) && (
            <div className="flex items-center gap-2 flex-wrap">
              {shipData.label_url && (
                <a
                  href={shipData.label_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Label
                </a>
              )}

              {shipData.manifest_url && (
                <a
                  href={shipData.manifest_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Manifest
                </a>
              )}

              {shipData.invoice_url && (
                <a
                  href={shipData.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-urbanist hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Invoice
                </a>
              )}
            </div>
          )}

          {/* Field Rows */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <ShippingDetailField label="AWB Number:" value={shipData.awb_number} />
            <ShippingDetailField label="Shiprocket Order ID:" value={shipData.shiprocket_order_id} />
            <ShippingDetailField label="Tracking ID:" value={shipData.tracking_id} />
            <ShippingDetailField label="Courier Name:" value={shipData.courier_name} />
            <ShippingDetailField label="Item Count:" value={shipData.item_count} />
            <ShippingDetailField label="Invoice No:" value={shipData.invoice_no} />
            <ShippingDetailField label="Transporter:" value={shipData.transporter_name} />
            <ShippingDetailField label="Estimated Days:" value={shipData.estimated_days} />
          </div>

          {/* Address rows take full width */}
          <div className="flex items-start gap-3 py-1.5 border-b border-gray-100">
            <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Pickup Address:</span>
            <span className="text-neutral-800 text-xs font-urbanist font-semibold whitespace-pre-wrap">{shipData.pickup_address || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
            <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Pickup Date:</span>
            <span className="text-neutral-800 text-xs font-urbanist font-semibold">{shipData.pickup_date || 'N/A'}</span>
          </div>
          <div className="flex items-start gap-3 py-1.5 border-b border-gray-100">
            <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">Delivery Address:</span>
            <span className="text-neutral-800 text-xs font-urbanist font-semibold whitespace-pre-wrap">{shipData.delivery_address || 'N/A'}</span>
          </div>

          {/* Product details sub-table */}
          {Array.isArray(shipData.product_details) && shipData.product_details.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 font-semibold text-gray-900 font-urbanist text-xs">Products</div>
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <Table className="w-full">
                  <TableHeader className="bg-gray-50 border-b border-gray-200">
                    <TableRow>
                      <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Product ID</TableHead>
                      <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Name</TableHead>
                      <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Qty</TableHead>
                      <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Unit Price</TableHead>
                      <TableHead className="px-[15px] py-[5px] text-left text-xs font-semibold text-gray-500 font-urbanist whitespace-nowrap">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {shipData.product_details.map((p: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-gray-50 bg-white">
                        <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800 font-semibold">{p.product_id}</TableCell>
                        <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800">{p.product_name}</TableCell>
                        <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800">{p.qty}</TableCell>
                        <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800">{p.unit_price}</TableCell>
                        <TableCell className="px-[15px] py-1.5 whitespace-nowrap text-xs font-urbanist text-neutral-800">{p.price_total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Helper component for displaying shipping detail fields
const ShippingDetailField: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="flex items-center gap-3 py-1.5 border-b border-gray-100">
    <span className="text-neutral-700 text-xs font-urbanist min-w-[130px]">{label}</span>
    <span className="text-neutral-800 text-xs font-urbanist font-semibold">{value || 'N/A'}</span>
  </div>
)
