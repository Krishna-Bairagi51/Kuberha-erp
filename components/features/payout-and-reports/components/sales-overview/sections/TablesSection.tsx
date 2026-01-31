"use client"

import React from "react"
import { TopCustomersTable } from "./TopCustomersTable"
import { WhatsSellingCard } from "./WhatsSellingCard"
import { TopCustomer } from "../../../types/sales-overview.types"

interface TablesSectionProps {
  topCustomers: TopCustomer[]
  isLoadingTopCustomers?: boolean
}

export const TablesSection: React.FC<TablesSectionProps> = ({
  topCustomers,
  isLoadingTopCustomers = false,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      <TopCustomersTable customers={topCustomers} isLoading={isLoadingTopCustomers} />
      <WhatsSellingCard />
    </div>
  )
}

