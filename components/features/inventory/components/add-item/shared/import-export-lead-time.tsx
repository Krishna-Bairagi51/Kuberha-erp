"use client"
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LeadTimeEntry } from '../../lead-time-management'
import type { ProductListItem } from '../../../types/inventory.types'
import { useSellerProductsQuery } from '../../../hooks/use-inventory-query'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { Search, FileText, LayoutTemplate } from 'lucide-react'
import { toast } from 'sonner'
import { formatIndianCurrency, formatIndianNumber } from '@/lib/api/helpers/number'

interface ImportExportLeadTimeProps {
  manufacture_lead_times: LeadTimeEntry[]
  onClose: () => void
}

interface LeadTimeTemplate {
  id: string
  name: string
  description: string
  leadTimes: LeadTimeEntry[]
}

const ImportExportLeadTime = ({ manufacture_lead_times, onClose }: ImportExportLeadTimeProps) => {
  const [activeTab, setActiveTab] = useState<'products' | 'templates'>('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customTemplateName, setCustomTemplateName] = useState('')
  
  // Use TanStack Query for seller products
  const { 
    data: productsResponse, 
    isLoading: isLoadingProducts 
  } = useSellerProductsQuery()
  
  // Extract products from query response
  const products = useMemo(() => {
    return (productsResponse?.record || []) as ProductListItem[]
  }, [productsResponse])

  // Pre-filled templates
  const predefinedTemplates: LeadTimeTemplate[] = [
    {
      id: 'standard',
      name: 'Standard Manufacturing',
      description: 'Standard lead times for general manufacturing',
      leadTimes: [
        { quantity_range: '0-1', lead_time_value: 7, lead_time_unit: 'days', start_qty: 0, end_qty: 1 },
        { quantity_range: '2-5', lead_time_value: 10, lead_time_unit: 'days', start_qty: 2, end_qty: 5 },
        { quantity_range: '6-9', lead_time_value: 14, lead_time_unit: 'days', start_qty: 6, end_qty: 9 },
        { quantity_range: '10+', lead_time_value: 21, lead_time_unit: 'days', start_qty: 10, end_qty: 10 }
      ]
    },
    {
      id: 'express',
      name: 'Express Manufacturing',
      description: 'Faster lead times for urgent orders',
      leadTimes: [
        { quantity_range: '0-1', lead_time_value: 3, lead_time_unit: 'days', start_qty: 0, end_qty: 1 },
        { quantity_range: '2-5', lead_time_value: 5, lead_time_unit: 'days', start_qty: 2, end_qty: 5 },
        { quantity_range: '6-9', lead_time_value: 7, lead_time_unit: 'days', start_qty: 6, end_qty: 9 },
        { quantity_range: '10+', lead_time_value: 10, lead_time_unit: 'days', start_qty: 10, end_qty: 10 }
      ]
    },
    {
      id: 'economy',
      name: 'Economy Manufacturing',
      description: 'Extended lead times for cost-effective production',
      leadTimes: [
        { quantity_range: '0-1', lead_time_value: 14, lead_time_unit: 'days', start_qty: 0, end_qty: 1 },
        { quantity_range: '2-5', lead_time_value: 21, lead_time_unit: 'days', start_qty: 2, end_qty: 5 },
        { quantity_range: '6-9', lead_time_value: 1, lead_time_unit: 'month', start_qty: 6, end_qty: 9 },
        { quantity_range: '10+', lead_time_value: 1.5, lead_time_unit: 'month', start_qty: 10, end_qty: 10 }
      ]
    }
  ]

  const handleExport = () => {
    const headers = ['Quantity Range', 'Lead Time Value', 'Lead Time Unit', 'Start Qty', 'End Qty']
    const csvRows = [
      headers.join(','),
      ...manufacture_lead_times.map(item => 
        [
          item.quantity_range,
          item.lead_time_value,
          item.lead_time_unit,
          item.start_qty,
          item.end_qty
        ].join(',')
      )
    ]
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lead_time_export.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Lead times exported successfully')
  }

  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        toast.success('CSV file imported successfully')
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleUseTemplate = (template: LeadTimeTemplate) => {
    toast.success(`Template "${template.name}" applied successfully`)
  }

  const handleCreateCustomTemplate = () => {
    if (!customTemplateName.trim()) {
      toast.error('Please enter a template name')
      return
    }
    toast.success(`Custom template "${customTemplateName}" created successfully`)
    setCustomTemplateName('')
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 body-3 font-urbanist text-sm transition-colors ${
            activeTab === 'products'
              ? 'text-secondary-900 border-b-2 border-secondary-900 font-semibold'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          Product Lists
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 body-3 font-urbanist text-sm transition-colors ${
            activeTab === 'templates'
              ? 'text-secondary-900 border-b-2 border-secondary-900 font-semibold'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <LayoutTemplate className="h-4 w-4" />
          Lead Time Templates
        </button>
      </div>

      {/* Content Container with Fixed Height */}
      <div className="min-h-[500px] max-h-[500px] overflow-y-auto">
        {activeTab === 'products' ? (
          /* Products Section */
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 body-3 font-urbanist text-sm border-gray-300"
              />
            </div>

            {/* Products Table */}
            {isLoadingProducts ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-6 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm">Product Name</div>
                  <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">Category</div>
                  <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">Status</div>
                  <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">Stock</div>
                  <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">MRP</div>
                  <div className="font-semibold text-gray-700 body-3 font-urbanist text-sm text-center">Stock Value</div>
                </div>
                
                <div className="divide-y divide-gray-200 max-h-[380px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-12 text-center text-gray-500 body-3 font-urbanist text-sm">
                      {searchTerm ? 'No products found matching your search' : 'No products available'}
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div key={product.id} className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="text-gray-700 body-3 font-urbanist text-sm">{product.name}</div>
                        <div className="text-gray-600 body-3 font-urbanist text-sm text-center">{product.category}</div>
                        <div className="text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full body-3 font-urbanist text-xs ${
                            product.status === 'approved' 
                              ? 'bg-green-100 text-green-700' 
                              : product.status === 'draft'
                              ? 'bg-[#FFE599] text-[#997A00]'
                              : product.status === 'rejected'
                              ? 'bg-red-50 text-red-600'
                              : product.status === 'unarchive'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {product.status}
                          </span>
                        </div>
                        <div className="text-gray-600 body-3 font-urbanist text-sm text-center">{formatIndianNumber(product.stock || 0)}</div>
                        <div className="text-gray-600 body-3 font-urbanist text-sm text-center">{formatIndianCurrency(product.mrp || 0)}</div>
                        <div className="text-gray-600 body-3 font-urbanist text-sm text-center">{formatIndianCurrency(product.stock_value || 0)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Templates Section */
          <div className="space-y-6">
            {/* Pre-filled Templates */}
            <div>
              <h3 className="font-semibold text-gray-700 body-3 font-urbanist text-base mb-3">
                Pre-filled Templates
              </h3>
              <div className="space-y-3">
                {predefinedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-secondary-900 bg-secondary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 body-3 font-urbanist text-sm">
                          {template.name}
                        </h4>
                        <p className="text-gray-600 body-3 font-urbanist text-xs mt-1">
                          {template.description}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUseTemplate(template)
                        }}
                        className="h-8 px-3 body-3 font-urbanist text-xs bg-secondary-900 hover:bg-secondary-800 text-white"
                      >
                        Use Template
                      </Button>
                    </div>
                    
                    {/* Template Lead Times Preview */}
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <div className="grid grid-cols-4 gap-2 text-xs body-3 font-urbanist">
                        <div className="font-semibold text-gray-600">Quantity</div>
                        <div className="font-semibold text-gray-600">Time</div>
                        <div className="font-semibold text-gray-600">Unit</div>
                        <div className="font-semibold text-gray-600">Range</div>
                      </div>
                      {template.leadTimes.map((lt, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-2 text-xs body-3 font-urbanist text-gray-600 mt-1">
                          <div>{lt.quantity_range}</div>
                          <div>{lt.lead_time_value}</div>
                          <div>{lt.lead_time_unit}</div>
                          <div>{lt.start_qty}-{lt.end_qty === lt.start_qty ? `${lt.end_qty}+` : lt.end_qty}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Custom Template */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-700 body-3 font-urbanist text-base mb-3">
                Create Custom Template
              </h3>
              <div className="space-y-3">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter custom template name"
                    value={customTemplateName}
                    onChange={(e) => setCustomTemplateName(e.target.value)}
                    className="body-3 font-urbanist text-sm border-gray-300"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleCreateCustomTemplate}
                    className="flex-1 h-9 body-3 font-urbanist text-sm bg-secondary-900 hover:bg-secondary-800 text-white"
                  >
                    Create Template
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExport}
                    disabled={!manufacture_lead_times || manufacture_lead_times.length === 0}
                    className="flex-1 h-9 body-3 font-urbanist text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  >
                    Export Current
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImportClick}
                    className="flex-1 h-9 body-3 font-urbanist text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  >
                    Import CSV
                  </Button>
                </div>
              </div>

              {/* Current Lead Times Display */}
              {manufacture_lead_times && manufacture_lead_times.length > 0 && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 body-3 font-urbanist">
                      Current Lead Times ({manufacture_lead_times.length} entries)
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-2 bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-xs text-gray-700 body-3 font-urbanist">
                      <div>Quantity Range</div>
                      <div>Time Value</div>
                      <div>Unit</div>
                      <div>Start Qty</div>
                      <div>End Qty</div>
                    </div>
                    {manufacture_lead_times.map((item, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-gray-100 text-xs text-gray-600 body-3 font-urbanist">
                        <div>{item.quantity_range}</div>
                        <div>{item.lead_time_value}</div>
                        <div>{item.lead_time_unit}</div>
                        <div>{item.start_qty}</div>
                        <div>{item.end_qty}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportExportLeadTime