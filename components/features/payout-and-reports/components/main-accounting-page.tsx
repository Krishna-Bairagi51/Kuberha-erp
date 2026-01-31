"use client"

import React, { useState } from "react"
import ModerHeader from "@/components/shared/layout/page-header"
import { cn } from "@/lib/utils"
import SalesOverview from "@/components/features/payout-and-reports/components/sales-overview/sales-overview"
import SalesDetailsTable from "@/components/features/payout-and-reports/components/sales-details-table"
import SupplierPayout from "@/components/features/payout-and-reports/components/supplier-payout"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUserType } from "@/hooks/use-user-type"
import { downloadFile } from "../services/sales-details.service"
import { generateVendorProductListSheet } from "../services/vendor-product-list-sheet.service"

const MainAccountingPage = () => {
  const [activeTab, setActiveTab] = useState<"Sales Overview" | "Sales Details" | "Supplier Payout">("Sales Overview") 
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false)
  const { userType } = useUserType()

  const handleDownloadVendorProductList = async () => {
    setIsGeneratingSheet(true)
    try {
      const result = await generateVendorProductListSheet()
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.url) {
        const ts = new Date().toISOString().slice(0, 10)
        downloadFile(result.url, `vendor_product_list_${ts}.xlsx`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate sheet")
    } finally {
      setIsGeneratingSheet(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModerHeader
        title="Payouts & Reports"
        action={
            <Button
              variant="secondary"
              className="gap-2 rounded-xl px-4 shadow-sm"
              onClick={handleDownloadVendorProductList}
              disabled={isGeneratingSheet}
            >
              {isGeneratingSheet ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {isGeneratingSheet ? "Generating..." : "Download Product List"}
            </Button>
          }
      />

      <div className="">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border-b border-gray-200 px-3 pt-5">
          <div className="flex items-center gap-3">
            {(["Sales Overview", "Sales Details", "Supplier Payout"] as const).map((tab) => ( 
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-sm font-semibold px-3 pb-2 transition-colors font-urbanist text-md rounded-t-md",
                  activeTab === tab 
                    ? "text-secondary-900 border-b-2 border-secondary-900 hover:bg-secondary-50" 
                    : "text-gray-600 hover:text-secondary-900 hover:bg-gray-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 pb-6 space-y-6">
        {activeTab === "Sales Overview" && <SalesOverview />}
        {activeTab === "Sales Details" && <SalesDetailsTable />}
        {activeTab === "Supplier Payout" && <SupplierPayout />}
      </div>
    </div>
  )
}

export default MainAccountingPage

