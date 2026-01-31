import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import PageHeader from '@/components/shared/layout/page-header'
import { CircleXIcon, Info, X, ChevronDown, ChevronUp, Eye, AlertTriangle, MoreVertical } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  StartPackagingQCProps,
  BoxDimension,
  ShippingItem,
} from '../types/orders.types'
import { toast } from 'sonner'
import { LoadingAnimation } from '@/components/shared/ui/loading-animation'
import { 
  useBoxDimensionsQuery, 
  useShippingItemsQuery,
  useCreateShiprocketOrderMutation 
} from '../hooks/use-orders-query'

export const StartPackagingQC = ({ onBack, orderId }: StartPackagingQCProps) => {
  const [showForm, setShowForm] = useState(false)
  const [selectedBox, setSelectedBox] = useState<BoxDimension | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [localValue, setLocalValue] = useState('')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [shiprocketResponse, setShiprocketResponse] = useState<any | null>(null)
  const [creatingShipment, setCreatingShipment] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null)

  // Use TanStack Query for box dimensions
  const { 
    data: boxDimensionsData, 
    isLoading: loading 
  } = useBoxDimensionsQuery()
  
  // Use TanStack Query for shipping items
  const { 
    data: shippingItemsData, 
    isLoading: shippingItemsLoading 
  } = useShippingItemsQuery(orderId)
  
  // Use mutation for creating shiprocket order
  const createShiprocketMutation = useCreateShiprocketOrderMutation()
  
  // Extract data from queries
  const boxDimensions = boxDimensionsData?.record || []
  const shippingItems = shippingItemsData?.record || []


  // When no items are selected, ensure box selection UI/state is reset
  useEffect(() => {
    if (selectedItems.length === 0) {
      setSelectedBox(null)
      setLocalValue('')
      setIsDropdownOpen(false)
    }
  }, [selectedItems])

  // If the shipping items list becomes empty (e.g., items deleted), reset related UI/state
  useEffect(() => {
    if (shippingItems.length === 0) {
      setSelectedItems([])
      setSelectedBox(null)
      setLocalValue('')
      setIsDropdownOpen(false)
    }
  }, [shippingItems])



  // Filter box dimensions based on local input value
  const filteredBoxTypes = localValue.trim() 
    ? boxDimensions.filter(box => box.box_type.toLowerCase().includes(localValue.toLowerCase()))
    : boxDimensions

  const handleBoxSelect = (box: BoxDimension) => {
    setSelectedBox(box)
    setLocalValue('')
    setIsDropdownOpen(false)
  }

  const handleClear = () => {
    setSelectedBox(null)
    setLocalValue('')
  }

  const handleInputChange = (value: string) => {
    setLocalValue(value)
    if (value.length > 0) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localValue.trim() && filteredBoxTypes.length > 0) {
      e.preventDefault()
      handleBoxSelect(filteredBoxTypes[0])
    }
  }

  const handleItemSelect = (orderLineId: number) => {
    setSelectedItems(prev => {
      if (prev.includes(orderLineId)) {
        return prev.filter(id => id !== orderLineId)
      } else {
        return [...prev, orderLineId]
      }
    })
  }

  const isItemSelected = (orderLineId: number) => {
    return selectedItems.includes(orderLineId)
  }

  const handleToggleSelectAll = () => {
    if (shippingItems.length === 0) return
    const allIds = shippingItems.map(item => item.order_line_id)
    const isAllSelected = selectedItems.length === allIds.length
    setSelectedItems(isAllSelected ? [] : allIds)
  }

  const handleStartShipping = async () => {
    try {
      if (selectedItems.length === 0) {
        toast.error('Please select at least one item to start shipping.')
        return
      }

      if (!selectedBox) {
        toast.error('Please select a box type before creating the shipment.')
        return
      }

      const accessToken = localStorage.getItem('accessToken')
      const sessionId = localStorage.getItem('sessionId')
      if (!accessToken || accessToken === 'null' || accessToken === 'undefined') {
        throw new Error('No valid access token found')
      }
      if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
        throw new Error('No valid session id found')
      }

      const selectedDetails = shippingItems.filter(item => selectedItems.includes(item.order_line_id))

      const declaredValue = selectedDetails.reduce((sum, item) => sum + (item.price_total ?? 0), 0)

      const lineItems = selectedDetails.map(item => ({
        name: item.product_name,
        sku: item.product_name,
        units: item.qty ?? 1,
        selling_price: item.unit_price ?? 0,
        discount: item.discount ?? 0,
        tax: item.tax ?? 0,
        hsn: item.hsn ?? ''
      }))

      const lineIds = selectedDetails.map(item => item.order_line_id)

      const payload = {
        box_type: selectedBox.id,
        order_id: orderId, // If API expects product_id here instead, tell me and I'll switch it
        weight_kg: selectedBox.box_volumetric_weight,
        declared_value: declaredValue,
        length: selectedBox.box_length,
        breadth: selectedBox.box_width,
        height: selectedBox.box_height,
        line_items: lineItems,
        line_ids: lineIds
      }

      setCreatingShipment(true)

      // Use TanStack Query mutation instead of direct service call
      const result = await createShiprocketMutation.mutateAsync(payload)
      if (result && result.status_code === 200) {
        setShiprocketResponse(result)
        setShowForm(false)
      } else {
        setErrorMessage('Unexpected response while creating Shiprocket order.')
        setRetryAction(() => handleStartShipping)
        setErrorOpen(true)
      }
    } catch (error) {
      setErrorMessage('Failed to create Shiprocket order. Please try again.')
      setRetryAction(() => handleStartShipping)
      setErrorOpen(true)
    } finally {
      setCreatingShipment(false)
    }
  }

  const clearAll = () => {
    setSelectedItems([])
    setSelectedBox(null)
    setLocalValue('')
    setIsDropdownOpen(false)
  }

  // fetchBoxDimensions and fetchShippingItems removed - now using TanStack Query hooks

  return (
    <div key="start-packaging-qc" className="min-h-screen bg-gray-50">
        <PageHeader 
          title="Order History / Order Details" 
          subTitle="Create Shipment Order" 
          onTitleClick={onBack}
        />
        <div className="p-[16px] animate-slide-up">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-[750px] relative">
            <div className="flex items-center justify-between p-[8px] border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="body-3 font-semibold text-gray-900 font-urbanist">Shipping Order</h3>
                {/* <Info className="h-4 w-4 text-gray-400" /> */}
              </div>
              {!shiprocketResponse && (
                <button 
                  onClick={() => {
                    if (showForm) {
                      clearAll()
                      setShowForm(false)
                    } else {
                      setShowForm(true)
                    }
                  }}
                  disabled={creatingShipment}
                  className={`p-[8px] h-[38px] text-sm font-medium rounded-lg transition-colors font-urbanist ${
                    showForm 
                      ? 'bg-white border border-red-600 text-red-600 hover:bg-red-50' 
                      : 'bg-secondary-900 text-white hover:bg-secondary-800'
                  }`}
                >
                  {showForm ? <CircleXIcon className="h-4 w-4" /> : 'Create Shipping Order'}
                </button>
              )}
            </div>
            <Dialog open={creatingShipment} onOpenChange={(open) => {
              // Prevent closing while creating shipment
              if (!open && creatingShipment) {
                // Do nothing - prevent closing
              }
            }}>
              <DialogContent
                className="sm:max-w-[420px] p-4 border border-gray-200 rounded-lg"
                onInteractOutside={(event) => {
                  event.preventDefault()
                }}
              >
                <div className="flex flex-col items-center justify-center py-8">
                  <DialogTitle className="text-[18px] font-semibold text-gray-900 mb-4 font-urbanist">
                    Creating Shipment...
                  </DialogTitle>

                  {/* Loading Animation */}
                  <div className="relative w-full flex flex-col items-center justify-center mb-6">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      {/* Outer Glow Effect */}
                      <div className="absolute inset-0 rounded-full bg-secondary-900/5 blur-xl animate-pulse" />

                      <div className="flex justify-center items-center">
                        <LoadingAnimation />
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-[14px] font-semibold text-red-600 font-urbanist">
                        Do not refresh the page
                      </p>
                      <p className="text-[13px] text-gray-600 font-urbanist mt-2">
                        Creating shipment... This may take a few minutes.
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      <div className="w-2 h-2 bg-secondary-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-secondary-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-secondary-900 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="font-urbanist">Request failed</DialogTitle>
                <DialogDescription className="font-urbanist text-[14px]">
                  {errorMessage || 'Something went wrong while processing your request.'}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  className="px-4 py-2 rounded-md border border-gray-300 text-sm font-urbanist hover:bg-gray-50"
                  onClick={() => {
                    setErrorOpen(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-secondary-900 text-white text-sm font-urbanist hover:bg-secondary-800 disabled:opacity-60"
                  onClick={() => {
                    const retry = retryAction
                    setErrorOpen(false)
                    if (retry) retry()
                  }}
                >
                  Retry
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            {shiprocketResponse ? (
              <div className="space-y-4 mx-[8px] my-[4px]">
                <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 font-urbanist">Ready to ship</h4>
                        {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-2 rounded-md border border-gray-300 text-sm font-urbanist hover:bg-gray-50"
                          onClick={() => {
                            const url = shiprocketResponse?.invoice_url?.invoice_url
                            if (url) window.open(url, '_blank')
                          }}
                        >
                          Download Invoice
                        </button>
                        <button
                          className="px-3 py-2 rounded-md border border-gray-300 text-sm font-urbanist hover:bg-gray-50"
                          onClick={() => {
                            const url = shiprocketResponse?.manifest_url?.manifest_url
                            if (url) window.open(url, '_blank')
                          }}
                        >
                          Download Manifest
                        </button>
                        <button
                          className="px-3 py-2 rounded-md border border-gray-300 text-sm font-urbanist hover:bg-gray-50"
                          onClick={() => {
                            const url = shiprocketResponse?.data?.label_url || shiprocketResponse?.label_url?.label_url
                            if (url) window.open(url, '_blank')
                          }}
                        >
                         Preview Label
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader className="bg-gray-50 border-b border-gray-200">
                          <TableRow>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">
                              Field
                            </TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">
                              Value
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">AWB Number</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.awb_number}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Shiprocket Order ID</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.shiprocket_order_id}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Tracking ID</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.tracking_id}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Courier Name</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.courier_name}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Item Count</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.item_count}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Pickup Address</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-pre-wrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.pickup_address}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Delivery Address</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-pre-wrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.delivery_address}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Invoice No</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.invoice_no}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Transporter</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.transporter_name}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50 bg-white">
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">Estimated Days</TableCell>
                            <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{shiprocketResponse?.data?.estimated_days}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Product details sub-table */}
                    {Array.isArray(shiprocketResponse?.data?.product_details) && shiprocketResponse.data.product_details.length > 0 && (
                      <div className="mt-6">
                        <div className="mb-2 font-semibold text-gray-900 font-urbanist text-sm">Products</div>
                        <div className="overflow-x-auto">
                          <Table className="w-full">
                            <TableHeader className="bg-gray-50 border-b border-gray-200">
                              <TableRow>
                                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">Product ID</TableHead>
                                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">Name</TableHead>
                                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">Qty</TableHead>
                                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">Unit Price</TableHead>
                                <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white">
                              {shiprocketResponse.data.product_details.map((p: any, idx: number) => (
                                <TableRow key={idx} className="hover:bg-gray-50 bg-white">
                                  <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">{p.product_id}</TableCell>
                                  <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800">{p.product_name}</TableCell>
                                  <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800">{p.qty}</TableCell>
                                  <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800">{p.unit_price}</TableCell>
                                  <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800">{p.price_total}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : showForm ? (
              <div className="space-y-4 mx-[8px] my-[4px]">
                {/* Items Table - Shows First */}
                <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <CardContent className="p-0">
                    {/* Card Header */}
                    <div className="flex items-center justify-between p-2 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <h2 className="font-semibold text-gray-900 label-1 font-urbanist">Items for Shipping</h2>
                        {/* <Info className="h-[14px] w-[14px] text-gray-400" /> */}
                      </div>
                      {/* <button 
                        onClick={() => fetchShippingItems(orderId.toString())}
                        className="label-2 font-urbanist px-4 font-bold underline text-gray-700 transition-colors duration-200 cursor-pointer p-0"
                      >
                        Refresh Items
                      </button> */}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader className="bg-gray-50 border-b border-gray-200">
                          <TableRow>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">
                              <Checkbox
                                checked={selectedItems.length > 0 && selectedItems.length === shippingItems.length}
                                onCheckedChange={handleToggleSelectAll}
                                className="border-gray-300"
                              />
                            </TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">
                              Order Line ID
                            </TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">
                              Product ID
                            </TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">
                              Product Name
                            </TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">Qty</TableHead>
                            <TableHead className="px-[20px] py-[6px] text-left body-3 font-semibold text-gray-500 font-urbanist whitespace-nowrap items-center">Price Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                          {shippingItemsLoading ? (
                            <TableRow className="hover:bg-white">
                              <TableCell colSpan={6} className="px-[20px] py-12 text-center">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                  <LoadingSpinner />
                                  <div className="text-lg font-semibold text-gray-500 font-urbanist">
                                    Loading shipping items...
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : shippingItems.length === 0 ? (
                            <TableRow className="hover:bg-white">
                              <TableCell colSpan={6} className="px-[20px] py-12 text-center">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                  <div className="text-lg font-semibold text-gray-500 font-urbanist">
                                    No items found for shipping
                                  </div>
                                  <div className="text-sm text-gray-400 font-urbanist max-w-md">
                                    Please check if the order has items ready for shipping.
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            shippingItems.map((item, index) => (
                              <TableRow key={index} className="hover:bg-gray-50 bg-white">
                                <TableCell className="px-[20px] py-2 whitespace-nowrap">
                                  <Checkbox
                                    checked={isItemSelected(item.order_line_id)}
                                    onCheckedChange={() => handleItemSelect(item.order_line_id)}
                                    className="border-gray-300"
                                  />
                                </TableCell>
                                <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist items-center">
                                  {item.order_line_id}
                                </TableCell>
                                <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist items-center">
                                  {item.product_id}
                                </TableCell>
                                <TableCell className="px-[20px] py-2 whitespace-nowrap font-semibold text-neutral-800 body-3 font-urbanist items-center">
                                  <div className="font-semibold text-neutral-800 body-3 font-urbanist">{item.product_name}</div>
                                </TableCell>
                                <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-700">
                                  {item.qty != null ? item.qty : '-'}
                                </TableCell>
                                <TableCell className="px-[20px] py-2 whitespace-nowrap body-3 font-urbanist items-center text-neutral-800 font-semibold">
                                  {item.price_total != null ? `₹${(item.price_total || 0).toLocaleString()}` : '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Box Selection Dropdown - Shows Only When Items Are Selected */}
                {selectedItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-urbanist">Select Box Type:</label>
                    <div className="flex gap-3">
                      {loading ? (
                        <div className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <div className="flex-1 relative">
                          <Input
                            type="text"
                            value={selectedBox?.box_type.toUpperCase() || localValue}
                            onChange={(e) => {
                              if (!selectedBox) {
                                handleInputChange(e.target.value)
                              } else {
                                handleClear()
                                handleInputChange(e.target.value)
                              }
                            }}
                            onKeyDown={handleKeyDown}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            onFocus={() => {
                              if (!selectedBox && localValue.length > 0) {
                                setIsDropdownOpen(true)
                              } else if (!selectedBox) {
                                setIsDropdownOpen(true)
                              }
                            }}
                            placeholder="Select from the preset Box type"
                            className="h-9 body-3 font-urbanist text-sm text-neutral-900 border-gray-300 pr-8"
                          />
                          
                          {/* Action buttons on the right */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {selectedBox ? (
                              <button
                                type="button"
                                onClick={handleClear}
                                className="hover:text-red-600 text-gray-400"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="hover:text-gray-600 text-gray-400"
                              >
                                {isDropdownOpen ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          {/* Dropdown with suggestions */}
                          {isDropdownOpen && !selectedBox && filteredBoxTypes.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {filteredBoxTypes.map((box) => (
                                <div
                                  key={box.id}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                  onMouseDown={() => handleBoxSelect(box)}
                                >
                                  <span className="text-sm text-gray-700">{box.box_type.toUpperCase()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Box Details - Shows When Box Is Selected */}
                {selectedBox && (
                  <div>
                  <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 font-urbanist">Selected Box: {selectedBox.box_type.toUpperCase()}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dimensions Column */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Dimensions *</Label>
                            <div className="w-20 flex gap-2">
                              <Select value={selectedBox.box_unit} disabled>
                                <SelectTrigger className="border-gray-300 h-8 body-3 font-urbanist text-sm text-neutral-900">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mm">mm</SelectItem>
                                  <SelectItem value="cm">cm</SelectItem>
                                  <SelectItem value="m">m</SelectItem>
                                  <SelectItem value="in">in</SelectItem>
                                  <SelectItem value="ft">ft</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Input
                                type="text"
                                value={selectedBox.box_length}
                                disabled
                                placeholder="Length"
                                className="h-9 body-3 font-urbanist text-sm text-neutral-900 border-gray-300"
                              />
                            </div>
                            <div className="space-y-1">
                              <Input
                                type="text"
                                value={selectedBox.box_width}
                                disabled
                                placeholder="Width"
                                className="h-9 body-3 font-urbanist text-sm text-neutral-900 border-gray-300"
                              />
                            </div>
                            <div className="space-y-1">
                              <Input
                                type="text"
                                value={selectedBox.box_height}
                                disabled
                                placeholder="Height"
                                className="h-9 body-3 font-urbanist text-sm text-neutral-900 border-gray-300"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Volumetric Weight Column */}
                        <div className="space-y-[10px]">
                          <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">Volumetric Weight (net/gross) *</Label>
                          <div className="flex gap-2 border border-gray-300 rounded-md items-center mt-3">
                            <Input
                              type="text"
                              value={selectedBox.box_volumetric_weight}
                              disabled
                              placeholder="149.98"
                              className="border-none h-9 flex-1 body-3 font-urbanist text-sm text-neutral-900 focus:ring-0 focus:border-none"
                            />
                            <Select value="kg" disabled>
                              <SelectTrigger className="border-gray-300 h-6 mr-2 w-24 body-3 font-urbanist text-sm text-neutral-900">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="g">Gram</SelectItem>
                                <SelectItem value="kg">Kilogram</SelectItem>
                                <SelectItem value="lb">Pound</SelectItem>
                                <SelectItem value="oz">Ounce</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      className="bg-secondary-900 hover:bg-secondary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-[16px] py-[8px] rounded-lg body-3 font-urbanist"
                      onClick={handleStartShipping}
                      disabled={creatingShipment}
                    >
                    {creatingShipment ? 'Processing…' : 'Start Shipping'}
                    </button>
                  </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-[8px] py-[8px]">
                <img src="/images/svg/image 4.png" alt="Shipping illustration" className="w-[300px] h-[173px] rounded-lg mb-6 mt-6" />
                <div className="text-center">
                  <div className="font-bold text-gray-800 font-urbanist mb-2 heading-6">No shipping detail yet</div>
                  <p className="text-gray-700 font-urbanist body-3">One or more items in the order are not packaging QC approved yet.</p>
                  <p className="text-gray-700 font-urbanist body-3">Kindly update status and start shipping.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}

export default StartPackagingQC
